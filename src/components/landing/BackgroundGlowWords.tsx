import React from 'react';

const wordData = [
  // Left Side
  { word: 'Syntax', top: '15%', left: '8%', size: '22px', delay: '0s', duration: '20s', colorClass: 'text-brand-lavender' },
  { word: 'Grammar', top: '30%', left: '15%', size: '18px', delay: '5s', duration: '25s', colorClass: 'text-brand-lavender' },
  { word: 'Clause', top: '45%', left: '5%', size: '26px', delay: '8s', duration: '17s', colorClass: 'text-brand-gold' },
  { word: 'Cohesion', top: '60%', left: '18%', size: '20px', delay: '3s', duration: '22s', colorClass: 'text-brand-lavender' },
  { word: 'Passage', top: '75%', left: '10%', size: '24px', delay: '10s', duration: '19s', colorClass: 'text-brand-lavender' },
  { word: 'Author', top: '90%', left: '20%', size: '17px', delay: '1s', duration: '24s', colorClass: 'text-brand-gold' },
  
  // Right Side
  { word: 'Inference', top: '20%', left: '85%', size: '28px', delay: '2s', duration: '18s', colorClass: 'text-brand-gold' },
  { word: 'Rhetoric', top: '35%', left: '78%', size: '21px', delay: '7s', duration: '23s', colorClass: 'text-brand-lavender' },
  { word: 'Context', top: '50%', left: '90%', size: '19px', delay: '4s', duration: '20s', colorClass: 'text-brand-lavender' },
  { word: 'Logic', top: '65%', left: '75%', size: '25px', delay: '9s', duration: '16s', colorClass: 'text-brand-lavender' },
  { word: 'Vocabulary', top: '80%', left: '88%', size: '23px', delay: '6s', duration: '21s', colorClass: 'text-brand-gold' },
  { word: 'Purpose', top: '95%', left: '80%', size: '20px', delay: '12s', duration: '18s', colorClass: 'text-brand-lavender' },

  // Extras for more fill
  { word: 'SAT', top: '5%', left: '30%', size: '30px', delay: '1.5s', duration: '15s', colorClass: 'text-brand-lavender' },
  { word: 'Analysis', top: '8%', left: '65%', size: '18px', delay: '8.5s', duration: '25s', colorClass: 'text-brand-lavender' },
  { word: 'Score', top: '92%', left: '40%', size: '28px', delay: '4.5s', duration: '19s', colorClass: 'text-brand-gold' },
  { word: 'Practice', top: '95%', left: '58%', size: '22px', delay: '10.5s', duration: '22s', colorClass: 'text-brand-lavender' },
];


const BackgroundGlowWords: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
      {wordData.map((data, i) => (
        <span
          key={i}
          className={`absolute font-semibold animate-glow-words ${data.colorClass}`}
          style={{
            top: data.top,
            left: data.left,
            fontSize: data.size,
            animationDelay: data.delay,
            animationDuration: data.duration,
          }}
        >
          {data.word}
        </span>
      ))}
    </div>
  );
};

export default BackgroundGlowWords;
