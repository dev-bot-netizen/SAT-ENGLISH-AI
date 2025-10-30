import type { VercelRequest, VercelResponse } from '@vercel/node';
import clientPromise from './db.js';
import { Db, ObjectId } from 'mongodb';
import { withAuth } from './firebaseAdmin.js';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { FeedbackState } from '../../src/types/index.js';

interface UserDocument {
    _id: string;
    email: string | null;
    tier: 'free' | 'premium' | 'developer';
    createdAt: Date;
    hasCompletedTutorial: boolean;
    totalTestsCompleted: number;
    feedbackState?: FeedbackState;
    snoozeCount?: number;
}

const assignmentsHandler = async (req: VercelRequest, res: VercelResponse, user: DecodedIdToken): Promise<void> => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    // pathSegments are like: ['api', 'assignments', 'summaries', 'userId123']
    // or ['api', 'assignments', 'assignmentId123']

    const client = await clientPromise;
    const db: Db = client.db("sat_solver_db");
    const assignmentsCollection = db.collection("assignments");

    // POST /api/assignments (create new assignment)
    if (req.method === 'POST' && pathSegments.length === 2) {
        try {
            const assignmentData = req.body;
            assignmentData.userId = user.uid;
            
            const difficultyMap: { [key: number]: string } = { 1: 'easy', 2: 'moderate', 3: 'hard' };
            const difficultyName = difficultyMap[assignmentData.difficulty] || 'standard';
            const sortedTopics = [...assignmentData.topics].sort();
            const count = await assignmentsCollection.countDocuments({
                userId: user.uid,
                topics: sortedTopics,
                difficulty: assignmentData.difficulty,
            });
            const assignmentNumber = count + 1;
            assignmentData.name = `${sortedTopics.join(' & ')} ${difficultyName} ${assignmentNumber}`;

            assignmentData.dateCompleted = new Date(assignmentData.dateCompleted);
            assignmentData.totalQuestions = assignmentData.questions.length;
            assignmentData.status = assignmentData.status || 'completed';

            const result = await assignmentsCollection.insertOne(assignmentData);

            if (assignmentData.status === 'completed') {
                const usersCollection = db.collection<UserDocument>("users");
                const userDoc = await usersCollection.findOne({ _id: user.uid });

                const updateOps: any = { $inc: { totalTestsCompleted: 1 } };

                if (userDoc && userDoc.feedbackState === 'snoozed') {
                    const newSnoozeCount = (userDoc.snoozeCount || 1) - 1;
                    if (newSnoozeCount <= 0) {
                        updateOps.$set = { feedbackState: 'eligible', snoozeCount: 0 };
                    } else {
                        updateOps.$set = { snoozeCount: newSnoozeCount };
                    }
                }
                
                await usersCollection.updateOne({ _id: user.uid }, updateOps);
            }

            res.status(201).json({ id: result.insertedId });
            return;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to save assignment due to a database error.";
            console.error("Error in POST /api/assignments:", error);
            res.status(500).json({ message });
            return;
        }
    }

    // GET /api/assignments/summaries/[userId]
    if (req.method === 'GET' && pathSegments[2] === 'summaries' && pathSegments.length === 4) {
        try {
            const userId = pathSegments[3];
            if (user.uid !== userId) {
                res.status(403).json({ message: "Forbidden: You can only access your own assignment summaries." });
                return;
            }
            
            const cursor = assignmentsCollection.find({ userId })
                .project({ name: 1, score: 1, totalQuestions: 1, topics: 1, difficulty: 1, dateCompleted: 1, status: 1 })
                .sort({ dateCompleted: -1 });
            
            const summaries = await cursor.toArray();
            const formattedSummaries = summaries.map(({ _id, ...rest }: any) => ({
                ...rest,
                id: _id.toString(),
                status: rest.status || 'completed',
            }));
            
            res.status(200).json(formattedSummaries);
            return;
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to fetch assignment summaries.";
            console.error(`Error in GET /api/assignments/summaries:`, error);
            res.status(500).json({ message });
            return;
        }
    }

    // GET or DELETE /api/assignments/[assignmentId]
    if ((req.method === 'GET' || req.method === 'DELETE') && pathSegments.length === 3) {
        const assignmentId = pathSegments[2];
        if (!ObjectId.isValid(assignmentId)) {
            res.status(400).json({ message: "Valid assignment ID is required." });
            return;
        }
        const _id = new ObjectId(assignmentId);

        try {
            const assignment = await assignmentsCollection.findOne({ _id });

            if (!assignment) {
                res.status(404).json({ message: "Assignment not found." });
                return;
            }
            if (assignment.userId !== user.uid) {
                res.status(403).json({ message: "Forbidden: You are not authorized to access this assignment." });
                return;
            }

            if (req.method === 'GET') {
                const { _id: assignment_id, ...rest } = assignment;
                const formattedAssignment = {
                    ...rest,
                    id: assignment_id.toString(),
                    highlights: rest.highlights || {},
                    strikethroughs: rest.strikethroughs || {},
                };
                res.status(200).json(formattedAssignment);
                return;
            }

            if (req.method === 'DELETE') {
                await assignmentsCollection.deleteOne({ _id, userId: user.uid });
                res.status(204).end();
                return;
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "Database error processing assignment.";
            console.error(`Error in ${req.method} /api/assignments/${assignmentId}:`, error);
            res.status(500).json({ message });
            return;
        }
    }

    res.status(404).json({ message: "Assignment route not found." });
    return;
};
export const handleAssignments = withAuth(assignmentsHandler);
