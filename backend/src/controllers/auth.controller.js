import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../service/email.service.js";
import { redis } from "../config/cache.js";

/**
 * @desc Register a new user and send a send verification email
 * @route POST /api/auth/register
 * @access Public
 */

export async function register(req, res) {
    const { username, email, password } = req.body;

    const isUserAlreadyExists = await userModel.findOne({
        $or: [{ email }, { username }]
    })

    if (isUserAlreadyExists) {
        return res.status(400).json({
            message: "User with this email or username already exists",
            success: false,
            err: "User already exists"
        })
    }

    const user = await userModel.create({ username, email, password });

    const emailVerificationToken = jwt.sign({
        email: user.email,
        type: "email_verification"
    },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    await sendEmail({
        to: email,
        subject: "Welcome to IntelliChat!",
        html: `
                <p>Hi ${username},</p>
                <p>Thank you for registering at <strong>IntelliChat</strong>. We're excited to have you on board!</p>
                <p>Please verify your email address by clicking the link below:</p>
                <a href="http://localhost:3000/api/auth/verify-email?token=${emailVerificationToken}">Verify Email</a>
                <p>If you did not create an account, please ignore this email.</p>
                <p>Best regards,<br>The IntelliChat Team</p>
        `
    });

    res.status(201).json({
        message: "User registered successfully",
        success: true,
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    });

}




/****
 * @route GET /api/auth/login
 * @desc Login user and return JWT token
 * @access Public
 */
export async function login(req, res) {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
        return res.status(400).json({
            message: "Invalid email or password",
            success: false,
            err: "User not found"
        })
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
        return res.status(400).json({
            message: "Invalid email or password",
            success: false,
            err: "Incorrect password"
        })
    }

    if (!user.verified) {
        return res.status(400).json({
            message: "Please verify your email before logging in",
            success: false,
            err: "Email not verified"
        })
    }

    const token = jwt.sign({
        id: user._id,
        username: user.username,
    }, process.env.JWT_SECRET, { expiresIn: '7d' })

    res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.status(200).json({
        message: "Login successful",
        success: true,
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    })

}


/**
 * @route GET /api/auth/get-me
 * @desc Get current logged in user
 * @access Private
 */

export async function getMe(req, res) {
    const userId = req.user.id || req.user.userId;

    const user = await userModel.findById(userId).select("-password");

    if (!user) {
        return res.status(404).json({
            message: "User not found",
            success: false,
            err: "User not found"
        })
    }

    res.status(200).json({
        message: "User details fetched successfully",
        success: true,
        user
    })
}

/**
 * @route POST /api/auth/logout
 * @desc Logout user by clearing the token cookie
 * @access Private
 */
export const logout = async (req, res) => {
    const token = req.cookies.token
    if (!token) {
        console.log("UnAuthorized User")
    }
    redis.set(token, "blacklisted", "EX", 60 * 60)
    res.clearCookie("token")

    return res.status(200).json({
        message: "Logged out successfully",
        success: true
    })
}

/**
 * @route GET /api/auth/verify-email
 * @desc Verify user's email using the token sent in the verification email
 * @access Public
 */
export const verifyEmail = async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({
            message: "Invalid or missing token",
            success: false,
            err: "Token is required"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if (decoded.type && decoded.type !== "email_verification") {
            return res.status(400).json({
                message: "Invalid token",
                success: false,
                err: "Invalid token type"
            })
        }

        const user = await userModel.findOne({ email: decoded.email })
        if (!user) {
            return res.status(400).json({
                message: "Invalid token",
                success: false,
                err: "User not found"
            })
        }

        if (user.verified) {
            return res.status(400).json({
                message: "Email already verified",
                success: false,
                err: "Email already verified"
            })
        }

        user.verified = true
        await user.save()

        const html = `
        <h1>Email Verified Successfully!</h1>
        <p>Your email has been verified. You can now log in to your account.</p>
        <a href="http://localhost:3000/login">Go to Login</a>
    `

        return res.send(html);
    }
    catch (err) {
        return res.status(400).json({
            message: "Invalid or expired token",
            success: false,
            err: err.message
        })
    }
}


/**
 * @route POST /api/auth/resend-verification-email
 * @desc Resend the email verification email to the user
 * @access Public
 */

export const resendVerificationEmail = async (req, res) => {
    const { email } = req.body
    const user = await userModel.findOne({ email })
    if (!user) {
        return res.status(404).json({
            message: "User not found",
            success: false,
            err: "User not found"
        })
    }

    if (user.verified) {
        return res.status(400).json({
            message: "Email is already verified",
            success: false,
            err: "Email already verified"
        })
    }

    const emailVerificationToken = jwt.sign(
        { email: user.email, type: "email_verification" },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    )

    await sendEmail({
        to: email,
        subject: "IntelliChat - Resend Email Verification",
        html: `
            <p>Hi ${user.username},</p>
            <p>You requested to resend the email verification. Please verify your email by clicking the link below:</p>
            <a href="http://localhost:3000/api/auth/verify-email?token=${emailVerificationToken}">Verify Email</a>
            <p>If you did not request this, please ignore this email.</p>
            <p>Best regards,<br/>The IntelliChat Team</p>
        `
    })

    return res.status(200).json({
        message: "Verification email sent successfully",
        success: true
    })
}