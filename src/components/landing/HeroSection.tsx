import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PlayCircleIcon } from '@/components/icons/PlayCircleIcon';
import { AcademicCapIcon } from '../icons/AcademicCapIcon';

gsap.registerPlugin(ScrollTrigger);

interface HeroSectionProps {
    onNavigateToApp: () => void;
}

const pathElements = [
    { type: 'text', content: '...which choice best states the...' },
    { type: 'choice', content: 'A' },
    { type: 'text', content: '...conform to the conventions of Standard English?' },
    { type: 'vocab', content: 'Ephemeral' },
    { type: 'choice', content: 'D' },
    { type: 'text', content: 'Based on the texts, both authors would...' },
    { type: 'choice', content: 'B' },
    { type: 'vocab', content: 'Ubiquitous' },
    { type: 'text', content: '...the function of the underlined portion...' },
    { type: 'choice', content: 'C' },
    { type: 'vocab', content: 'Dogmatic' },
    { type: 'text', content: 'Which choice most logically completes the text?' },
    { type: 'choice', content: 'A' },
    { type: 'text', content: '...a change in Earth\'s orbit that affected...' },
    { type: 'vocab', content: 'Garrulous' },
    { type: 'choice', content: 'C' },
    { type: 'text', content: '...the text most strongly suggest about...' },
];

const AscentPath = () => (
    <div className="ascent-path-container absolute inset-0 z-0 h-full w-full">
        <div className="destination-goal absolute top-[15%] right-[10%] opacity-0">
            <div className="absolute w-48 h-48 bg-brand-gold/50 rounded-full blur-3xl animate-pulse"></div>
            <AcademicCapIcon className="relative w-24 h-24 text-brand-gold/70" style={{ filter: "drop-shadow(0 0 15px #FFD700)" }} />
        </div>
        
        {pathElements.map((el, i) => {
            const top = 100 - (i * 5.5);
            const left = 20 + (i * 4) + (i % 2 === 0 ? -15 * Math.sin(i) : 15 * Math.sin(i));
            const rotation = -20 + (i * 2);

            let className = "path-element absolute";
            if (el.type === 'text') className += " text-white/20 text-xs w-48";
            if (el.type === 'choice') className += " text-brand-lavender/50 text-xl font-bold";
            if (el.type === 'vocab') className += " text-brand-gold/60 text-lg font-semibold";
            
            return (
                <div key={i} className={className} style={{ top: `${top}%`, left: `${left}%`, transform: `rotate(${rotation}deg)`}}>
                    {el.content}
                </div>
            )
        })}
    </div>
);

const AnimatedText: React.FC<{ text: string; className?: string }> = ({ text, className }) => (
    <span aria-label={text} className={className}>
        {text.split('').map((char, index) => (
            <span key={index} className="hero-char inline-block" style={{ willChange: 'transform, opacity' }}>
                {char === ' ' ? '\u00A0' : char}
            </span>
        ))}
    </span>
);

const HeroSection: React.FC<HeroSectionProps> = ({ onNavigateToApp }) => {
    const component = useRef<HTMLDivElement>(null);
    
    useLayoutEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        let ctx = gsap.context(() => {
            if (prefersReducedMotion) {
                gsap.set('.hero-char, [data-anim-hero], .path-element, .destination-goal', { opacity: 1, y: 0 });
                return;
            }

            const tl = gsap.timeline();

            tl.from(".hero-char", {
                y: 100,
                opacity: 0,
                stagger: 0.02,
                duration: 0.8,
                ease: 'power3.out'
            });

            tl.from("[data-anim-hero]", {
                y: 30,
                opacity: 0,
                duration: 1,
                stagger: 0.1,
                ease: 'power3.out'
            }, "-=0.5");

            gsap.from(".path-element", {
                y: 50,
                opacity: 0,
                duration: 1.5,
                stagger: {
                    each: 0.1,
                    from: "start"
                },
                ease: 'power4.out',
            });
            
            gsap.fromTo(".destination-goal", {
                scale: 0.5,
                opacity: 0,
            }, {
                scale: 1,
                opacity: 1,
                duration: 2,
                ease: 'elastic.out(1, 0.5)',
                delay: 1
            });
            
            gsap.utils.toArray<HTMLElement>('.path-element').forEach(el => {
                gsap.to(el, {
                    y: gsap.utils.random(-10, 10),
                    x: gsap.utils.random(-5, 5),
                    rotation: `+=${gsap.utils.random(-5, 5)}`,
                    repeat: -1,
                    yoyo: true,
                    duration: gsap.utils.random(4, 8),
                    ease: 'sine.inOut'
                });
            });

            gsap.to('.ascent-path-container', {
                y: -300,
                scale: 1.2,
                ease: 'none',
                scrollTrigger: {
                    trigger: component.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 1.5
                }
            });

        }, component);
        return () => ctx.revert();
    }, []);

    const handleDemoClick = () => {
        document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' });
    }

    return (
        <section ref={component} className="relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-hidden">
            <div className="absolute inset-0 bg-brand-indigo"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/az-subtle.png')] opacity-5"></div>
            
            <AscentPath />

            <div className="relative z-10 text-center px-4">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight">
                    <AnimatedText text="Your Ascent to a" className="block" />
                    <AnimatedText text="Perfect Score Starts Here" className="block text-brand-lavender" />
                </h1>
                <p data-anim-hero className="mt-6 max-w-2xl mx-auto text-lg text-white/80">
                    Upload any question, get instant solutions. Practice with AI-generated tests. Build vocabulary that sticks. Powered by Google Gemini.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={onNavigateToApp}
                        className="w-full sm:w-auto bg-brand-gold text-brand-indigo font-bold py-3 px-8 rounded-lg text-lg hover:bg-yellow-300 transition-transform hover:scale-105 duration-300"
                    >
                        Start Free Trial
                    </button>
                    <button
                        data-anim-hero
                        onClick={handleDemoClick}
                        className="w-full sm:w-auto flex items-center justify-center space-x-2 text-white font-medium py-3 px-8 rounded-lg hover:bg-white/10 transition-colors duration-300"
                    >
                        <PlayCircleIcon className="w-6 h-6" />
                        <span>Watch Demo</span>
                    </button>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
