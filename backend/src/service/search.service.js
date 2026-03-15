import { tavily } from "@tavily/core";

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });


export async function search({ query }) {
    const response = await tvly.search(query);
    return response
}