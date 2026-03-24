import "dotenv/config";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai"
import { HumanMessage, SystemMessage, AIMessage, tool, createAgent } from "langchain";
import * as z from "zod";
import { searchInternet, readWebPage } from "./internet.service.js";
import { sendEmail } from "./email.service.js";

const geminiModel = new ChatGoogleGenerativeAI({
    model: "gemini-flash-latest",
    apiKey: process.env.GEMINI_API_KEY
});

const mistralModel = new ChatMistralAI({
    model: "mistral-medium-latest",
    apiKey: process.env.MISTRAL_API_KEY
})

// email tool for mistral model
const emailTool = tool(
    sendEmail,
    {
        name: "sendEmail",
        description: "Use this tool to send an email. Provide the recipient's email address, subject, and HTML content.",
        schema: z.object({
            to: z.string().describe("Email address of the recipient"),
            subject: z.string().describe("Subject of the email"),
            html: z.string().describe("HTML content of the email")
        })
    }
)

// search internet tool for mistral model
const searchInternetTool = tool(
    searchInternet,
    {
        name: "searchInternet",
        description: "Use this tool to get the latest information from the internet.",
        schema: z.object({
            query: z.string().describe("The search query to look up on the internet.")
        })
    }
)

const readWebPageTool = tool(
    readWebPage,
    {
        name: "readWebPage",
        description: "Use this tool to fetch and read the main textual content of a webpage from a URL.",
        schema: z.object({
            url: z.string().url().describe("The full URL of the webpage to read.")
        })
    }
)

// Safe calculator for mathematical expressions (no arbitrary code execution)
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
            expression: z.string().describe("The mathematical expression to evaluate, e.g. '2 + 3 * 4' or '(100 - 25) / 3'")
        })
    }
)

// Current date and time
async function getCurrentDateTime(_input = {}) {
    const now = new Date();
    return JSON.stringify({
        iso: now.toISOString(),
        date: now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
        time: now.toLocaleTimeString("en-US", { hour12: true }),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        unix: Math.floor(now.getTime() / 1000)
    });
}

const getCurrentDateTimeTool = tool(
    getCurrentDateTime,
    {
        name: "getCurrentDateTime",
        description: "Use this tool to get the current date, time, timezone, and UNIX timestamp. Use when the user asks what time/date it is, or when time-sensitive context is needed.",
        schema: z.object({})
    }
)

// Google Maps search - returns a search URL (no API key required)
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
            query: z.string().describe("The search query for Google Maps, e.g. 'pizza near me', 'route from A to B', 'coffee shops downtown'")
        })
    }
)



const agentTools = [searchInternetTool, readWebPageTool, emailTool, calculatorTool, getCurrentDateTimeTool, googleMapsSearchTool];

const agent = createAgent({
    model: mistralModel,
    tools: agentTools,
})

const fallbackAgent = createAgent({
    model: geminiModel,
    tools: agentTools,
})

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function cleanGeneratedTitle(rawTitle) {
    if (!rawTitle) return "New Chat";

    return String(rawTitle)
        .replace(/\*\*/g, "")
        .replace(/^\s*["'`]+|["'`]+\s*$/g, "")
        .replace(/^\s*[-:]+|[-:]+\s*$/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80) || "New Chat";
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
                You are a helpful and precise assistant for answering questions.
                If you don't know the answer, say you don't know.
                Tools available:
                - searchInternet: Get the latest information from the web. Use when questions need up-to-date info.
                - readWebPage: Fetch and read a webpage's content from a URL. Use when user provides a URL or asks for page details.
                - sendEmail: Send emails with recipient, subject, and HTML content.
                - calculator: Evaluate math expressions (+, -, *, /, %, parentheses). Use for any arithmetic.
                - getCurrentDateTime: Get current date, time, timezone. Use when user asks what time/date it is.
                - googleMapsSearch: For nearby places, restaurants, routes, directions. Always include the returned mapsSearchUrl as a clickable link in your answer.
            `),
        ...(messages
            .map((msg) => {
                if (msg.role == "user") {
                    return new HumanMessage(msg.content)
                } else if (msg.role == "ai" || msg.role == "assistant" || msg.role == "model") {
                    return new AIMessage(msg.content)
                }
                return null;
            })
            .filter(Boolean)),
    ];
}

export async function generateResponse(messages, options = {}) {
    const { onStatus } = options;
    console.log(messages)

    const payload = {
        messages: buildAgentMessages(messages),
    };

    onStatus?.("Searching...");

    let response;
    try {
        onStatus?.("Reading source...");
        response = await invokeWithRetry({
            agentInstance: agent,
            payload,
            retries: 1,
            onStatus,
            statusLabel: "Retrying Mistral",
        });
    } catch (mistralError) {
        console.error("Mistral failed, switching to Gemini:", mistralError?.message || mistralError);
        onStatus?.("Mistral unavailable. Switching to Gemini...");
        response = await invokeWithRetry({
            agentInstance: fallbackAgent,
            payload,
            retries: 1,
            onStatus,
            statusLabel: "Retrying Gemini",
        });
    }

    onStatus?.("Finalizing...");

    const finalMessage = response.messages?.[response.messages.length - 1]?.text || "";
    return finalMessage;

}

export async function generateChatTitle(message) {
    const promptMessages = [
        new SystemMessage(`
            You are a helpful assistant that generates concise and descriptive titles for chat conversations.
            
            User will provide you with the first message of a chat conversation, and you will generate a title that captures the essence of the conversation in 2-4 words. The title should be clear, relevant, and engaging, giving users a quick understanding of the chat's topic.    
        `),
        new HumanMessage(`
            Generate a title for a chat conversation based on the following first message:
            "${message}"
            `)
    ];

    try {
        const response = await mistralModel.invoke(promptMessages);
        return cleanGeneratedTitle(response.text);
    } catch (error) {
        console.error("Mistral title generation failed, using Gemini:", error?.message || error);
        const fallbackResponse = await geminiModel.invoke(promptMessages);
        return cleanGeneratedTitle(fallbackResponse.text);
    }

}
