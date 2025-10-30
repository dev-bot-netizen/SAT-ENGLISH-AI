import type { VocabularyWord, WordDetails, VocabularyWordStatus, QuizQuestion, EvaluationResult } from '@/types';
import { getAuthHeader } from './firebase';
import { getSpeechAudio } from './ttsService';

export const addWordsToVocab = async (userId: string | null, words: string[], contextPassage: string, sourceQuestionId: number): Promise<void> => {
    if (userId && words.length > 0) {
        const authHeader = await getAuthHeader();
        const response = await fetch('/api/vocabulary?action=addWords', {
            method: 'POST',
            headers: { ...authHeader, 'Content-Type': 'application/json' },
            body: JSON.stringify({ words, contextPassage, sourceQuestionId }),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
            console.error('Failed to add words to vocabulary:', error.message);
            // Don't throw an error to the user for this, as it's a background/non-critical task.
        }
    }
};

export const getVocabularyList = async (userId: string | null): Promise<VocabularyWord[]> => {
     if (userId) {
        const authHeader = await getAuthHeader();
        const response = await fetch(`/api/vocabulary?action=getList&userId=${userId}`, {
            headers: authHeader,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to fetch vocabulary list.');
        }
        return response.json();
    } else {
        // Guest users have no vocabulary list
        return [];
    }
};

export const getReviewQueue = async (): Promise<VocabularyWord[]> => {
    const authHeader = await getAuthHeader();
    if (!authHeader['Authorization']) return [];

    const response = await fetch('/api/vocabulary?action=getReviewQueue', {
        headers: authHeader,
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch review queue.');
    }
    return response.json();
};

export const updateWordStatus = async (wordId: string, status: VocabularyWordStatus): Promise<void> => {
    const authHeader = await getAuthHeader();
    const response = await fetch('/api/vocabulary?action=update', {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId, status }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An unknown error occurred while updating word status' }));
        throw new Error(error.message);
    }
};

export const submitWordReview = async (wordId: string, performance: 'again' | 'good' | 'reset'): Promise<void> => {
    const authHeader = await getAuthHeader();
    const response = await fetch('/api/vocabulary?action=update', {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId, performance }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An unknown error occurred while submitting review' }));
        throw new Error(error.message);
    }
};

export const getWordDetails = async (word: string, context: string): Promise<WordDetails> => {
    const authHeader = await getAuthHeader();
    const encodedWord = encodeURIComponent(word);
    const encodedContext = encodeURIComponent(context);
    const response = await fetch(`/api/vocabulary?action=getDetails&word=${encodedWord}&context=${encodedContext}`, {
        method: 'GET',
        headers: { ...authHeader },
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to get word details.';
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || `${errorMessage} Server responded with ${response.status}: ${errorText}`;
        } catch (e) {
            errorMessage += ` Server responded with ${response.status}: ${errorText}`;
        }
        throw new Error(errorMessage);
    }
    return response.json();
};

export const getPronunciationAudio = async (text: string, accent: string): Promise<string> => {
    return getSpeechAudio(text, accent);
};

export const generateVocabularyQuiz = async (words: VocabularyWord[]): Promise<QuizQuestion[]> => {
    const authHeader = await getAuthHeader();
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generateVocabQuiz', payload: { words } }),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to generate quiz.' }));
        throw new Error(error.message);
    }
    const data = await response.json();
    return data.questions;
};

export const evaluateVocabularyAnswer = async (question: QuizQuestion, userAnswer: string): Promise<EvaluationResult> => {
    const authHeader = await getAuthHeader();
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'evaluateVocabAnswer', payload: { question, userAnswer } }),
    });
     if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to evaluate answer.' }));
        throw new Error(error.message);
    }
    const data = await response.json();
    return data.evaluation;
};

export const bulkUpdateWords = async (updates: { wordId: string, status?: VocabularyWordStatus, performance?: 'again' }[]): Promise<void> => {
    const authHeader = await getAuthHeader();
    const response = await fetch('/api/vocabulary?action=bulkUpdate', {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An unknown error occurred while saving quiz results' }));
        throw new Error(error.message);
    }
};
