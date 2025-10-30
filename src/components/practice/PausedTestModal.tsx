import React from 'react';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';

interface PausedTestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onResume: () => void;
    onDiscardAndCreateNew: () => void;
    pausedAssignmentName: string;
}

const PausedTestModal: React.FC<PausedTestModalProps> = ({ isOpen, onClose, onResume, onDiscardAndCreateNew, pausedAssignmentName }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            aria-modal="true"
            role="dialog"
            aria-labelledby="paused-test-title"
            onClick={onClose}
        >
            <div 
                className="max-w-md w-full bg-gray-900 border border-gray-700 rounded-xl p-8 text-center shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <AlertTriangleIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <h2 id="paused-test-title" className="text-2xl font-bold text-white mb-2">Paused Test Found</h2>
                <p className="text-gray-400 mb-6">
                    You have a paused test: <span className="font-semibold text-white">{pausedAssignmentName}</span>.
                    Would you like to resume it, or discard it and create a new one?
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={onResume}
                        className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-500 transition-colors duration-300"
                    >
                        Resume Test
                    </button>
                    <button
                        onClick={onDiscardAndCreateNew}
                        className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-500 transition-colors duration-300"
                    >
                        Discard & Create New
                    </button>
                </div>
                 <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white font-semibold text-sm transition-colors mt-6"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default PausedTestModal;