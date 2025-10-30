import type { VercelRequest, VercelResponse } from '@vercel/node';
import clientPromise from './db.js';
import type { Db } from 'mongodb';
import { withAuth, getAdminApp } from './firebaseAdmin.js';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { FeedbackState } from '../../src/types/index.js';

const DEVELOPER_EMAIL = 'goelakshaj@gmail.com';

interface UserDocument {
    _id: string;
    email: string | null;
    tier: 'free' | 'premium' | 'developer';
    createdAt: Date;
    hasCompletedTutorial?: boolean;
    totalTestsCompleted?: number;
    feedbackState?: FeedbackState;
    snoozeCount?: number;
}

const usersHandler = async (req: VercelRequest, res: VercelResponse, userToken: DecodedIdToken): Promise<void> => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const userId = pathSegments.length > 2 ? pathSegments[2] : null;

    const client = await clientPromise;
    const db: Db = client.db("sat_solver_db");
    const usersCollection = db.collection<UserDocument>("users");

    // POST /api/users (create user)
    if (req.method === 'POST' && !userId) {
        try {
            const { uid, email } = userToken;
            const existingUser = await usersCollection.findOne({ _id: uid });
            if (existingUser) {
                const { _id, ...userProfile } = existingUser;
                res.status(200).json({ uid: _id, ...userProfile });
                return;
            }

            const newUser: UserDocument = {
                _id: uid,
                email: email || null,
                tier: email === DEVELOPER_EMAIL ? 'developer' : 'premium',
                createdAt: new Date(),
                hasCompletedTutorial: false,
                totalTestsCompleted: 0,
                feedbackState: 'eligible',
                snoozeCount: 0,
            };

            await usersCollection.insertOne(newUser);
            const { _id, createdAt, ...userProfile } = newUser;
            res.status(201).json({ uid: _id, ...userProfile });
            return;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to create user.";
            console.error("Error in POST /api/users:", error);
            res.status(500).json({ message });
            return;
        }
    }

    // Routes that require a specific user ID
    if (userId) {
        if (userToken.uid !== userId) {
            res.status(403).json({ message: "Forbidden: You can only access your own user data." });
            return;
        }

        switch (req.method) {
            case 'GET':
                try {
                    const { startOfDay: startOfDayQuery } = req.query;
                    const user = await usersCollection.findOne({ _id: userId });

                    if (!user) {
                        res.status(404).json({ message: "User not found." });
                        return;
                    }

                    if (user.email === DEVELOPER_EMAIL) {
                        user.tier = 'developer';
                    }

                    const testLogsCollection = db.collection("practice_test_logs");
                    let startOfPeriod: Date;

                    if (startOfDayQuery && typeof startOfDayQuery === 'string' && !isNaN(new Date(startOfDayQuery).getTime())) {
                        startOfPeriod = new Date(startOfDayQuery);
                    } else {
                        startOfPeriod = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    }
                    
                    const testsTakenToday = await testLogsCollection.countDocuments({
                        userId,
                        createdAt: { $gte: startOfPeriod }
                    });

                    const limits: Record<string, number> = { free: 2, premium: 4, developer: 99999 };
                    const dailyTestLimit = limits[user.tier] || 2;

                    const { _id, createdAt, ...userProfile } = user;
                    res.status(200).json({
                        uid: _id,
                        ...userProfile,
                        hasCompletedTutorial: user.hasCompletedTutorial ?? false,
                        totalTestsCompleted: user.totalTestsCompleted ?? 0,
                        feedbackState: user.feedbackState ?? 'eligible',
                        snoozeCount: user.snoozeCount ?? 0,
                        testsTakenToday,
                        dailyTestLimit
                    });
                    return;
                } catch (error) {
                    const message = error instanceof Error ? error.message : "Failed to fetch user profile.";
                    console.error(`Error in GET /api/users/${userId}:`, error);

                    if (message.toLowerCase().includes('authentication failed')) {
                        // FIX: Changed `return res.status...` to separate statements to match `Promise<void>` return type.
                        res.status(500).json({ message: "Database authentication failed. Please double-check your MONGO_URI for the correct username and password." });
                        return;
                    }
                    if (message.toLowerCase().includes('timeout')) {
                        // FIX: Changed `return res.status...` to separate statements to match `Promise<void>` return type.
                        res.status(500).json({ message: "Database connection timed out. Please verify your MONGO_URI and check your IP whitelist settings in MongoDB Atlas to allow access from anywhere (0.0.0.0/0)." });
                        return;
                    }
                    
                    // FIX: Changed `return res.status...` to separate statements to match `Promise<void>` return type.
                    res.status(500).json({ message });
                    return;
                }

            case 'PUT':
                try {
                    const { hasCompletedTutorial, feedbackAction } = req.body;
                    let updateQuery;

                    if (typeof hasCompletedTutorial === 'boolean') {
                        updateQuery = { $set: { hasCompletedTutorial: hasCompletedTutorial } };
                    } else if (feedbackAction === 'snooze') {
                        updateQuery = { $set: { feedbackState: 'snoozed' as FeedbackState, snoozeCount: 5 } };
                    } else if (feedbackAction === 'dismiss') {
                        updateQuery = { $set: { feedbackState: 'dismissed' as FeedbackState } };
                    } else {
                        res.status(400).json({ message: "Invalid payload." });
                        return;
                    }
                    
                    const result = await usersCollection.updateOne({ _id: userId }, updateQuery);
                    if (result.matchedCount === 0) {
                        res.status(404).json({ message: "User not found." });
                        return;
                    }
                    res.status(200).json({ message: "User profile updated." });
                    return;
                } catch (error) {
                    const message = error instanceof Error ? error.message : "Failed to update user profile.";
                    console.error(`Error in PUT /api/users/${userId}:`, error);
                    res.status(500).json({ message });
                    return;
                }

            case 'DELETE':
                try {
                    await db.collection("assignments").deleteMany({ userId });
                    await db.collection("vocabulary").deleteMany({ userId });
                    await db.collection("practice_test_logs").deleteMany({ userId });
                    await usersCollection.deleteOne({ _id: userId });

                    const adminAuth = getAdminApp().auth();
                    await adminAuth.deleteUser(userId);

                    res.status(204).end();
                    return;
                } catch (error) {
                    const message = error instanceof Error ? error.message : "Failed to delete account.";
                    console.error(`Error in DELETE /api/users/${userId}:`, error);
                    res.status(500).json({ message });
                    return;
                }
            
            default:
                res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
                res.status(405).end(`Method ${req.method} Not Allowed for /api/users/${userId}`);
                return;
        }
    }

    res.setHeader('Allow', ['POST', 'GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed for the requested route.`);
    return;
};

export const handleUsers = withAuth(usersHandler);