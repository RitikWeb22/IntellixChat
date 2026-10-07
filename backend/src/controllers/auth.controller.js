import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../service/email.service.js";
import { redis } from "../config/cache.js";

const getFrontendUrl = () => process.env.FRONTEND_URL || (process.env.NODE_ENV === "production" ? "https://intellix-chat.vercel.app" : "http://localhost:5173");
const getBackendUrl = () => process.env.BACKEND_URL || (process.env.NODE_ENV === "production" ? "https://intellix-chat-bacend.vercel.app" : `http://localhost:${process.env.PORT || 3000}`);

/**
 * @desc Register a new user and send verification email
 * @route POST /api/auth/register
 * @access Public
 */
export async function register(req, res) {
    try {
        const { username, email, password } = req.body;

        const isUserAlreadyExists = await userModel.findOne({
            $or: [{ email: email.toLowerCase() }, { username }],
        });

        if (isUserAlreadyExists) {
            return res.status(400).json({
                message: "User with this email or username already exists",
                success: false,
                err: "User already exists",
            });
        }

        const user = await userModel.create({
            username: username.trim(),
            email: email.toLowerCase().trim(),
            password,
        });

        const emailVerificationToken = jwt.sign(
            {
                email: user.email,
                type: "email_verification",
            },
            process.env.JWT_SECRET || "intellix_default_jwt_secret_key",
            { expiresIn: "1d" }
        );

        const verificationUrl = `${getBackendUrl()}/api/auth/verify-email?token=${emailVerificationToken}`;

        try {
            await sendEmail({
                to: email,
                subject: "Verify your email for Intellix AI",
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 28px; background-color: #0f172a; color: #f8fafc; border-radius: 16px;">
                        <div style="text-align: center; margin-bottom: 24px;">
                            <h1 style="color: #f43f5e; font-size: 26px; margin: 0; font-weight: 700; letter-spacing: -0.5px;">Intellix AI</h1>
                            <p style="color: #94a3b8; font-size: 14px; margin-top: 6px;">Next-Gen AI Workspace</p>
                        </div>
                        <div style="background-color: #1e293b; padding: 24px; border-radius: 12px; border: 1px solid #334155;">
                            <h2 style="font-size: 18px; color: #f1f5f9; margin-top: 0;">Welcome, ${username}!</h2>
                            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Thank you for joining Intellix. Please verify your email address to activate your account and start chatting with AI models.</p>
                            <div style="text-align: center; margin: 28px 0;">
                                <a href="${verificationUrl}" style="background: linear-gradient(135deg, #e11d48, #f43f5e); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(225, 29, 72, 0.4);">Verify Email Address</a>
                            </div>
                            <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">Or copy this link to your browser: <br/><a href="${verificationUrl}" style="color: #38bdf8; word-break: break-all;">${verificationUrl}</a></p>
                        </div>
                        <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 24px;">If you didn't create an Intellix account, you can safely ignore this email.</p>
                    </div>
                `,
            });
        } catch (emailErr) {
            console.warn("Could not dispatch verification email, verification URL:", verificationUrl);
        }

        console.log(`\n========================================`);
        console.log(`[AUTH] User registered: ${user.email}`);
        console.log(`[AUTH] Verification link: ${verificationUrl}`);
        console.log(`========================================\n`);

        res.status(201).json({
            message: "Registration successful. Please check your email to verify your account.",
            success: true,
            verificationUrl, // Provided for easy dev flow
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({
            message: error.message || "Failed to register user",
            success: false,
        });
    }
}

/****
 * @route POST /api/auth/login
 * @desc Login user and return JWT cookie
 * @access Public
 */
export async function login(req, res) {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password",
                success: false,
                err: "User not found",
            });
        }

        const isPasswordMatch = await user.comparePassword(password);

        if (!isPasswordMatch) {
            return res.status(400).json({
                message: "Invalid email or password",
                success: false,
                err: "Incorrect password",
            });
        }

        if (!user.verified) {
            return res.status(400).json({
                message: "Please verify your email address before logging in.",
                success: false,
                err: "Email not verified",
                unverified: true,
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                userId: user._id,
                username: user.username,
                email: user.email,
            },
            process.env.JWT_SECRET || "intellix_default_jwt_secret_key",
            { expiresIn: "7d" }
        );

        const isHttpsOrProduction =
            process.env.NODE_ENV === "production" ||
            req.secure ||
            req.headers["x-forwarded-proto"] === "https" ||
            (req.headers.host && !req.headers.host.includes("localhost"));

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: isHttpsOrProduction ? "none" : "lax",
            secure: isHttpsOrProduction,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            message: "Login successful",
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            message: error.message || "Login failed",
            success: false,
        });
    }
}

/**
 * @route GET /api/auth/get-me
 * @desc Get current logged in user
 * @access Private
 */
export async function getMe(req, res) {
    try {
        const userId = req.user.id || req.user.userId;

        const user = await userModel.findById(userId).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false,
                err: "User not found",
            });
        }

        res.status(200).json({
            message: "User details fetched successfully",
            success: true,
            user,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message || "Failed to fetch user",
            success: false,
        });
    }
}

/**
 * @route POST /api/auth/logout
 * @desc Logout user by clearing the token cookie and blacklisting
 * @access Private
 */
export const logout = async (req, res) => {
    try {
        const token = req.cookies?.token;
        if (token) {
            try {
                await redis.set(token, "blacklisted", "EX", 60 * 60 * 24);
            } catch (err) {
                console.warn("Could not cache blacklisted token:", err.message);
            }
        }
        const isHttpsOrProduction =
            process.env.NODE_ENV === "production" ||
            req.secure ||
            req.headers["x-forwarded-proto"] === "https" ||
            (req.headers.host && !req.headers.host.includes("localhost"));

        res.clearCookie("token", {
            httpOnly: true,
            sameSite: isHttpsOrProduction ? "none" : "lax",
            secure: isHttpsOrProduction,
        });

        return res.status(200).json({
            message: "Logged out successfully",
            success: true,
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Logout error",
            success: false,
        });
    }
};

/**
 * @route GET /api/auth/verify-email
 * @desc Verify user's email using token and redirect to login
 * @access Public
 */
export const verifyEmail = async (req, res) => {
    const { token } = req.query;
    const frontendUrl = getFrontendUrl();

    if (!token) {
        return res.status(400).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8"/>
                <title>Intellix - Verification Failed</title>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <style>
                    body { font-family: system-ui, sans-serif; background: #090d16; color: #f8fafc; display: grid; place-items: center; min-height: 100vh; margin: 0; }
                    .card { background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; max-width: 420px; text-align: center; }
                    .btn { display: inline-block; background: #e11d48; color: #fff; padding: 10px 24px; border-radius: 10px; text-decoration: none; margin-top: 16px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2 style="color: #fb7185;">Missing Verification Token</h2>
                    <p style="color: #94a3b8;">The verification link is invalid or incomplete.</p>
                    <a href="${frontendUrl}/login" class="btn">Return to Login</a>
                </div>
            </body>
            </html>
        `);
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "intellix_default_jwt_secret_key");
        if (decoded.type && decoded.type !== "email_verification") {
            return res.status(400).send(`
                <!DOCTYPE html>
                <html><body style="font-family: system-ui; background: #090d16; color: #fff; display: grid; place-items: center; min-height: 100vh;">
                    <div style="background: #131b2e; padding: 32px; border-radius: 16px; text-align: center;">
                        <h2 style="color: #fb7185;">Invalid Token Type</h2>
                        <a href="${frontendUrl}/login" style="color: #38bdf8;">Return to Login</a>
                    </div>
                </body></html>
            `);
        }

        const user = await userModel.findOne({ email: decoded.email });
        if (!user) {
            return res.status(400).send(`
                <!DOCTYPE html>
                <html><body style="font-family: system-ui; background: #090d16; color: #fff; display: grid; place-items: center; min-height: 100vh;">
                    <div style="background: #131b2e; padding: 32px; border-radius: 16px; text-align: center;">
                        <h2 style="color: #fb7185;">User Not Found</h2>
                        <a href="${frontendUrl}/register" style="color: #38bdf8;">Create an Account</a>
                    </div>
                </body></html>
            `);
        }

        user.verified = true;
        await user.save();

        const loginRedirectUrl = `${frontendUrl}/login?verified=true`;

        return res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="utf-8"/>
                <title>Email Verified - Intellix</title>
                <meta name="viewport" content="width=device-width, initial-scale=1"/>
                <meta http-equiv="refresh" content="3;url=${loginRedirectUrl}"/>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                        background: radial-gradient(circle at 50% 20%, #1e1b4b, #090d16 80%);
                        color: #f8fafc;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        padding: 16px;
                    }
                    .box {
                        background: rgba(19, 27, 46, 0.85);
                        backdrop-filter: blur(16px);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 20px;
                        padding: 40px 32px;
                        max-width: 440px;
                        width: 100%;
                        text-align: center;
                        box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                    }
                    .check {
                        width: 64px;
                        height: 64px;
                        margin: 0 auto 20px;
                        background: rgba(16, 185, 129, 0.15);
                        border: 2px solid #10b981;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 32px;
                        color: #10b981;
                    }
                    h1 { font-size: 24px; font-weight: 700; margin: 0 0 10px; color: #fff; }
                    p { font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0 0 24px; }
                    .btn {
                        display: inline-block;
                        background: linear-gradient(135deg, #e11d48, #f43f5e);
                        color: #fff;
                        padding: 12px 28px;
                        border-radius: 12px;
                        text-decoration: none;
                        font-weight: 600;
                        font-size: 14px;
                        transition: opacity 0.2s;
                    }
                    .btn:hover { opacity: 0.9; }
                    .timer { font-size: 12px; color: #64748b; margin-top: 16px; }
                </style>
            </head>
            <body>
                <div class="box">
                    <div class="check">✓</div>
                    <h1>Email Verified!</h1>
                    <p>Your account (<strong>${user.email}</strong>) has been verified successfully. You can now log in to access the Intellix workspace.</p>
                    <a href="${loginRedirectUrl}" class="btn">Proceed to Login</a>
                    <div class="timer">Redirecting in 3 seconds...</div>
                </div>
            </body>
            </html>
        `);
    } catch (err) {
        return res.status(400).send(`
            <!DOCTYPE html>
            <html>
            <body style="font-family: system-ui; background: #090d16; color: #fff; display: grid; place-items: center; min-height: 100vh;">
                <div style="background: #131b2e; padding: 32px; border-radius: 16px; text-align: center; max-width: 400px;">
                    <h2 style="color: #fb7185;">Verification Link Expired</h2>
                    <p style="color: #94a3b8; font-size: 14px;">This verification link is invalid or has expired.</p>
                    <a href="${frontendUrl}/login" style="display:inline-block; margin-top: 12px; background: #e11d48; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none;">Go to Login</a>
                </div>
            </body>
            </html>
        `);
    }
};

/**
 * @route POST /api/auth/resend-verification-email
 * @desc Resend the email verification email to the user
 * @access Public
 */
export const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required", success: false });
        }

        const user = await userModel.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(404).json({
                message: "No account found with this email",
                success: false,
                err: "User not found",
            });
        }

        if (user.verified) {
            return res.status(400).json({
                message: "Email is already verified",
                success: false,
                err: "Email already verified",
            });
        }

        const emailVerificationToken = jwt.sign(
            { email: user.email, type: "email_verification" },
            process.env.JWT_SECRET || "intellix_default_jwt_secret_key",
            { expiresIn: "1d" }
        );

        const verificationUrl = `${getBackendUrl()}/api/auth/verify-email?token=${emailVerificationToken}`;

        try {
            await sendEmail({
                to: email,
                subject: "Intellix - Verify your email address",
                html: `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 28px; background-color: #0f172a; color: #f8fafc; border-radius: 16px;">
                        <h2 style="color: #f1f5f9; margin-top: 0;">Hi ${user.username},</h2>
                        <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">You requested a new verification link for your Intellix account.</p>
                        <div style="text-align: center; margin: 28px 0;">
                            <a href="${verificationUrl}" style="background: #e11d48; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 600; font-size: 14px; display: inline-block;">Verify Email Address</a>
                        </div>
                    </div>
                `,
            });
        } catch (e) {
            console.warn("Could not send email, link:", verificationUrl);
        }

        console.log(`[AUTH] Resent verification link: ${verificationUrl}`);

        return res.status(200).json({
            message: "Verification email sent successfully. Check your inbox or spam folder.",
            success: true,
            verificationUrl, // Provided for easy dev testing
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Failed to resend verification email",
            success: false,
        });
    }
};