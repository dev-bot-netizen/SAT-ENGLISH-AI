import React from 'react';

const TrustSection: React.FC = () => {
  // The content of this section has been temporarily hidden as per your request.
  // To restore it, simply uncomment the original JSX below and the associated imports.
  return null;
};

export default TrustSection;

/*
// Original Imports:
import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { StarIcon } from '@/components/icons/StarIcon';
import BackgroundGlowWords from './BackgroundGlowWords';

// Original Component Code:
const testimonials = [
  {
    quote: "This app found my exact weak spots and made practice tests just for me. My SAT score jumped 150 points!",
    author: "Sarah Chen",
    class: "Class of 2025"
  },
  {
    quote: "I can turn any article into practice questions. Studying marine biology articles for SAT prep was genius!",
    author: "Marcus Rodriguez",
    class: "Class of 2024"
  },
  {
    quote: "The vocabulary trainer actually makes words memorable with those AI stories. Finally clicked for me.",
    author: "Priya Patel",
    class: "Class of 2025"
  },
  {
    quote: "The AI tutor is like having a private SAT expert 24/7. It explained grammar rules in a way that finally made sense.",
    author: "Jessica Lee",
    class: "Class of 2025"
  },
  {
    quote: "Being able to generate tests from my incorrect answers was a game-changer. I stopped making the same mistakes.",
    author: "David Kim",
    class: "Class of 2024"
  },
  {
    quote: "I used to hate SAT prep. This app made it feel less like a chore and more like a challenge I could actually beat.",
    author: "Emily Williams",
    class: "Class of 2025"
  }
];

const OriginalTrustSection: React.FC = () => {
    const component = useRef<HTMLDivElement>(null);
    const scrollerRef = useRef<HTMLDivElement>(null);
    const scrollerWrapperRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;
        
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            // For reduced motion, just show a grid layout, no animation.
            const parent = scroller.parentElement;
            if (parent) {
                parent.classList.remove('inline-flex', 'overflow-hidden', '[mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]');
                parent.classList.add('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-8');
                scroller.classList.remove('flex', '[&>div]:mx-4');
                scroller.classList.add('contents');
            }
            return;
        }
        
        // Duplicate the testimonials for a seamless loop
        // FIX: Explicitly cast the result of Array.from to HTMLElement[] to resolve a TypeScript error where `item` was inferred as `unknown`.
        const scrollerContent = Array.from(scroller.children) as HTMLElement[];
        scrollerContent.forEach(item => {
            const duplicatedItem = item.cloneNode(true) as HTMLElement;
            duplicatedItem.setAttribute('aria-hidden', 'true');
            scroller.appendChild(duplicatedItem);
        });

        const timeline = gsap.timeline({
            repeat: -1,
            defaults: { ease: 'none' }
        });
        
        // The total width of the original set of items
        const scrollWidth = scroller.scrollWidth / 2;
        const duration = scrollWidth / 75; // Adjust speed by changing the divisor

        timeline.to(scroller, {
            x: -scrollWidth,
            duration: duration,
        });

        // Pause on hover
        const scrollerWrapperEl = scrollerWrapperRef.current;
        const pauseAnimation = () => gsap.to(timeline, { timeScale: 0 });
        const playAnimation = () => gsap.to(timeline, { timeScale: 1 });
        
        scrollerWrapperEl?.addEventListener('mouseenter', pauseAnimation);
        scrollerWrapperEl?.addEventListener('mouseleave', playAnimation);

        return () => {
            timeline.kill();
            scrollerWrapperEl?.removeEventListener('mouseenter', pauseAnimation);
            scrollerWrapperEl?.removeEventListener('mouseleave', playAnimation);
        };
    }, []);

  return (
    <section ref={component} className="relative overflow-hidden py-20 sm:py-24 lg:py-32 bg-brand-indigo/50">
      <BackgroundGlowWords wordCount={15} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <div className="flex">
                {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="w-8 h-8 text-brand-gold" />
                ))}
            </div>
            <p className="text-xl font-bold text-white">4.8/5 stars</p>
            <p className="text-white/70">from 2,100+ SAT students</p>
        </div>
        <div ref={scrollerWrapperRef} className="mt-16 w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
            <div ref={scrollerRef} className="flex items-center justify-center md:justify-start [&>div]:mx-4">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-brand-lilac/10 border border-brand-lavender/20 rounded-xl p-6 text-left space-y-4 w-80 md:w-96 flex-shrink-0"
                >
                  <p className="text-white/90">"{testimonial.quote}"</p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-brand-violet rounded-full flex items-center justify-center font-bold text-white">
                        {testimonial.author.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{testimonial.author}</p>
                      <p className="text-sm text-brand-lavender/80">{testimonial.class}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        </div>
      </div>
    </section>
  );
};
*/
