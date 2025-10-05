// FIX: Import GenerativePart from local types as it is not exported from @google/genai.
import type { GenerativePart } from "../types";

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // remove the data:mime/type;base64, part
            resolve(result.split(',')[1]);
        };
        reader.onerror = (error) => reject(error);
    });
};

export const fileToGenerativePart = async (file: File): Promise<GenerativePart> => {
    const base64Data = await fileToBase64(file);
    return {
        inlineData: {
            data: base64Data,
            mimeType: file.type,
        },
    };
};
