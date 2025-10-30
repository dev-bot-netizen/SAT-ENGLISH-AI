import type { UserProfile } from '@/types';
import { auth, getAuthHeader, type User } from './firebase';

export const getOrCreateUserProfile = async (user: User): Promise<UserProfile> => {
    if (!user) throw new Error("User object is required.");

    const handleResponse = async (response: Response, action: 'fetch' | 'create') => {
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Failed to ${action} user profile. Server responded with ${response.status}`;

            if (response.status === 500 && errorText.includes('FUNCTION_INVOCATION_FAILED')) {
                // Throw a more specific error for the UI to catch
                const specificError = new Error(`A server configuration error has occurred. Please check the backend status for details.`);
                (specificError as any).code = 'SERVER_CONFIG_ERROR';
                throw specificError;
            } else {
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || `${errorMessage}: ${errorText}`;
                } catch (e) {
                    errorMessage += `: ${errorText}`;
                }
            }
            throw new Error(errorMessage);
        }
        return response.json();
    };

    let token;
    try {
        token = await user.getIdToken();
    } catch (error) {
        console.error("Error getting auth token in getOrCreateUserProfile:", error);
        throw new Error("Could not get authentication token.");
    }
    const authHeader = { 'Authorization': `Bearer ${token}` };


    // Determine the start of the current day in the user's local timezone.
    const today = new Date();
    const startOfDayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    // Convert to a UTC ISO string to be sent to the API.
    // This correctly represents the start of the user's local day in a standardized format.
    const startOfDayUTCString = startOfDayLocal.toISOString();

    // First, try to get the user profile, passing the local start of day.
    const getResponse = await fetch(`/api/users/${user.uid}?startOfDay=${encodeURIComponent(startOfDayUTCString)}`, {
        headers: authHeader,
    });
    
    if (getResponse.ok) {
        return await getResponse.json();
    }
    
    // If user not found (404), create it.
    if (getResponse.status === 404) {
        const createResponse = await fetch('/api/users', {
            method: 'POST',
            headers: { 
                ...authHeader,
                'Content-Type': 'application/json',
            },
            // The body is no longer needed; the backend uses the verified token to get UID and email.
            body: JSON.stringify({}), 
        });
        return handleResponse(createResponse, 'create');
    }
    
    // Handle other errors from the initial GET request
    // This will throw a formatted error if the GET request failed for reasons other than 404
    await handleResponse(getResponse, 'fetch');
    
    // This line should not be reachable, but is needed for type safety.
    throw new Error('An unexpected error occurred in getOrCreateUserProfile.');
};

export const markTutorialAsCompleted = async (): Promise<void> => {
    const authHeader = await getAuthHeader();
    if (!authHeader['Authorization']) throw new Error("User not authenticated.");

    const user = auth.currentUser;
    if (!user) {
        throw new Error("No signed-in user found.");
    }

    const response = await fetch(`/api/users/${user.uid}`, {
        method: 'PUT',
        headers: {
            ...authHeader,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hasCompletedTutorial: true }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to update tutorial status.';
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || `${errorMessage} Server responded with ${response.status}: ${errorText}`;
        } catch (e) {
            errorMessage += ` Server responded with ${response.status}: ${errorText}`;
        }
        throw new Error(errorMessage);
    }
};

export const updateUserFeedbackPreference = async (action: 'snooze' | 'dismiss'): Promise<void> => {
    const authHeader = await getAuthHeader();
    if (!authHeader['Authorization']) throw new Error("User not authenticated.");

    const user = auth.currentUser;
    if (!user) {
        throw new Error("No signed-in user found.");
    }

    const response = await fetch(`/api/users/${user.uid}`, {
        method: 'PUT',
        headers: {
            ...authHeader,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedbackAction: action }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to update feedback preference.';
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || `${errorMessage} Server responded with ${response.status}: ${errorText}`;
        } catch (e) {
            errorMessage += ` Server responded with ${response.status}: ${errorText}`;
        }
        throw new Error(errorMessage);
    }
};

export const deleteUserAccount = async (): Promise<void> => {
    const authHeader = await getAuthHeader();
    if (!authHeader['Authorization']) throw new Error("User not authenticated.");

    const user = auth.currentUser;
    if (!user) {
        throw new Error("No signed-in user found to delete.");
    }

    const response = await fetch(`/api/users/${user.uid}`, {
        method: 'DELETE',
        headers: authHeader,
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to delete account.';
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || `${errorMessage} Server responded with ${response.status}: ${errorText}`;
        } catch (e) {
            errorMessage += ` Server responded with ${response.status}: ${errorText}`;
        }
        throw new Error(errorMessage);
    }
    // A 204 No Content response will have an empty body.
};