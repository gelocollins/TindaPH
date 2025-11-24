import { GoogleGenAI } from "@google/genai";

// NOTE: In a real app, process.env.API_KEY would be populated.
// For this demo, we assume the environment variable is set or the user provides it.
// We handle the case where it might be missing gracefully.

export const generateListingDescription = async (title: string, category: string, condition: string): Promise<string> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key found for Gemini.");
    return "This is a great item! (AI Description unavailable without API Key)";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Write a catchy, short, and professional sales description for a marketplace listing in the Philippines.
      Item: ${title}
      Category: ${category}
      Condition: ${condition}
      
      Tone: Friendly, trustworthy, enthusiastic.
      Max length: 3 sentences.
      Include emojis.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not generate description.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating description. Please try again.";
  }
};
