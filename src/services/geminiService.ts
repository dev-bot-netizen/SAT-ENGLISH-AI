import type { Question } from "@/types";
import { getAuthHeader } from './firebase';

// Helper to convert a file to a base64 string
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // result is a data URL like "data:image/png;base64,iVBORw0KGgo..."
            // We only want the base64 part, so we split on the comma.
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = error => reject(error);
    });
};

const callGeminiApi = async (action: string, payload: unknown) => {
    const authHeader = await getAuthHeader(); // Automatically get token for every call

    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 
            ...authHeader,
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ action, payload })
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Server responded with ${response.status}`;
        try {
            // If the server returns a JSON error, use its message
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || `${errorMessage}: ${errorText}`;
        } catch (e) {
             // Otherwise, the error is not JSON (e.g., an HTML page from Vercel)
            errorMessage += `: ${errorText}`;
        }
        // This error will be caught by the try/catch block in the calling UI component
        throw new Error(errorMessage);
    }

    // Only parse JSON if the response is OK. Errors will be caught by the component.
    return await response.json();
};

export const solveSatQuestion = async (imageFile: File): Promise<string> => {
    const imageData = await fileToBase64(imageFile);
    const mimeType = imageFile.type;
    // The userId is no longer sent in the payload. The backend will identify the user via the auth token.
    const { solution } = await callGeminiApi('solveSatQuestion', { imageData, mimeType });
    return solution;
};

export const generateSatAssignment = async (topics: string[], difficulty: number, customizations: string): Promise<Question[]> => {
    // This API call now requires authentication, enforced by the backend.
    // The userId is no longer sent in the payload.
    const { questions } = await callGeminiApi('generateSatAssignment', { topics, difficulty, customizations });
    return questions;
};

export const getQuestionExplanation = async (question: Question): Promise<string> => {
    const { explanation } = await callGeminiApi('getQuestionExplanation', { question });
    return explanation;
};

export const generateTargetedPracticeTest = async (files: File[], correctAnswers: string[]): Promise<Question[]> => {
    if (files.length === 0 || files.length > 3) {
        throw new Error("Please upload between 1 and 3 image files.");
    }
    const imagePromises = files.map(async (file, index) => ({
        imageData: await fileToBase64(file),
        mimeType: file.type,
        correctAnswer: correctAnswers[index] || '', // Pass the correct answer
    }));
    const images = await Promise.all(imagePromises);
    const { questions } = await callGeminiApi('generateTargetedPractice', { images });
    return questions;
};

export const generateAdaptiveTest = async (sourceQuestions: Question[]): Promise<Question[]> => {
    if (sourceQuestions.length === 0 || sourceQuestions.length > 20) {
        throw new Error("Please select between 1 and 20 questions.");
    }
    const { questions } = await callGeminiApi('generateAdaptiveTest', { sourceQuestions });
    return questions;
};

export const generateFromText = async (text: string): Promise<Question[]> => {
    if (text.trim().length < 100) {
        throw new Error("Please provide a text passage of at least 100 characters.");
    }
    const { questions } = await callGeminiApi('generateFromText', { text });
    return questions;
};