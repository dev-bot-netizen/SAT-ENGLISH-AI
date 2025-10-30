import React, { useState, useEffect } from 'react';
import { XIcon } from './icons/XIcon';
import { StarIcon } from './icons/StarIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { ErrorIcon } from './icons/ErrorIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';

interface FeedbackData {
    rating: number;
    aiRating: number;
    mostValuableFeature?: string;
    aiIssues?: string;
    comments?: string;
}

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (feedback: FeedbackData) => Promise<void>;
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

const VALUABLE_FEATURES = ["AI Question Solver", "AI Practice Test Generation", "AI Vocabulary Details", "Other"];

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [aiRating, setAiRating] = useState(0);
    const [hoverAiRating, setHoverAiRating] = useState(0);
    const [mostValuableFeature, setMostValuableFeature] = useState('');
    const [aiIssues, setAiIssues] = useState('');
    const [comments, setComments] = useState('');
    const [submitState, setSubmitState] = useState<SubmitState>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setRating(0);
                setHoverRating(0);
                setAiRating(0);
                setHoverAiRating(0);
                setMostValuableFeature('');
                setAiIssues('');
                setComments('');
                setSubmitState('idle');
                setErrorMessage('');
            }, 300);
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (rating === 0 || aiRating === 0) {
            setErrorMessage('Please provide a rating for both your overall experience and the AI explanations.');
            setSubmitState('error');
            return;
        }
        setSubmitState('submitting');
        setErrorMessage('');
        try {
            await onSubmit({ rating, aiRating, mostValuableFeature, aiIssues, comments });
            setSubmitState('success');
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (e) {
            setErrorMessage(e instanceof Error ? e.message : 'An unknown error occurred.');
            setSubmitState('error');
        }
    };

    if (!isOpen) return null;

    const renderContent = () => {
        switch (submitState) {
            case 'success':
                return (
                    <div className="flex flex-col items-center justify-center text-center p-8 animate-modal-enter">
                        <CheckCircleIcon className="w-16 h-16 text-green-400 mb-4" />
                        <h2 id="feedback-modal-title" className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Thank You!</h2>
                        <p className="text-slate-500 dark:text-gray-400">Your feedback has been submitted successfully.</p>
                    </div>
                );
            case 'submitting':
                return (
                    <div className="flex flex-col items-center justify-center text-center p-8">
                        <SpinnerIcon className="w-16 h-16 text-purple-400 mb-4" />
                        <h2 id="feedback-modal-title" className="text-2xl font-bold text-slate-900 dark:text-white">Submitting...</h2>
                    </div>
                );
            default:
                return (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <h2 id="feedback-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">Share Your Feedback</h2>
                            <button onClick={onClose} className="p-1 rounded-full text-slate-400 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700 hover:text-slate-900 dark:hover:text-white transition-colors" aria-label="Close">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <p className="text-slate-500 dark:text-gray-400 mb-6 text-sm">Your input helps us improve SAT Solver AI for everyone.</p>

                        <div className="space-y-6 text-left max-h-[70vh] overflow-y-auto pr-2">
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">1. How would you rate your overall experience?<span className="text-red-400">*</span></label>
                                <div className="flex space-x-1" onMouseLeave={() => setHoverRating(0)}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button key={star} onClick={() => setRating(star)} onMouseEnter={() => setHoverRating(star)} className="focus:outline-none" aria-label={`${star} star rating`}>
                                            <StarIcon className={`w-8 h-8 transition-colors ${(hoverRating || rating) >= star ? 'text-yellow-400' : 'text-slate-400 dark:text-gray-600'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">2. How would you rate the AI's explanations?<span className="text-red-400">*</span></label>
                                <div className="flex space-x-1" onMouseLeave={() => setHoverAiRating(0)}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button key={star} onClick={() => setAiRating(star)} onMouseEnter={() => setHoverAiRating(star)} className="focus:outline-none" aria-label={`AI explanation ${star} star rating`}>
                                            <StarIcon className={`w-8 h-8 transition-colors ${(hoverAiRating || aiRating) >= star ? 'text-yellow-400' : 'text-slate-400 dark:text-gray-600'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">3. Which AI feature has been most valuable? (Optional)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {VALUABLE_FEATURES.map(option => (
                                        <button key={option} onClick={() => setMostValuableFeature(option)} className={`p-2 text-sm rounded-md border-2 transition-colors ${mostValuableFeature === option ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-100 dark:bg-gray-800 border-slate-300 dark:border-gray-700 hover:border-purple-500'}`}>
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="ai-issues" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">4. Did the AI seem incorrect or confusing? (Optional)</label>
                                <textarea id="ai-issues" value={aiIssues} onChange={e => setAiIssues(e.target.value)} rows={3} className="w-full bg-slate-100 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-lg p-2 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="If so, could you briefly describe it?" />
                            </div>
                            <div>
                                <label htmlFor="comments" className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">5. Any other comments or suggestions? (Optional)</label>
                                <textarea id="comments" value={comments} onChange={e => setComments(e.target.value)} rows={3} className="w-full bg-slate-100 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-lg p-2 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Tell us what you think..." />
                            </div>
                        </div>

                        {submitState === 'error' && errorMessage && (
                            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg flex items-center space-x-2 text-sm">
                                <ErrorIcon className="w-5 h-5 flex-shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}
                        
                        <div className="mt-6">
                            <button onClick={handleSubmit} className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-500 transition-colors">
                                Submit Feedback
                            </button>
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-modal-enter" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="feedback-modal-title">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 w-full max-w-lg shadow-2xl relative p-6" onClick={e => e.stopPropagation()}>
                {renderContent()}
            </div>
        </div>
    );
};

export default FeedbackModal;
