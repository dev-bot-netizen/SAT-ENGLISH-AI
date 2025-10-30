import React from 'react';
import { LockIcon } from './icons/LockIcon';
import { XIcon } from './icons/XIcon';

interface AuthPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAuthRedirect: () => void;
}

const AuthPromptModal: React.FC<AuthPromptModalProps> = ({ isOpen, onClose, onAuthRedirect }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-prompt-title"
        >
            <div
                className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 w-full max-w-md text-center p-8 relative shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 hover:text-slate-800 dark:hover:text-white transition-colors" aria-label="Close">
                    <XIcon className="w-6 h-6" />
                </button>
                <LockIcon className="w-12 h-12 text-purple-500 dark:text-purple-400 mx-auto mb-4" />
                <h2 id="auth-prompt-title" className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Feature Locked</h2>
                <p className="text-slate-600 dark:text-gray-400 mb-6">
                    Please sign in or create an account to use this feature and save your progress.
                </p>
                <button
                    onClick={onAuthRedirect}
                    className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                >
                    Sign In or Sign Up
                </button>
            </div>
        </div>
    );
};

export default AuthPromptModal;
