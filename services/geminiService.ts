import { GoogleGenAI, Modality } from "@google/genai";
// FIX: Import GenerativePart from local types as it is not exported from @google/genai.
import type { GenerativePart } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY is not set in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = "gemini-2.5-flash-image";

export async function generateImage(
    originalImage: GenerativePart,
    prompt: string,
    backgroundImage: GenerativePart | null
): Promise<string | null> {
    const parts: GenerativePart[] = [originalImage];

    if (backgroundImage) {
        parts.push(backgroundImage);
        parts.push({ text: 'Replace the background of the first image with the second image, keeping the people from the first image. ' + prompt });
    } else {
        parts.push({ text: `Change the background to: ${prompt}` });
    }
    
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: parts,
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const mimeType = part.inlineData.mimeType;
                return `data:${mimeType};base64,${base64ImageBytes}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Error generating image with Gemini:", error);
        throw new Error("Failed to generate image from API.");
    }
}
