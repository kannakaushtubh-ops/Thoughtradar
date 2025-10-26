
import { GoogleGenAI } from "@google/genai";

// Assume API_KEY is set in the environment
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key not found. Summarization will be disabled.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const summarizeThought = async (thoughtText: string): Promise<string> => {
    if (!ai) {
        return "Summary unavailable.";
    }
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Summarize this thought in 5 words or less: "${thoughtText}"`,
        });

        const summary = response.text.trim().replace(/["*]/g, ''); // Clean up quotes and asterisks
        return summary || "Could not summarize.";
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "Summary generation failed.";
    }
};
