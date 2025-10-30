import React from 'react';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { XIcon } from './icons/XIcon';

interface FeedbackBannerProps {
  onGiveFeedback: () => void;
  onRemind: () => void;
  onDismiss: () => void;
}

const FeedbackBanner: React.FC<FeedbackBannerProps> = ({ onGiveFeedback, onRemind, onDismiss }) => {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 sm:p-4 flex items-center justify-between shadow-lg text-sm sm:text-base">
      <div className="flex items-center space-x-3">
        <MegaphoneIcon className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
        <div>
          <p className="font-semibold">Enjoying the app?</p>
          <p className="hidden sm:block text-sm">Help us improve by sharing your feedback!</p>
        </div>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
        <button onClick={onGiveFeedback} className="bg-white text-purple-700 font-bold py-2 px-3 rounded-lg text-xs sm:text-sm hover:bg-gray-200 transition-colors">Give Feedback</button>
        <button onClick={onRemind} className="font-semibold text-xs sm:text-sm hover:underline hidden sm:block">Remind Me Later</button>
        <button onClick={onDismiss} className="font-semibold text-xs sm:text-sm hover:underline hidden sm:block">Don't Ask Again</button>
        <button onClick={onRemind} className="p-1 rounded-full hover:bg-white/20 transition-colors" aria-label="Remind me later"><XIcon className="w-5 h-5" /></button>
      </div>
    </div>
  );
};

export default FeedbackBanner;
