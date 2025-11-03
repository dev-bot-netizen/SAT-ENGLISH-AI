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
                className="bg-brand-indigo rounded-xl border border-brand-lavender/20 w-full max-w-md text-center p-8 relative shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors" aria-label="Close">
                    <XIcon className="w-6 h-6" />
                </button>
                <LockIcon className="w-12 h-12 text-brand-lavender mx-auto mb-4" />
                <h2 id="auth-prompt-title" className="text-2xl font-bold text-white mb-2">Feature Locked</h2>
                <p className="text-white/70 mb-6">
                    Please sign in or create an account to use this feature and save your progress.
                </p>
                <button
                    onClick={onAuthRedirect}
                    className="w-full bg-brand-violet text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-lavender hover:text-brand-indigo transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-lavender focus:ring-offset-2 focus:ring-offset-brand-indigo"
                >
                    Sign In or Sign Up
                </button>
            </div>
        </div>
    );
};

export default AuthPromptModal;
