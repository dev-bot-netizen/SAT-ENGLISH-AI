import type { PastAssignment, PastAssignmentSummary, Question, Highlight } from '@/types';
import { getAuthHeader } from './firebase';

interface AssignmentData {
    score: number;
    questions: Question[];
    userAnswers: Record<number, string>;
    highlights: Record<number, Highlight[]>;
    strikethroughs?: Record<number, string[]>;
    topics: string[];
    difficulty: number;
    timeLimitInSeconds: number;
    customizations?: string;
    status: 'completed' | 'paused';
    timeRemaining?: number;
}

const GUEST_ASSIGNMENTS_KEY = 'sat-solver-guest-assignments';

// --- Local Storage Helper Functions for Guest Mode ---

const getLocalAssignments = (): PastAssignment[] => {
    try {
        const data = localStorage.getItem(GUEST_ASSIGNMENTS_KEY);
        if (!data) return [];
        const assignments = JSON.parse(data);
        // Rehydrate date strings into Date objects
        return assignments.map((a: any) => ({ ...a, dateCompleted: new Date(a.dateCompleted) }));
    } catch (error) {
        console.error("Error reading guest assignments from localStorage:", error);
        return [];
    }
};

const saveLocalAssignments = (assignments: PastAssignment[]): void => {
    try {
        localStorage.setItem(GUEST_ASSIGNMENTS_KEY, JSON.stringify(assignments));
    } catch (error) {
        console.error("Error saving guest assignments to localStorage:", error);
    }
};


// A helper to create robust error messages from failed fetch responses
const createApiError = async (response: Response, defaultMessage: string): Promise<Error> => {
    const errorText = await response.text();
    let errorMessage = defaultMessage;
    try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
            errorMessage = errorJson.message;
        } else {
             errorMessage += `. Server responded with ${response.status}: ${errorText}`;
        }
    } catch (e) {
        // The error response was not JSON (e.g., an HTML error page from Vercel)
        errorMessage += `. Server responded with ${response.status}: ${errorText}`;
    }
    return new Error(errorMessage);
};

export const saveAssignment = async (userId: string | null, data: AssignmentData): Promise<void> => {
    if (userId) {
        // --- API Logic for Logged-In Users ---
        const payload = {
            ...data,
            dateCompleted: new Date().toISOString(), // Use ISO string for JSON transfer
        };

        try {
            const authHeader = await getAuthHeader();
            if (!authHeader['Authorization']) throw new Error("User not authenticated.");

            const response = await fetch('/api/assignments', {
                method: 'POST',
                headers: {
                    ...authHeader,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw await createApiError(response, 'Failed to save assignment');
            }
        } catch (error) {
            console.error("Error saving assignment via API:", error);
            throw error;
        }
    } else {
        // --- Local Storage Logic for Guest Users ---
        const localAssignments = getLocalAssignments();
        
        // --- Generate Assignment Name for Guest ---
        const difficultyMap: { [key: number]: string } = { 1: 'easy', 2: 'moderate', 3: 'hard' };
        const difficultyName = difficultyMap[data.difficulty] || 'standard';
        const sortedTopics = [...data.topics].sort();
        
        const count = localAssignments.filter(a => 
            a.userId === 'guest' && 
            JSON.stringify([...a.topics].sort()) === JSON.stringify(sortedTopics) &&
            a.difficulty === data.difficulty
        ).length;

        const assignmentNumber = count + 1;
        const name = `${sortedTopics.join(' & ')} ${difficultyName} ${assignmentNumber}`;
        // --- End Name Generation ---

        const newAssignment: PastAssignment = {
            ...data,
            id: `guest-${Date.now()}`,
            userId: 'guest',
            name: name,
            dateCompleted: new Date(),
            strikethroughs: data.strikethroughs || {},
            customizations: data.customizations || '',
        };
        localAssignments.push(newAssignment);
        saveLocalAssignments(localAssignments);
        return Promise.resolve();
    }
};

export const getAssignmentSummaries = async (userId: string | null): Promise<PastAssignmentSummary[]> => {
    if (userId) {
        // --- API Logic for Logged-In Users ---
        try {
            const authHeader = await getAuthHeader();
            if (!authHeader['Authorization']) throw new Error("User not authenticated.");

            const response = await fetch(`/api/assignments/summaries/${userId}`, {
                headers: authHeader,
            });
            if (!response.ok) {
                 throw await createApiError(response, 'Failed to fetch assignment summaries');
            }
            const summaries = await response.json();
            
            // Rehydrate date strings into Date objects
            return summaries.map((s: any) => ({
                ...s,
                totalQuestions: s.totalQuestions || 20, // Fallback for older data
                dateCompleted: new Date(s.dateCompleted),
            })).sort((a: any, b: any) => b.dateCompleted.getTime() - a.dateCompleted.getTime());

        } catch (error) {
            console.error("Error fetching summaries from API:", error);
            throw error;
        }
    } else {
        // --- Local Storage Logic for Guest Users ---
        const assignments = getLocalAssignments();
        const summaries: PastAssignmentSummary[] = assignments.map((a: PastAssignment & {totalQuestions?: number}) => ({
            id: a.id,
            name: a.name,
            dateCompleted: a.dateCompleted,
            score: a.score,
            totalQuestions: a.totalQuestions || a.questions.length,
            topics: a.topics,
            difficulty: a.difficulty,
            status: a.status || 'completed',
        }));
        // Sort by most recent first
        return Promise.resolve(summaries.sort((a, b) => b.dateCompleted.getTime() - a.dateCompleted.getTime()));
    }
};

export const getAssignmentDetails = async (assignmentId: string): Promise<PastAssignment | null> => {
    if (assignmentId.startsWith('guest-')) {
        // --- Local Storage Logic for Guest Users ---
        const assignments = getLocalAssignments();
        const assignment = assignments.find(a => a.id === assignmentId) || null;
        return Promise.resolve(assignment);
    } else {
        // --- API Logic for Logged-In Users ---
        try {
            const authHeader = await getAuthHeader();
            if (!authHeader['Authorization']) throw new Error("User not authenticated.");

            const response = await fetch(`/api/assignments/${assignmentId}`, {
                headers: authHeader
            });
            if (response.status === 404) {
                return null;
            }
            if (!response.ok) {
                throw await createApiError(response, 'Failed to fetch assignment details');
            }
            const assignmentData = await response.json();

            // Rehydrate date string into a Date object
            return {
                ...assignmentData,
                dateCompleted: new Date(assignmentData.dateCompleted),
            } as PastAssignment;
        } catch (error) {
            console.error(`Error fetching assignment details for ${assignmentId}: `, error);
            throw error;
        }
    }
};

export const checkForPausedAssignment = async (userId: string | null): Promise<PastAssignmentSummary | null> => {
    const summaries = await getAssignmentSummaries(userId);
    return summaries.find(s => s.status === 'paused') || null;
};

export const deleteAssignment = async (assignmentId: string): Promise<void> => {
    if (assignmentId.startsWith('guest-')) {
        const assignments = getLocalAssignments();
        const updatedAssignments = assignments.filter(a => a.id !== assignmentId);
        saveLocalAssignments(updatedAssignments);
        return Promise.resolve();
    } else {
        const authHeader = await getAuthHeader();
        if (!authHeader['Authorization']) throw new Error("User not authenticated.");

        const response = await fetch(`/api/assignments/${assignmentId}`, {
            method: 'DELETE',
            headers: authHeader,
        });

        if (!response.ok) {
            throw await createApiError(response, 'Failed to delete an assignment');
        }
    }
};

export const getGuestCompletedAssignmentsCount = (): number => {
    const assignments = getLocalAssignments();
    return assignments.filter(a => a.status === 'completed').length;
};