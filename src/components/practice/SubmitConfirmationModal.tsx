import React from 'react';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';

interface SubmitConfirmationModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    unansweredCount: number;
}

const SubmitConfirmationModal: React.FC<SubmitConfirmationModalProps> = ({ isOpen, onConfirm, onCancel, unansweredCount }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            aria-modal="true"
            role="dialog"
            aria-labelledby="submit-confirm-title"
        >
            <div className="max-w-md w-full bg-brand-indigo border border-brand-lavender/20 rounded-xl p-8 text-center shadow-2xl">
                <AlertTriangleIcon className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h2 id="submit-confirm-title" className="text-2xl font-bold text-white mb-2">Are you sure?</h2>
                <p className="text-white/70 mb-6">
                    You have {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}. Your score will be calculated based on your completed answers.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={onCancel}
                        className="w-full bg-white/10 text-white font-bold py-3 px-4 rounded-lg hover:bg-white/20 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-lavender focus:ring-offset-2 focus:ring-offset-brand-indigo"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={onConfirm}
                        className="w-full bg-brand-gold text-brand-indigo font-bold py-3 px-4 rounded-lg hover:bg-yellow-300 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-brand-indigo"
                    >
                        Submit Anyway
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubmitConfirmationModal;