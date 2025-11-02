
import React from 'react';
import { SparklesIcon } from '../icons/SparklesIcon';

interface TestCounterProps {
  testsTakenToday: number;
  dailyTestLimit: number;
}

const TestBlock: React.FC<{ filled: boolean }> = ({ filled }) => (
    <div className={`w-6 h-6 rounded-md transition-colors duration-300 ${filled ? 'bg-purple-500' : 'bg-brand-lavender/20'}`} />
);

const TestCounter: React.FC<TestCounterProps> = ({ testsTakenToday, dailyTestLimit }) => {
  if (dailyTestLimit > 100) {
    return (
      <div
        className="max-w-md mx-auto bg-brand-lilac/5 border border-purple-500/30 rounded-lg p-3 flex items-center justify-between text-sm"
        role="status"
        aria-label="You have unlimited daily tests."
      >
        <span className="font-semibold text-white/80">Daily Practice Tests</span>
        <div className="flex items-center space-x-2 text-brand-lavender font-bold">
            <SparklesIcon className="w-4 h-4" /> 
            <span>Unlimited</span>
        </div>
      </div>
    );
  }

  const limit = Math.max(testsTakenToday, dailyTestLimit);
  const remaining = Math.max(0, dailyTestLimit - testsTakenToday);

  return (
    <div
      className="max-w-md mx-auto bg-brand-lilac/5 border border-brand-lavender/20 rounded-lg p-3 flex items-center justify-between text-sm"
      role="status"
      aria-label={`You have used ${testsTakenToday} of ${dailyTestLimit} daily practice tests. You have ${remaining} tests left.`}
    >
      <span className="font-semibold text-white/80">Daily Tests Used</span>
      <div className="flex items-center space-x-2" aria-hidden="true">
        {Array.from({ length: limit }).map((_, i) => (
          <TestBlock key={i} filled={i < testsTakenToday} />
        ))}
      </div>
    </div>
  );
};

export default TestCounter;
