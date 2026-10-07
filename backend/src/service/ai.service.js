import "dotenv/config";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage, SystemMessage, AIMessage, tool, createAgent } from "langchain";
import * as z from "zod";
import { searchInternet, readWebPage } from "./internet.service.js";
import { sendEmail } from "./email.service.js";

const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key");
const hasMistralKey = Boolean(process.env.MISTRAL_API_KEY && process.env.MISTRAL_API_KEY !== "your_mistral_api_key");

const geminiModel = new ChatGoogleGenerativeAI({
    model: "gemini-flash-latest",
    apiKey: process.env.GEMINI_API_KEY || "placeholder_key",
});

const mistralModel = new ChatMistralAI({
    model: "mistral-medium-latest",
    apiKey: process.env.MISTRAL_API_KEY || "placeholder_key",
});

// email tool
const emailTool = tool(
    sendEmail,
    {
        name: "sendEmail",
        description: "Use this tool to send an email. Provide the recipient's email address, subject, and HTML content.",
        schema: z.object({
            to: z.string().describe("Email address of the recipient"),
            subject: z.string().describe("Subject of the email"),
            html: z.string().describe("HTML content of the email"),
        }),
    }
);

// search internet tool
const searchInternetTool = tool(
    searchInternet,
    {
        name: "searchInternet",
        description: "Use this tool to get the latest information from the internet.",
        schema: z.object({
            query: z.string().describe("The search query to look up on the internet."),
        }),
    }
);

const readWebPageTool = tool(
    readWebPage,
    {
        name: "readWebPage",
        description: "Use this tool to fetch and read the main textual content of a webpage from a URL.",
        schema: z.object({
            url: z.string().url().describe("The full URL of the webpage to read."),
        }),
    }
);

// Safe calculator for mathematical expressions
async function evaluateMath({ expression }) {
    if (!expression || String(expression).length > 200) {
        return JSON.stringify({ error: "Expression must be 1-200 characters." });
    }
    const allowed = /^[0-9+\-*/().%\s]+$/;
    if (!allowed.test(expression)) {
        return JSON.stringify({ error: "Invalid characters. Only numbers, +, -, *, /, (, ), % allowed." });
    }
    const sanitized = String(expression).replace(/\s/g, "");
    try {
        const result = Function(`"use strict"; return (${sanitized})`)();
        return JSON.stringify({ expression: sanitized, result: Number.isFinite(result) ? result : String(result) });
    } catch (e) {
        return JSON.stringify({ error: e.message || "Invalid expression" });
    }
}

const calculatorTool = tool(
    evaluateMath,
    {
        name: "calculator",
        description: "Use this tool to evaluate mathematical expressions. Supports +, -, *, /, parentheses, and %. Example: (15 * 3) + 7",
        schema: z.object({
            expression: z.string().describe("The mathematical expression to evaluate, e.g. '2 + 3 * 4' or '(100 - 25) / 3'"),
        }),
    }
);

// Current date and time
async function getCurrentDateTime(_input = {}) {
    const now = new Date();
    return JSON.stringify({
        iso: now.toISOString(),
        date: now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
        time: now.toLocaleTimeString("en-US", { hour12: true }),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        unix: Math.floor(now.getTime() / 1000),
    });
}

const getCurrentDateTimeTool = tool(
    getCurrentDateTime,
    {
        name: "getCurrentDateTime",
        description: "Use this tool to get the current date, time, timezone, and UNIX timestamp.",
        schema: z.object({}),
    }
);

// Google Maps search
async function googleMapsSearch({ query }) {
    const encoded = encodeURIComponent(query);
    const url = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    return JSON.stringify({ query, mapsSearchUrl: url });
}

const googleMapsSearchTool = tool(
    googleMapsSearch,
    {
        name: "googleMapsSearch",
        description: "Use this tool when the user asks for nearby places, restaurants, routes, directions, or location discovery. Returns a clickable Google Maps search URL.",
        schema: z.object({
            query: z.string().describe("The search query for Google Maps, e.g. 'pizza near me', 'route from A to B', 'coffee shops'"),
        }),
    }
);

const agentTools = [searchInternetTool, readWebPageTool, emailTool, calculatorTool, getCurrentDateTimeTool, googleMapsSearchTool];

let mistralAgent = null;
let geminiAgent = null;

try {
    mistralAgent = createAgent({
        model: mistralModel,
        tools: agentTools,
    });
} catch (e) {
    console.warn("Could not create Mistral agent:", e.message);
}

try {
    geminiAgent = createAgent({
        model: geminiModel,
        tools: agentTools,
    });
} catch (e) {
    console.warn("Could not create Gemini agent:", e.message);
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function cleanGeneratedTitle(rawTitle) {
    if (!rawTitle) return "New Chat";

    return String(rawTitle)
        .replace(/\*\*/g, "")
        .replace(/^\s*["'`]+|["'`]+\s*$/g, "")
        .replace(/^\s*[-:]+|[-:]+\s*$/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 50) || "New Chat";
}

async function invokeWithRetry({ agentInstance, payload, retries = 1, onStatus, statusLabel }) {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            if (attempt > 0) {
                onStatus?.(`${statusLabel} retry ${attempt}...`);
            }
            return await agentInstance.invoke(payload);
        } catch (error) {
            lastError = error;
            if (attempt < retries) {
                await delay(350 * (attempt + 1));
            }
        }
    }
    throw lastError;
}

function buildAgentMessages(messages) {
    return [
        new SystemMessage(`
            You are Intellix, a highly intelligent, friendly, and precise AI assistant.
            You have access to specialized tools:
            - searchInternet: Query the live web for recent events, facts, news, and technical questions.
            - readWebPage: Fetch and read readable webpage content directly given a URL.
            - sendEmail: Draft and send formatted HTML emails.
            - calculator: Evaluate mathematical equations accurately.
            - getCurrentDateTime: Get exact current time, date, day of week, and timezone.
            - googleMapsSearch: Generate Google Maps discovery links for places, restaurants, locations, and directions.

            Formatting guidelines:
            - Use clean, well-formatted Markdown with headings, bullet points, bold highlights, and code blocks with language tags when appropriate.
            - If you use Google Maps, format the link as [Search on Google Maps](url).
            - Keep answers structured, insightful, and enjoyable to read.
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

export async function generateResponse(messages, options = {}) {
    const { onStatus } = options;

    if (!hasMistralKey && !hasGeminiKey) {
        return "⚠️ **API Key Missing**: Neither `MISTRAL_API_KEY` nor `GEMINI_API_KEY` is configured in `backend/.env`. Please add a valid API key to enable AI responses.";
    }

    const payload = {
        messages: buildAgentMessages(messages),
    };

    onStatus?.("Thinking...");

    let response;
    // Prefer Mistral if configured, otherwise Gemini
    if (hasMistralKey && mistralAgent) {
        try {
            response = await invokeWithRetry({
                agentInstance: mistralAgent,
                payload,
                retries: 1,
                onStatus,
                statusLabel: "Retrying Mistral",
            });
        } catch (mistralError) {
            console.error("Mistral failed, attempting Gemini fallback:", mistralError?.message || mistralError);
            if (hasGeminiKey && geminiAgent) {
                onStatus?.("Switching to Gemini model...");
                response = await invokeWithRetry({
                    agentInstance: geminiAgent,
                    payload,
                    retries: 1,
                    onStatus,
                    statusLabel: "Retrying Gemini",
                });
            } else {
                throw mistralError;
            }
        }
    } else if (hasGeminiKey && geminiAgent) {
        response = await invokeWithRetry({
            agentInstance: geminiAgent,
            payload,
            retries: 1,
            onStatus,
            statusLabel: "Retrying Gemini",
        });
    }

    onStatus?.("Finalizing response...");

    const finalMessage = response?.messages?.[response?.messages?.length - 1]?.text || "";
    return finalMessage || "I was unable to formulate a response. Please try again.";
}

export async function generateChatTitle(message) {
    if (!message || typeof message !== "string") return "New Chat";
    const snippet = message.slice(0, 100);

    if (!hasMistralKey && !hasGeminiKey) {
        // Fallback local heuristic title if no API key is available
        const words = snippet.replace(/[^\w\s]/gi, "").split(/\s+/).filter(Boolean);
        return words.slice(0, 4).join(" ") || "New Conversation";
    }

    const promptMessages = [
        new SystemMessage(
            "You are a helpful assistant that generates a concise 2-4 word title for a chat conversation based on the user's first message. Return only the title without quotes or punctuation."
        ),
        new HumanMessage(`Generate a short 2-4 word title for this prompt:\n"${snippet}"`),
    ];

    try {
        if (hasMistralKey) {
            const response = await mistralModel.invoke(promptMessages);
            return cleanGeneratedTitle(response.text);
        } else {
            const response = await geminiModel.invoke(promptMessages);
            return cleanGeneratedTitle(response.text);
        }
    } catch (error) {
        console.warn("AI title generation failed, using local title:", error?.message || error);
        const words = snippet.replace(/[^\w\s]/gi, "").split(/\s+/).filter(Boolean);
        return words.slice(0, 4).join(" ") || "New Conversation";
    }
}
