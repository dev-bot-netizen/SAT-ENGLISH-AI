import { GoogleGenAI } from '@google/genai';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import fs from 'fs';
import path from 'path';

let credentialsSetup = false;
let aiInstance: GoogleGenAI | null = null;
let ttsClientInstance: TextToSpeechClient | null = null;

/**
 * Sets up Google Application Default Credentials (ADC) for serverless environments
 * like Vercel. It writes the service account JSON from an environment variable
 * to a temporary file and sets the GOOGLE_APPLICATION_CREDENTIALS env var
 * to point to it. This function is designed to run only once per instance.
 */
export const setupGoogleCredentials = () => {
    if (credentialsSetup) {
        return;
    }

    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (!credentialsJson || credentialsJson === 'PASTE_YOUR_ENTIRE_SERVICE_ACCOUNT_JSON_HERE') {
        throw new Error("Server Configuration Error: The GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set. Please add your full service account JSON key to your project's environment variables.");
    }
    
    // In Vercel, the /tmp directory is a writable location.
    const tempDir = '/tmp';
    const credentialsPath = path.join(tempDir, 'gcp-credentials.json');

    try {
        // Write the credentials JSON to the temporary file.
        fs.writeFileSync(credentialsPath, credentialsJson);
        
        // Set the environment variable that Google's SDKs use to find the credentials.
        process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;

        credentialsSetup = true;
        console.log("Successfully set up Google Application Default Credentials.");

    } catch (error) {
        console.error("Failed to set up Google Application Default Credentials:", error);
        throw new Error(`Server Configuration Error: Could not write credentials to temporary file. This is often caused by an improperly formatted GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable. Details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/**
 * Returns a singleton instance of the GoogleGenAI client configured for Vertex AI.
 * It ensures that credentials are set up before creating the client.
 */
export const getAiClient = (): GoogleGenAI => {
    // Ensure credentials are set up before initializing any client
    setupGoogleCredentials();

    if (aiInstance) {
        return aiInstance;
    }
    
    const projectId = process.env.VERTEX_PROJECT_ID;
    const location = process.env.VERTEX_LOCATION;

    if (!projectId || projectId === 'YOUR_VERTEX_AI_PROJECT_ID_HERE' || !location) {
      throw new Error("Vertex AI environment variables (VERTEX_PROJECT_ID, VERTEX_LOCATION) are missing or are placeholders. Please configure them in your project settings.");
    }

    try {
        aiInstance = new GoogleGenAI({
            vertexai: true,
            project: projectId,
            location: location
        });
        return aiInstance;
    } catch (error) {
        console.error("Failed to initialize GoogleGenAI client for Vertex AI:", error);
        throw new Error(`Server Configuration Error: Failed to create GoogleGenAI client. Details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Returns a singleton instance of the Google Cloud TextToSpeechClient.
 * It ensures that credentials are set up before creating the client.
 */
export const getTtsClient = (): TextToSpeechClient => {
    setupGoogleCredentials();
    if (ttsClientInstance) {
        return ttsClientInstance;
    }
    try {
        ttsClientInstance = new TextToSpeechClient();
        return ttsClientInstance;
    } catch (error) {
        console.error("Failed to initialize TextToSpeechClient:", error);
        throw new Error(`Server Configuration Error: Failed to create TextToSpeechClient. Details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};