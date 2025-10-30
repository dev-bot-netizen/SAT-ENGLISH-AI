
import React from 'react';
import { StarIcon } from './icons/StarIcon';
import { CodeBracketIcon } from './icons/CodeBracketIcon';

interface TierBadgeProps {
  tier: 'premium' | 'developer';
}

const TierBadge: React.FC<TierBadgeProps> = ({ tier }) => {
  if (tier === 'premium') {
    return (
      <div className="relative group">
        {/* The badge itself */}
        <div className="relative overflow-hidden cursor-pointer flex items-center space-x-1.5 px-3 py-1 text-xs font-bold text-yellow-900 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full border border-yellow-300/50 shadow-sm">
            <StarIcon className="w-3.5 h-3.5" />
            <span>Free Premium</span>
            {/* Shimmer effect - Moved inside and animation corrected */}
            <div className="absolute inset-0 -translate-x-full transform -skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-40 animate-shimmer" />
        </div>
        
        {/* Tooltip */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 p-3 bg-brand-indigo border border-brand-lavender/20 rounded-lg shadow-xl z-30 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-300 text-left">
            <p className="text-sm font-semibold text-white mb-2">Free premium provided to all users till October 10th.</p>
            <ul className="list-disc list-inside text-xs text-white/80 space-y-1">
                <li>Unlimited AI question solves from images</li>
                <li>4 practice tests per day</li>
                <li>Full access to assignment history</li>
            </ul>
             <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-brand-lavender/20"></div>
        </div>
      </div>
    );
  }

  if (tier === 'developer') {
    return (
      <div 
        className="flex items-center space-x-1.5 px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-brand-violet to-brand-indigo rounded-full border border-brand-lavender/50 shadow-lg animate-glow"
        title="Developer mode: Unlimited test generation"
      >
        <CodeBracketIcon className="w-4 h-4" />
        <span>Developer</span>
      </div>
    );
  }

  return null;
};

export default TierBadge;