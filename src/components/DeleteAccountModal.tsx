import React, { useState } from 'react';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { XIcon } from './icons/XIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { ErrorIcon } from './icons/ErrorIcon';

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirmDelete: () => Promise<void>;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose, onConfirmDelete }) => {
    const [confirmationText, setConfirmationText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const CONFIRM_WORD = 'DELETE';

    if (!isOpen) return null;

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);
        try {
            await onConfirmDelete();
            // The onClose will be called from the parent component upon success
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsDeleting(false);
        }
    };
    
    const isConfirmationMatch = confirmationText === CONFIRM_WORD;

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
        >
            <div
                className="bg-white dark:bg-gray-900 rounded-xl border border-red-500/30 dark:border-red-700/50 w-full max-w-md text-center p-8 relative shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 hover:text-slate-800 dark:hover:text-white transition-colors" aria-label="Close">
                    <XIcon className="w-6 h-6" />
                </button>
                <AlertTriangleIcon className="w-12 h-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
                <h2 id="delete-account-title" className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Delete Account</h2>
                <p className="text-slate-600 dark:text-gray-400 mb-4">
                    This action is permanent and cannot be undone. All your data, including assignment history and vocabulary lists, will be permanently erased.
                </p>
                <p className="text-slate-700 dark:text-gray-300 mb-4">To confirm, please type "<strong className="text-red-500 dark:text-red-400">{CONFIRM_WORD}</strong>" in the box below.</p>

                <input
                    type="text"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-center font-semibold tracking-widest placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder={CONFIRM_WORD}
                />
                
                {error && (
                    <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg flex items-center space-x-2 text-sm">
                        <ErrorIcon className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <button
                    onClick={handleDelete}
                    disabled={!isConfirmationMatch || isDeleting}
                    className="w-full mt-4 bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-500 disabled:bg-slate-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center space-x-2"
                >
                    {isDeleting ? <SpinnerIcon className="w-5 h-5" /> : null}
                    <span>{isDeleting ? 'Deleting...' : 'Delete My Account Permanently'}</span>
                </button>
            </div>
        </div>
    );
};

export default DeleteAccountModal;
