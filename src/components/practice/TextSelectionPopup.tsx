import React from 'react';
import { BookOpenIcon } from '../icons/BookOpenIcon';

interface TextSelectionPopupProps {
    position: { top: number; left: number };
    onAdd: () => void;
}

const TextSelectionPopup: React.FC<TextSelectionPopupProps> = ({ position, onAdd }) => {
    if (!position.top) return null;

    return (
        <div
            className="absolute z-20 text-selection-popup"
            style={{ 
                top: position.top, 
                left: position.left,
                transform: 'translateX(-50%)', // Center the popup on the selection
            }}
            // Prevent mouseup on the popup from closing it
            onMouseUp={(e) => e.stopPropagation()}
        >
            <button
                onClick={onAdd}
                className="flex items-center space-x-2 bg-purple-600 text-white font-semibold text-sm py-2 px-3 rounded-lg shadow-lg hover:bg-purple-500 transition-colors"
                title="Add to your personal vocabulary list"
            >
                <BookOpenIcon className="w-4 h-4" />
                <span>Add to Vocabulary</span>
            </button>
        </div>
    );
};

export default TextSelectionPopup;
