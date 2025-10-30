import React from 'react';
import { AcademicCapIcon } from '@/components/icons/AcademicCapIcon';

interface LandingHeaderProps {
    onNavigateToApp: () => void;
}

const LandingHeader: React.FC<LandingHeaderProps> = ({ onNavigateToApp }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-brand-indigo/80 backdrop-blur-lg border-b border-brand-lavender/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center space-x-2">
            <AcademicCapIcon className="w-8 h-8 text-brand-lavender" />
            <span className="font-bold text-xl text-white">SAT Solver AI</span>
          </div>
          <nav className="flex items-center space-x-4">
            <button
              onClick={onNavigateToApp}
              className="text-white/80 hover:text-white font-medium transition-colors text-sm"
            >
              Sign In
            </button>
            <button
              onClick={onNavigateToApp}
              className="bg-brand-violet text-white font-bold py-2 px-4 rounded-lg text-sm hover:bg-brand-lavender hover:text-brand-indigo transition-colors"
            >
              Get Started
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;