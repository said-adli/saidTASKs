import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
// Note: We'll initialize lazily to avoid errors if the key isn't set immediately
let genAI: GoogleGenerativeAI | null = null;

const getGenAI = () => {
    if (!genAI) {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not set in your environment variables.");
        }
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
};

// Default model: Flash for high-quota, low-latency tasks
const FAST_MODEL = "gemini-2.5-flash";

export const aiService = {
    breakDownTask: async (taskTitle: string, description?: string): Promise<string[]> => {
        try {
            const ai = getGenAI();
            const model = ai.getGenerativeModel({ model: FAST_MODEL });

            const prompt = `Break down this task into 3-6 actionable sub-tasks.
Task: "${taskTitle}"${description ? `\nContext: "${description}"` : ''}

Return ONLY a JSON array of strings. No markdown, no explanation.
Example: ["Step one","Step two","Step three"]`;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

            return JSON.parse(cleanJson) as string[];
        } catch (error) {
            console.error("Error breaking down task with Gemini:", error);
            throw error;
        }
    },

    categorizeTask: async (taskTitle: string): Promise<{ category: string, icon: string } | null> => {
        try {
            const ai = getGenAI();
            const model = ai.getGenerativeModel({ model: FAST_MODEL });

            const prompt = `Categorize this task and assign an emoji.
Task: "${taskTitle}"

Return ONLY JSON: {"category":"CategoryName","icon":"Emoji"}
Categories: Work, Personal, Urgent, Coding, Health, Finance, Learning, Chores, Setup.`;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();

            return JSON.parse(cleanJson) as { category: string, icon: string };
        } catch (error) {
            console.error("Error categorizing task with Gemini:", error);
            return null;
        }
    }
};
