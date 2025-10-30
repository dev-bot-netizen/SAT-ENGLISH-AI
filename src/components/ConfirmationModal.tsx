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
                className="max-w-md w-full bg-gray-900 border border-gray-700 rounded-xl p-8 text-center shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <AlertTriangleIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h2 id="confirmation-title" className="text-2xl font-bold text-white mb-2">{title}</h2>
                <p className="text-gray-400 mb-6">
                    {message}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={onClose}
                        className="w-full bg-gray-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;