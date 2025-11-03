import React from 'react';
import { AlertTriangleIcon } from '@/components/icons/AlertTriangleIcon';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel' 
}) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            aria-modal="true"
            role="dialog"
            aria-labelledby="confirmation-title"
            onClick={onClose}
        >
            <div 
                className="max-w-md w-full bg-brand-indigo border border-brand-lavender/20 rounded-xl p-8 text-center shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <AlertTriangleIcon className="w-12 h-12 text-brand-lavender mx-auto mb-4" />
                <h2 id="confirmation-title" className="text-2xl font-bold text-white mb-2">{title}</h2>
                <p className="text-white/70 mb-6">
                    {message}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={onClose}
                        className="w-full bg-white/10 text-white font-bold py-3 px-4 rounded-lg hover:bg-white/20 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-lavender focus:ring-offset-2 focus:ring-offset-brand-indigo"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="w-full bg-brand-violet text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-lavender hover:text-brand-indigo transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-lavender focus:ring-offset-2 focus:ring-offset-brand-indigo"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
