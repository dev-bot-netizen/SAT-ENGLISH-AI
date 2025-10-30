import React from 'react';
import type { Question } from '@/types';
import { CheckCircleIcon } from '@/components/icons/CheckCircleIcon';

interface QuestionMiniPreviewProps {
    question: Question;
    isSelected: boolean;
    onSelect: () => void;
    isSelectable: boolean;
}

const QuestionMiniPreview: React.FC<QuestionMiniPreviewProps> = ({ question, isSelected, onSelect, isSelectable }) => {
    
    // Extract question text, removing markdown and passage header
    const questionTextOnly = question.questionText
        .replace(/\*\*Passage:\*\*/, '')
        .replace(/\*\*Question:\*\*/, '')
        .replace(/###.*?###/g, '') // remove headers
        .replace(/\*\*/g, '') // remove bold
        .replace(/<u>/g, '') // remove underline
        .replace(/<\/u>/g, '')
        .trim();
    
    const truncatedText = questionTextOnly.length > 100 
        ? `${questionTextOnly.substring(0, 100)}...` 
        : questionTextOnly;

    const cursorClass = isSelectable ? 'cursor-pointer' : 'cursor-not-allowed';

    return (
        <button
            onClick={onSelect}
            disabled={!isSelectable && !isSelected}
            className={`relative w-full h-full text-left p-4 rounded-lg border-2 transition-all duration-200 
                flex flex-col
                ${!isSelectable && !isSelected ? 'opacity-60' : ''}
                ${isSelected 
                    ? 'bg-purple-900/50 border-purple-500 ring-2 ring-purple-500' 
                    : `bg-gray-800 border-gray-700 hover:border-purple-600 ${cursorClass}`
                }
            `}
        >
            {isSelected && (
                <div className="absolute top-2 right-2 text-purple-400">
                    <CheckCircleIcon className="w-5 h-5" />
                </div>
            )}
            <div className="flex-shrink-0 mb-2">
                <p className="font-bold text-white">Question {question.id}</p>
                <p className="text-xs text-gray-400 bg-gray-700 inline-block px-2 py-0.5 rounded">{question.topic}</p>
            </div>
            <p className="flex-grow text-sm text-gray-300">
                {truncatedText}
            </p>
        </button>
    );
};

export default QuestionMiniPreview;