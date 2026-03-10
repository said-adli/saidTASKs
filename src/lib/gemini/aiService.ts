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

export const aiService = {
    breakDownTask: async (taskTitle: string, description?: string): Promise<string[]> => {
        try {
            const ai = getGenAI();
            // Gemini 2.5 Pro for advanced reasoning
            const model = ai.getGenerativeModel({ model: "gemini-2.5-pro" });

            const prompt = `
        You are an expert productivity assistant. Your job is to break down a complex task into smaller, highly actionable sub-tasks.
        The user wants to accomplish: "${taskTitle}"
        ${description ? `Additional context: "${description}"` : ''}

        Rules:
        1. Return ONLY a valid JSON array of strings. 
        2. Do not include markdown formatting like \`\`\`json.
        3. Do not include any explanations or conversational text.
        4. Provide 3 to 6 highly actionable, concise steps.
        
        Example Output:
        ["Research necessary materials", "Draft initial outline", "Review with team"]
      `;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            // Clean up potential markdown formatting that Gemini might forcefully include
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
            const model = ai.getGenerativeModel({ model: "gemini-2.5-pro" });

            const prompt = `
        You are an expert productivity categorization engine. 
        Given the task title: "${taskTitle}"
        
        1. Determine the best category for this task (e.g., Work, Personal, Urgent, Coding, Health, Food, Finance, Learning, Chores, Setup).
        2. Assign a single appropriate emoji icon for this task (e.g., 🍕, 💻, 🏃‍♂️, 💰, 📚, 🧹, ⚙️).
        
        Return ONLY a valid JSON object in this format:
        {"category": "CategoryName", "icon": "Emoji"}
        
        Do not include markdown or explanations.
        `;

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
