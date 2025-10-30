import React, { useState, useEffect, useCallback } from 'react';
import type { VocabularyWord, QuizQuestion, EvaluationResult, McqQuestion, ShortAnswerQuestion } from '@/types';
import { generateVocabularyQuiz, evaluateVocabularyAnswer, getWordDetails } from '@/services/vocabularyService';
import { ErrorIcon } from '@/components/icons/ErrorIcon';
import { CheckCircleIcon } from '@/components/icons/CheckCircleIcon';
import { XCircleIcon } from '@/components/icons/XCircleIcon';
import { ProgressiveAcademicCapIcon } from '../icons/ProgressiveAcademicCapIcon';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';

interface VocabularyQuizProps {
    words: VocabularyWord[];
    onQuizComplete: (results: { wordId: string; isCorrect: boolean }[]) => void;
}

type QuizState = 'loading' | 'active' | 'evaluating' | 'reviewing' | 'complete';

const VocabularyQuiz: React.FC<VocabularyQuizProps> = ({ words, onQuizComplete }) => {
    const [quizState, setQuizState] = useState<QuizState>('loading');
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [lastEvaluation, setLastEvaluation] = useState<EvaluationResult | null>(null);
    const [results, setResults] = useState<{ wordId: string; isCorrect: boolean }[]>([]);
    const [error, setError] = useState<string | null>(null);

    const fetchQuiz = useCallback(async () => {
        try {
            const generatedQuestions = await generateVocabularyQuiz(words);
            setQuestions(generatedQuestions);
            setQuizState('active');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not load the quiz.');
            setQuizState('loading');
        }
    }, [words]);

    useEffect(() => {
        fetchQuiz();
    }, [fetchQuiz]);

    const handleNext = () => {
        setUserAnswer('');
        setLastEvaluation(null);
        setError(null);
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setQuizState('active');
        } else {
            setQuizState('complete');
        }
    };

    const handleMcqAnswer = async (selectedOption: string) => {
        if (quizState !== 'active') return;

        setUserAnswer(selectedOption);
        setQuizState('evaluating');
        setError(null);

        const currentQuestion = questions[currentIndex] as McqQuestion;
        const isCorrect = selectedOption === currentQuestion.correctWord;

        let evalResult: EvaluationResult = {
            isCorrect,
            feedback: isCorrect ? "That's right!" : `The correct answer was: ${currentQuestion.correctWord}`
        };

        if (!isCorrect) {
            try {
                const [correctDetails, wrongDetails] = await Promise.all([
                    getWordDetails(currentQuestion.correctWord, currentQuestion.questionText),
                    getWordDetails(selectedOption, currentQuestion.questionText)
                ]);
                evalResult.correctWordDefinition = correctDetails.definition;
                evalResult.wrongWordDefinition = wrongDetails.definition;
            } catch (e) {
                console.error("Failed to fetch definitions for review:", e);
                // Non-blocking error
            }
        }
        
        setLastEvaluation(evalResult);
        setResults(prev => [...prev, { wordId: currentQuestion.originalWordId, isCorrect }]);
        setQuizState('reviewing');
    };


    const handleShortAnswerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userAnswer.trim() || quizState !== 'active') return;

        setQuizState('evaluating');
        setError(null);
        try {
            const currentQuestion = questions[currentIndex] as ShortAnswerQuestion;
            const evaluation = await evaluateVocabularyAnswer(currentQuestion, userAnswer);
            setLastEvaluation(evaluation);
            setResults(prev => [...prev, { wordId: currentQuestion.originalWordId, isCorrect: evaluation.isCorrect }]);
            setQuizState('reviewing');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not evaluate your answer.');
            setQuizState('active');
        }
    };

    const currentQuestion = questions[currentIndex];
    const progressPercentage = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
    
    const renderMcqQuestion = (question: McqQuestion) => (
        <div className="space-y-4">
            <div className="text-center min-h-[10rem] flex flex-col justify-center my-8 px-4">
                <p className="text-slate-600 dark:text-gray-300 mb-2">Fill in the blank:</p>
                <p className="text-xl md:text-2xl text-slate-900 dark:text-white leading-relaxed" dangerouslySetInnerHTML={{ __html: question.questionText.replace('[____]', '<span class="font-bold text-purple-600 dark:text-purple-400">[____]</span>') }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {question.options.map(option => {
                    const isCorrect = option === question.correctWord;
                    const wasSelected = userAnswer === option;
                    let buttonClasses = 'w-full text-center text-lg border-2 rounded-lg px-3 py-4 transition-all duration-200 ';

                    if (quizState === 'reviewing' || quizState === 'evaluating') {
                        if (isCorrect) {
                            buttonClasses += 'border-green-500 bg-green-50 dark:bg-green-900/50 ring-2 ring-green-500 text-slate-900 dark:text-white';
                        } else if (wasSelected && !isCorrect) {
                            buttonClasses += 'border-red-500 bg-red-50 dark:bg-red-900/50 text-slate-900 dark:text-white';
                        } else {
                            buttonClasses += 'border-slate-200 dark:border-gray-700 opacity-60 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300';
                        }
                    } else {
                        buttonClasses += 'bg-white dark:bg-gray-800 border-slate-300 dark:border-gray-700 text-slate-900 dark:text-white hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transform hover:-translate-y-1';
                    }

                    return (
                        <button
                            key={option}
                            onClick={() => handleMcqAnswer(option)}
                            disabled={quizState !== 'active'}
                            className={buttonClasses}
                        >
                            {option}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const renderShortAnswerQuestion = (question: ShortAnswerQuestion) => (
        <form onSubmit={handleShortAnswerSubmit} className="space-y-4">
            <div className="text-center min-h-[10rem] flex flex-col justify-center my-8 px-4">
                <p className="text-xl md:text-2xl text-slate-900 dark:text-white leading-relaxed">{question.questionText}</p>
            </div>
            <input
                type="text"
                value={userAnswer}
                onChange={e => setUserAnswer(e.target.value)}
                placeholder="Type your definition"
                disabled={quizState !== 'active'}
                className="w-full text-center text-lg bg-slate-100 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-lg px-3 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-200 dark:disabled:bg-gray-700"
                autoFocus
            />
            <div className="h-14 flex items-center justify-center">
                {quizState === 'active' && <button type="submit" className="bg-purple-600 text-white font-bold py-3 px-10 rounded-lg hover:bg-purple-500 transform hover:scale-105 transition-transform duration-200">Check Answer</button>}
            </div>
        </form>
    );

    if (quizState === 'loading') {
        return (
            <div className="text-center py-16">
                {error ? (
                    <div className="p-4 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg">
                        <ErrorIcon className="w-8 h-8 mx-auto mb-2" />
                        <p>{error}</p>
                    </div>
                ) : (
                    <>
                        <ProgressiveAcademicCapIcon className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Generating Your Quiz...</h2>
                        <p className="text-slate-600 dark:text-gray-300 mt-2">The AI is crafting questions just for you.</p>
                    </>
                )}
            </div>
        );
    }
    
    if (quizState === 'complete') {
        const correctCount = results.filter(r => r.isCorrect).length;
        return (
             <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Quiz Complete!</h2>
                <p className="text-lg text-slate-600 dark:text-gray-300 mt-2">You scored {correctCount} out of {results.length}.</p>
                <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Correctly answered words will be moved to your 'Mastered' list.</p>
                <button 
                    onClick={() => onQuizComplete(results)}
                    className="mt-6 bg-purple-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-purple-500"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 p-6 md:p-8">
            <div className="w-full bg-slate-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
                <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${progressPercentage}%`, transition: 'width 0.5s ease-in-out' }}></div>
            </div>
            <p className="text-center text-sm font-semibold text-slate-500 dark:text-gray-400 mb-4">Question {currentIndex + 1} of {questions.length}</p>

            {currentQuestion.type === 'FILL_IN_THE_BLANK_MCQ' ? renderMcqQuestion(currentQuestion) : renderShortAnswerQuestion(currentQuestion)}

            {error && <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg text-center text-sm">{error}</div>}

            {(quizState === 'reviewing' || quizState === 'evaluating') && (
                <div className="min-h-[14rem] pt-4">
                    {quizState === 'evaluating' && (
                        <div className="text-center pt-4 flex flex-col items-center justify-center animate-modal-enter">
                            <div className="relative w-20 h-20">
                                <div className="absolute inset-0 border-4 border-purple-200 dark:border-purple-800 rounded-full animate-pulse"></div>
                                <div className="absolute inset-0 border-4 border-t-purple-500 border-l-transparent border-b-purple-500 border-r-transparent rounded-full animate-spin"></div>
                                <AcademicCapIcon className="w-10 h-10 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <p className="mt-4 font-semibold text-slate-700 dark:text-gray-300">The AI is evaluating your answer...</p>
                        </div>
                    )}

                    {quizState === 'reviewing' && lastEvaluation && (
                        <div className={`mt-4 p-4 rounded-lg animate-modal-enter ${lastEvaluation.isCorrect ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                            <div className="flex items-center">
                                {lastEvaluation.isCorrect ? (
                                    <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
                                ) : (
                                    <XCircleIcon className="w-8 h-8 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" />
                                )}
                                <p className={`text-xl font-semibold ${lastEvaluation.isCorrect ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>{lastEvaluation.feedback}</p>
                            </div>

                            {lastEvaluation && !lastEvaluation.isCorrect && (
                                <div className="mt-3 pt-3 border-t border-red-300 dark:border-red-700 text-sm">
                                    {currentQuestion.type === 'FILL_IN_THE_BLANK_MCQ' ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {lastEvaluation.wrongWordDefinition && (
                                                <div className="bg-red-200/50 dark:bg-red-900/40 p-3 rounded-lg">
                                                    <p className="font-semibold text-red-800 dark:text-red-200">Your Answer ({userAnswer}):</p>
                                                    <p className="text-red-700 dark:text-red-300 mt-1">{lastEvaluation.wrongWordDefinition}</p>
                                                </div>
                                            )}
                                            {lastEvaluation.correctWordDefinition && (
                                                 <div className="bg-green-200/50 dark:bg-green-900/40 p-3 rounded-lg">
                                                    <p className="font-semibold text-green-800 dark:text-green-200">Correct Answer ({currentQuestion.correctWord}):</p>
                                                    <p className="text-green-700 dark:text-green-300 mt-1">{lastEvaluation.correctWordDefinition}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        lastEvaluation.correctWordDefinition && (
                                            <div>
                                                <p className="font-semibold text-red-800 dark:text-red-200">Correct Definition:</p>
                                                <p className="text-red-700 dark:text-red-300">{lastEvaluation.correctWordDefinition}</p>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                            <button onClick={handleNext} className="w-full mt-4 bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-500">
                                {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VocabularyQuiz;