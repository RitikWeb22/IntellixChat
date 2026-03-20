
import { tavily as Tavily } from "@tavily/core"

const tavily = Tavily({
    apiKey: process.env.TAVILY_API_KEY,
})


export const searchInternet = async ({ query }) => {
    const results = await tavily.search(query, {
        maxResults: 5,
    })
    return JSON.stringify(results)
}

export const readWebPage = async ({ url }) => {
    const response = await fetch(url, {
        headers: {
            "User-Agent": "IntellixBot/1.0"
        }
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch webpage: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()

    // Remove script/style/no-script blocks and strip tags for a compact readable payload.
    const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()

    const limitedText = text.slice(0, 12000)

    return JSON.stringify({
        url,
        content: limitedText,
        truncated: text.length > limitedText.length
    })
}