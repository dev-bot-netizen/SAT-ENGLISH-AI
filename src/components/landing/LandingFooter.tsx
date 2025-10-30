import React from 'react';

const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-brand-indigo border-t border-brand-lavender/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-white/50 text-sm">
        <p>&copy; {new Date().getFullYear()} SAT Solver AI. All rights reserved.</p>
        <p className="mt-2">Powered by Google Gemini. For educational purposes only.</p>
        <div className="mt-4 flex justify-center space-x-6">
            <a href="#" className="hover:text-white transition-colors">Support</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;