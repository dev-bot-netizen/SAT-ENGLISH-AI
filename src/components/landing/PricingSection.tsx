import React from 'react';
import { CheckCircleIcon } from '@/components/icons/CheckCircleIcon';
import BackgroundGlowWords from './BackgroundGlowWords';

interface PricingSectionProps {
  onNavigateToApp: () => void;
}

const freeFeatures = [
  "3 daily question solves",
  "Basic practice tests",
  "Community support",
  "Access to core features"
];

const premiumFeatures = [
  "Unlimited question solving",
  "Targeted practice from images",
  "Practice from any text",
  "AI vocabulary trainer",
  "Text-to-speech explanations",
  "Priority support"
];

const PricingSection: React.FC<PricingSectionProps> = ({ onNavigateToApp }) => {
  return (
    <section data-anim-section className="relative overflow-hidden py-20 sm:py-24 lg:py-32 bg-brand-indigo">
      <BackgroundGlowWords wordCount={20} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <h2 data-anim className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Find the Plan That's Right for You</h2>
          <p data-anim className="mt-4 text-lg text-white/70">
            Start for free and upgrade anytime to unlock powerful premium features.
          </p>
        </div>

        <div className="mt-16 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free Card */}
          <div data-anim className="bg-brand-lilac/5 border border-brand-lavender/20 rounded-2xl p-8 flex flex-col">
            <h3 className="text-2xl font-bold text-white">Free</h3>
            <p className="mt-2 text-white/70">Get a feel for the platform.</p>
            <p className="mt-6 text-4xl font-bold text-white">
              $0 <span className="text-lg font-medium text-white/70">/ month</span>
            </p>
            <ul className="mt-8 space-y-4 text-left">
              {freeFeatures.map((feature, i) => (
                <li key={i} className="flex items-start space-x-3">
                  <CheckCircleIcon className="w-6 h-6 text-brand-lavender flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={onNavigateToApp}
              className="mt-auto w-full bg-brand-violet text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-lavender hover:text-brand-indigo transition-colors duration-300 mt-8"
            >
              Get Started for Free
            </button>
          </div>

          {/* Premium Card */}
          <div data-anim className="relative bg-brand-violet border-2 border-brand-gold rounded-2xl p-8 flex flex-col shadow-2xl shadow-brand-gold/20">
            <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-brand-gold text-brand-indigo text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold text-white">Premium</h3>
            <p className="mt-2 text-white/70">Unlock your full potential.</p>
            <p className="mt-6 text-4xl font-bold text-white">
              Free <span className="text-lg font-medium text-white/70">until Oct 10th</span>
            </p>
            <ul className="mt-8 space-y-4 text-left">
              {premiumFeatures.map((feature, i) => (
                <li key={i} className="flex items-start space-x-3">
                  <CheckCircleIcon className="w-6 h-6 text-brand-gold flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={onNavigateToApp}
              className="mt-auto w-full bg-brand-gold text-brand-indigo font-bold py-3 px-4 rounded-lg hover:bg-yellow-300 transition-colors duration-300 mt-8"
            >
              Start Free Premium Trial
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
