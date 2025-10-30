import type { VercelRequest, VercelResponse } from '@vercel/node';
import clientPromise from './db.js';
import type { Db } from 'mongodb';
import { verifyIdToken } from './firebaseAdmin.js';
import type { DecodedIdToken } from 'firebase-admin/auth';

interface UserDocument {
    _id: string;
    tier: 'free' | 'premium' | 'developer';
}

export async function handleFeedback(req: VercelRequest, res: VercelResponse) {
    let user: DecodedIdToken | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split('Bearer ')[1];
        try {
            user = await verifyIdToken(token);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Authentication failed.";
            console.error("Token verification failed in /api/feedback:", message);
            return res.status(403).json({ message: `Forbidden: ${message}` });
        }
    }

    try {
        const client = await clientPromise;
        const db: Db = client.db("sat_solver_db");
        
        if (req.method === 'POST') {
            const { action, payload } = req.body;
            if (action !== 'submit' || !payload) {
                return res.status(400).json({ message: 'Invalid action or missing payload.' });
            }
            if (typeof payload.rating !== 'number' || typeof payload.aiRating !== 'number' || typeof payload.page !== 'string') {
                return res.status(400).json({ message: 'Invalid feedback payload format. Required: rating (number), aiRating (number), page (string).' });
            }

            const feedbackCollection = db.collection('feedback');
            const newFeedback = {
                rating: payload.rating,
                aiRating: payload.aiRating,
                mostValuableFeature: payload.mostValuableFeature || '',
                aiIssues: payload.aiIssues || '',
                comments: payload.comments || '',
                page: payload.page,
                userId: user ? user.uid : 'guest',
                createdAt: new Date(),
            };
            await feedbackCollection.insertOne(newFeedback);
            return res.status(201).json({ message: 'Feedback submitted successfully.' });
        }

        if (req.method === 'GET') {
            if (!user) {
                return res.status(401).json({ message: 'Authentication is required to view feedback.' });
            }

            const usersCollection = db.collection<UserDocument>('users');
            const dbUser = await usersCollection.findOne({ _id: user.uid });

            if (!dbUser || dbUser.tier !== 'developer') {
                return res.status(403).json({ message: 'Forbidden: Developer access is required to view feedback.' });
            }

            const feedbackCollection = db.collection('feedback');
            const feedback = await feedbackCollection.find().sort({ createdAt: -1 }).toArray();
            return res.status(200).json(feedback);
        }

        res.setHeader('Allow', ['POST', 'GET']);
        res.status(405).send(`Method ${req.method} Not Allowed`);

    } catch (error) {
        const message = error instanceof Error ? error.message : "An unexpected error occurred.";
        console.error(`Error in /api/feedback for ${req.method} request:`, error);
        res.status(500).json({ message });
    }
}