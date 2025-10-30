import React from 'react';
import { Question } from '../../types';
import { XIcon } from '../icons/XIcon';

interface QuestionNavigationPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onJumpToQuestion: (index: number) => void;
    questions: Question[];
    userAnswers: Record<number, string>;
    currentIndex: number;
}

const QuestionNavigationPanel: React.FC<QuestionNavigationPanelProps> = ({ isOpen, onClose, onJumpToQuestion, questions, userAnswers, currentIndex }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-panel-title"
        >
            <div
                className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 w-full max-w-2xl max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-gray-800">
                    <h2 id="review-panel-title" className="text-lg font-bold text-slate-900 dark:text-white">Review Questions</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors">
                        <XIcon className="w-6 h-6 text-slate-500 dark:text-gray-400" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
                        {questions.map((q, index) => {
                            const isAnswered = userAnswers[q.id] !== undefined;
                            const isCurrent = index === currentIndex;
                            
                            let buttonClass = 'w-12 h-12 flex items-center justify-center rounded-lg border-2 font-bold transition-colors ';
                            if (isCurrent) {
                                buttonClass += 'bg-purple-600 border-purple-500 text-white ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 ring-purple-500';
                            } else if (isAnswered) {
                                buttonClass += 'bg-slate-200 dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-gray-600';
                            } else {
                                buttonClass += 'bg-transparent border-slate-300 dark:border-gray-700 text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800';
                            }

                            return (
                                <button
                                    key={q.id}
                                    onClick={() => onJumpToQuestion(index)}
                                    className={buttonClass}
                                    aria-label={`Go to question ${index + 1}${isAnswered ? ', answered' : ', unanswered'}`}
                                >
                                    {index + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>
                 <div className="p-4 border-t border-slate-200 dark:border-gray-800 mt-auto">
                    <div className="flex items-center justify-center space-x-6 text-sm text-slate-500 dark:text-gray-400">
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-gray-700 bg-transparent"></div>
                            <span>Unanswered</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-gray-600 bg-slate-200 dark:bg-gray-700"></div>
                            <span>Answered</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded-full border-2 border-purple-500 bg-purple-600"></div>
                            <span>Current</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestionNavigationPanel;