
import React, { useState, useEffect } from 'react';
import { ProgressiveAcademicCapIcon } from '@/components/icons/ProgressiveAcademicCapIcon';

const loadingMessages = [
    "Analyzing your selections...",
    "Connecting with the AI test creator...",
    "Crafting unique questions based on your needs...",
    "Reviewing passages for SAT-level complexity...",
    "Generating plausible answer choices...",
    "Assembling your personalized practice test...",
    "Finalizing the test questions..."
];

interface GeneratingTestViewProps {
    title: string;
}

const GeneratingTestView: React.FC<GeneratingTestViewProps> = ({ title }) => {
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

    useEffect(() => {
        const delays = [5000, 7000, 10000, 15000];
        let messageIndex = 0;
        let timeoutId: ReturnType<typeof setTimeout>;

        const scheduleNext = () => {
            const delay = delays[Math.min(messageIndex, delays.length - 1)];

            timeoutId = setTimeout(() => {
                messageIndex++;
                setLoadingMessage(loadingMessages[messageIndex % loadingMessages.length]);
                scheduleNext();
            }, delay);
        };

        scheduleNext();

        return () => clearTimeout(timeoutId);
    }, []);

    return (
        <div className="text-center py-16">
            <ProgressiveAcademicCapIcon className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
            <p className="text-slate-600 dark:text-gray-300 mt-2 min-h-[1.5em]">{loadingMessage}</p>
        </div>
    );
};

export default GeneratingTestView;