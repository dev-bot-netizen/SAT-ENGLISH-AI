import { getAuthHeader } from './firebase';
import type { Feedback } from '@/types';

interface FeedbackPayload {
    rating: number;
    aiRating: number;
    mostValuableFeature?: string;
    aiIssues?: string;
    comments?: string;
    page: string;
}

export const submitFeedback = async (payload: FeedbackPayload): Promise<void> => {
    const authHeader = await getAuthHeader(); // Will be empty for guests, handled by backend
    const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 
            ...authHeader,
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ action: 'submit', payload })
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(error.message);
    }
};

export const getFeedback = async (): Promise<Feedback[]> => {
    const authHeader = await getAuthHeader();
    if (!authHeader['Authorization']) {
        throw new Error("Authentication required to view feedback.");
    }

    const response = await fetch('/api/feedback', {
        method: 'GET',
        headers: authHeader,
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(error.message);
    }
    const data = await response.json();
    return data.map((item: any) => ({ ...item, _id: item._id.toString() }));
};