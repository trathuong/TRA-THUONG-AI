export interface ImageFile {
    file: File;
    previewUrl: string;
}

// FIX: Define GenerativePart type locally as it is not exported from @google/genai.
export type GenerativePart = {
    text: string;
} | {
    inlineData: {
        mimeType: string;
        data: string;
    };
};
