import React, { useState, useCallback, useMemo } from 'react';
import type { Question, Highlight, UserProfile } from '@/types';
import { getQuestionExplanation } from '@/services/geminiService';
import AssignmentResults from './AssignmentResults';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { SpinnerIcon } from '@/components/icons/SpinnerIcon';
import { ErrorIcon } from '@/components/icons/ErrorIcon';
import { CheckCircleIcon } from '@/components/icons/CheckCircleIcon';
import { XCircleIcon } from '@/components/icons/XCircleIcon';
import { MinusCircleIcon } from '@/components/icons/MinusCircleIcon';
import QuestionTextRenderer from '@/components/QuestionTextRenderer';
import { ChevronLeftIcon } from '@/components/icons/ChevronLeftIcon';
import AdaptiveTestModal from './AdaptiveTestModal';
import { SpeakerIcon } from '../icons/SpeakerIcon';
import { getSpeechAudio } from '@/services/ttsService';

type Filter = 'all' | 'incorrect' | 'unattempted';

interface AssignmentReviewProps {
    questions: Question[];
    userAnswers: Record<number, string>;
    score: number;
    highlights: Record<number, Highlight[]>;
    strikethroughs: Record<number, string[]>;
    onRestart?: () => void;
    onBack?: () => void;
    onTestGenerated?: (questions: Question[]) => void;
    userProfile?: UserProfile | null;
}

const AssignmentReview: React.FC<AssignmentReviewProps> = ({ 
    questions, 
    userAnswers, 
    score, 
    onRestart, 
    highlights, 
    strikethroughs, 
    onBack, 
    onTestGenerated, 
    userProfile 
}) => {
    const [visibleExplanations, setVisibleExplanations] = useState<Record<number, boolean>>({});
    const [visibleAnswers, setVisibleAnswers] = useState<Record<number, boolean>>({});
    const [explanations, setExplanations] = useState<Record<number, string>>({});
    const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({});
    const [errorStates, setErrorStates] = useState<Record<number, string | null>>({});
    const [activeFilter, setActiveFilter] = useState<Filter>('all');
    const [showAdaptiveModal, setShowAdaptiveModal] = useState(false);
    const [speakingState, setSpeakingState] = useState<{ [key: number]: 'speaking' | 'error' | 'idle' }>({});

    const filteredQuestions = useMemo(() => {
        return questions.filter(q => {
            const userAnswer = userAnswers[q.id];
            const isCorrect = userAnswer === q.correctAnswer;
            const isAttempted = userAnswer !== undefined;
            switch(activeFilter) {
                case 'incorrect': return isAttempted && !isCorrect;
                case 'unattempted': return !isAttempted;
                case 'all':
                default:
                    return true;
            }
        }).sort((a,b) => a.id - b.id);
    }, [questions, userAnswers, activeFilter]);

    const handleShowAnswer = (questionId: number) => {
        setVisibleAnswers(prev => ({ ...prev, [questionId]: true }));
    };

    const toggleExplanation = useCallback(async (questionId: number) => {
        const isCurrentlyVisible = !!visibleExplanations[questionId];

        if (isCurrentlyVisible) {
            setVisibleExplanations(prev => ({...prev, [questionId]: false}));
            return;
        }

        // When showing explanation, also reveal the answer
        setVisibleAnswers(prev => ({ ...prev, [questionId]: true }));
        setVisibleExplanations(prev => ({...prev, [questionId]: true}));
        
        // If explanation already exists or is loading, no need to fetch.
        if (explanations[questionId] || loadingStates[questionId]) {
            return;
        }

        const question = questions.find(q => q.id === questionId);
        if (!question) return;

        setLoadingStates(prev => ({ ...prev, [questionId]: true }));
        setErrorStates(prev => ({ ...prev, [questionId]: null }));

        try {
            const rawExplanation = await getQuestionExplanation(question);
            
            const markdownBlockRegex = /```[a-z]*\s*([\s\S]*?)\s*```/;
            const match = rawExplanation.match(markdownBlockRegex);

            let cleanedExplanation;
            if (match && match[1]) {
                cleanedExplanation = match[1].trim();
            } else {
                cleanedExplanation = rawExplanation.trim();
            }
            
            setExplanations(prev => ({ ...prev, [questionId]: cleanedExplanation }));
        } catch (e) {
            const finalMessage = e instanceof Error ? e.message : 'Could not load explanation.';
            setErrorStates(prev => ({ ...prev, [questionId]: finalMessage }));
        } finally {
            setLoadingStates(prev => ({ ...prev, [questionId]: false }));
        }
    }, [questions, visibleExplanations, explanations, loadingStates]);
    
    const hasAccessToTTS = userProfile?.tier === 'premium' || userProfile?.tier === 'developer';

    const handleSpeak = async (questionId: number) => {
        const explanation = explanations[questionId];
        if (!explanation || speakingState[questionId] === 'speaking') return;

        setSpeakingState(prev => ({ ...prev, [questionId]: 'speaking' }));
        try {
            const textToSpeak = explanation.replace(/(\*\*|__|\*|_|`|#+\s*)/g, '');
            const audioBase64 = await getSpeechAudio(textToSpeak);
            const audioSrc = `data:audio/mp3;base64,${audioBase64}`;
            const audio = new Audio(audioSrc);
            audio.play();
            audio.onended = () => setSpeakingState(prev => ({ ...prev, [questionId]: 'idle' }));
            audio.onerror = () => setSpeakingState(prev => ({ ...prev, [questionId]: 'error' }));
        } catch (e) {
            console.error("TTS Error:", e);
            setSpeakingState(prev => ({ ...prev, [questionId]: 'error' }));
        }
    }

    return (
        <div className="space-y-12">
            {onTestGenerated && showAdaptiveModal && (
                <AdaptiveTestModal
                    isOpen={showAdaptiveModal}
                    onClose={() => setShowAdaptiveModal(false)}
                    onTestGenerated={onTestGenerated}
                    allQuestions={questions}
                    userAnswers={userAnswers}
                    initialFilter={activeFilter}
                    userProfile={userProfile ?? null}
                />
            )}

            <AssignmentResults
                score={score}
                totalQuestions={questions.length}
                onRestart={onRestart}
                onBack={onBack}
            />
            
            <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Review Your Answers</h2>
                    {onBack && !onRestart && (
                        <button
                            onClick={onBack}
                            className="inline-flex items-center space-x-2 bg-slate-200 dark:bg-gray-700 text-slate-800 dark:text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            <ChevronLeftIcon className="w-5 h-5" />
                            <span>Back to History</span>
                        </button>
                    )}
                </div>

                {onTestGenerated && (
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="font-semibold text-slate-900 dark:text-white">Filter:</span>
                                {(['all', 'incorrect', 'unattempted'] as Filter[]).map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setActiveFilter(filter)}
                                        className={`px-3 py-1 text-sm font-semibold rounded-full capitalize transition-colors ${
                                            activeFilter === filter
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-300 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowAdaptiveModal(true)}
                                className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-500 transition-colors"
                            >
                                Build an Adaptive Test
                            </button>
                        </div>
                    </div>
                )}


                {filteredQuestions.length === 0 && (
                    <div className="text-center text-slate-500 dark:text-gray-400 py-8">
                        <p>No questions match the current filter.</p>
                    </div>
                )}

                {filteredQuestions.map((q) => {
                    const questionId = q.id;
                    const userAnswer = userAnswers[questionId];
                    const isCorrect = userAnswer === q.correctAnswer;
                    const isAttempted = userAnswer !== undefined;
                    const isExplanationReady = !!explanations[questionId];
                    const isLoadingExplanation = loadingStates[questionId] || (!isExplanationReady && visibleExplanations[questionId]);
                    const questionHighlights = highlights[questionId] || [];
                    
                    let status: 'correct' | 'incorrect' | 'unattempted' = 'unattempted';
                    if (isAttempted) {
                        status = isCorrect ? 'correct' : 'incorrect';
                    }

                    const shouldShowCorrectAnswer = isCorrect || !!visibleAnswers[questionId];

                    return (
                        <div key={q.id} className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 p-6 md:p-8">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Question {q.id}</h3>
                                {status === 'correct' && <span className="flex items-center space-x-2 text-sm font-medium bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-3 py-1 rounded-full"><CheckCircleIcon className="w-5 h-5" /><span>Correct</span></span>}
                                {status === 'incorrect' && <span className="flex items-center space-x-2 text-sm font-medium bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-3 py-1 rounded-full"><XCircleIcon className="w-5 h-5" /><span>Incorrect</span></span>}
                                {status === 'unattempted' && <span className="flex items-center space-x-2 text-sm font-medium bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded-full"><MinusCircleIcon className="w-5 h-5" /><span>Unattempted</span></span>}
                            </div>
                             <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">Topic: {q.topic}</p>
                            
                            <QuestionTextRenderer 
                                text={q.questionText} 
                                highlights={questionHighlights}
                                isHighlightMode={true}
                                onHighlightClick={() => {}}
                            />
                            
                            <div className="space-y-3 mb-6">
                                {q.options.map(opt => {
                                    const isUserChoice = userAnswer === opt.letter;
                                    const isTheCorrectAnswer = q.correctAnswer === opt.letter;
                                    const questionStrikethroughs = strikethroughs[q.id] || [];
                                    const isStruckOut = questionStrikethroughs.includes(opt.letter);

                                    let optionClasses = 'block p-4 rounded-lg border-2 transition-colors ';

                                    if (isUserChoice) {
                                        if (isCorrect) {
                                            optionClasses += 'bg-green-50 dark:bg-green-600/10 border-green-500 ring-2 ring-green-500';
                                        } else {
                                            optionClasses += 'bg-red-50 dark:bg-red-600/10 border-red-500';
                                        }
                                    } else if (isTheCorrectAnswer && shouldShowCorrectAnswer) {
                                        optionClasses += 'bg-green-50 dark:bg-green-600/10 border-green-500';
                                    } else {
                                        optionClasses += 'bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700';
                                    }
                                    
                                    return (
                                        <div key={opt.letter} className={optionClasses}>
                                            <span className={`font-bold mr-3 text-purple-600 dark:text-purple-400 ${isStruckOut ? 'line-through text-gray-500' : ''}`}>{opt.letter}.</span>
                                            <span className={`text-slate-800 dark:text-gray-200 ${isStruckOut ? 'line-through text-gray-500' : ''}`}>{opt.text}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex items-center space-x-3">
                                {(status === 'incorrect' || status === 'unattempted') && !visibleAnswers[questionId] && (
                                    <button
                                        onClick={() => handleShowAnswer(questionId)}
                                        className="inline-flex items-center justify-center bg-slate-200 dark:bg-gray-700 text-slate-800 dark:text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <span>Show Answer</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => toggleExplanation(questionId)}
                                    disabled={isLoadingExplanation}
                                    className="inline-flex items-center justify-center space-x-2 bg-slate-200 dark:bg-gray-700 text-slate-800 dark:text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-gray-600 transition-colors disabled:bg-slate-100 dark:disabled:bg-gray-700 disabled:cursor-wait"
                                >
                                    {isLoadingExplanation && <SpinnerIcon className="w-5 h-5" />}
                                    <span>{isLoadingExplanation ? 'Loading...' : (visibleExplanations[questionId] ? 'Hide Explanation' : 'Show Explanation')}</span>
                                </button>
                            </div>
                            
                            {visibleExplanations[questionId] && (
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-gray-700">
                                    {errorStates[questionId] && (
                                        <div className="p-3 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg flex items-center space-x-2">
                                            <ErrorIcon className="w-5 h-5" />
                                            <span>{errorStates[questionId]}</span>
                                        </div>
                                    )}
                                    {explanations[questionId] && !isLoadingExplanation && (
                                        <>
                                            {hasAccessToTTS && (
                                                <div className="flex items-center justify-end -mb-2">
                                                    <button
                                                        onClick={() => handleSpeak(questionId)}
                                                        disabled={speakingState[questionId] === 'speaking'}
                                                        className="p-2 rounded-full text-slate-500 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700 hover:text-slate-800 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-wait"
                                                        title="Read explanation aloud"
                                                    >
                                                        {speakingState[questionId] === 'speaking' ? <SpinnerIcon className="w-5 h-5" /> : <SpeakerIcon className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            )}
                                            {speakingState[questionId] === 'error' && <p className="text-xs text-red-500 dark:text-red-400 text-right mb-2">Could not play audio.</p>}
                                            <MarkdownRenderer content={explanations[questionId]} />
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AssignmentReview;