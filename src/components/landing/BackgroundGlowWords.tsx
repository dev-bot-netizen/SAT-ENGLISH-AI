import React, { useMemo } from 'react';

const words = [
  'Syntax', 'Inference', 'Rhetoric', 'Gemini', 'Analysis', 'SAT', 
  'Grammar', 'Punctuation', 'Context', 'Thesis', 'Clause', 'Modifier', 
  'Cohesion', 'Logic', 'AI Tutor', 'Score', 'Practice', 'Vocabulary',
  'Passage', 'Evidence', 'Claim', 'Transition', 'Structure', 'Purpose', 
  'Author', 'Tone', 'Style'
];

// A simple seeded pseudo-random number generator for deterministic positioning
const seededRandom = (seed: number): number => {
    const s = Math.sin(seed) * 10000;
    return s - Math.floor(s);
};

interface WordStyle {
    word: string;
    style: React.CSSProperties;
    className: string;
}

const BackgroundGlowWords: React.FC = () => {
    const styledWords = useMemo(() => {
        // This array will hold the final, calculated styles for each word.
        const finalizedWords: WordStyle[] = [];

        words.forEach((word, i) => {
            const seed = i * 1.618; // Use a seed for deterministic randomness
            
            // 1. Calculate all random values before creating the element object
            const top = seededRandom(seed * 10) * 90 + 5; // 5% to 95%
            
            let left;
            // Place words on horizontal peripheries to avoid overlapping centered content
            if (seededRandom(seed) > 0.5) {
                left = seededRandom(seed + 1) * 30; // Left side: 0% to 30%
            } else {
                left = 70 + seededRandom(seed + 2) * 30; // Right side: 70% to 100%
            }

            const size = seededRandom(seed * 30) * 16 + 16; // 16px to 32px
            const delay = seededRandom(seed * 40) * 20; // 0s to 20s
            const duration = seededRandom(seed * 50) * 10 + 15; // 15s to 25s
            
            // 2. Determine color class
            const colorClass = seededRandom(seed * 5) > 0.25 ? 'text-brand-lavender' : 'text-brand-gold';

            // 3. Finalize and store the style and class objects. No DOM elements are created here.
            finalizedWords.push({
                word: word,
                style: {
                  top: `${top}%`,
                  left: `${left}%`,
                  fontSize: `${size}px`,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`,
                },
                className: `absolute font-semibold opacity-0 animate-glow-words ${colorClass}`
            });
        });

        return finalizedWords;
    }, []); // Empty dependency array ensures this calculation runs only once.

    // 4. Render the elements using the pre-calculated, finalized styles.
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
