import React from 'react';
import { HighlighterIcon } from '../icons/HighlighterIcon';
import { StrikethroughIcon } from '../icons/StrikethroughIcon';

type HighlightColor = 'yellow' | 'pink' | 'cyan';

interface HighlightToolbarProps {
    isHighlightMode: boolean;
    setIsHighlightMode: (value: boolean) => void;
    activeColor: HighlightColor;
    setActiveColor: (color: HighlightColor) => void;
    isStrikethroughMode: boolean;
    setIsStrikethroughMode: (value: boolean) => void;
}

const COLORS: { name: HighlightColor, class: string }[] = [
    { name: 'yellow', class: 'bg-yellow-400' },
    { name: 'pink', class: 'bg-pink-400' },
    { name: 'cyan', class: 'bg-cyan-400' },
];

const HighlightToolbar: React.FC<HighlightToolbarProps> = ({ 
    isHighlightMode, 
    setIsHighlightMode, 
    activeColor, 
    setActiveColor,
    isStrikethroughMode,
    setIsStrikethroughMode
}) => {

    const handleHighlightToggle = () => {
        setIsHighlightMode(!isHighlightMode);
    };

    const handleStrikethroughToggle = () => {
        setIsStrikethroughMode(!isStrikethroughMode);
    };

    return (
        <div className="flex items-center space-x-2 bg-slate-100 dark:bg-gray-800 p-1 rounded-lg border border-slate-200 dark:border-gray-700">
            <button
                onClick={handleHighlightToggle}
                className={`p-2 rounded-md transition-colors ${isHighlightMode ? 'bg-purple-600 text-white' : 'text-slate-500 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700'}`}
                aria-pressed={isHighlightMode}
                title={isHighlightMode ? "Disable Highlighting" : "Enable Highlighting"}
            >
                <HighlighterIcon className="w-5 h-5" />
            </button>
            <button
                onClick={handleStrikethroughToggle}
                className={`p-2 rounded-md transition-colors ${isStrikethroughMode ? 'bg-purple-600 text-white' : 'text-slate-500 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-700'}`}
                aria-pressed={isStrikethroughMode}
                title={isStrikethroughMode ? "Disable Strikethrough" : "Enable Strikethrough"}
            >
                <StrikethroughIcon className="w-5 h-5" />
            </button>
            {isHighlightMode && (
                <div className="flex items-center space-x-2 border-l border-slate-300 dark:border-gray-700 pl-2">
                    {COLORS.map(color => (
                        <button
                            key={color.name}
                            onClick={() => setActiveColor(color.name)}
                            className={`w-6 h-6 rounded-full ${color.class} transition-all duration-150 ${activeColor === color.name ? 'ring-2 ring-offset-2 ring-offset-slate-100 dark:ring-offset-gray-800 ring-white' : 'hover:scale-110'}`}
                            aria-label={`Select ${color.name} highlight`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default HighlightToolbar;