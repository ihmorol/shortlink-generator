import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || '';

// Initialize only if API Key exists, but handle safely in calls
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const GeminiService = {
  suggestSlugs: async (originalUrl: string, description: string = ''): Promise<string[]> => {
    if (!ai) {
      console.warn("Gemini API Key is missing.");
      return [];
    }

    try {
      const prompt = `
        I am creating a short link for the following URL: "${originalUrl}".
        ${description ? `Description of the content: "${description}".` : ''}
        
        Suggest 5 creative, short, and memorable slugs (URL paths) for this link.
        Slugs should be:
        1. URL-safe (kebab-case or camelCase).
        2. Short (ideally under 15 characters).
        3. Relevant to the content.
        
        Return the result as a JSON array of strings.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        }
      });

      const text = response.text;
      if (!text) return [];

      const data = JSON.parse(text);
      return data.suggestions || [];
    } catch (error) {
      console.error("Error generating slug suggestions:", error);
      return [];
    }
  }
};