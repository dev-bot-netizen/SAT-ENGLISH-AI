import type { FeedbackState } from '@/types';
import { getGuestCompletedAssignmentsCount } from './assignmentService';

const GUEST_DATA_KEY = 'sat-solver-guest-feedback-data';

interface GuestFeedbackData {
    totalTestsCompleted: number;
    feedbackState: FeedbackState;
    snoozeCount: number;
}

const defaultState: GuestFeedbackData = {
    totalTestsCompleted: 0,
    feedbackState: 'eligible',
    snoozeCount: 0,
};

export const getGuestFeedbackData = (): GuestFeedbackData => {
    try {
        const data = localStorage.getItem(GUEST_DATA_KEY);
        const parsedData = data ? JSON.parse(data) : defaultState;
        
        // Sync totalTestsCompleted with the source of truth from assignmentService
        parsedData.totalTestsCompleted = getGuestCompletedAssignmentsCount();
        
        return parsedData;

    } catch (e) {
        // If parsing fails, reset to default but still get the correct test count
        const syncedDefault = { ...defaultState, totalTestsCompleted: getGuestCompletedAssignmentsCount() };
        return syncedDefault;
    }
};

export const saveGuestFeedbackData = (data: GuestFeedbackData): void => {
    try {
        localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("Failed to save guest data", e);
    }
};

export const handleGuestTestCompletion = (): GuestFeedbackData => {
    const data = getGuestFeedbackData(); // This gets the already-synced count
    if (data.feedbackState === 'snoozed') {
        data.snoozeCount = Math.max(0, data.snoozeCount - 1);
        if (data.snoozeCount === 0) {
            data.feedbackState = 'eligible';
        }
    }
    saveGuestFeedbackData(data);
    return data;
};

export const snoozeGuestFeedback = (): void => {
    const data = getGuestFeedbackData();
    data.feedbackState = 'snoozed';
    data.snoozeCount = 5;
    saveGuestFeedbackData(data);
};

export const dismissGuestFeedback = (): void => {
    const data = getGuestFeedbackData();
    data.feedbackState = 'dismissed';
    saveGuestFeedbackData(data);
};
