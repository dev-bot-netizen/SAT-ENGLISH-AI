import React from 'react';
import BackgroundGlowWords from './BackgroundGlowWords';

interface FinalCTASectionProps {
    onNavigateToApp: () => void;
}

const FinalCTASection: React.FC<FinalCTASectionProps> = ({ onNavigateToApp }) => {
  return (
    <section data-anim-section className="relative overflow-hidden py-20 sm:py-24 lg:py-32 bg-brand-indigo/50">
      <BackgroundGlowWords />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 data-anim className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Ready to Transform Your SAT Prep?</h2>
        <p data-anim className="mt-4 max-w-2xl mx-auto text-lg text-white/70">
          Join thousands of students who’ve already improved their scores with AI-powered learning.
        </p>
        <div data-anim className="mt-10">
          <button
            onClick={onNavigateToApp}
            className="bg-brand-gold text-brand-indigo font-bold py-4 px-10 rounded-lg text-lg hover:bg-yellow-300 transition-transform hover:scale-105 duration-300"
          >
            Get Started Today
          </button>
        </div>
      </div>
    </section>
  );
};

export default FinalCTASection;