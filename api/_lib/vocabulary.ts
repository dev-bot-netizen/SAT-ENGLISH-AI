import type { VercelRequest, VercelResponse } from '@vercel/node';
import clientPromise from './db.js';
import { Db, ObjectId } from 'mongodb';
import { withAuth } from './firebaseAdmin.js';
import type { DecodedIdToken } from 'firebase-admin/auth';
// FIX: Renamed the imported VocabularyWord to avoid conflict with the new server-side interface.
import type { WordDetails, VocabularyWordStatus, VocabularyWord as ClientVocabularyWord } from '../../src/types/index.js';
import { Type } from "@google/genai";
import { getAiClient } from './googleClient.js';

interface WordDetailsDBCache extends Omit<WordDetails, 'contextPassage'> {
    _id: string;
}

// FIX: Defined a server-side interface for VocabularyWord that correctly types MongoDB fields.
// This resolves type errors when querying with ObjectId.
interface VocabularyWord extends Omit<ClientVocabularyWord, '_id' | 'addedAt' | 'nextReviewDate'> {
    _id: ObjectId;
    userId: string;
    addedAt: Date;
    nextReviewDate?: Date;
}

const generateWordDetails = async (word: string, context: string): Promise<WordDetails> => {
    const ai = getAiClient();
    const systemInstruction = `You are a helpful vocabulary assistant. Your goal is to provide rich, contextual information about a specific word to help a student learn it for the SAT. The student will provide a word and the context in which they encountered it.`;
    const userPrompt = `The word is "${word}". It appeared in this context: "${context}". Please provide the following information about the word "${word}".`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            definition: { type: Type.STRING, description: `A clear, concise definition of the word '${word}' as it's used in the provided context.` },
            pronunciation: { type: Type.STRING, description: `The phonetic pronunciation of the word '${word}', e.g., /fəˈnɛtɪk/.` },
            exampleSentences: { type: Type.ARRAY, items: { type: Type.STRING }, description: `Three distinct and memorable example sentences using the word '${word}'.` },
            deepDive: { type: Type.STRING, description: `A "deep dive" into the word '${word}'. This should be a short, engaging paragraph explaining its etymology (origin), or a mini-story that helps make the word's meaning unforgettable.` },
            contextPassage: { type: Type.STRING, description: `The original context passage provided by the user.`}
        },
        required: ["definition", "exampleSentences", "deepDive", "contextPassage"],
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: schema
        },
    });

    const responseText = response.text;
    if (!responseText) {
        throw new Error("AI did not return a valid response for word details.");
    }
    const details = JSON.parse(responseText);
    details.contextPassage = context;
    return details as WordDetails;
};

const vocabularyHandler = async (req: VercelRequest, res: VercelResponse, user: DecodedIdToken): Promise<void> => {
    try {
        const client = await clientPromise;
        const db: Db = client.db("sat_solver_db");
        
        const { action } = req.query;

        // --- GET Requests ---
        if (req.method === 'GET') {
            if (action === 'getDetails') {
                const { word, context } = req.query;
                if (!word || typeof word !== 'string' || !context || typeof context !== 'string') {
                    res.status(400).json({ message: "word and context query parameters are required." });
                    return;
                }
                const lowerCaseWord = word.toLowerCase();
                const detailsCollection = db.collection<WordDetailsDBCache>("word_details");
                const cachedDetails = await detailsCollection.findOne({ _id: lowerCaseWord });
                if (cachedDetails) {
                    const { _id, ...rest } = cachedDetails;
                    const detailsToReturn = { ...rest, contextPassage: context };
                    res.status(200).json(detailsToReturn);
                    return;
                }
                const newDetails = await generateWordDetails(lowerCaseWord, context as string);
                const { contextPassage, ...detailsToCache } = newDetails;
                await detailsCollection.insertOne({ _id: lowerCaseWord, ...detailsToCache });
                res.status(200).json(newDetails);
                return;
            } 
            
            if (action === 'getList') {
                const { userId } = req.query;
                if (user.uid !== userId) {
                    res.status(403).json({ message: "Forbidden: You can only access your own vocabulary." });
                    return;
                }
                const vocabCollection = db.collection("vocabulary");
                const vocabulary = await vocabCollection.find({ userId: user.uid }).sort({ addedAt: -1 }).toArray();
                res.status(200).json(vocabulary);
                return;
            }

            if (action === 'getReviewQueue') {
                const now = new Date();
                const vocabCollection = db.collection("vocabulary");
                const cursor = vocabCollection.find({
                    userId: user.uid,
                    $or: [
                        { status: 'new' },
                        { status: 'review', nextReviewDate: { $lte: now } }
                    ]
                }).sort({ addedAt: 1 }); // study oldest new words first
                const queue = await cursor.toArray();
                res.status(200).json(queue);
                return;
            }
        }

        // --- POST Requests ---
        if (req.method === 'POST') {
            if (action === 'addWords') {
                const vocabCollection = db.collection("vocabulary");
                const { words, contextPassage, sourceQuestionId } = req.body as { words: string[], contextPassage: string, sourceQuestionId: number };
                if (!words || !Array.isArray(words) || !contextPassage || sourceQuestionId === undefined) {
                    res.status(400).json({ message: "Payload must include words (array), contextPassage, and sourceQuestionId." });
                    return;
                }
                if (words.length === 0) {
                    res.status(200).json({ message: "No words to add." });
                    return;
                }
                const lowerCaseWords = words.map(w => w.toLowerCase().trim()).filter(w => w.length > 0);
                const uniqueWords = [...new Set(lowerCaseWords)];
                const existingWords = await vocabCollection.find({ userId: user.uid, word: { $in: uniqueWords } }).project({ word: 1 }).toArray();
                const existingWordSet = new Set(existingWords.map(w => w.word));
                const wordsToAdd = uniqueWords.filter(w => !existingWordSet.has(w));
                if (wordsToAdd.length === 0) {
                    res.status(200).json({ message: "All provided words are already in the vocabulary list." });
                    return;
                }
                const newVocabEntries = wordsToAdd.map(word => ({
                    userId: user.uid, word: word, contextPassage: contextPassage,
                    sourceQuestionId: sourceQuestionId, addedAt: new Date(), status: 'new' as const,
                    repetitionInterval: 0, easeFactor: 2.5, nextReviewDate: new Date(),
                }));
                await vocabCollection.insertMany(newVocabEntries);
                res.status(201).json({ message: `Successfully added ${wordsToAdd.length} word(s).` });
                return;
            }
        }

        // --- PUT Requests ---
        if (req.method === 'PUT') {
            if (action === 'update') {
                const { wordId, status, performance } = req.body;
                if (!wordId || !ObjectId.isValid(wordId)) {
                    res.status(400).json({ message: 'A valid wordId is required.' });
                    return;
                }

                const vocabCollection = db.collection<VocabularyWord>("vocabulary");
                const word = await vocabCollection.findOne({ _id: new ObjectId(wordId), userId: user.uid });

                if (!word) {
                    res.status(404).json({ message: 'Word not found or you do not have permission to update it.' });
                    return;
                }

                let updateQuery = {};

                if (status && ['new', 'review', 'mastered'].includes(status)) {
                    // Manual status override
                    const update: any = { status };
                    if (status === 'new') {
                        update.repetitionInterval = 0;
                        update.easeFactor = 2.5;
                        update.nextReviewDate = new Date();
                    } else if (status === 'review') {
                        update.nextReviewDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
                    }
                    updateQuery = { $set: update };
                } else if (performance && ['again', 'good', 'reset'].includes(performance)) {
                    // SRS review update
                    let newStatus: VocabularyWordStatus = 'review';
                    let newInterval; // in days
                    let newEaseFactor = word.easeFactor || 2.5;
                    const now = new Date();
                    let nextReviewDate: Date;
                    const oneDayInMillis = 24 * 60 * 60 * 1000;

                    if (performance === 'reset') {
                        newStatus = 'new';
                        newInterval = 0;
                        nextReviewDate = now;
                    } else if (performance === 'again') {
                        newStatus = 'review';
                        newInterval = 1;
                        newEaseFactor = Math.max(1.3, newEaseFactor - 0.2);
                        nextReviewDate = new Date(now.getTime() + oneDayInMillis);
                    } else { // performance === 'good'
                        const currentInterval = word.repetitionInterval || 0;
                        if (word.status === 'new' || currentInterval < 1) {
                            newInterval = 1;
                        } else {
                            newInterval = Math.ceil(currentInterval * newEaseFactor);
                        }
                        newInterval = Math.min(newInterval, 180); // cap at ~6 months

                        if (newInterval >= 30) {
                            newStatus = 'mastered';
                        } else {
                            newStatus = 'review';
                        }
                        nextReviewDate = new Date(now.getTime() + newInterval * oneDayInMillis);
                    }
                     updateQuery = { $set: { 
                        status: newStatus,
                        repetitionInterval: newInterval,
                        easeFactor: newEaseFactor,
                        nextReviewDate: nextReviewDate,
                     }};

                } else {
                    res.status(400).json({ message: 'Invalid payload. Must provide either a valid "status" or "performance".' });
                    return;
                }

                await vocabCollection.updateOne({ _id: new ObjectId(wordId) }, updateQuery);
                res.status(200).json({ message: 'Word updated successfully.' });
                return;
            }

            if (action === 'bulkUpdate') {
                 const { updates } = req.body;
                if (!updates || !Array.isArray(updates)) {
                    res.status(400).json({ message: 'Invalid payload: "updates" array is required.' });
                    return;
                }

                const vocabCollection = db.collection<VocabularyWord>("vocabulary");
                const bulkOps = [];

                for (const update of updates) {
                    if (!update.wordId || !ObjectId.isValid(update.wordId)) continue;
                    
                    let updateQuery;
                    if (update.status === 'mastered') {
                        updateQuery = { $set: { status: 'mastered' as const } };
                    } else if (update.performance === 'again') {
                         updateQuery = { $set: { 
                            status: 'review' as const,
                            repetitionInterval: 1,
                            easeFactor: 2.3, // Slightly lower ease factor on quiz fail
                            nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                         }};
                    } else {
                        continue;
                    }
                    
                    bulkOps.push({
                        updateOne: {
                            filter: { _id: new ObjectId(update.wordId), userId: user.uid },
                            update: updateQuery,
                        }
                    });
                }

                if (bulkOps.length > 0) {
                    await vocabCollection.bulkWrite(bulkOps);
                }

                res.status(200).json({ message: 'Quiz results saved.' });
                return;
            }
        }

        res.status(404).json({ message: `API route not found for method ${req.method} and action '${action}'.` });
        return;

    } catch (error) {
        const message = error instanceof Error ? error.message : "An unexpected error occurred in the vocabulary API.";
        console.error(`Error in /api/vocabulary for URL ${req.url}:`, error);
        res.status(500).json({ message });
    }
};

export const handleVocabulary = withAuth(vocabularyHandler);