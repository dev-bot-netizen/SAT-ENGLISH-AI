
import React from 'react';

interface FooterProps {
  onGiveFeedback: () => void;
}

const Footer: React.FC<FooterProps> = ({ onGiveFeedback }) => {
  return (
    <footer className="w-full text-center border-t border-brand-lavender/10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center">
        <p className="text-sm text-white/50">
          Powered by Gemini API. For educational purposes only.
        </p>
        <button
          onClick={onGiveFeedback}
          className="text-sm text-white/50 hover:text-brand-lavender hover:underline transition-colors mt-2 sm:mt-0"
        >
          Give Feedback
        </button>
      </div>
    </footer>
  );
};

export default Footer;