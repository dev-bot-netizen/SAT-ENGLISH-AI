import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Part, Type } from '@google/genai';
import type { Question, WordDetails, VocabularyWord, QuizQuestion, EvaluationResult } from '../../src/types/index.js';
import { getResourceContentOnServer } from './resourceReader.js';
import clientPromise from './db.js';
import type { Db } from 'mongodb';
import { verifyIdToken } from './firebaseAdmin.js';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getAiClient, getTtsClient } from './googleClient.js';
import type { protos } from '@google-cloud/text-to-speech';
import { Buffer } from 'node:buffer';


interface UserDocument {
    _id: string;
    email: string | null;
    tier: 'free' | 'premium' | 'developer';
    createdAt: Date;
}

interface WordDetailsDBCache extends Omit<WordDetails, 'contextPassage'> {
    _id: string;
}

// --- Server-Side Helper Functions ---

const base64ToGenerativePart = (imageData: string, mimeType: string): Part => {
  return {
    inlineData: { data: imageData, mimeType: mimeType },
  };
};

const stringToGenerativePart = (text: string): Part => {
    return { text };
};

const getAnswerChoice = async (imagePart: Part, contextParts: Part[]): Promise<string> => {
    const ai = getAiClient();
    const prompt = `You are an expert SAT English tutor. Analyze the SAT English question in the user-provided image, using the additional documents for context on question style and format. Identify the correct multiple-choice answer. Respond with ONLY a JSON object containing the letter of the correct answer, like {"answer": "A"}. Do not provide any other text or explanation.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [{ role: 'user', parts: [{ text: prompt }, imagePart, ...contextParts] }],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    answer: {
                        type: Type.STRING,
                        description: "The single letter of the correct answer (e.g., A, B, C, or D).",
                    },
                },
                required: ["answer"],
            },
        },
    });

    const responseText = response.text;
    if (!responseText) {
        throw new Error('AI returned an empty response for getAnswerChoice.');
    }
    const jsonResponse = JSON.parse(responseText);

    if (!jsonResponse?.answer || typeof jsonResponse.answer !== 'string') {
        throw new Error('Invalid or missing answer in AI response');
    }
    const answer = jsonResponse.answer.trim().toUpperCase().charAt(0);
    if (!['A', 'B', 'C', 'D', 'E'].includes(answer)) {
        throw new Error(`Invalid answer format received: ${jsonResponse.answer}`);
    }
    return answer;
};

const getExplanation = async (imagePart: Part, correctAnswer: string, contextParts: Part[]): Promise<string> => {
    const ai = getAiClient();
    const prompt = `You are an expert SAT English tutor. A student has identified that the correct answer to the SAT English question in the image is **${correctAnswer}**. 
    
Your task is to act as a tutor and provide a comprehensive, step-by-step explanation for *why* **${correctAnswer}** is the correct choice. Use the provided documents as examples of the style and tone for your explanation.

**Response format requirements:**
1.  Start by confirming the answer with the text: "**The final answer is ${correctAnswer}**"
2.  Follow this with a heading: "**Step-by-step explanation:**"
3.  Provide a clear, logical, and easy-to-follow explanation broken down into numbered steps.

Now, analyze the question in the image and provide your detailed explanation for answer **${correctAnswer}**.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [{ role: 'user', parts: [{ text: prompt }, imagePart, ...contextParts] }],
    });

    const explanationText = response.text;
    if (!explanationText) {
        throw new Error('AI returned an empty explanation.');
    }
    // The AI model is instructed to use '\n', but sometimes returns the escaped '\\n' string.
    // We replace it with an actual newline character here to ensure proper rendering.
    return explanationText.replace(/\\n/g, '\n');
};

const handleSolveSatQuestion = async (payload: { imageData: string, mimeType: string }, ip: string | string[] | undefined, user: DecodedIdToken | null) => {
    const { imageData, mimeType } = payload;
    if (!imageData || !mimeType) throw new Error("imageData and mimeType are required.");
    
    if (!user) {
        if (!ip) {
             const error = new Error("IP address is missing for guest user.");
            (error as any).statusCode = 400;
            throw error;
        }
        const clientIp = (Array.isArray(ip) ? ip[0] : ip.split(',')[0]).trim();
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        const client = await clientPromise;
        const db: Db = client.db("sat_solver_db");
        const usageCollection = db.collection("guest_usage");
        
        const result = await usageCollection.findOneAndUpdate(
            { ip: clientIp, date: today },
            { $inc: { count: 1 } },
            { upsert: true, returnDocument: 'after' }
        );
        const usage = result;

        if (usage && usage.count > 3) {
            const error = new Error("Guest daily limit of 3 solves exceeded.");
            (error as any).statusCode = 429;
            throw error;
        }
    }
  
    const imagePart = base64ToGenerativePart(imageData, mimeType);
    // This is a significant optimization. We are reducing the number of context files from 3 to 1.
    // The Gemini model is powerful enough to understand the required style and tone from a smaller set of examples,
    // and this change drastically reduces the number of tokens sent in each request without sacrificing quality.
    const contextFilePaths = [
        'resources/all-types/all-types-3.ts',
    ];
    const contextContentPromises = contextFilePaths.map(path => getResourceContentOnServer(path));
    const contextContents = await Promise.all(contextContentPromises);
    const allContextParts = contextContents.map((content: string) => stringToGenerativePart(content));

    let confirmedAnswer: string | null = null;
    const firstAnswerPromises = Array(3).fill(0).map(() => getAnswerChoice(imagePart, allContextParts));
    const firstAnswers = await Promise.all(firstAnswerPromises);
    
    if (firstAnswers.every(answer => answer === firstAnswers[0])) {
        confirmedAnswer = firstAnswers[0];
    } else {
        const secondAnswerPromises = Array(3).fill(0).map(() => getAnswerChoice(imagePart, allContextParts));
        const secondAnswers = await Promise.all(secondAnswerPromises);
        
        const answerCounts: { [key: string]: number } = {};
        for (const answer of [...firstAnswers, ...secondAnswers]) {
            answerCounts[answer] = (answerCounts[answer] || 0) + 1;
        }

        let bestAnswer: string | null = null;
        let maxCount = 0;
        for (const answer in answerCounts) {
            if (answerCounts[answer] > maxCount) {
                maxCount = answerCounts[answer];
                bestAnswer = answer;
            }
        }
        
        if (maxCount >= 3) confirmedAnswer = bestAnswer;
    }

    if (!confirmedAnswer) throw new Error("The AI could not reach a consensus. Please try again.");

    return await getExplanation(imagePart, confirmedAnswer, allContextParts);
};

const TOPIC_TO_FOLDER_MAP: Record<string, string> = {
    'Cross-text connections': 'cross-text-connections',
    'Text structure and purpose': 'text-structure-and-purpose',
    'Words in context': 'words-in-context',
    'Rhetorical synthesis': 'rhetorical-synthesis',
    'Transitions': 'transitions',
    'Central ideas and details': 'central-ideas-and-details',
    'Inference': 'inference',
    'Boundaries': 'boundaries',
    'Form, Structure, and Sense': 'form-structure-and-sense'
};

const TOPIC_INSTRUCTIONS: Record<string, string> = {
    'Cross-text connections': 'These questions require analyzing two short texts to identify relationships, agreements, or disagreements between them. The passages should be distinct but related in subject matter.',
    'Text structure and purpose': 'These questions focus on how a text is organized and the function of specific parts. Questions might ask about the main purpose of the text, the function of an underlined sentence, or the overall structure (e.g., comparison, cause-and-effect).',
    'Words in context': 'These questions test vocabulary within a specific context. The correct answer is the word or phrase that best fits the meaning of the sentence or passage. Passages are often short literary excerpts.',
    'Rhetorical synthesis': 'These questions present a set of notes about a topic and ask the student to synthesize the information to achieve a specific rhetorical goal (e.g., "emphasize a difference," "present the study and its findings").',
    'Transitions': 'These questions ask for the most logical transition word or phrase (e.g., "however," "for example," "in conclusion") to connect ideas between sentences or clauses.',
    'Central ideas and details': 'These questions test comprehension of the main idea of a passage and the ability to locate specific supporting details within it.',
    'Inference': 'These questions require the student to draw a logical conclusion based on the information provided in the text. The answer is not stated directly but is strongly implied.',
    'Boundaries': 'This is a grammar-focused category. Questions test correct punctuation usage to separate clauses, phrases, and items in a list. This includes commas, semicolons, colons, periods, and dashes.',
    'Form, Structure, and Sense': 'This is a grammar-focused category. Questions test subject-verb agreement, pronoun-antecedent agreement, verb tense, and modifier placement to ensure sentences are grammatically correct and logical.'
};

const DIFFICULTY_MAP: Record<number, string> = { 1: 'Easy', 2: 'Moderate', 3: 'Hard' };

const checkUserAccess = async (user: DecodedIdToken | null, db: Db, feature: 'test_generation' | 'premium_feature'): Promise<void> => {
    if (!user) {
        const error = new Error("User authentication is required for this feature.");
        (error as any).statusCode = 401;
        throw error;
    }

    const usersCollection = db.collection<UserDocument>("users");
    const dbUser = await usersCollection.findOne({ _id: user.uid });
    
    if (!dbUser) {
        const error = new Error("User not found.");
        (error as any).statusCode = 404;
        throw error;
    }

    let tier = dbUser.tier;
    // Override for developer account
    if (dbUser.email === 'goelakshaj@gmail.com') {
        tier = 'developer';
    }

    if (tier === 'free') {
        const error = new Error("This is a premium feature. Please upgrade your account to use it.");
        (error as any).statusCode = 403; // 403 Forbidden is more appropriate for access denial
        throw error;
    }

    if (feature === 'test_generation' && tier !== 'developer') {
        const testLogsCollection = db.collection("practice_test_logs");
        const limits: Record<string, number> = { free: 2, premium: 4 };
        const userLimit = limits[tier];

        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const testsToday = await testLogsCollection.countDocuments({
            userId: user.uid,
            createdAt: { $gte: twentyFourHoursAgo }
        });

        if (testsToday >= userLimit) {
            const error = new Error(`Daily limit of ${userLimit} practice tests reached for your account tier.`);
            (error as any).statusCode = 429;
            throw error;
        }
        await testLogsCollection.insertOne({ userId: user.uid, createdAt: new Date() });
    } else if (feature === 'test_generation' && tier === 'developer') {
        const testLogsCollection = db.collection("practice_test_logs");
        await testLogsCollection.insertOne({ userId: user.uid, createdAt: new Date() });
    }
};


const allSatTopics = Object.keys(TOPIC_TO_FOLDER_MAP);
const questionSchema = {
    type: Type.OBJECT, properties: {
        id: { type: Type.NUMBER, description: "The question number." },
        topic: { type: Type.STRING, description: `The SAT English topic for the question. Must be one of: ${allSatTopics.join(', ')}.` },
        difficulty: { type: Type.NUMBER, description: `The difficulty level (1, 2, or 3). Must be a number.` },
        questionText: { 
            type: Type.STRING,
            description: "The full text including any passages and the question itself. This field MUST follow markdown format. For questions with one passage: '**Passage:**\\n[Passage text here]\\n\\n**Question:**\\n[Question text here]'. For questions with two texts (like Cross-text connections): '**Passage:**\\nText 1\\n[Text 1 content]\\n\\nText 2\\n[Text 2 content]\\n\\n**Question:**\\n[Question text here]'. If there is no passage, use: '**Question:**\\n[Question text here]'"
        },
        options: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { letter: { type: Type.STRING }, text: { type: Type.STRING } } } },
        correctAnswer: { type: Type.STRING, description: "The letter of the correct option (e.g., 'A')." },
        challengingWords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of challenging vocabulary words from the passage. Can be empty." },
    }, required: ['id', 'topic', 'difficulty', 'questionText', 'options', 'correctAnswer'],
};

const handleGenerateSatAssignment = async (payload: { topics: string[], difficulty: number, customizations: string }, user: DecodedIdToken | null) => {
    const { topics, difficulty, customizations } = payload;
    if (!topics || !difficulty) throw new Error("topics and difficulty are required.");

    const client = await clientPromise;
    const db: Db = client.db("sat_solver_db");
    await checkUserAccess(user, db, 'test_generation');

    const ai = getAiClient();
    const difficultyName = DIFFICULTY_MAP[difficulty];
    if (!difficultyName) throw new Error(`Invalid difficulty level provided: ${difficulty}`);
    
    const isAllTopics = topics.length === 1 && topics[0] === 'All Topics';
    
    const difficultyLimits: { [key: number]: number } = { 1: 7, 2: 10, 3: 13 };
    const wordLimit = difficultyLimits[difficulty];

    const challengingWordsInstruction = `5. For the 'challengingWords' field, identify and include only truly challenging or tricky vocabulary words from the passage that a high school student might not know.
   - The criteria for a challenging word should be very stringent. Do not include common words.
   - It is perfectly acceptable for a question to have no challenging words if none meet this high standard. The 'challengingWords' array can be empty.
   - For the entire 20-question test, aim for a soft limit of around ${wordLimit} total challenging words for '${difficultyName}' difficulty. This limit can be exceeded if there are more genuinely challenging words, but avoid adding words just to meet a quota.`;

    let systemInstruction: string, userPrompt: string, filePaths: string[], questionTopicValidation: string;
    
    if (isAllTopics) {
        const allTopicInstructions = allSatTopics.map(topic => `*   **${topic}:** ${TOPIC_INSTRUCTIONS[topic]}`).join('\n');
        
        systemInstruction = `You are an expert SAT English test creator. Your task is to generate a complete 20-question practice test. The test must be of '${difficultyName}' difficulty. It should cover a diverse range of topics from the list below. Aim for a balanced distribution of questions across these topics:
${allTopicInstructions}

**QUALITY REQUIREMENTS:**
*   **SAT-Level Standard:** All questions, passages, and options must meet the rigorous standards of the official SAT English test. The language must be sophisticated, grammatically perfect, and free of errors.
*   **Completeness:** Each generated question must be complete. For reading comprehension questions, this means including the full passage(s). For "Cross-text connections," you MUST provide both "Text 1" and "Text 2". The question and all multiple-choice options must be fully written out. Do not truncate any part of the question.
*   **Clarity and Unambiguity:** Questions must be clear and unambiguous. The correct answer must be definitively correct based on the provided text and logic.
*   **Plausible Distractors:** Incorrect options (distractors) should be plausible but clearly incorrect upon careful analysis. They should target common student misunderstandings.
*   **Original Content:** Do not plagiarize or closely copy existing SAT materials. Generate original content that mimics the style and difficulty of official questions.
*   **Creativity and Originality:** The content of the passages and questions should be highly original, engaging, and creative. Explore a wide range of subjects, from arts and humanities to sciences and social studies, to make the test interesting for the student.

**CRITICAL FORMATTING RULES:**
1.  Strictly adhere to the JSON schema provided.
2.  For the 'questionText' field, you MUST use the following markdown structure:
    *   If there is a passage: \`**Passage:**\\n[Passage text]\\n\\n**Question:**\\n[Question text]\`
    *   If there is no passage: \`**Question:**\\n[Question text]\`
    *   **DO NOT** include a header like "### Question X of Y ###". The response should start directly with "**Passage:**" or "**Question:**".
3.  The content and style should mimic the provided example files.
4.  Generate exactly 20 unique questions.
${challengingWordsInstruction}
${customizations}`;
        userPrompt = `Based on the provided example file and topic descriptions, generate a 20-question '${difficultyName}' difficulty SAT English test with a good mix of all topics.`;
        filePaths = [`resources/all-types/all-types-${difficulty}.ts`];
        questionTopicValidation = `The SAT English topic for the question. Must be one of: ${allSatTopics.join(', ')}.`;
    } else {
        const topicInstructions = topics.map(topic => `*   **${topic}:** ${TOPIC_INSTRUCTIONS[topic]}`).join('\n');
        
        systemInstruction = `You are an expert SAT English test creator. Your task is to generate a complete 20-question practice test of '${difficultyName}' difficulty. The test must focus on the following SAT English topics:
${topicInstructions}

The questions should be distributed among the selected topics. You must ensure the generated questions accurately test the skills described for each topic. The content and style should mimic the provided example questions, which represent the topics to be covered.

**QUALITY REQUIREMENTS:**
*   **SAT-Level Standard:** All questions, passages, and options must meet the rigorous standards of the official SAT English test. The language must be sophisticated, grammatically perfect, and free of errors.
*   **Completeness:** Each generated question must be complete. For reading comprehension questions, this means including the full passage(s). For "Cross-text connections," you MUST provide both "Text 1" and "Text 2". The question and all multiple-choice options must be fully written out. Do not truncate any part of the question.
*   **Clarity and Unambiguity:** Questions must be clear and unambiguous. The correct answer must be definitively correct based on the provided text and logic.
*   **Plausible Distractors:** Incorrect options (distractors) should be plausible but clearly incorrect upon careful analysis. They should target common student misunderstandings.
*   **Original Content:** Do not plagiarize or closely copy existing SAT materials. Generate original content that mimics the style and difficulty of official questions.
*   **Creativity and Originality:** The content of the passages and questions should be highly original, engaging, and creative. Explore a wide range of subjects, from arts and humanities to sciences and social studies, to make the test interesting for the student.

**CRITICAL FORMATTING RULES:**
1.  Strictly adhere to the JSON schema provided.
2.  For the 'questionText' field, you MUST use the following markdown structure:
    *   If there is a passage: \`**Passage:**\\n[Passage text]\\n\\n**Question:**\\n[Question text]\`
    *   If there is no passage: \`**Question:**\\n[Question text]\`
    *   **DO NOT** include a header like "### Question X of Y ###". The response should start directly with "**Passage:**" or "**Question:**".
3.  The content and style should mimic the provided example files.
4.  Generate exactly 20 unique questions.
${challengingWordsInstruction}
${customizations}`;
        userPrompt = `Based on the provided example files and topic descriptions, generate a 20-question '${difficultyName}' difficulty SAT English test. The questions should be in the same style and cover the same subject matter as the examples, and be distributed among these topics: ${topics.join(', ')}.`;
        filePaths = topics.map(topic => `resources/${TOPIC_TO_FOLDER_MAP[topic]}/${TOPIC_TO_FOLDER_MAP[topic]}-${difficulty}.ts`);
        questionTopicValidation = `The SAT English topic for the question. Must be one of: ${topics.join(', ')}.`;
    }

    const assignmentSchema = {
        type: Type.OBJECT, properties: { questions: { type: Type.ARRAY, items: {
            ...questionSchema,
            properties: {
                ...questionSchema.properties,
                topic: { type: Type.STRING, description: questionTopicValidation },
            }
        } } }, required: ['questions']
    };

    const fileContentPromises = filePaths.flat().map(path => getResourceContentOnServer(path).catch(() => null));
    const fileContents = (await Promise.all(fileContentPromises)).filter((c): c is string => c !== null);
    if (fileContents.length === 0) throw new Error(`No resource files could be loaded.`);
    
    const fullPrompt = `${userPrompt}

The following is one or more example files. You MUST strictly adhere to the format, style, and tone of the questions, passages, and explanations found in these examples when generating the new test.

--- EXAMPLE FILE(S) START ---
${fileContents.join('\n\n--- NEXT EXAMPLE FILE ---\n\n')}
--- EXAMPLE FILE(S) END ---
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: fullPrompt,
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: assignmentSchema,
            temperature: 1.0,
        },
    });

    const responseText = response.text;
    if (!responseText) throw new Error("AI did not return a valid response for assignment generation.");
    
    const result = JSON.parse(responseText);
    if (!result.questions || result.questions.length !== 20) throw new Error("AI did not return 20 questions.");
    
    return result.questions.map((q: Question, index: number) => {
        const cleanedQuestionText = q.questionText.replace(/^### Question \d+ of \d+ ###\s*\n\n/, '');
        const processedQuestionText = cleanedQuestionText.replace(/\\n/g, '\n');
        return {
            ...q,
            id: index + 1,
            questionText: processedQuestionText,
        };
    });
};

const handleGetQuestionExplanation = async (payload: { question: Question }): Promise<string> => {
    const ai = getAiClient();
    const { question } = payload;
    if (!question) throw new Error("A question object is required.");

    const folderName = TOPIC_TO_FOLDER_MAP[question.topic];
    if (!folderName && !question.topic.startsWith('Targeted:') && !question.topic.startsWith('Reading Comprehension')) {
        // Allow targeted tests to proceed without a folder
        throw new Error(`Invalid topic provided: ${question.topic}`);
    }

    let sampleFileContent: string = "Please provide a standard SAT English explanation.";
    if (folderName) {
        try {
            sampleFileContent = await getResourceContentOnServer(`resources/${folderName}/${folderName}-${question.difficulty}.ts`);
        } catch {
            sampleFileContent = await getResourceContentOnServer(`resources/${folderName}/${folderName}-1.ts`);
        }
    }
    
    const sampleFilePart = stringToGenerativePart(sampleFileContent);

    const prompt = `You are an expert SAT English tutor. A student is reviewing the following question:

**Topic:** ${question.topic}
**Difficulty:** ${DIFFICULTY_MAP[question.difficulty]}
**Question & Passage:**
${question.questionText}

**Options:**
${question.options.map(opt => `${opt.letter}. ${opt.text}`).join('\n')}

**Correct Answer:** ${question.correctAnswer}

Your task is to provide a comprehensive, step-by-step explanation for why **${question.correctAnswer}** is the correct choice, and briefly explain why the other options are incorrect. Use the provided sample file as an example of the expected style and tone.

**Response format requirements:**
1.  Start by confirming the answer: "**The final answer is ${question.correctAnswer}**"
2.  Follow this with a heading: "**Explanations:**"
3.  Provide clear, bulleted explanations for both the correct answer and the incorrect ones. For example: "* **Correct (A):** [Explanation] * **Incorrect (B):** [Explanation]"`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [{ role: 'user', parts: [{ text: prompt }, sampleFilePart] }],
    });
    
    const explanationText = response.text;
    if (!explanationText) throw new Error('AI returned an empty explanation.');
    
    return explanationText.replace(/\\n/g, '\n');
};

const getQuestionSummary = async (imageParts: Part[]): Promise<string> => {
    const ai = getAiClient();
    const prompt = `You are an expert SAT English tutor. You are given one or more images of SAT English questions. Analyze them and provide a concise, 2-4 word summary of the primary skills or topics being tested (e.g., 'Rhetoric & Punctuation', 'Vocabulary in Context', 'Sentence Structure', 'Cross-Text Analysis'). Respond ONLY with a JSON object containing the summary, like {"summary": "Your Summary Here"}. Do not provide any other text or explanation.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [{ role: 'user', parts: [{ text: prompt }, ...imageParts] }],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: {
                        type: Type.STRING,
                        description: "A 2-4 word summary of the question types.",
                    },
                },
                required: ["summary"],
            },
        },
    });

    const responseText = response.text;
    if (!responseText) {
        throw new Error('AI returned an empty response for getQuestionSummary.');
    }
    const jsonResponse = JSON.parse(responseText);

    if (!jsonResponse?.summary || typeof jsonResponse.summary !== 'string') {
        throw new Error('Invalid or missing summary in AI response');
    }
    return jsonResponse.summary;
};

const handleGenerateTargetedPractice = async (payload: { images: { imageData: string, mimeType: string, correctAnswer: string }[] }, user: DecodedIdToken | null) => {
    const { images } = payload;
    if (!images || !Array.isArray(images) || images.length === 0 || images.length > 3) {
        throw new Error("Payload must contain an array of 1 to 3 images.");
    }
    const client = await clientPromise;
    const db: Db = client.db("sat_solver_db");
    await checkUserAccess(user, db, 'test_generation');

    const ai = getAiClient();
    
    const imagePartsForSummary = images.map(image => base64ToGenerativePart(image.imageData, image.mimeType));
    const summary = await getQuestionSummary(imagePartsForSummary);
    const generatedTestName = `Targeted: ${summary}`;

    const threeQuestionSchema = {
        type: Type.OBJECT,
        properties: {
            questions: {
                type: Type.ARRAY,
                items: {
                    ...questionSchema,
                    properties: {
                        ...questionSchema.properties,
                        topic: { 
                            type: Type.STRING, 
                            description: `This MUST be the string '${generatedTestName}'.`
                        },
                    },
                },
                description: "An array containing exactly 3 question objects."
            }
        },
        required: ["questions"],
    };


    const generationPromises = images.map(image => {
        const systemInstruction = `You are an expert SAT English test creator. Analyze the provided image of an SAT English question. ${image.correctAnswer ? `The correct answer is **${image.correctAnswer}**.` : ''} Your task is to generate three new, unique questions that are analogous to the one in the image in topic, style, and reasoning required, but with entirely new content.

**QUALITY REQUIREMENTS:**
*   **SAT-Level Standard:** All new questions, passages, and options must meet the rigorous standards of the official SAT English test. The language must be sophisticated, grammatically perfect, and free of errors.
*   **Completeness:** Each generated question must be complete. If the source question has one or two passages, the new questions must also have full, complete passages. The question and all multiple-choice options must be fully written out. Do not truncate any part of the question.
*   **Clarity and Unambiguity:** Questions must be clear and unambiguous. The correct answer must be definitively correct based on the provided text and logic.
*   **Plausible Distractors:** Incorrect options (distractors) should be plausible but clearly incorrect upon careful analysis.
*   **Creative Content:** The new passages and questions should be creative and original. While mimicking the style and topic of the source question, use different subjects and scenarios to make the practice engaging.

**CRITICAL FORMATTING RULES:**
*   For each new question, the 'topic' field in the JSON MUST be exactly '${generatedTestName}'.
*   Adhere strictly to the provided JSON schema.
*   Ensure difficulty is inferred from the image and set to 1, 2, or 3.`;
        const imagePart = base64ToGenerativePart(image.imageData, image.mimeType);
        const textPart = { text: "Analyze this image of an SAT question and generate new questions based on it." };
        return ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: [{ role: 'user', parts: [textPart, imagePart] }],
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: threeQuestionSchema,
                temperature: 1.0,
            },
        });
    });

    const responses = await Promise.all(generationPromises);
    const allQuestions = responses.flatMap(response => {
        const text = response.text;
        if (!text) return [];
        try {
            const parsed = JSON.parse(text);
            return parsed.questions || [];
        } catch (e) {
            console.error("Failed to parse JSON for targeted practice chunk:", text);
            return [];
        }
    });

    if (allQuestions.length === 0) {
        throw new Error("The AI failed to generate any questions from the provided images. Please try again with clearer images.");
    }
    
    return allQuestions.map((q: Question, index: number) => ({
        ...q,
        id: index + 1,
        questionText: q.questionText.replace(/\\n/g, '\n'),
    }));
};

const handleGenerateAdaptiveTest = async (payload: { sourceQuestions: Question[] }, user: DecodedIdToken | null) => {
    const { sourceQuestions } = payload;
    const n = sourceQuestions.length;
    if (n === 0 || n > 20) {
        throw new Error("Must provide between 1 and 20 source questions.");
    }
    
    const client = await clientPromise;
    const db: Db = client.db("sat_solver_db");
    await checkUserAccess(user, db, 'test_generation');

    const ai = getAiClient();
    const basePrompts = Math.floor(20 / n);
    const extraPrompts = 20 % n;

    const generationTasks: { question: Question; count: number }[] = sourceQuestions.map((q, index) => ({
        question: q,
        count: basePrompts + (index < extraPrompts ? 1 : 0),
    }));

    const systemInstruction = `You are an expert SAT English test creator. A student needs more practice with a question like the one provided. Your task is to generate new, unique, and analogous questions. They must target the same skill and style but use entirely new content.

**QUALITY REQUIREMENTS:**
*   **SAT-Level Standard:** All questions, passages, and options must meet the rigorous standards of the official SAT English test. The language must be sophisticated, grammatically perfect, and free of errors.
*   **Completeness:** Each generated question must be complete. If the source question has one or two passages, the new questions must also have full, complete passages. The question and all multiple-choice options must be fully written out. Do not truncate any part of the question.
*   **Clarity and Unambiguity:** Questions must be clear and unambiguous. The correct answer must be definitively correct based on the provided text and logic.
*   **Plausible Distractors:** Incorrect options (distractors) should be plausible but clearly incorrect upon careful analysis.
*   **Creative & Original Content:** While staying true to the topic and style of the source question, create entirely new passages and scenarios. The content should be fresh, engaging, and distinct from the original question provided.

**CRITICAL FORMATTING RULES:**
*   Adhere strictly to the provided JSON schema.`;

    const generationPromises = generationTasks.map(task => {
        const userPrompt = `A student needs more practice with a question like this one: ${JSON.stringify(task.question)}. Generate ${task.count} new, unique, and analogous questions.`;
        
        const adaptiveQuestionSchema = {
            type: Type.OBJECT,
            properties: {
                questions: {
                    type: Type.ARRAY,
                    items: questionSchema,
                    description: `An array containing exactly ${task.count} question objects.`
                }
            },
            required: ["questions"],
        };

        return ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: adaptiveQuestionSchema,
                temperature: 1.0,
            },
        });
    });
    
    const responses = await Promise.all(generationPromises);
    const allQuestions = responses.flatMap(response => {
        const text = response.text;
        if (!text) return [];
        try {
            const parsed = JSON.parse(text);
            return parsed.questions || [];
        } catch (e) {
            console.error("Failed to parse JSON for adaptive test chunk:", text);
            return [];
        }
    });

    if (allQuestions.length < 20) {
        throw new Error("The AI failed to generate a full 20-question test. Please try again.");
    }
    
    return allQuestions.slice(0, 20).map((q: Question, index: number) => ({
        ...q,
        id: index + 1,
        questionText: q.questionText.replace(/\\n/g, '\n'),
    }));
};

const handleGenerateFromText = async (payload: { text: string }, user: DecodedIdToken | null) => {
    const { text } = payload;
    if (!text) throw new Error("Text for generation is required.");

    const client = await clientPromise;
    const db: Db = client.db("sat_solver_db");
    await checkUserAccess(user, db, 'test_generation');

    const ai = getAiClient();
    
    const systemInstruction = `You are an expert SAT English test creator. Your task is to generate 5 high-quality, SAT-style questions based on a user-provided text. You must create questions of various types, similar to the provided example file.

**Instructions:**
1.  **Analyze the Text:** Read the entire text provided by the user.
2.  **Select Snippets:** For each of the 5 questions, select a specific, short snippet (one or two sentences) from the original text to serve as the 'Passage'.
3.  **Create Varied Questions:** Generate a diverse set of 5 questions. Each question should be based on its selected snippet. The question types should vary and test different skills, such as:
    *   **Words in Context:** Replace a word in a snippet with a blank and ask for the best fit.
    *   **Boundaries:** Replace punctuation in a snippet with a blank and ask for the correct punctuation.
    *   **Inference:** Ask for a logical conclusion based on a snippet.
    *   **Text structure and purpose:** Ask about the function of a part of the snippet.
    *   **Central ideas and details:** Ask about the main point of the snippet.
4.  **Provide Plausible Options:** For each question, create four multiple-choice options (A, B, C, D). The correct answer should be clear, and the incorrect options (distractors) should be plausible.
5.  **Format Correctly:**
    *   For the 'questionText' field, format it as: \`**Passage:**\\n[The short snippet you selected]\\n\\n**Question:**\\n[Your generated question]\`
    *   If you create a "fill-in-the-blank" style question, use \`_______\` for the blank in the passage text.
    *   The 'topic' for all questions must be 'Text Analysis Practice'.
    *   Strictly adhere to the provided JSON schema.`;

    const sampleFileContent = await getResourceContentOnServer('resources/all-types/all-types-3.ts');

    const userPrompt = `Please generate 5 varied, SAT-style questions based on the following text. Each question should use a small, relevant portion of the text as its passage. The style of the questions should mimic the provided example file.

**Source Text:**
---
${text}
---

**Example File:**
---
${sampleFileContent}
---
`;

    const generatedTestSchema = {
        type: Type.OBJECT,
        properties: {
            questions: {
                type: Type.ARRAY,
                items: {
                    ...questionSchema,
                    properties: {
                        ...questionSchema.properties,
                        topic: { type: Type.STRING, description: `This MUST be the string 'Text Analysis Practice'.` }
                    }
                },
                description: "An array of exactly 5 question objects."
            }
        },
        required: ["questions"]
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: userPrompt,
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: generatedTestSchema,
            temperature: 1.0,
        }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("AI did not return a valid response for text-based generation.");
    
    const result = JSON.parse(responseText);
    if (!result.questions || result.questions.length !== 5) throw new Error("AI did not return 5 questions.");
    
    return result.questions.map((q: Question, index: number) => ({
        ...q,
        id: index + 1,
        questionText: q.questionText.replace(/\\n/g, '\n'),
    }));
};

const ACCENT_VOICE_MAP: Record<string, protos.google.cloud.texttospeech.v1.IVoiceSelectionParams> = {
    'en-US': { languageCode: 'en-US', name: 'en-US-Standard-J' }, // Female
    'en-GB': { languageCode: 'en-GB', name: 'en-GB-Standard-A' }, // Female
    'en-IN': { languageCode: 'en-IN', name: 'en-IN-Standard-B' }, // Male
};

const handleGetSpeechAudio = async (payload: { text: string; accent: string }, user: DecodedIdToken) => {
    const client = await clientPromise;
    const db: Db = client.db("sat_solver_db");
    await checkUserAccess(user, db, 'premium_feature');

    const { text, accent } = payload;
    if (!text || typeof text !== 'string') {
        const err = new Error('Text to synthesize is required.');
        (err as any).statusCode = 400;
        throw err;
    }
    if (!accent || typeof accent !== 'string' || !ACCENT_VOICE_MAP[accent]) {
        const err = new Error('A valid accent (en-US, en-GB, en-IN) is required.');
        (err as any).statusCode = 400;
        throw err;
    }
        
    const ttsClient = getTtsClient();
    const request: protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
        input: { text: text },
        voice: ACCENT_VOICE_MAP[accent],
        audioConfig: { audioEncoding: 'MP3' },
    };
    const [response] = await ttsClient.synthesizeSpeech(request);
    if (!response.audioContent) {
        throw new Error('Text-to-Speech API returned no audio content.');
    }
    return Buffer.from(response.audioContent).toString('base64');
};

const handleGenerateVocabQuiz = async (payload: { words: VocabularyWord[] }, user: DecodedIdToken | null): Promise<QuizQuestion[]> => {
    const { words } = payload;
    if (!words || !Array.isArray(words) || words.length === 0) {
        throw new Error("Payload must contain an array of words.");
    }

    const client = await clientPromise;
    const db: Db = client.db("sat_solver_db");
    await checkUserAccess(user, db, 'premium_feature');

    const ai = getAiClient();
    const systemInstruction = `You are an expert SAT vocabulary quiz creator. You will be given a list of vocabulary words and their original MongoDB IDs. Your task is to create a varied and challenging quiz with exactly one question for each word provided. The quiz MUST include a mix of the following two question types:

1.  'FILL_IN_THE_BLANK_MCQ':
    - The 'correctWord' for this question MUST be one of the words from the input list.
    - Create a unique, high-quality sentence that uses the word, but replace the word with '[____]'. This tests contextual understanding.
    - The sentence MUST be sophisticated, grammatically correct, and sound natural.
    - Provide four plausible multiple-choice options in the 'options' array.
    - **CRITICAL REQUIREMENT for MCQ:** One of the four options in the 'options' array MUST be the exact 'correctWord' for the question. The other three options should be plausible but incorrect distractors. The options should be challenging.

2.  'DEFINITION_SHORT_ANSWER':
    - The 'correctWord' for this question MUST be one of the words from the input list.
    - Ask for the definition of the word directly. The 'questionText' for this type should be "What is the definition of '[word]'?".

For every question you generate, you MUST set the 'originalWordId' field to the corresponding MongoDB ID of the word from the input list. This is crucial for tracking.
Ensure a good variety between the two question types in the generated quiz.`;
    
    const userPrompt = `Generate a quiz for the following words:\n${words.map(w => `- ${w.word}`).join('\n')}`;
    
    const quizSchema = {
        type: Type.OBJECT,
        properties: {
            questions: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ['FILL_IN_THE_BLANK_MCQ', 'DEFINITION_SHORT_ANSWER'] },
                        questionText: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true, description: "An array of 4 strings for MCQ questions. Must be null for short answer questions." },
                        correctWord: { type: Type.STRING },
                        originalWordId: { type: Type.STRING },
                    },
                    required: ["type", "questionText", "correctWord", "originalWordId"],
                },
                description: `An array of exactly ${words.length} question objects.`
            }
        },
        required: ["questions"]
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `${userPrompt} \n\nHere is the full data for context: ${JSON.stringify(words)}`,
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: quizSchema,
            temperature: 0.5, // Lowered temperature for higher quality, more focused questions.
        },
    });

    const responseText = response.text;
    if (!responseText) throw new Error("AI did not return a valid quiz response.");
    
    const result = JSON.parse(responseText);
    if (!result.questions || result.questions.length !== words.length) {
        throw new Error("AI did not return the correct number of quiz questions.");
    }
    return result.questions as QuizQuestion[];
};

const handleEvaluateVocabAnswer = async (payload: { question: QuizQuestion; userAnswer: string }, user: DecodedIdToken | null): Promise<EvaluationResult> => {
    const { question, userAnswer } = payload;
    if (!question || !userAnswer) {
        throw new Error("Payload must contain question and userAnswer.");
    }
    const client = await clientPromise;
    const db: Db = client.db("sat_solver_db");
    await checkUserAccess(user, db, 'premium_feature');

    const ai = getAiClient();
    const systemInstruction = `You are an SAT vocabulary evaluator. The student was asked to provide a definition for a word. You need to determine if their answer is correct.
The answer is correct if it accurately captures the meaning of the word. Be reasonably lenient with phrasing as long as the core concept is correct. The student's answer does not need to be a textbook definition.`;
    const userPrompt = `
- Word to Define: "${question.correctWord}"
- Student's Definition: "${userAnswer}"

Is the student's definition correct? Provide brief, encouraging feedback.
`;

    const evaluationSchema = {
        type: Type.OBJECT,
        properties: {
            isCorrect: { type: Type.BOOLEAN },
            feedback: { type: Type.STRING, description: "A brief, one-sentence explanation for why the answer is correct or incorrect." },
        },
        required: ["isCorrect", "feedback"]
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: userPrompt,
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: evaluationSchema,
        },
    });

    const responseText = response.text;
    if (!responseText) throw new Error("AI did not return a valid evaluation.");

    const evaluationResult = JSON.parse(responseText) as EvaluationResult;

    if (!evaluationResult.isCorrect && question.type === 'DEFINITION_SHORT_ANSWER') {
        const detailsCollection = db.collection<WordDetailsDBCache>("word_details");
        const details = await detailsCollection.findOne({ _id: question.correctWord.toLowerCase() });
        if (details) {
            evaluationResult.correctWordDefinition = details.definition;
        }
    }

    return evaluationResult;
};

const generateWordDetails = async (word: string, context: string): Promise<WordDetails> => {
    const ai = getAiClient();
    const systemInstruction = `You are a helpful vocabulary assistant. Your goal is to provide rich, contextual information about a specific word to help a student learn it for the SAT. The student will provide a word and the context in which they encountered it. When providing a definition, prioritize the most common, general-purpose meaning of the word that would be relevant for a high school student. Avoid overly technical or domain-specific definitions unless the word is almost exclusively used in that specific context.`;
    const userPrompt = `The word is "${word}". It appeared in this context: "${context}". Please provide the following information about the word "${word}".`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            definition: { type: Type.STRING, description: `A clear, concise definition of the word '${word}'. Prioritize its most common, general-purpose meaning. Avoid overly technical jargon.` },
            pronunciation: { type: Type.STRING, description: `The phonetic pronunciation of the word '${word}', e.g., /fəˈnɛtɪk/.` },
            exampleSentences: { type: Type.ARRAY, items: { type: Type.STRING }, description: `Three distinct and memorable example sentences using the word '${word}'.` },
            deepDive: { type: Type.STRING, description: `A "deep dive" into the word '${word}'. This should be a short, engaging paragraph explaining its etymology (origin), or a mini-story that helps make the word's meaning unforgettable.` },
            contextPassage: { type: Type.STRING, description: `The original context passage provided by the user.`}
        },
        required: ["definition", "exampleSentences", "deepDive", "contextPassage"],
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
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


// --- Main API Handler ---
export async function handleGemini(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).send(`Method ${req.method} Not Allowed`);
    }
    
    let user: DecodedIdToken | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split('Bearer ')[1];
        try {
            user = await verifyIdToken(token);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Authentication failed.";
            if (message.includes('Firebase Admin SDK')) {
                 console.error("Firebase Admin config failed:", message);
                 return res.status(500).json({ message: `Server Configuration Error: ${message}` });
            }
            return res.status(403).json({ message: `Forbidden: ${message}` });
        }
    }

    try {
        let action, payload;

        if (req.url?.startsWith('/api/tts')) {
            action = 'getSpeechAudio';
            payload = req.body;
        } else {
            ({ action, payload } = req.body);
        }

        const ip = req.headers['x-forwarded-for'];

        switch (action) {
            case 'solveSatQuestion':
                const solution = await handleSolveSatQuestion(payload, ip, user);
                return res.status(200).json({ solution });

            case 'generateSatAssignment': {
                const questions = await handleGenerateSatAssignment(payload, user);
                return res.status(200).json({ questions });
            }
            case 'getQuestionExplanation':
                const explanation = await handleGetQuestionExplanation(payload);
                return res.status(200).json({ explanation });
            
            case 'generateTargetedPractice': {
                const questions = await handleGenerateTargetedPractice(payload, user);
                return res.status(200).json({ questions });
            }

            case 'generateAdaptiveTest': {
                const questions = await handleGenerateAdaptiveTest(payload, user);
                return res.status(200).json({ questions });
            }

            case 'generateFromText': {
                const questions = await handleGenerateFromText(payload, user);
                return res.status(200).json({ questions });
            }

            case 'getSpeechAudio': {
                if (!user) return res.status(401).json({ message: "Authentication required for TTS." });
                const audioContent = await handleGetSpeechAudio(payload, user);
                return res.status(200).json({ audioContent });
            }

            case 'generateVocabQuiz': {
                const questions = await handleGenerateVocabQuiz(payload, user);
                return res.status(200).json({ questions });
            }

            case 'evaluateVocabAnswer': {
                const evaluation = await handleEvaluateVocabAnswer(payload, user);
                return res.status(200).json({ evaluation });
            }
            
            case 'getWordDetails': {
                if (!user) return res.status(401).json({ message: "Authentication required for word details." });
                const details = await generateWordDetails(payload.word, payload.context);
                return res.status(200).json(details);
            }

            default:
                return res.status(400).json({ message: 'Invalid action specified.' });
        }
    } catch (error: unknown) {
        console.error(`Error in Gemini handler for action: ${req.body?.action}`, error);
        const message = error instanceof Error ? error.message : "An unknown server error occurred.";
        const statusCode = (error as any).statusCode || 500;
        return res.status(statusCode).json({ message });
    }
}
