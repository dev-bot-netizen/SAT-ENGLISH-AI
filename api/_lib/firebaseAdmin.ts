import admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setupGoogleCredentials } from './googleClient.js';

// Singleton instance
let adminApp: admin.app.App | null = null;

export const getAdminApp = (): admin.app.App => {
    if (adminApp) {
        return adminApp;
    }
    
    try {
        // Ensure credentials are set up for ADC before any initialization
        setupGoogleCredentials();

        // Check if already initialized by firebase-admin internals
        if (admin.apps.length > 0) {
            adminApp = admin.app();
            return adminApp;
        }

        // Initialize with Application Default Credentials.
        // the setupGoogleCredentials() function ensures the GOOGLE_APPLICATION_CREDENTIALS
        // environment variable is set correctly for this to work.
        adminApp = admin.initializeApp({
            credential: admin.credential.applicationDefault(),
        });
        return adminApp;

    } catch (error: any) {
        console.error('Firebase admin initialization error', error.stack);
        throw new Error(`Failed to initialize Firebase Admin SDK. This is likely due to an issue with the provided GOOGLE_APPLICATION_CREDENTIALS_JSON. Details: ${error.message}`);
    }
};

export const verifyIdToken = async (token: string): Promise<DecodedIdToken> => {
    try {
        const auth = getAdminApp().auth();
        const decodedToken = await auth.verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        console.error("Error verifying Firebase ID token:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("An unknown error occurred during token verification.");
    }
};


export const withAuth = (handler: (req: VercelRequest, res: VercelResponse, user: DecodedIdToken) => Promise<void> | void) => 
    async (req: VercelRequest, res: VercelResponse) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ message: 'Unauthorized: No token provided.' });
            }

            const token = authHeader.split('Bearer ')[1];
            const user = await verifyIdToken(token);
            // We must 'await' the handler to catch any async errors that occur within it.
            return await handler(req, res, user);

        } catch (error) {
            const message = error instanceof Error ? error.message : "An unexpected error occurred.";

            // Check for specific Firebase Auth error codes that indicate a client-side token issue
            if (error && typeof error === 'object' && 'code' in error) {
                const firebaseErrorCode = (error as { code: string }).code;
                if (firebaseErrorCode.startsWith('auth/')) {
                    console.error("Firebase authentication error:", message);
                    // These are client errors (bad token, expired, etc.)
                    return res.status(403).json({ message: `Forbidden: ${message}` });
                }
            }

            // Check for known server-side configuration error strings
            const isConfigError = message.includes('GOOGLE_APPLICATION_CREDENTIALS_JSON') || message.includes('MONGO_URI');
            if (isConfigError) {
                console.error("Server configuration error:", message);
                return res.status(500).json({ message: `Server Configuration Error: ${message}` });
            }

            // All other errors are treated as unexpected internal server errors
            console.error("Internal server error in authenticated route:", error);
            res.status(500).json({ message: `Internal Server Error: ${message}` });
        }
    };