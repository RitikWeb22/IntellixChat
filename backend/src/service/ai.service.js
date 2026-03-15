import "dotenv/config";
import readline from "readline/promises"
import { ChatMistralAI } from "@langchain/mistralai";
import { createAgent, HumanMessage, tool } from "langchain";

import * as z from "zod";
import { sendEmail } from "./email.service.js";
import { search } from "./search.service.js";


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})


/**
 * @description This tool is used to send email. It takes the recipient's email address, subject, and HTML content as input and sends an email to the recipient.
 */
const emailTool = tool(
    sendEmail,
    {
        name: "sendEmail",
        description: "use this tool to send email",
        schema: z.object({
            to: z.string().describe("email address of the recipient"),
            subject: z.string().describe("subject of the email"),
            html: z.string().describe("html content of the email")
        })
    }
)


/**
 * @description This tool is used to search on the internet and get the latest information. It takes a query as input and returns the search results.
 */
const internetTool = tool(
    search,
    {
        name: "internetSearch",
        description: "use this tool to search on the internet and get the latest information",
        schema: z.object({
            query: z.string().describe("the search query")
        })
    }
)



const model = new ChatMistralAI({
    model: "mistral-small-latest",
});



const agent = createAgent({
    model,
    tools: [emailTool, internetTool]
});


const messages = []

export async function test() {
    while (true) {
        const userInput = await rl.question("\x1b[32mYou:\x1b[0m ");
        messages.push(new HumanMessage(userInput))
        const res = await agent.invoke({ messages });
        messages.push(res.messages[res.messages.length - 1]);
        // console.log(res)/
        console.log(`\x1b[34mAgent:\x1b[0m ${res.messages[res.messages.length - 1].text}\n`);
    }

    rl.close()
}