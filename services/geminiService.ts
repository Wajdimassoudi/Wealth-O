
import { GoogleGenAI, Type } from "@google/genai";
import { SideHustle, UserProfile } from "../types";

// The SideHustle and UserProfile types are now properly exported from ../types

export const generateSideHustles = async (profile: UserProfile): Promise<SideHustle[]> => {
  // Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate exactly 4 realistic side-hustle ideas based on these parameters:
        Skills: ${profile.skills.join(", ") || "General"}
        Time available: ${profile.availableTime}
        Budget: ${profile.initialBudget}`,
      config: {
        systemInstruction: "You are an elite financial advisor. Provide high-quality, actionable, and specific side-hustle ideas. Ensure response is valid JSON array.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              potentialEarnings: { type: Type.STRING },
              timeToStart: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["title", "description", "difficulty", "potentialEarnings", "timeToStart", "category"]
          }
        }
      }
    });

    // Access the .text property directly from GenerateContentResponse
    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    const result = JSON.parse(text.trim());
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("AI Generation Failure:", error);
    // Return empty array to allow UI to handle failure gracefully
    return [];
  }
};
