import React, { useMemo } from 'react';

// Expanded and shuffled list for more variety
const words = [
  'SAT', 'Syntax', 'Gemini', 'Vocabulary', 'Inference', 'Clause', 'Analysis', 
  'Rhetoric', 'Practice', 'Grammar', 'Punctuation', 'Protagonist', 'Context', 
  'Thesis', 'Figurative', 'Modifier', 'Cohesion', 'Logic', 'AI Tutor', 'Score', 
  'Passage', 'Evidence', 'Diction', 'Claim', 'Transition', 'Structure', 'Purpose', 
  'Author', 'Tone', 'Style', 'Connotation', 'Denotation', 'Metaphor', 'Simile', 
  'Antagonist', 'Exposition', 'Climax', 'Resolution', 'Imagery'
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

interface BackgroundGlowWordsProps {
    wordCount?: number;
}

const BackgroundGlowWords: React.FC<BackgroundGlowWordsProps> = ({ wordCount = words.length }) => {
    const styledWords = useMemo(() => {
        const finalizedWords: WordStyle[] = [];

        // Take a subset of words based on the prop
        const wordsToRender = words.slice(0, Math.min(wordCount, words.length));

        wordsToRender.forEach((word, i) => {
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
            const delay = seededRandom(seed * 40) * 5; // 0s to 5s (FASTER)
            const duration = seededRandom(seed * 50) * 10 + 15; // 15s to 25s
            
            // 2. Determine color class
            const colorClass = seededRandom(seed * 5) > 0.25 ? 'text-brand-lavender' : 'text-brand-gold';

            // 3. Finalize and store the style and class objects.
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
    }, [wordCount]);

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
