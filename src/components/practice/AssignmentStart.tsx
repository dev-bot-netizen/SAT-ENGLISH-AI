


import React, { useState, useRef } from 'react';
import { SpinnerIcon } from '@/components/icons/SpinnerIcon';
import { ErrorIcon } from '@/components/icons/ErrorIcon';
import { CheckCircleIcon } from '@/components/icons/CheckCircleIcon';
import TestCounter from './TestCounter';

interface AssignmentStartProps {
    onStart: (timeInMinutes: number, topics: string[], difficulty: number, lockdownEnabled: boolean, customizations: string) => void;
    isGenerating: boolean;
    error: string | null;
    testsTakenToday?: number;
    dailyTestLimit?: number;
    topicsId?: string;
    difficultyId?: string;
    startButtonId?: string;
}

const SAT_TOPICS = [
    'Cross-text connections',
    'Text structure and purpose',
    'Words in context',
    'Rhetorical synthesis',
    'Transitions',
    'Central ideas and details',
    'Inference',
    'Boundaries',
    'Form, Structure, and Sense'
];

const DIFFICULTIES = [
    { label: 'Easy', value: 1 },
    { label: 'Moderate', value: 2 },
    { label: 'Hard', value: 3 },
];

const TIME_OPTIONS = [
    { id: 'standard', label: 'Standard Time', minutes: 23 },
    { id: 'extended', label: '1.5x Time', minutes: 34 }
]

const OptionCard: React.FC<{
    onClick: () => void;
    isSelected: boolean;
    isDisabled?: boolean;
    children: React.ReactNode;
    className?: string;
}> = ({ onClick, isSelected, isDisabled = false, children, className = '' }) => (
    <button
        onClick={onClick}
        disabled={isDisabled}
        className={`relative w-full text-left p-3 rounded-lg border-2 text-sm transition-all duration-200 
          ${isDisabled 
            ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-gray-800 border-slate-200 dark:border-gray-700' 
            : 'bg-slate-100 dark:bg-gray-800 border-slate-200 dark:border-gray-700 hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-black focus:ring-offset-white'}
          ${isSelected ? 'border-purple-500 ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-600/20' : ''}
          ${className}
        `}
    >
        <div className={`font-semibold ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-gray-300'}`}>
            {children}
        </div>
        {isSelected && (
          <div className="absolute top-2 right-2 text-purple-500 dark:text-purple-400">
            <CheckCircleIcon className="w-5 h-5" />
          </div>
        )}
    </button>
);


const AssignmentStart: React.FC<AssignmentStartProps> = ({ onStart, isGenerating, error, testsTakenToday, dailyTestLimit, topicsId, difficultyId, startButtonId }) => {
    const [timeOption, setTimeOption] = useState<'standard' | 'extended' | 'custom'>('standard');
    const [customTime, setCustomTime] = useState<string>('');
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
    const [topicError, setTopicError] = useState<string|null>(null);
    const [lockdownEnabled, setLockdownEnabled] = useState<boolean>(false);
    const [customizations, setCustomizations] = useState('');
    const customTimeInputRef = useRef<HTMLInputElement>(null);

    const handleTopicClick = (topic: string) => {
        setTopicError(null);

        if (topic === 'All Topics') {
            setSelectedTopics(current => 
                current.includes('All Topics') ? [] : ['All Topics']
            );
        } else {
            setSelectedTopics(current => {
                const selection = current.includes('All Topics') ? [] : [...current];
                
                if (selection.includes(topic)) {
                    return selection.filter(t => t !== topic);
                } else {
                    if (selection.length < 3) {
                        return [...selection, topic];
                    } else {
                        setTopicError("You can select up to 3 topics.");
                        return current;
                    }
                }
            });
        }
    };

    const handleStartClick = () => {
        if (selectedTopics.length === 0 || selectedDifficulty === null) return;
        
        let timeInMinutes: number;
        if (timeOption === 'standard') {
            timeInMinutes = 23;
        } else if (timeOption === 'extended') {
            timeInMinutes = 34;
        } else {
            const parsedTime = parseFloat(customTime);
            if (isNaN(parsedTime) || parsedTime <= 0) {
                return; 
            }
            timeInMinutes = parsedTime;
        }
        
        onStart(timeInMinutes, selectedTopics, selectedDifficulty, lockdownEnabled, customizations);
    };
    
    const isCustomTimeValid = timeOption !== 'custom' || (!isNaN(parseFloat(customTime)) && parseFloat(customTime) > 0);
    const canStart = !isGenerating && selectedTopics.length > 0 && selectedDifficulty !== null && isCustomTimeValid;
    const isAllTopicsSelected = selectedTopics.includes('All Topics');

    return (
        <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                SAT English Practice Test
            </h2>
            <p className="text-slate-600 dark:text-gray-400 mb-8">
                Customize your 20-question test by topic and difficulty.
            </p>

            {testsTakenToday !== undefined && dailyTestLimit !== undefined && (
                <TestCounter
                    testsTakenToday={testsTakenToday}
                    dailyTestLimit={dailyTestLimit}
                />
            )}
            
            <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 p-6 md:p-8 backdrop-blur-sm space-y-8 mt-8">
                
                <fieldset id={topicsId}>
                    <legend className="text-lg font-semibold text-slate-900 dark:text-white text-left mb-1">1. Select Topics</legend>
                    <p className="text-sm text-slate-600 dark:text-gray-400 text-left mb-4">Choose 'All Topics' or select up to 3 specific topics.</p>
                    <div className="space-y-3">
                         <OptionCard
                            onClick={() => handleTopicClick('All Topics')}
                            isSelected={isAllTopicsSelected}
                        >
                            All Topics
                        </OptionCard>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                            {SAT_TOPICS.map(topic => (
                                <OptionCard
                                    key={topic}
                                    onClick={() => handleTopicClick(topic)}
                                    isSelected={selectedTopics.includes(topic)}
                                    isDisabled={isAllTopicsSelected}
                                >
                                    {topic}
                                </OptionCard>
                            ))}
                        </div>
                    </div>
                    {topicError && <p className="text-red-500 dark:text-red-400 text-sm mt-2 text-left">{topicError}</p>}
                </fieldset>
                
                <fieldset id={difficultyId}>
                    <legend className="text-lg font-semibold text-slate-900 dark:text-white text-left mb-3">2. Choose Difficulty</legend>
                     <div className="grid grid-cols-3 gap-3">
                        {DIFFICULTIES.map(({label, value}) => (
                             <OptionCard
                                key={value}
                                onClick={() => setSelectedDifficulty(value)}
                                isSelected={selectedDifficulty === value}
                            >
                                {label}
                            </OptionCard>
                        ))}
                    </div>
                </fieldset>

                <fieldset>
                    <legend className="text-lg font-semibold text-slate-900 dark:text-white text-left mb-3">3. Set Time Limit</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup">
                        {TIME_OPTIONS.map(({id, label, minutes}) => (
                            <label key={id} className="cursor-pointer">
                                 <input 
                                    type="radio" 
                                    name="timeOption" 
                                    value={id} 
                                    checked={timeOption === id} 
                                    onChange={() => setTimeOption(id as 'standard' | 'extended')} 
                                    className="sr-only"
                                />
                                <div className={`relative w-full text-left p-3 rounded-lg border-2 text-sm transition-all duration-200 
                                    ${'bg-slate-100 dark:bg-gray-800 border-slate-200 dark:border-gray-700 hover:border-purple-500'}
                                    ${timeOption === id ? 'border-purple-500 ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-600/20' : ''}
                                `}>
                                    <p className={`font-semibold ${timeOption === id ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-gray-300'}`}>{label}</p>
                                    <p className="text-sm text-slate-500 dark:text-gray-400">{minutes} Minutes</p>
                                    {timeOption === id && (
                                        <div className="absolute top-2 right-2 text-purple-500 dark:text-purple-400">
                                            <CheckCircleIcon className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>
                            </label>
                        ))}
                         <label className="cursor-pointer" onClick={() => customTimeInputRef.current?.focus()}>
                            <input
                                type="radio"
                                name="timeOption"
                                value="custom"
                                checked={timeOption === 'custom'}
                                onChange={() => setTimeOption('custom')}
                                className="sr-only"
                            />
                            <div className={`relative w-full text-left p-3 rounded-lg border-2 text-sm transition-all duration-200 
                                ${'bg-slate-100 dark:bg-gray-800 border-slate-200 dark:border-gray-700 hover:border-purple-500'}
                                ${timeOption === 'custom' ? 'border-purple-500 ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-600/20' : ''}
                            `}>
                                <p className={`font-semibold ${timeOption === 'custom' ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-gray-300'}`}>Custom</p>
                                <div className="flex items-baseline space-x-2 text-sm text-slate-500 dark:text-gray-400">
                                    <input
                                        ref={customTimeInputRef}
                                        type="number"
                                        id="custom-time-input"
                                        value={customTime}
                                        onFocus={() => setTimeOption('custom')}
                                        onChange={(e) => {
                                            setTimeOption('custom');
                                            setCustomTime(e.target.value);
                                        }}
                                        min="1"
                                        step="0.5"
                                        className="bg-transparent font-sans text-slate-900 dark:text-white text-sm w-full focus:outline-none placeholder-slate-500 p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="e.g., 20.5"
                                        aria-label="Custom time in minutes"
                                    />
                                    <span className="text-sm text-slate-500 dark:text-gray-400">Minutes</span>
                                </div>
                                {timeOption === 'custom' && (
                                    <div className="absolute top-2 right-2 text-purple-500 dark:text-purple-400">
                                        <CheckCircleIcon className="w-5 h-5" />
                                    </div>
                                )}
                            </div>
                        </label>
                    </div>
                </fieldset>

                <fieldset>
                    <legend className="text-lg font-semibold text-slate-900 dark:text-white text-left mb-3">4. Test Security</legend>
                    <label className="flex items-center justify-between p-3 rounded-lg border-2 bg-slate-100 dark:bg-gray-800 border-slate-200 dark:border-gray-700">
                        <div>
                            <p className="font-semibold text-slate-900 dark:text-white">Enable Lockdown Mode</p>
                            <p className="text-sm text-slate-600 dark:text-gray-400">Prevents leaving the tab. A second attempt will auto-submit the test.</p>
                        </div>
                        <button
                            onClick={() => setLockdownEnabled(prev => !prev)}
                            role="switch"
                            aria-checked={lockdownEnabled}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-offset-white focus:ring-purple-500 ${lockdownEnabled ? 'bg-purple-600' : 'bg-slate-300 dark:bg-gray-600'}`}
                        >
                            <span
                                className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ${lockdownEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </button>
                    </label>
                </fieldset>

                <fieldset>
                    <legend className="text-lg font-semibold text-slate-900 dark:text-white text-left mb-2">5. Customizations (Optional)</legend>
                     <p className="text-sm text-slate-600 dark:text-gray-400 text-left mb-4">
                        Provide a prompt to further tailor your test questions.
                    </p>
                    <textarea
                        id="customizations"
                        value={customizations}
                        onChange={(e) => setCustomizations(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-gray-800 border border-slate-300 dark:border-gray-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder='e.g., "Generate questions about marine biology" or "Focus on punctuation rules for dialogue."'
                        rows={3}
                        aria-label="Custom instructions for test generation"
                    />
                </fieldset>

                {error && (
                    <div className="my-4 p-3 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg flex items-center justify-center space-x-2">
                        <ErrorIcon className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                )}
                
                <button
                    id={startButtonId}
                    onClick={handleStartClick}
                    disabled={!canStart}
                    className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-500 disabled:bg-slate-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black flex items-center justify-center space-x-2"
                >
                    {isGenerating ? (
                        <>
                            <SpinnerIcon className="w-5 h-5"/>
                            <span>Generating Your Test...</span>
                        </>
                    ) : (
                        <span>Start Assignment</span>
                    )}
                </button>
                 {!canStart && !isGenerating && (
                    <p className="text-sm text-slate-500 dark:text-gray-400 mt-2">
                        {timeOption === 'custom' && !isCustomTimeValid 
                            ? 'Please enter a valid custom time (e.g., 20.5).'
                            : 'Please select topics and a difficulty level to begin.'
                        }
                    </p>
                )}
            </div>
        </div>
    );
};

export default AssignmentStart;
