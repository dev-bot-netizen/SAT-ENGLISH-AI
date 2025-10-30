import React from 'react';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';

interface LockdownWarningModalProps {
    isOpen: boolean;
    onReturn: () => void;
}

const LockdownWarningModal: React.FC<LockdownWarningModalProps> = ({ isOpen, onReturn }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            aria-modal="true"
            role="dialog"
            aria-labelledby="lockdown-warning-title"
        >
            <div className="max-w-lg w-full bg-white dark:bg-black border border-yellow-500/50 rounded-xl p-8 text-center shadow-2xl">
                <AlertTriangleIcon className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                <h2 id="lockdown-warning-title" className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Warning: Test Paused</h2>
                <p className="text-slate-600 dark:text-gray-400 mb-6">
                    You have left the test window or exited fullscreen mode. This is your first and only warning.
                    If you leave the test again, your assignment will be automatically submitted.
                </p>
                <button
                    onClick={onReturn}
                    className="w-full bg-yellow-500 text-slate-900 font-bold py-3 px-4 rounded-lg hover:bg-yellow-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black"
                >
                    Return to Test
                </button>
            </div>
        </div>
    );
};

export default LockdownWarningModal;