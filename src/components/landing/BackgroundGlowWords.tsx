import React from 'react';

const words = [
  'Syntax', 'Inference', 'Rhetoric', 'Gemini', 'Analysis', 'SAT', 
  'Grammar', 'Punctuation', 'Context', 'Thesis', 'Clause', 'Modifier', 
  'Cohesion', 'Logic', 'AI Tutor', 'Score', 'Practice', 'Vocabulary',
  'Passage', 'Evidence', 'Claim', 'Transition', 'Structure', 'Purpose', 
  'Author', 'Tone', 'Style'
];

// Simple pseudo-random number generator for deterministic positioning
const seededRandom = (seed: number) => {
    let s = Math.sin(seed) * 10000;
    return s - Math.floor(s);
};

const BackgroundGlowWords: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
      {words.map((word, i) => {
        const top = seededRandom(i * 10) * 90 + 5; // 5% to 95%
        
        let left;
        // Place words on the horizontal peripheries to avoid overlapping centered content
        if (seededRandom(i) > 0.5) {
            // Place on the left side, from 0% to 30%
            left = seededRandom(i + 1) * 30;
        } else {
            // Place on the right side, from 70% to 100%
            left = 70 + seededRandom(i + 2) * 30;
        }

        const size = seededRandom(i * 30) * 16 + 16; // 16px to 32px
        const delay = seededRandom(i * 40) * 20; // 0s to 20s
        const duration = seededRandom(i * 50) * 10 + 15; // 15s to 25s
        
        // Use mostly lavender words, with some gold ones for accent
        const colorClass = i % 3 !== 0 ? 'text-brand-lavender' : 'text-brand-gold';

        return (
          <span
            key={i}
            className={`absolute font-semibold animate-glow-words ${colorClass}`}
            style={{
              top: `${top}%`,
              left: `${left}%`,
              fontSize: `${size}px`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

export default BackgroundGlowWords;
