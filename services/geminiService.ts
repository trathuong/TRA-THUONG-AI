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
    backgroundImage: GenerativePart | null,
    keepOriginalFace: boolean,
    smoothSkin: boolean,
    removeAcne: boolean,
    increaseSharpness: boolean
): Promise<string | null> {
    const parts: GenerativePart[] = [originalImage];

    const instructions: string[] = [];

    if (backgroundImage) {
        parts.push(backgroundImage);
        instructions.push('Replace the background of the person in the first image with the second image.');
        if (prompt) {
            instructions.push(`Incorporate these elements into the new background: ${prompt}.`);
        }
    } else {
        instructions.push(`Change the background to: ${prompt}`);
    }

    instructions.push('Keep the original person from the first image in the foreground.');

    if (keepOriginalFace) {
        instructions.push('Preserve the facial features and likeness of the person exactly.');
    } else {
        instructions.push('You may slightly enhance the facial features for a better look, but maintain the person\'s identity.');
    }

    if (smoothSkin) {
        instructions.push('Apply a skin smoothing effect to the person.');
    }
    
    if (removeAcne) {
        instructions.push('Remove any acne, blemishes, or spots from the person\'s skin for a clear complexion.');
    }

    if (increaseSharpness) {
        instructions.push('Increase the overall sharpness and detail of the person, especially their facial features like eyes and hair, to make them look crisp and well-defined.');
    }

    const fullPrompt = instructions.join(' ');
    parts.push({ text: fullPrompt });
    
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