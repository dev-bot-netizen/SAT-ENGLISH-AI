import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { XIcon } from './icons/XIcon';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAuthRedirect: () => void;
    isGuest: boolean;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onAuthRedirect, isGuest }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-modal-enter" 
            onClick={onClose} 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="upgrade-modal-title"
        >
            <div 
                className="bg-brand-indigo rounded-xl border border-brand-lavender/20 w-full max-w-md text-center p-8 relative shadow-2xl" 
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 p-1 rounded-full text-white/60 hover:bg-white/10 transition-colors" 
                    aria-label="Close"
                >
                    <XIcon className="w-6 h-6" />
                </button>
                <SparklesIcon className="w-12 h-12 text-brand-lavender mx-auto mb-4" />
                <h2 id="upgrade-modal-title" className="text-2xl font-bold text-white mb-2">Upgrade to Premium</h2>
                <p className="text-white/70 mb-6">
                    Unlock all features, including the Spaced Repetition Vocabulary Trainer and AI-powered test generation from any text, with a Premium subscription.
                </p>
                
                <button 
                    onClick={isGuest ? onAuthRedirect : onClose}
                    className="w-full mt-4 bg-brand-violet text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-lavender hover:text-brand-indigo transition-colors"
                >
                    {isGuest ? 'Sign Up for Free Premium' : 'Sounds Good'}
                </button>

                <p className="text-xs text-white/50 mt-4">
                    {isGuest 
                        ? "All new accounts get a free premium trial!" 
                        : "For this demo, Premium is automatically granted to all signed-in users until October 10th."
                    }
                </p>
            </div>
        </div>
    );
};

export default UpgradeModal;