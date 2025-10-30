import type { VercelRequest, VercelResponse } from '@vercel/node';

// This version of the health check has NO internal dependencies on other library files
// like db.ts or firebaseAdmin.ts. This is to ensure that even if those files
// cause a server crash on initialization, this endpoint can still run and provide
// diagnostics on the environment variables themselves.

export async function handleHealthCheck(_req: VercelRequest, res: VercelResponse) {
    const status = {
        firebaseAdmin: { ok: false, message: 'Not checked' },
        mongoDb: { ok: false, message: 'Not checked' },
    };

    // Check Firebase/Google Credentials
    try {
        const creds = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
        if (!creds || creds === 'PASTE_YOUR_ENTIRE_SERVICE_ACCOUNT_JSON_HERE') {
            throw new Error("The GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set or is a placeholder.");
        }
        const parsedCreds = JSON.parse(creds);
        if (!parsedCreds.project_id || !parsedCreds.private_key || !parsedCreds.client_email) {
            throw new Error("The GOOGLE_APPLICATION_CREDENTIALS_JSON value is not a valid JSON service account key. It's missing required fields like 'project_id', 'private_key', or 'client_email'.");
        }
        status.firebaseAdmin.ok = true;
        status.firebaseAdmin.message = `Successfully parsed credentials for project: ${parsedCreds.project_id}.`;
    } catch (error) {
        status.firebaseAdmin.ok = false;
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("JSON")) {
             status.firebaseAdmin.message = `Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON. Please ensure it's a valid, single-line JSON string without extra characters. Details: ${errorMessage}`;
        } else {
            status.firebaseAdmin.message = errorMessage;
        }
    }

    // Check MongoDB URI
    try {
        const uri = process.env.MONGO_URI;
        if (!uri || uri === 'YOUR_MONGO_URI_HERE') {
            throw new Error("The MONGO_URI environment variable is not set or is a placeholder.");
        }
        if (!uri.startsWith('mongodb+srv://')) {
            throw new Error("The MONGO_URI does not appear to be a valid 'mongodb+srv' connection string.");
        }
        status.mongoDb.ok = true;
        status.mongoDb.message = 'MONGO_URI is set and has the correct format.';
    } catch (error) {
        status.mongoDb.ok = false;
        status.mongoDb.message = error instanceof Error ? error.message : 'An unknown error occurred while checking the MONGO_URI.';
    }

    const overallOk = status.firebaseAdmin.ok && status.mongoDb.ok;
    res.status(overallOk ? 200 : 503).json(status);
}
