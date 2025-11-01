import React, { useMemo } from 'react';

const words = [
  'Syntax', 'Inference', 'Rhetoric', 'Gemini', 'Analysis', 'SAT', 
  'Grammar', 'Punctuation', 'Context', 'Thesis', 'Clause', 'Modifier', 
  'Cohesion', 'Logic', 'AI Tutor', 'Score', 'Practice', 'Vocabulary',
  'Passage', 'Evidence', 'Claim', 'Transition', 'Structure', 'Purpose', 
  'Author', 'Tone', 'Style'
];

// Simple deterministic pseudo-random number generator
const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

interface WordStyle {
    word: string;
    style: React.CSSProperties;
    className: string;
}

const BackgroundGlowWords: React.FC = () => {
    const styledWords = useMemo((): WordStyle[] => {
        // All CSS positioning and details are randomized and finalized here,
        // before any DOM elements are created.
        return words.map((word, i) => {
            const seed = i + 1; // Use non-zero seed

            // Position words on the horizontal peripheries to avoid overlapping centered content
            const onLeftSide = seededRandom(seed * 10) > 0.5;
            const left = onLeftSide
                ? seededRandom(seed * 20) * 30 // 0% to 30%
                : 70 + seededRandom(seed * 30) * 30; // 70% to 100%

            const top = seededRandom(seed * 40) * 90 + 5; // 5% to 95%
            const size = seededRandom(seed * 50) * 16 + 16; // 16px to 32px
            const rotation = seededRandom(seed * 60) * 20 - 10; // -10deg to 10deg
            const delay = seededRandom(seed * 70) * 20; // 0s to 20s
            const duration = seededRandom(seed * 80) * 10 + 15; // 15s to 25s

            // Use mostly lavender words, with some gold ones for accent
            const colorClass = i % 3 !== 0 ? 'text-brand-lavender' : 'text-brand-gold';

            return {
                word: word,
                style: {
                    top: `${top}%`,
                    left: `${left}%`,
                    fontSize: `${size}px`,
                    '--rotation-deg': `${rotation}deg`, // CSS variable for animation
                    animationDelay: `${delay}s`,
                    animationDuration: `${duration}s`,
                } as React.CSSProperties,
                className: `absolute font-semibold animate-glow-words ${colorClass}`
            };
        });
    }, []);

    return (
        <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
            {styledWords.map(({ word, style, className }, i) => (
                <span key={i} className={className} style={style}>
                    {word}
                </span>
            ))}
        </div>
    );
};

export default BackgroundGlowWords;
