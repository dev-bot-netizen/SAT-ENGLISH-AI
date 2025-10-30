import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const pathSegments = url.pathname.split('/').filter(Boolean);

    if (pathSegments.length < 2) {
        return res.status(404).json({ message: 'Not Found: Invalid API path.' });
    }

    const resource = pathSegments[1];

    try {
        switch (resource) {
            case 'health': {
                const { handleHealthCheck } = await import('./_lib/health.js');
                return await handleHealthCheck(req, res);
            }
            case 'assignments': {
                const { handleAssignments } = await import('./_lib/assignments.js');
                return await handleAssignments(req, res);
            }
            case 'users': {
                const { handleUsers } = await import('./_lib/users.js');
                return await handleUsers(req, res);
            }
            case 'feedback': {
                const { handleFeedback } = await import('./_lib/feedback.js');
                return await handleFeedback(req, res);
            }
            case 'gemini':
            case 'tts': {
                const { handleGemini } = await import('./_lib/gemini.js');
                return await handleGemini(req, res);
            }
            case 'vocabulary': {
                const { handleVocabulary } = await import('./_lib/vocabulary.js');
                return await handleVocabulary(req, res);
            }
            default:
                return res.status(404).json({ message: `Not Found: No handler for '${resource}'.` });
        }
    } catch (error) {
        console.error(`Unhandled error in API router for resource '${resource}':`, error);
        const message = error instanceof Error ? error.message : "An unexpected internal server error occurred.";
        return res.status(500).json({ message });
    }
}