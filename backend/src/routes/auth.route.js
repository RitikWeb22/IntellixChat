import { Router } from "express";
import { getMe, login, logout, register, resendVerificationEmail, verifyEmail } from "../controllers/auth.controller.js";
import { identifyUser } from "../middlewares/auth.middleware.js";
import { loginValidator, registerValidator } from "../validators/auth.validator.js";

const authRouter = Router();


/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
authRouter.post("/register", registerValidator, register)


/**
 * @route POST /api/auth/login
 * @desc Login user and return JWT token
 * @access Public
 */

authRouter.post("/login", loginValidator, login)

/**
 * @route GET /api/auth/get-me
 * @desc Get current logged in user
 * @access Private
 */
authRouter.get("/get-me", identifyUser, getMe)

/**
 * @route POST /api/auth/logout
 * @desc Logout user by clearing the token cookie
 * @access Private

 */
authRouter.post("/logout", identifyUser, logout)

/**
 * @route GET /api/auth/verify-email
 * @desc Verify user's email
 * @access Public
 */
authRouter.get("/verify-email", verifyEmail)


/** 
 * @route POST /api/auth/resend-verification-email
 * @desc Resend the email verification email to the user
 * @access Public
 * 
    */
authRouter.post("/resend-verification-email", resendVerificationEmail)


export default authRouter;