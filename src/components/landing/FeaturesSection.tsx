import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CameraIcon } from '@/components/icons/CameraIcon';
import { DocumentTextIcon } from '@/components/icons/DocumentTextIcon';
import { WandSparklesIcon } from '@/components/icons/WandSparklesIcon';
import { UploadIcon } from '../icons/UploadIcon';
import BackgroundGlowWords from './BackgroundGlowWords';

gsap.registerPlugin(ScrollTrigger);

const FeaturesSection: React.FC = () => {
    const component = useRef<HTMLDivElement>(null);
    const connectingLineRef = useRef<SVGPathElement>(null);

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const path = connectingLineRef.current;

            if (prefersReducedMotion) {
                gsap.set(".feature-card-anim, .anim-child, .icon-anim, .mockup-before, .mockup-after, .mockup-card", { opacity: 1, y: 0, x: 0, scale: 1 });
                if (path) {
                  gsap.set(path, { opacity: 0.2 });
                  const svg = path.ownerSVGElement;
                  if (svg) {
                    const midX = svg.viewBox.baseVal.width / 2;
                    path.setAttribute('d', `M ${midX} 0 V ${svg.viewBox.baseVal.height}`);
                  }
                }
                return;
            }
            
            const cards = gsap.utils.toArray<HTMLElement>('.feature-card-anim');
            const svg = path?.ownerSVGElement;

            if (!path || !svg || cards.length < 3) return;

            const pathProxy = {
                length: 0,
                progress: 0,
                set: (target: SVGPathElement) => {
                    target.style.strokeDashoffset = `${pathProxy.length * (1 - pathProxy.progress)}`;
                }
            };

            const updatePath = () => {
                const svgRect = svg.getBoundingClientRect();
                if (svgRect.width === 0 || svgRect.height === 0) return;

                const pt = svg.createSVGPoint();
                const ctm = svg.getScreenCTM()?.inverse();
                if (!ctm) return;

                const getSVGCoords = (element: HTMLElement) => {
                    const rect = element.getBoundingClientRect();
                    pt.x = rect.left + rect.width / 2 - svgRect.left;
                    pt.y = rect.top + rect.height / 2 - svgRect.top;
                    return pt.matrixTransform(ctm);
                };

                const points = cards.map(card => getSVGCoords(card));
                const startY = 0;
                const endY = svg.viewBox.baseVal.height;
                const startX = svg.viewBox.baseVal.width / 2;
                const vOffset = 150;

                const d = [
                    `M ${startX},${startY}`,
                    `L ${startX},${points[0].y - vOffset}`,
                    `C ${startX},${points[0].y}, ${points[0].x},${points[0].y - vOffset}, ${points[0].x},${points[0].y}`,
                    `C ${points[0].x},${points[0].y + vOffset}, ${points[1].x},${points[1].y - vOffset}, ${points[1].x},${points[1].y}`,
                    `C ${points[1].x},${points[1].y + vOffset}, ${points[2].x},${points[2].y - vOffset}, ${points[2].x},${points[2].y}`,
                    `L ${points[2].x},${endY}`
                ].join(' ');

                path.setAttribute('d', d);
                pathProxy.length = path.getTotalLength();
                gsap.set(path, { strokeDasharray: pathProxy.length });
                pathProxy.set(path);
            };

            gsap.to(pathProxy, {
                progress: 1,
                ease: "power1.inOut",
                scrollTrigger: {
                    trigger: component.current,
                    start: "top top",
                    end: "bottom bottom",
                    scrub: 1,
                    onUpdate: () => pathProxy.set(path),
                    onRefresh: updatePath,
                    invalidateOnRefresh: true,
                }
            });

            cards.forEach((card, index) => {
                const scrollTriggerConfig: gsap.plugins.ScrollTrigger["Vars"] = {
                    trigger: card,
                    start: 'center center',
                    end: '+=150%',
                    scrub: 1,
                    pin: true,
                };

                const timeline = gsap.timeline({
                    scrollTrigger: scrollTriggerConfig
                });
                
                timeline.fromTo(card, {
                    y: 50,
                    opacity: 0,
                }, {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    ease: 'power4.out',
                }, 0);
                
                timeline.fromTo(card.querySelector('.card-bg'), {
                    scaleX: 0
                }, {
                    scaleX: 1,
                    duration: 1.2,
                    ease: 'power3.inOut'
                }, 0.2);

                switch(index) {
                    case 0: // Card 1 - AI from Images
                        timeline.fromTo(card.querySelector('.icon-anim'), { y: -30, opacity: 0, filter: 'drop-shadow(0 0 0px #C4B5FD)' }, { y: 0, opacity: 1, filter: 'drop-shadow(0 10px 15px rgba(196, 181, 253, 0.3))', duration: 1, ease: 'bounce.out' }, 0.4);
                        timeline.fromTo(card.querySelector('.headline-anim'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0.6);
                        timeline.fromTo(card.querySelectorAll('.desc-anim'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.8, ease: 'power3.out' }, 0.8);
                        
                        timeline.to(card.querySelector('.demo-faux-image'), { top: '50%', y: '-50%', ease: 'power2.inOut' }, 1)
                                .to(card.querySelector('.demo-upload-view'), { opacity: 0, ease: 'power2.inOut' }, 2)
                                .to(card.querySelector('.demo-results-view'), { opacity: 1, ease: 'power2.inOut' }, 2)
                                .from(card.querySelectorAll('.demo-question-card'), { opacity: 0, x: -20, stagger: 0.3, ease: 'power3.out' }, 2.5);
                        break;
                    case 1: // Card 2 - Quiz from Text
                        timeline.fromTo(card.querySelector('.icon-anim'), { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }, 0.4);
                        timeline.fromTo(card.querySelector('.icon-flash'), { opacity: 1, scale: 1 }, { opacity: 0, scale: 2.5, duration: 0.6, ease: 'power2.out' }, 0.4);
                        timeline.fromTo(card.querySelector('.headline-anim'), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'elastic.out(1, 0.5)' }, 0.8);
                        timeline.fromTo(card.querySelectorAll('.desc-anim'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.8, ease: 'power3.out', delay: 0.2 }, 1);

                        timeline.to(card.querySelector('.demo-selection-highlight'), { height: '100%', ease: 'none' }, 1.5)
                                .to(card.querySelector('.demo-selection-highlight'), { backgroundColor: '#a855f7', repeat: 1, yoyo: true, duration: 0.1 }, 2.5) // Flash to indicate 'copy'
                                .to(card.querySelector('.demo-website-view'), { opacity: 0, ease: 'power2.inOut' }, 2.7)
                                .to(card.querySelector('.demo-paste-view'), { opacity: 1, ease: 'power2.inOut' }, 2.7)
                                .to(card.querySelector('.demo-paste-view'), { opacity: 0, ease: 'power2.inOut' }, 4)
                                .to(card.querySelector('.demo-results-view-2'), { opacity: 1, ease: 'power2.inOut' }, 4)
                                .from(card.querySelectorAll('.demo-question-card-2'), { opacity: 0, x: -20, stagger: 0.3, ease: 'power3.out' }, 4.5);
                        break;
                    case 2: // Card 3 - Vocab Trainer
                        timeline.fromTo(card.querySelectorAll('.spark'), { scale: 0, opacity: 0, rotation: 'random(-180, 180)' }, { scale: 1, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'power2.out' }, 0.4);
                        timeline.to(card.querySelectorAll('.spark'), { opacity: 0, duration: 0.5, stagger: 0.05, delay: 0.3 }, 0.6);
                        timeline.fromTo(card.querySelector('.headline-anim'), { clipPath: 'polygon(0 0, 0 0, 0 100%, 0% 100%)', opacity: 0 }, { clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', opacity: 1, duration: 1, ease: 'power2.inOut' }, 0.8);
                        timeline.fromTo(card.querySelectorAll('.desc-anim'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.1, duration: 0.8, ease: 'power3.out' }, 1.2);
                        
                        // New demo animation
                        timeline.fromTo(card.querySelector('.demo-vocab-popup'), { scale: 0.5, opacity: 0, y: 10 }, { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.7)' }, 1.8)
                                .to(card.querySelector('.demo-vocab-popup'), { scale: 0.9, yoyo: true, repeat: 1, duration: 0.15, ease: 'power1.inOut' }, 2.5) // click effect
                                .to(card.querySelector('.demo-vocab-test-view'), { opacity: 0, ease: 'power2.inOut', duration: 0.5 }, 2.8)
                                .to(card.querySelector('.demo-vocab-results-view'), { opacity: 1, ease: 'power2.inOut', duration: 0.5 }, 2.8)
                                .from(card.querySelectorAll('.demo-vocab-detail-card'), { opacity: 0, x: -20, stagger: 0.2, ease: 'power3.out' }, 3.3);
                        break;
                }
            });

        }, component);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={component} className="relative py-20 sm:py-24 lg:py-32 bg-brand-indigo overflow-hidden">
            <BackgroundGlowWords />
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto" data-anim-section>
                    <h2 data-anim className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">The AI Tutor That Adapts to You</h2>
                    <p data-anim className="mt-4 text-lg text-white/70">Go beyond simple answer-checking. Our tools analyze your needs and create a learning path that's uniquely yours.</p>
                </div>

                <div className="mt-20 relative">
                    <div className="absolute top-0 left-0 h-full w-full pointer-events-none md:flex md:justify-center" aria-hidden="true">
                        <svg width="100%" height="100%" viewBox="0 0 1280 1800" preserveAspectRatio="none" className="max-w-7xl">
                            <defs>
                                <linearGradient id="line-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="#B47DFF" stopOpacity="0" />
                                    <stop offset="10%" stopColor="#B47DFF" />
                                    <stop offset="90%" stopColor="#FFD700" />
                                    <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path ref={connectingLineRef} d="" fill="none" stroke="url(#line-gradient)" strokeWidth="3"/>
                        </svg>
                    </div>

                    <div className="max-w-5xl mx-auto grid grid-cols-1 gap-16 md:gap-8">
                        
                        {/* Feature 1 */}
                        <div className="feature-card-anim md:max-w-md md:justify-self-center">
                             <div className="relative bg-brand-lilac/5 border border-brand-lavender/20 rounded-2xl p-8 space-y-4 overflow-hidden h-full flex flex-col">
                                <div className="card-bg absolute inset-0 bg-gradient-to-br from-purple-500/10 to-brand-violet/20 origin-left" />
                                <div className="icon-container relative w-16 h-16 bg-brand-violet rounded-lg flex items-center justify-center icon-anim">
                                    <CameraIcon className="w-8 h-8 text-brand-lavender" />
                                </div>
                                <h3 className="text-xl font-bold text-white headline-anim">Targeted Practice from Your Toughest Questions</h3>
                                <div className="desc-anim">
                                  <p className="text-white/70 flex-grow">Struggling with a specific question type? Upload a screenshot. Our AI diagnoses the core concepts and builds a personalized practice set to turn your weaknesses into strengths.</p>
                                </div>
                                <div className="relative h-48 mt-4 desc-anim overflow-hidden bg-gray-800 p-3 rounded-lg border border-gray-700">
                                    <div className="demo-upload-view absolute inset-0 p-3">
                                        <div className="demo-upload-zone w-full h-full border-2 border-dashed rounded-lg border-gray-600 flex flex-col items-center justify-center">
                                            <UploadIcon className="w-8 h-8 text-gray-500" />
                                            <p className="text-xs text-gray-500 mt-2">Drop question image here</p>
                                        </div>
                                        <div className="demo-faux-image absolute top-[-50px] left-[50%] -translate-x-1/2 w-40 h-24 bg-slate-600 rounded border-2 border-slate-500 p-2 text-xs text-slate-300 overflow-hidden">
                                            <p className="font-bold">SAT Question #23</p>
                                            <div className="w-full h-1 bg-slate-500 rounded-full mt-1"></div>
                                            <div className="w-3/4 h-1 bg-slate-500 rounded-full mt-1"></div>
                                        </div>
                                    </div>
                                    <div className="demo-results-view absolute inset-0 p-3 bg-gray-800 opacity-0">
                                        <p className="font-mono text-xs text-purple-300">&gt; Analysis complete. Generating targeted questions...</p>
                                        <div className="mt-2 space-y-2">
                                            <div className="demo-question-card w-full h-8 bg-brand-indigo rounded border border-purple-400/50 flex items-center px-2">
                                                <p className="text-xs text-white/80">Q1: Boundaries...</p>
                                            </div>
                                            <div className="demo-question-card w-full h-8 bg-brand-indigo rounded border border-purple-400/50 flex items-center px-2">
                                                <p className="text-xs text-white/80">Q2: Transitions...</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="feature-card-anim md:max-w-md md:justify-self-start">
                           <div className="relative bg-brand-lilac/5 border border-brand-lavender/20 rounded-2xl p-8 space-y-4 overflow-hidden h-full flex flex-col">
                                <div className="card-bg absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-violet-500/20 origin-left" />
                                <div className="icon-container relative w-16 h-16 bg-brand-violet rounded-lg flex items-center justify-center">
                                    <div className="icon-flash absolute inset-0 bg-brand-lavender rounded-lg"></div>
                                    <DocumentTextIcon className="w-8 h-8 text-brand-lavender relative icon-anim" />
                                </div>
                                <h3 className="text-xl font-bold text-white headline-anim">Quiz Anything in Seconds</h3>
                                <div className="desc-anim">
                                  <p className="text-white/70 flex-grow">Copy and paste any article, story, or essay. SAT Solver AI instantly crafts a reading comprehension quiz, turning your interests into targeted practice. The internet is now your question bank.</p>
                                </div>
                                 <div className="relative h-48 mt-4 desc-anim overflow-hidden bg-gray-800 p-3 rounded-lg border border-gray-700">
                                    {/* View 1: Faux Website */}
                                    <div className="demo-website-view absolute inset-0 p-3">
                                        <div className="flex items-center justify-between pb-2 border-b border-gray-700">
                                            <p className="font-bold text-sm text-white">Really Great News Site</p>
                                            <div className="flex items-center space-x-1">
                                                <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                                                <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                                                <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                                            </div>
                                        </div>
                                        <div className="relative mt-3 space-y-1.5">
                                            <div className="demo-selection-highlight absolute bg-purple-500/50 h-0 overflow-hidden" style={{ top: 0, left: 0, width: '100%' }}>
                                                {/* Replicated text blocks for the highlight color */}
                                                <div className="space-y-1.5 p-1">
                                                    <div className="h-2 rounded-full bg-purple-300 w-full"></div>
                                                    <div className="h-2 rounded-full bg-purple-300 w-11/12"></div>
                                                    <div className="h-2 rounded-full bg-purple-300 w-full"></div>
                                                    <div className="h-2 rounded-full bg-purple-300 w-10/12"></div>
                                                    <div className="h-2 rounded-full bg-purple-300 w-full"></div>
                                                    <div className="h-2 rounded-full bg-purple-300 w-5/6"></div>
                                                </div>
                                            </div>
                                            {/* The base grey faux text blocks */}
                                            <div className="space-y-1.5 p-1">
                                                <div className="h-2 rounded-full bg-gray-600 w-full"></div>
                                                <div className="h-2 rounded-full bg-gray-600 w-11/12"></div>
                                                <div className="h-2 rounded-full bg-gray-600 w-full"></div>
                                                <div className="h-2 rounded-full bg-gray-600 w-10/12"></div>
                                                <div className="h-2 rounded-full bg-gray-600 w-full"></div>
                                                <div className="h-2 rounded-full bg-gray-600 w-5/6"></div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* View 2: Faux Paste */}
                                    <div className="demo-paste-view absolute inset-0 p-3 bg-gray-800 opacity-0">
                                        <div className="w-full h-full bg-slate-900 rounded-md p-2">
                                            <p className="font-mono text-xs text-cyan-300 mb-2">&gt; Pasting text...</p>
                                            <div className="space-y-1.5">
                                                <div className="h-2 rounded-full bg-cyan-800 w-full"></div>
                                                <div className="h-2 rounded-full bg-cyan-800 w-11/12"></div>
                                                <div className="h-2 rounded-full bg-cyan-800 w-full"></div>
                                                <div className="h-2 rounded-full bg-cyan-800 w-10/12"></div>
                                                <div className="h-2 rounded-full bg-cyan-800 w-full"></div>
                                                <div className="h-2 rounded-full bg-cyan-800 w-5/6"></div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* View 3: Results */}
                                    <div className="demo-results-view-2 absolute inset-0 p-3 bg-gray-800 opacity-0">
                                        <p className="font-mono text-xs text-cyan-300">&gt; Text analyzed. Generating quiz...</p>
                                        <div className="mt-2 space-y-2">
                                            <div className="demo-question-card-2 w-full h-8 bg-brand-indigo rounded border border-cyan-400/50 flex items-center px-2">
                                                <p className="text-xs text-white/80">Q1: Main Idea...</p>
                                            </div>
                                            <div className="demo-question-card-2 w-full h-8 bg-brand-indigo rounded border border-cyan-400/50 flex items-center px-2">
                                                <p className="text-xs text-white/80">Q2: Words in Context...</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="feature-card-anim md:max-w-md md:justify-self-end">
                            <div className="relative bg-brand-lilac/5 border border-brand-lavender/20 rounded-2xl p-8 space-y-4 overflow-hidden h-full flex flex-col">
                                <div className="card-bg absolute inset-0 bg-gradient-to-tl from-yellow-500/10 to-purple-500/20 origin-left" />
                                <div className="icon-container relative w-16 h-16 bg-brand-violet rounded-lg flex items-center justify-center">
                                    <WandSparklesIcon className="w-8 h-8 text-brand-lavender relative" />
                                    {[...Array(8)].map((_, i) => <div key={i} className="spark absolute w-2 h-2 bg-brand-gold rounded-full" style={{top: '50%', left: '50%', transform: `rotate(${i*45}deg) translateX(25px)`}} />)}
                                </div>
                                <h3 className="text-xl font-bold text-white headline-anim">Memorable Vocabulary, Powered by AI</h3>
                                <div className="desc-anim">
                                  <p className="text-white/70 flex-grow">Save words as you practice. Dive deep with AI-generated stories, etymologies, and smart flashcards. Not just definitions, but lasting knowledge.</p>
                                </div>
                                <div className="relative h-48 mt-4 desc-anim overflow-hidden bg-gray-800 p-3 rounded-lg border border-gray-700">
                                    {/* View 1: Practice Test with word selection */}
                                    <div className="demo-vocab-test-view absolute inset-0 p-3">
                                        <p className="font-mono text-xs text-yellow-300">&gt; Practice Test in progress...</p>
                                        <div className="mt-2 bg-slate-900 rounded-md p-3 text-sm text-white/80">
                                            ...the artist's fame was 
                                            <span className="demo-vocab-word-highlight relative font-bold text-yellow-300/80 bg-yellow-400/20 p-1 rounded-sm mx-1">
                                                ephemeral
                                                <div className="demo-vocab-popup absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-brand-violet text-white text-xs font-bold py-1 px-3 rounded-full shadow-lg">Add to Vocabulary</div>
                                            </span>
                                            , lasting only for the summer...
                                        </div>
                                    </div>

                                    {/* View 2: AI-Generated Vocab Card */}
                                    <div className="demo-vocab-results-view absolute inset-0 p-3 bg-gray-800 opacity-0">
                                        <p className="font-mono text-xs text-yellow-300">&gt; Word "ephemeral" saved. AI details generated:</p>
                                        <div className="mt-2 space-y-1.5">
                                            <div className="demo-vocab-detail-card text-xs bg-brand-indigo p-2 rounded-md border border-purple-400/50 text-white/80">
                                                <strong>Definition:</strong> Lasting for a very short time.
                                            </div>
                                            <div className="demo-vocab-detail-card text-xs bg-brand-indigo p-2 rounded-md border border-purple-400/50 text-white/80">
                                                <strong>Example:</strong> The artist created an ephemeral masterpiece with sidewalk chalk.
                                            </div>
                                            <div className="demo-vocab-detail-card text-xs bg-brand-indigo p-2 rounded-md border border-yellow-400/50 text-white/80">
                                                <strong>Deep Dive:</strong> From Greek "ephemeros", meaning "lasting for a day".
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-20" data-anim-section>
                    <p data-anim className="text-lg text-white/80">
                        See it in action — <a href="#demo-section" onClick={(e) => { e.preventDefault(); document.getElementById('demo-section')?.scrollIntoView({behavior: 'smooth'})}} className="font-bold text-brand-gold hover:text-yellow-300 underline">try our interactive demo below</a>.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;