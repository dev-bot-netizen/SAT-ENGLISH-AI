import React, { useState, useMemo } from 'react';
import type { Question, UserProfile } from '@/types';
import { generateAdaptiveTest } from '@/services/geminiService';
import QuestionMiniPreview from './QuestionMiniPreview';
import { XIcon } from '@/components/icons/XIcon';
import { ErrorIcon } from '@/components/icons/ErrorIcon';
import TestCounter from './TestCounter';
import GeneratingTestView from './GeneratingTestView';

type Filter = 'all' | 'incorrect' | 'unattempted';

interface AdaptiveTestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTestGenerated: (questions: Question[]) => void;
    allQuestions: Question[];
    userAnswers: Record<number, string>;
    initialFilter: Filter;
    userProfile: UserProfile | null;
}

const AdaptiveTestModal: React.FC<AdaptiveTestModalProps> = ({ 
    isOpen, 
    onClose, 
    onTestGenerated, 
    allQuestions, 
    userAnswers, 
    initialFilter, 
    userProfile 
}) => {
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<number>>(() => {
        const initialSelection = new Set<number>();
        allQuestions.forEach(q => {
            const userAnswer = userAnswers[q.id];
            const isCorrect = userAnswer === q.correctAnswer;
            const isAttempted = userAnswer !== undefined;
            if (initialFilter === 'incorrect' && isAttempted && !isCorrect) {
                initialSelection.add(q.id);
            } else if (initialFilter === 'unattempted' && !isAttempted) {
                initialSelection.add(q.id);
            }
        });
        return initialSelection;
    });

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const toggleQuestionSelection = (questionId: number) => {
        setSelectedQuestionIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(questionId)) {
                newSet.delete(questionId);
            } else if (newSet.size < 20) {
                newSet.add(questionId);
            }
            return newSet;
        });
    };

    const selectedQuestions = useMemo(() => {
        return allQuestions.filter(q => selectedQuestionIds.has(q.id));
    }, [allQuestions, selectedQuestionIds]);
    
    const hasReachedLimit = userProfile && userProfile.dailyTestLimit < 100 && userProfile.testsTakenToday >= userProfile.dailyTestLimit;
    const canGenerate = selectedQuestions.length > 0 && selectedQuestions.length <= 20 && !hasReachedLimit && !isLoading;

    const handleGenerate = async () => {
        if (!canGenerate) return;
        
        setIsLoading(true);
        setError(null);
        try {
            const newQuestions = await generateAdaptiveTest(selectedQuestions);
            onTestGenerated(newQuestions);
            onClose();
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to generate adaptive test: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-brand-indigo/90 backdrop-blur-md z-50 flex flex-col p-4 sm:p-6 lg:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="adaptive-test-title"
        >
            <div className="bg-black/20 rounded-xl border border-brand-lavender/20 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-brand-lavender/20">
                    <div className="space-y-1">
                        <h2 id="adaptive-test-title" className="text-xl font-bold text-white">Build an Adaptive Test</h2>
                        <p className="text-sm text-white/70">Select 1-20 questions to generate a new 20-question test targeting your weak areas.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors" aria-label="Close">
                        <XIcon className="w-6 h-6 text-white/70" />
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-grow overflow-y-auto p-6">
                    {isLoading ? (
                        <GeneratingTestView title="Generating Your Adaptive Test..." />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {allQuestions.map(q => (
                                <QuestionMiniPreview
                                    key={q.id}
                                    question={q}
                                    isSelected={selectedQuestionIds.has(q.id)}
                                    onSelect={() => toggleQuestionSelection(q.id)}
                                    isSelectable={selectedQuestionIds.size < 20 || selectedQuestionIds.has(q.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!isLoading && (
                    <div className="flex-shrink-0 p-4 border-t border-brand-lavender/20 bg-brand-indigo/80 backdrop-blur-sm">
                        {userProfile && (
                            <div className="mb-4">
                                <TestCounter testsTakenToday={userProfile.testsTakenToday} dailyTestLimit={userProfile.dailyTestLimit} />
                            </div>
                        )}
                        {error && (
                            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg flex items-center justify-center space-x-2 text-sm">
                                <ErrorIcon className="w-5 h-5" />
                                <span>{error}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <div className="text-left">
                                <p className="font-semibold text-white">Selected {selectedQuestionIds.size}/20 questions</p>
                                <p className="text-xs text-yellow-400">This will use one of your daily test allowances.</p>
                            </div>
                            <button 
                                onClick={handleGenerate} 
                                disabled={!canGenerate}
                                className="bg-brand-violet text-white font-bold py-3 px-6 rounded-lg hover:bg-brand-lavender hover:text-brand-indigo disabled:bg-brand-lavender/20 disabled:text-white/50 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center space-x-2"
                            >
                                <span>Generate Test</span>
                            </button>
                        </div>
                        {hasReachedLimit && <p className="text-sm text-center text-yellow-400 mt-2">You have reached your daily limit for practice tests.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdaptiveTestModal;