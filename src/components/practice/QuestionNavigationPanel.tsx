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
                className="bg-brand-indigo rounded-xl border border-brand-lavender/20 w-full max-w-2xl max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 border-b border-brand-lavender/20">
                    <h2 id="review-panel-title" className="text-lg font-bold text-white">Review Questions</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition-colors">
                        <XIcon className="w-6 h-6 text-white/70" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
                        {questions.map((q, index) => {
                            const isAnswered = userAnswers[q.id] !== undefined;
                            const isCurrent = index === currentIndex;
                            
                            let buttonClass = 'w-12 h-12 flex items-center justify-center rounded-lg border-2 font-bold transition-colors ';
                            if (isCurrent) {
                                buttonClass += 'bg-brand-violet border-brand-lavender text-white ring-2 ring-offset-2 ring-offset-brand-indigo ring-brand-lavender';
                            } else if (isAnswered) {
                                buttonClass += 'bg-brand-lavender/20 border-brand-lavender/40 text-white hover:bg-brand-lavender/30';
                            } else {
                                buttonClass += 'bg-black/20 border-brand-lavender/30 text-white/60 hover:bg-white/10';
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
                 <div className="p-4 border-t border-brand-lavender/20 mt-auto">
                    <div className="flex items-center justify-center space-x-6 text-sm text-white/60">
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded-full border-2 border-brand-lavender/30 bg-black/20"></div>
                            <span>Unanswered</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded-full border-2 border-brand-lavender/40 bg-brand-lavender/20"></div>
                            <span>Answered</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 rounded-full border-2 border-brand-lavender bg-brand-violet"></div>
                            <span>Current</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestionNavigationPanel;