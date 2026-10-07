import "dotenv/config";
import nodemailer from "nodemailer";

const isEmailConfigured = Boolean(
    process.env.GOOGLE_USER &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
);

let transporter = null;

if (isEmailConfigured) {
    try {
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: process.env.GOOGLE_USER,
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
            },
        });

        transporter.verify((error) => {
            if (error) {
                console.warn("Gmail OAuth verification warning:", error?.message || error);
            } else {
                console.log("Email service is ready to send messages via Gmail OAuth");
            }
        });
    } catch (err) {
        console.warn("Could not create Gmail transporter:", err?.message || err);
        transporter = null;
    }
} else {
    console.log("Gmail OAuth credentials not configured. Email service will run in simulated development mode.");
}

export async function sendEmail({ to, subject, html, text = "" }) {
    if (!isEmailConfigured || !transporter) {
        console.log("-----------------------------------------");
        console.log(`[SIMULATED EMAIL] To: ${to}`);
        console.log(`[SIMULATED EMAIL] Subject: ${subject}`);
        console.log(`[SIMULATED EMAIL] Content preview: ${text || (html ? html.replace(/<[^>]+>/g, " ").slice(0, 150) : "")}`);
        console.log("-----------------------------------------");
        return `Simulated email successfully logged for ${to} (Gmail OAuth not configured)`;
    }

    try {
        const mailOptions = {
            from: process.env.GOOGLE_USER,
            to,
            subject,
            html,
            text,
        };

        const details = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", details.messageId);
        return `Sent email successfully to ${to}`;
    } catch (error) {
        console.error("Failed to send email:", error?.message || error);
        return `Failed to send email to ${to}: ${error.message}`;
    }
}

export default { sendEmail };