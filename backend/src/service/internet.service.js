import { tavily as Tavily } from "@tavily/core";

let tavilyClient = null;

if (process.env.TAVILY_API_KEY) {
    try {
        tavilyClient = Tavily({
            apiKey: process.env.TAVILY_API_KEY,
        });
    } catch (err) {
        console.warn("Failed to initialize Tavily client:", err?.message || err);
    }
}

export const searchInternet = async ({ query }) => {
    if (!tavilyClient) {
        return JSON.stringify({
            status: "unavailable",
            message: "Tavily search API key is not configured on this server.",
            query,
        });
    }

    try {
        const results = await tavilyClient.search(query, {
            maxResults: 5,
        });
        return JSON.stringify(results);
    } catch (err) {
        console.error("Tavily search error:", err?.message || err);
        return JSON.stringify({
            status: "error",
            message: `Search failed: ${err.message}`,
            query,
        });
    }
};

export const readWebPage = async ({ url }) => {
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 IntellixBot/1.0",
            },
            signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (!response.ok) {
            return JSON.stringify({
                status: "error",
                message: `Failed to fetch webpage: ${response.status} ${response.statusText}`,
                url,
            });
        }

        const html = await response.text();

        // Remove script/style/no-script blocks and strip tags for a compact readable payload.
        const text = html
            .replace(/<script[\s\S]*?<\/script>/gi, " ")
            .replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        const limitedText = text.slice(0, 12000);

        return JSON.stringify({
            url,
            content: limitedText,
            truncated: text.length > limitedText.length,
        });
    } catch (err) {
        return JSON.stringify({
            status: "error",
            message: `Could not retrieve webpage: ${err.message}`,
            url,
        });
    }
};