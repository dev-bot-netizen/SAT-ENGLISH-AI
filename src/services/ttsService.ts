import { getAuthHeader } from './firebase';

export const getSpeechAudio = async (text: string, accent: string = 'en-US'): Promise<string> => {
    const authHeader = await getAuthHeader();
    if (!authHeader['Authorization']) {
        throw new Error("User not authenticated.");
    }

    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getSpeechAudio', payload: { text, accent } }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An unknown error occurred while fetching pronunciation.' }));
        throw new Error(error.message);
    }
    const data = await response.json();
    return data.audioContent;
};
