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
            <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl p-8 text-center shadow-2xl">
                <AlertTriangleIcon className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                <h2 id="submit-confirm-title" className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Are you sure?</h2>
                <p className="text-slate-600 dark:text-gray-400 mb-6">
                    You have {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}. Your score will be calculated based on your completed answers.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={onCancel}
                        className="w-full bg-slate-200 dark:bg-gray-600 text-slate-800 dark:text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-300 dark:hover:bg-gray-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                    >
                        Go Back
                    </button>
                    <button
                        onClick={onConfirm}
                        className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                    >
                        Submit Anyway
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubmitConfirmationModal;