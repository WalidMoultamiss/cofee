import { GoogleGenAI, Type } from "@google/genai";
import { PourStats, CoffeeFortune } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is not set. Gemini features will not work.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateCoffeeFortune = async (stats: PourStats): Promise<CoffeeFortune> => {
  const ai = getClient();
  
  // Fallback if no API key
  if (!ai) {
    return {
      rating: Math.floor(stats.fillPercentage / 10),
      title: "The Mystery Pour",
      fortune: "The mists of the future are clouded... (Check API Key)",
      baristaComment: "I can't quite read this cup."
    };
  }

  const prompt = `
    You are a wise, slightly mystical, but modern Coffee Fortune Teller and Master Barista.
    A user has just poured a cup of coffee in a simulation.
    
    Here are their stats:
    - Fill Percentage: ${stats.fillPercentage.toFixed(1)}% (Target was 80-95%)
    - Spilled: ${stats.spilled ? "Yes, messy!" : "No, clean."}
    - Time Taken: ${stats.timeTaken.toFixed(1)} seconds.

    Based on this performance, generate a "Coffee Reading" (fortune) and a critique of their technique.
    If they spilled or underfilled/overfilled, be gently teasing but constructive.
    If they did well (80-95%), be praiseworthy and give a lucky fortune.

    Return the response in JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rating: { type: Type.NUMBER, description: "Score out of 10" },
            title: { type: Type.STRING, description: "A mystical title for this pour (e.g., 'The Overflowing Heart')" },
            fortune: { type: Type.STRING, description: "A cryptic but warm fortune telling based on the 'patterns' in the coffee." },
            baristaComment: { type: Type.STRING, description: "Technical feedback on the pour." },
          },
          required: ["rating", "title", "fortune", "baristaComment"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as CoffeeFortune;
    }
    throw new Error("No text response");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      rating: 5,
      title: "The Silent Cup",
      fortune: "The spirits are quiet today. Try pouring again.",
      baristaComment: "Unable to connect to the ether (API Error)."
    };
  }
};
