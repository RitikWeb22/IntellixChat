import "dotenv/config";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGoogle } from "@langchain/google";
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



const agent = createAgent({
    model: mistralModel,
    tools: [searchInternetTool, readWebPageTool, emailTool],
})

const fallbackAgent = createAgent({
    model: geminiModel,
    tools: [searchInternetTool, readWebPageTool, emailTool],
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
                If the question requires up-to-date information, use the "searchInternet" tool to get the latest information from the internet and then answer based on the search results.
                If the user provides a URL or asks for details from a specific page, use the "readWebPage" tool.
                If the user asks for nearby places, restaurants, routes, or location discovery, use the "googleMapsSearch" tool.
                When using "googleMapsSearch", always include the provided mapsSearchUrl as a clickable link in your final answer.
                You can also use the "sendEmail" tool to send emails in formatted HTML.
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
