import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { UploadIcon } from '@/components/icons/UploadIcon';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';
import BackgroundGlowWords from './BackgroundGlowWords';

gsap.registerPlugin(ScrollTrigger);

interface DemoSectionProps {
    onNavigateToApp: () => void;
}

const fakeSolutionParts = [
    { type: 'h', text: '**The final answer is C**' },
    { type: 'h', text: '**Step-by-step explanation:**' },
    { type: 'p', text: '1.  **Analyze the Sentence Structure:** The first part of the sentence, "While one requires oxygen and one does _______," is a dependent clause. This type of clause cannot stand on its own as a complete sentence and must be connected to an independent clause.' },
    { type: 'p', text: '2.  **Identify the Independent Clause:** The second part, "aerobic and anaerobic respiration are both forms of cellular respiration," is an independent clause because it expresses a complete thought.' },
    { type: 'p', text: '3.  **Determine Correct Punctuation:** The standard convention for connecting a leading dependent clause to an independent clause is with a comma. Therefore, a comma is needed after the word "not".' },
    { type: 'p', text: '4.  **Evaluate Other Options:** A period (B) would create a sentence fragment. No punctuation (A) would create a run-on sentence. A semicolon (D) is used to connect two related independent clauses, which is not the case here.' },
];

const AnimatedSolution: React.FC = () => {
    // This component will just render the structure for GSAP to target
    return (
        <div className="solution-text space-y-4 text-gray-300 text-sm">
            {fakeSolutionParts.map((part, index) => (
                <div key={index} className="solution-part opacity-0">
                    {part.type === 'h' ? (
                        <p className="font-bold text-lg text-purple-400 mb-2">{part.text.replace(/\*\*/g, '')}</p>
                    ) : (
                        <p>{part.text}</p>
                    )}
                </div>
            ))}
        </div>
    );
};

const DemoSection: React.FC<DemoSectionProps> = ({ onNavigateToApp }) => {
    const component = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReducedMotion) {
                gsap.set('.demo-step, .upload-view, .analyzing-view, .results-view, .solution-part', { opacity: 1 });
                gsap.set('.faux-image', { display: 'none' });
                 gsap.set('.step-1', { opacity: 0 }); // Hide all but the last step title
                 gsap.set('.step-2', { opacity: 0 });
                 gsap.set('.step-3', { opacity: 1 });
                 gsap.set('.upload-view', { opacity: 0 });
                 gsap.set('.analyzing-view', { opacity: 0 });
                return;
            }

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: component.current,
                    start: 'top top',
                    end: '+=4000',
                    pin: true,
                    scrub: 1,
                    anticipatePin: 1,
                }
            });

            // Initial State
            gsap.set('.analyzing-view, .results-view', { opacity: 0 });
            gsap.set('.demo-step:not(.step-1)', { opacity: 0 });
            gsap.set('.progress-bar-inner', { width: '0%' });
            gsap.set('.faux-image', { top: '-50%', opacity: 0 });

            // --- Animation Sequence ---

            // Step 1: Upload
            tl.to('.faux-image', { top: '50%', opacity: 1, duration: 1, ease: 'power2.inOut' })
              .to('.faux-image', { scale: 0.8, duration: 0.5, ease: 'power2.in' }, '+=0.5');

            // Step 2: Transition to Analyzing
            tl.to('.step-1', { opacity: 0, duration: 0.5 }, 'analyze')
              .to('.step-2', { opacity: 1, duration: 0.5 }, 'analyze')
              .to('.upload-view', { opacity: 0, duration: 0.5 }, 'analyze')
              .to('.analyzing-view', { opacity: 1, duration: 0.5 }, 'analyze');
            
            // Step 3: Animate Progress Bar
            tl.to('.progress-bar-inner', { width: '100%', duration: 2, ease: 'none' });

            // Step 4: Transition to Results
            tl.to('.step-2', { opacity: 0, duration: 0.5 }, 'results')
              .to('.step-3', { opacity: 1, duration: 0.5 }, 'results')
              .to('.analyzing-view', { opacity: 0, duration: 0.5 }, 'results')
              .to('.results-view', { opacity: 1, duration: 0.5 }, 'results');

            // Step 5: Animate Solution Text
            tl.to('.solution-part', {
                opacity: 1,
                duration: 0.8,
                stagger: 0.5,
                ease: 'power2.out'
            });

        }, component);
        return () => ctx.revert();

    }, []);


  return (
    <section id="demo-section" ref={component} className="min-h-screen relative">
      <div className="sticky top-0 h-screen w-full flex flex-col justify-center bg-brand-indigo/50 overflow-hidden relative">
        <BackgroundGlowWords />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Watch AI solve real SAT questions in seconds.</h2>
              <p className="mt-4 text-lg text-white/70">
                See the power of Gemini in action. From tricky grammar rules to complex passage analysis, get instant clarity.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-brand-violet/30 to-brand-indigo/30 rounded-2xl border border-brand-lavender/20 p-8 backdrop-blur-xl shadow-2xl grid md:grid-cols-2 gap-8 items-center">
                {/* Left side: Instructions */}
                <div className="relative h-48 md:h-auto">
                    <div className="demo-step step-1 absolute inset-0 space-y-4">
                        <h3 className="text-xl font-semibold text-white">1. Upload a Question</h3>
                        <p className="text-white/70">Drag and drop, paste, or click to upload an image of any SAT English question.</p>
                    </div>
                    <div className="demo-step step-2 absolute inset-0 space-y-4">
                        <h3 className="text-xl font-semibold text-white">2. Analyzing...</h3>
                        <p className="text-white/70">Gemini analyzes the image, understands the passage, question, and options, and determines the correct answer.</p>
                    </div>
                    <div className="demo-step step-3 absolute inset-0 space-y-4">
                        <h3 className="text-xl font-semibold text-white">3. Get an Instant Solution</h3>
                        <p className="text-white/70">Receive a detailed, step-by-step breakdown explaining why the correct answer is right and the others are wrong.</p>
                        <button
                            onClick={onNavigateToApp}
                            className="bg-brand-gold text-brand-indigo font-bold py-3 px-6 rounded-lg text-md hover:bg-yellow-300 transition-transform hover:scale-105 duration-300 mt-4 inline-block"
                        >
                            Try It Yourself
                        </button>
                    </div>
                </div>

                {/* Right side: Demo Screen */}
                <div className="relative w-full h-96 bg-gray-900 rounded-lg border border-brand-lavender/20 p-6">
                    {/* Upload View */}
                    <div className="upload-view absolute inset-0 p-6">
                        <div className="relative flex flex-col items-center justify-center w-full h-full border-2 border-dashed rounded-lg border-brand-lavender/50 bg-black/20">
                            <UploadIcon className="w-10 h-10 mb-3 text-brand-lavender/80" />
                            <p className="text-sm text-white/70">
                                Drop question image here
                            </p>
                        </div>
                        <div className="faux-image absolute left-1/2 -translate-x-1/2 w-48 h-28 bg-slate-700 rounded-lg border-2 border-slate-500 p-2 text-xs text-slate-300 shadow-2xl flex flex-col justify-between">
                            <p className="font-bold text-center">SAT Question #23</p>
                            <div className="space-y-1">
                                <div className="w-full h-1.5 bg-slate-500 rounded-full"></div>
                                <div className="w-3/4 h-1.5 bg-slate-500 rounded-full"></div>
                                <div className="w-full h-1.5 bg-slate-500 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                    {/* Analyzing View */}
                    <div className="analyzing-view absolute inset-0 p-6 flex flex-col items-center justify-center">
                        <AcademicCapIcon className="w-16 h-16 text-brand-lavender animate-pulse" />
                        <p className="mt-4 font-semibold text-white">Analyzing with Gemini</p>
                        <div className="w-full bg-brand-indigo/50 rounded-full h-2.5 mt-4 border border-brand-lavender/30">
                            <div className="progress-bar-inner bg-brand-lavender h-full rounded-full"></div>
                        </div>
                    </div>
                    {/* Results View */}
                    <div className="results-view absolute inset-0 p-6 overflow-y-auto">
                        <AnimatedSolution />
                    </div>
                </div>
            </div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;