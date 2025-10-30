import React, { useState, useEffect } from 'react';
import { ErrorIcon } from './icons/ErrorIcon';
import MarkdownRenderer from './MarkdownRenderer';
import { ProgressiveAcademicCapIcon } from './icons/ProgressiveAcademicCapIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { getSpeechAudio } from '@/services/ttsService';
import { SpinnerIcon } from './icons/SpinnerIcon';
import type { UserProfile } from '@/types';

interface ResponseDisplayProps {
  solution: string | null;
  isLoading: boolean;
  error: string | null;
  userProfile: UserProfile | null;
}

const loadingMessages = [
    "Reading the passage...",
    "Analyzing the question...",
    "Evaluating the options...",
    "Cross-referencing grammatical rules...",
    "Consulting with the digital SAT experts...",
    "Finalizing the explanation..."
];


const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ solution, isLoading, error, userProfile }) => {
  const hasSolution = !!solution;
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    if (isLoading) {
        setLoadingMessage(loadingMessages[0]);
        const delays = [5000, 7000, 10000, 15000];
        let messageIndex = 0;

        const scheduleNext = () => {
            const delay = delays[Math.min(messageIndex, delays.length - 1)];
            timeoutId = setTimeout(() => {
                messageIndex++;
                setLoadingMessage(loadingMessages[messageIndex % loadingMessages.length]);
                scheduleNext();
            }, delay);
        };
        
        scheduleNext();
    }

    return () => {
        clearTimeout(timeoutId);
    };
  }, [isLoading]);
  
  const handleSpeak = async () => {
    if (isSpeaking || !solution) return;
    setIsSpeaking(true);
    setTtsError(null);
    try {
      // Strip markdown for cleaner speech
      const textToSpeak = solution.replace(/(\*\*|__|\*|_|`|#+\s*)/g, '');
      const audioBase64 = await getSpeechAudio(textToSpeak);
      const audioSrc = `data:audio/mp3;base64,${audioBase64}`;
      const audio = new Audio(audioSrc);
      audio.play();
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => {
        setTtsError('Could not play audio.');
        setIsSpeaking(false);
      }
    } catch (e) {
      setTtsError(e instanceof Error ? e.message : 'Failed to get audio.');
      setIsSpeaking(false);
    }
  }

  const containerClasses = [
    'w-full',
    'min-h-[20rem]',
    'bg-black/20',
    'rounded-lg',
    'border',
    'border-brand-lavender/20',
    'p-4 md:p-6',
    'text-white/80',
    'text-sm md:text-base',
    'transition-all duration-300',
    hasSolution ? '' : 'flex items-center justify-center'
  ].join(' ');
  
  const hasAccessToTTS = userProfile?.tier === 'premium' || userProfile?.tier === 'developer';

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center">
          <ProgressiveAcademicCapIcon className="w-16 h-16 mb-4 text-brand-lavender mx-auto" />
          <p className="font-semibold text-white">{loadingMessage}</p>
          <p className="text-sm text-white/60">The AI is working its magic.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-400">
          <ErrorIcon className="w-10 h-10 mb-4 mx-auto" />
          <p className="font-semibold">An Error Occurred</p>
          <p className="text-sm text-red-500">{error}</p>
        </div>
      );
    }
    
    if (solution) {
      return (
        <div className="overflow-y-auto">
            {hasAccessToTTS && (
                 <div id="walkthrough-tts-button" className="flex items-center justify-end mb-2 -mt-2">
                    <button
                        onClick={handleSpeak}
                        disabled={isSpeaking}
                        className="p-2 rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-wait"
                        title="Read explanation aloud"
                    >
                        {isSpeaking ? <SpinnerIcon className="w-5 h-5" /> : <SpeakerIcon className="w-5 h-5" />}
                    </button>
                 </div>
            )}
            {ttsError && <p className="text-xs text-red-400 text-right mb-2">{ttsError}</p>}
            <MarkdownRenderer content={solution} />
        </div>
      );
    }

    return (
      <div className="text-center">
        <p className="text-white/60">Your solution will appear here.</p>
      </div>
    );
  };
  
  return (
    <div className={containerClasses}>
      {renderContent()}
    </div>
  );
};

export default ResponseDisplay;