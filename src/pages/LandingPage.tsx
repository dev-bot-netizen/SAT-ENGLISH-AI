import React, { useLayoutEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import LandingHeader from '@/components/landing/LandingHeader';
import HeroSection from '@/components/landing/HeroSection';
import TrustSection from '@/components/landing/TrustSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import DemoSection from '@/components/landing/DemoSection';
import PricingSection from '@/components/landing/PricingSection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import LandingFooter from '@/components/landing/LandingFooter';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
  onNavigateToApp: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToApp }) => {

  useLayoutEffect(() => {
    // Lenis for smooth scrolling
    const lenis = new Lenis();

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time: number) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // Reduced motion check
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
        ScrollTrigger.defaults({
            toggleActions: "play none none none",
        });
        gsap.set("[data-anim]", { opacity: 1, y: 0, clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' });
        return; // Skip complex animations
    }

    // Default animation settings
    gsap.utils.toArray<HTMLElement>("[data-anim-section]").forEach((section: HTMLElement) => {
        const timeline = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                end: 'bottom 20%',
                toggleActions: 'play none none none',
            },
        });
        
        // Find all animatable elements within the section
        const elements = section.querySelectorAll('[data-anim]');
        
        timeline.fromTo(elements, {
            opacity: 0,
            y: 50,
        }, {
            opacity: 1,
            y: 0,
            duration: 1.2,
            stagger: 0.2,
            ease: 'power3.out',
        });
    });

    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach((trigger: ScrollTrigger) => trigger.kill());
      gsap.killTweensOf("[data-anim], [data-anim-section]");
    };
  }, []);

  return (
    <div className="bg-brand-indigo text-white font-sans">
      <LandingHeader onNavigateToApp={onNavigateToApp} />
      <main>
        <HeroSection onNavigateToApp={onNavigateToApp} />
        <TrustSection />
        <FeaturesSection />
        <DemoSection onNavigateToApp={onNavigateToApp} />
        <PricingSection onNavigateToApp={onNavigateToApp} />
        <FinalCTASection onNavigateToApp={onNavigateToApp} />
      </main>
      <LandingFooter />
      <Analytics />
      <SpeedInsights />
    </div>
  );
};

export default LandingPage;