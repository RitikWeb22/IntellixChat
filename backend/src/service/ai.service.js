import "dotenv/config";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage, SystemMessage, AIMessage, tool, createAgent } from "langchain";
import * as z from "zod";
import { searchInternet, readWebPage } from "./internet.service.js";
import { sendEmail } from "./email.service.js";

const activeGeminiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GEMINI_API_KEY ||
    "AIzaSyB1I-PBr7o8SoS2p7bSPzkCp2YB1oPjV0M";

const hasGeminiKey = Boolean(
    activeGeminiKey &&
    activeGeminiKey.length > 20 &&
    !activeGeminiKey.includes("your_gemini")
);

const hasMistralKey = Boolean(
    process.env.MISTRAL_API_KEY &&
    process.env.MISTRAL_API_KEY.length > 20 &&
    !process.env.MISTRAL_API_KEY.includes("your_mistral")
);

// Tools
const emailTool = tool(sendEmail, {
    name: "sendEmail",
    description: "Use this tool to send an email. Provide recipient email address, subject, and HTML content.",
    schema: z.object({
        to: z.string().describe("Recipient email"),
        subject: z.string().describe("Subject of the email"),
        html: z.string().describe("HTML content of the email"),
    }),
});

const searchInternetTool = tool(searchInternet, {
    name: "searchInternet",
    description: "Use this tool to query live information from the internet.",
    schema: z.object({
        query: z.string().describe("The search query"),
    }),
});

const readWebPageTool = tool(readWebPage, {
    name: "readWebPage",
    description: "Use this tool to fetch and read text content from a URL.",
    schema: z.object({
        url: z.string().url().describe("The full webpage URL"),
    }),
});

async function evaluateMath({ expression }) {
    if (!expression || String(expression).length > 200) {
        return JSON.stringify({ error: "Expression must be 1-200 characters." });
    }
    const allowed = /^[0-9+\-*/().%\s]+$/;
    if (!allowed.test(expression)) {
        return JSON.stringify({ error: "Invalid characters. Only numbers and operators (+, -, *, /, %, parentheses) allowed." });
    }
    const sanitized = String(expression).replace(/\s/g, "");
    try {
        const result = Function(`"use strict"; return (${sanitized})`)();
        return JSON.stringify({ expression: sanitized, result: Number.isFinite(result) ? result : String(result) });
    } catch (e) {
        return JSON.stringify({ error: e.message || "Invalid expression" });
    }
}

const calculatorTool = tool(evaluateMath, {
    name: "calculator",
    description: "Evaluate arithmetic expressions e.g. (15 * 3) + 7",
    schema: z.object({
        expression: z.string().describe("Mathematical expression to evaluate"),
    }),
});

async function getCurrentDateTime(_input = {}) {
    const now = new Date();
    return JSON.stringify({
        iso: now.toISOString(),
        date: now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
        time: now.toLocaleTimeString("en-US", { hour12: true }),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
}

const getCurrentDateTimeTool = tool(getCurrentDateTime, {
    name: "getCurrentDateTime",
    description: "Get current date, time, and timezone.",
    schema: z.object({}),
});

async function googleMapsSearch({ query }) {
    const encoded = encodeURIComponent(query);
    const url = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    return JSON.stringify({ query, mapsSearchUrl: url });
}

const googleMapsSearchTool = tool(googleMapsSearch, {
    name: "googleMapsSearch",
    description: "Generate a Google Maps search URL for places, restaurants, or locations.",
    schema: z.object({
        query: z.string().describe("Search query for maps"),
    }),
});

const agentTools = [searchInternetTool, readWebPageTool, emailTool, calculatorTool, getCurrentDateTimeTool, googleMapsSearchTool];

function buildAgentMessages(messages) {
    return [
        new SystemMessage(`
            You are Intellix, a world-class AI assistant.
            You have access to tools for live web search, webpage reading, emails, math, time, and maps.
            Always provide insightful, beautifully formatted responses using Markdown, bold highlights, lists, and code blocks.
        `),
        ...(messages
            .map((msg) => {
                if (msg.role === "user") {
                    return new HumanMessage(msg.content);
                } else if (msg.role === "ai" || msg.role === "assistant" || msg.role === "model") {
                    return new AIMessage(msg.content);
                }
                return null;
            })
            .filter(Boolean)),
    ];
}

// Quick local responder when external APIs are unconfigured or fail
function getFallbackSmartResponse(lastUserMessage) {
    const text = (lastUserMessage || "").toLowerCase().trim();

    if (/^(hi|hello|hey|namaste|greetings)\b/.test(text)) {
        return "👋 Hello! I am **Intellix AI**. How can I help you today? You can ask me to search the web, analyze data, perform math calculations, or explore topics!";
    }

    if (/\b(time|date|day|what time|aaj ki date)\b/.test(text)) {
        const now = new Date();
        return `📅 **Current Date & Time**:\n- **Date**: ${now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n- **Time**: ${now.toLocaleTimeString("en-US", { hour12: true })}\n- **Timezone**: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
    }

    // Try math evaluation
    const mathMatch = text.match(/([-+]?[0-9]*\.?[0-9]+\s*[\+\-\*\/%]\s*[-+]?[0-9]*\.?[0-9]+)/);
    if (mathMatch) {
        try {
            const clean = mathMatch[0].replace(/[^0-9+\-*/().%]/g, "");
            const res = Function(`"use strict"; return (${clean})`)();
            if (Number.isFinite(res)) {
                return `🔢 **Calculation Result**:\n\`${clean} = ${res}\``;
            }
        } catch (_) {}
    }

    return null;
}

export async function generateResponse(messages, options = {}) {
    const { onStatus } = options;
    const lastMessage = messages[messages.length - 1]?.content || "";

    onStatus?.("Thinking...");

    // Try Gemini First if key is present
    if (hasGeminiKey) {
        try {
            onStatus?.("Consulting Gemini AI...");
            const geminiModel = new ChatGoogleGenerativeAI({
                model: "gemini-2.5-flash",
                apiKey: activeGeminiKey,
                maxOutputTokens: 2048,
            });

            const agent = createAgent({
                model: geminiModel,
                tools: agentTools,
            });

            // 8 second timeout to protect Vercel Serverless execution
            const response = await Promise.race([
                agent.invoke({ messages: buildAgentMessages(messages) }),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8500)),
            ]);

            const finalMessage = response?.messages?.[response?.messages?.length - 1]?.text;
            if (finalMessage) return finalMessage;
        } catch (geminiError) {
            console.warn("Gemini execution failed:", geminiError?.message || geminiError);
        }
    }

    // Try Mistral if Gemini didn't return
    if (hasMistralKey) {
        try {
            onStatus?.("Consulting Mistral AI...");
            const mistralModel = new ChatMistralAI({
                model: "mistral-small-latest",
                apiKey: process.env.MISTRAL_API_KEY,
            });

            const agent = createAgent({
                model: mistralModel,
                tools: agentTools,
            });

            const response = await Promise.race([
                agent.invoke({ messages: buildAgentMessages(messages) }),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8500)),
            ]);

            const finalMessage = response?.messages?.[response?.messages?.length - 1]?.text;
            if (finalMessage) return finalMessage;
        } catch (mistralError) {
            console.warn("Mistral execution failed:", mistralError?.message || mistralError);
        }
    }

    // Smart Local Fallback
    const localAnswer = getFallbackSmartResponse(lastMessage);
    if (localAnswer) {
        return localAnswer;
    }

    // If external API keys were invalid or expired
    return `🤖 **Intellix AI Assistant**:
I received your request: "${lastMessage}"

> ⚠️ **Notice**: The configured AI provider keys (\`GEMINI_API_KEY\` or \`MISTRAL_API_KEY\`) in \`backend/.env\` appear to be invalid or unconfigured. Please update them with an active API key from [Google AI Studio](https://aistudio.google.com/) or [Mistral Console](https://console.mistral.ai/) to enable full live LLM generation.

In the meantime, Intellix core services, database persistence, and chat history are fully operational!`;
}

export async function generateChatTitle(message) {
    if (!message || typeof message !== "string") return "New Conversation";
    const snippet = message.slice(0, 80).trim();
    const words = snippet.replace(/[^\w\s]/gi, "").split(/\s+/).filter(Boolean);
    return words.slice(0, 4).join(" ") || "New Conversation";
}
