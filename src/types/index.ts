export type VocabularyWordStatus = 'new' | 'review' | 'mastered';

export type Page = 'solver' | 'practice' | 'history' | 'vocabulary' | 'feedback' | 'dashboard';

export type FeedbackState = 'eligible' | 'snoozed' | 'dismissed';

export interface Question {
    id: number;
    topic: string;
    questionText: string;
    options: {
        letter: string;
        text: string;
    }[];
    correctAnswer: string;
    difficulty: number;
    challengingWords?: string[];
}

export interface Highlight {
  id: string;
  startIndex: number;
  endIndex: number;
  text: string;
  color: 'yellow' | 'pink' | 'cyan';
  note: string;
}

export interface PastAssignment {
  id: string; // A unique identifier for the assignment, generated for local storage.
  userId: string;
  name: string;
  dateCompleted: Date;
  score: number;
  questions: Question[];
  userAnswers: Record<number, string>;
  highlights: Record<number, Highlight[]>;
  strikethroughs?: Record<number, string[]>;
  topics: string[];
  difficulty: number;
  timeLimitInSeconds: number;
  customizations?: string;
  status: 'completed' | 'paused';
  timeRemaining?: number;
}

export interface PastAssignmentSummary {
  id: string;
  name: string;
  dateCompleted: Date;
  score: number;
  totalQuestions: number;
  topics: string[];
  difficulty: number;
  status: 'completed' | 'paused';
}

export interface UserProfile {
  uid: string;
  email: string | null;
  tier: 'free' | 'premium' | 'developer';
  testsTakenToday: number;
  dailyTestLimit: number;
  hasCompletedTutorial: boolean;
  totalTestsCompleted: number;
  feedbackState?: FeedbackState;
  snoozeCount?: number;
  lastPracticeDate?: string; // ISO string
  currentStreak?: number;
  longestStreak?: number;
}

export interface VocabularyWord {
  _id: string; // From MongoDB
  word: string;
  contextPassage: string; // The original passage from the question
  sourceQuestionId: number;
  addedAt: string; // ISO date string
  status: VocabularyWordStatus;
  // For Spaced Repetition System (SRS)
  nextReviewDate?: string; // ISO string
  repetitionInterval?: number; // in days
  easeFactor?: number;
}

export interface WordDetails {
  definition: string;
  pronunciation?: string;
  exampleSentences: string[];
  deepDive: string; // For etymology or mini-story
  contextPassage: string; // The original passage from the question
}

export interface Feedback {
    _id: string;
    rating: number; // Overall experience rating
    aiRating: number; // AI explanation rating
    mostValuableFeature?: string;
    aiIssues?: string;
    comments?: string;
    userId: string;
    page: string;
    createdAt: string; // ISO date string
}

export type QuizQuestionType = 'FILL_IN_THE_BLANK_MCQ' | 'DEFINITION_SHORT_ANSWER';

export interface BaseQuizQuestion {
    type: QuizQuestionType;
    originalWordId: string;
    correctWord: string; // The word being tested
}

export interface McqQuestion extends BaseQuizQuestion {
    type: 'FILL_IN_THE_BLANK_MCQ';
    questionText: string; // The sentence with a blank, e.g., "The cat [____] on the mat."
    options: string[]; // Four options including the correct one
}

export interface ShortAnswerQuestion extends BaseQuizQuestion {
    type: 'DEFINITION_SHORT_ANSWER';
    questionText: string; // e.g., "What is the definition of 'ubiquitous'?"
}

export type QuizQuestion = McqQuestion | ShortAnswerQuestion;


export interface EvaluationResult {
    isCorrect: boolean;
    feedback: string;
    correctWordDefinition?: string;
    wrongWordDefinition?: string;
}