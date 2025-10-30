import React, { useState, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SparklesIcon } from './icons/SparklesIcon';
import { AcademicCapIcon } from './icons/AcademicCapIcon';
import { PencilIcon } from './icons/PencilIcon';
import { ClockIcon } from './icons/ClockIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { CheckBadgeIcon } from './icons/CheckBadgeIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { TargetIcon } from './icons/TargetIcon';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { RectangleStackIcon } from './icons/RectangleStackIcon';
import type { Page } from '@/types';
import { SpeakerIcon } from './icons/SpeakerIcon';

interface WalkthroughProps {
    isOpen: boolean;
    onFinish: () => void;
    currentPage: Page;
    setPage: (page: Page) => void;
}

interface Step {
    targetId: string;
    title: string;
    description: string;
    page: Page;
    icon: React.ReactNode;
    position: 'top' | 'bottom' | 'left' | 'right';
}

const steps: Step[] = [
    {
        targetId: 'walkthrough-intro-dummy',
        title: 'Welcome to SAT Solver AI!',
        description: "Let's take a quick tour of your new AI-powered tutor for the SAT English section.",
        page: 'solver',
        icon: <SparklesIcon className="w-16 h-16 text-purple-400" />,
        position: 'bottom',
    },
    {
        targetId: 'walkthrough-solver-step',
        title: 'The AI Solver',
        description: "Stuck on a tough question? Upload a screenshot, and our AI will provide a detailed, step-by-step explanation.",
        page: 'solver',
        icon: <AcademicCapIcon className="w-16 h-16 text-purple-400" />,
        position: 'bottom',
    },
    {
        targetId: 'walkthrough-solution-step',
        title: 'Listen to Explanations',
        description: "After you solve a question, the explanation will appear here. Premium users can even use the Text-to-Speech button to have it read aloud.",
        page: 'solver',
        icon: <SpeakerIcon className="w-16 h-16 text-purple-400" />,
        position: 'top',
    },
    {
        targetId: 'walkthrough-practice-tab',
        title: 'The Practice Hub',
        description: "Ready to test your skills? The 'Practice' tab is your gateway to generating customized tests.",
        page: 'solver',
        icon: <PencilIcon className="w-16 h-16 text-purple-400" />,
        position: 'bottom',
    },
    {
        targetId: 'walkthrough-targeted-practice-button',
        title: 'Targeted Practice',
        description: "Use 'Targeted Practice' to create a test from screenshots of questions you've struggled with.",
        page: 'practice',
        icon: <TargetIcon className="w-16 h-16 text-purple-400" />,
        position: 'bottom',
    },
     {
        targetId: 'walkthrough-text-practice-button',
        title: 'Practice from Any Text',
        description: "With our Premium 'Text Practice' feature, you can paste any text and have the AI generate a quiz from it instantly.",
        page: 'practice',
        icon: <DocumentTextIcon className="w-16 h-16 text-purple-400" />,
        position: 'bottom',
    },
    {
        targetId: 'walkthrough-history-tab',
        title: 'Track Your Progress',
        description: "All your completed tests are saved in 'History'. Review your answers and watch your skills grow.",
        page: 'practice', 
        icon: <ClockIcon className="w-16 h-16 text-purple-400" />,
        position: 'bottom',
    },
    {
        targetId: 'walkthrough-vocabulary-tab',
        title: 'Build Your Vocabulary',
        description: "Challenging words from tests are saved here. Let's check out the Premium flashcard trainer.",
        page: 'history',
        icon: <BookOpenIcon className="w-16 h-16 text-purple-400" />,
        position: 'bottom',
    },
    {
        targetId: 'walkthrough-study-session-card',
        title: 'Spaced Repetition Flashcards',
        description: "Here you can start a study session with flashcards. The system uses spaced repetition to show you words at the perfect time to maximize retention.",
        page: 'vocabulary',
        icon: <RectangleStackIcon className="w-16 h-16 text-purple-400" />,
        position: 'bottom',
    },
    {
        targetId: 'walkthrough-end-dummy',
        title: "You're All Set!",
        description: "You're ready to start your journey to a higher SAT score. Good luck!",
        page: 'solver',
        icon: <CheckBadgeIcon className="w-16 h-16 text-purple-400" />,
        position: 'bottom',
    }
];

interface HighlightStyle {
    top?: number;
    left?: number;
    width?: number;
    height?: number;
    display?: string;
}

const Walkthrough: React.FC<WalkthroughProps> = ({ isOpen, onFinish, currentPage, setPage }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [highlightStyle, setHighlightStyle] = useState<HighlightStyle>({});
    const [tooltipStyle, setTooltipStyle] = useState<HighlightStyle>({});
    const [isPositioned, setIsPositioned] = useState(false);
    
    const tooltipRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const cleanup = () => {
            document.body.classList.remove('walkthrough-active');
            delete document.body.dataset.walkthroughStep;
        };

        if (!isOpen) {
            setIsPositioned(false);
            cleanup();
            return;
        }

        document.body.classList.add('walkthrough-active');

        const step = steps[currentStep];

        if (step.targetId) {
            document.body.dataset.walkthroughStep = step.targetId;
        } else {
            delete document.body.dataset.walkthroughStep;
        }

        const positionElements = (retries = 5) => {
            let targetElement: HTMLElement | null = document.getElementById(step.targetId);
            
            if (step.targetId.includes('dummy')) {
                const dummyRect = {
                    top: window.innerHeight / 2 - 150,
                    left: window.innerWidth / 2,
                    width: 0,
                    height: 0,
                };
                setHighlightStyle({ display: 'none' });
                
                if (tooltipRef.current) {
                    const tooltipRect = tooltipRef.current.getBoundingClientRect();
                    setTooltipStyle({
                        top: dummyRect.top,
                        left: dummyRect.left - (tooltipRect.width / 2)
                    });
                }
                setIsPositioned(true);
                return;
            }

            if (!targetElement) {
                if (retries > 0) {
                    setTimeout(() => positionElements(retries - 1), 300);
                } else {
                    console.error(`Walkthrough failed to find target element after multiple retries: #${step.targetId}`);
                    setIsPositioned(false);
                }
                return;
            }

            targetElement.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });

            // A brief timeout to allow smooth scrolling to finish before measuring.
            setTimeout(() => {
                if (!document.getElementById(step.targetId)) return; // Re-check in case it disappeared

                const rect = document.getElementById(step.targetId)!.getBoundingClientRect();
                const PADDING = 10;
                setHighlightStyle({
                    top: rect.top - PADDING,
                    left: rect.left - PADDING,
                    width: rect.width + PADDING * 2,
                    height: rect.height + PADDING * 2,
                    display: 'block'
                });
                
                if (tooltipRef.current) {
                    const tooltipRect = tooltipRef.current.getBoundingClientRect();
                    let top = 0;
                    let left = 0;

                    switch (step.position) {
                        case 'bottom':
                            top = rect.bottom + PADDING;
                            left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                            break;
                        case 'top':
                            top = rect.top - tooltipRect.height - PADDING;
                            left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                            break;
                        case 'right':
                            top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                            left = rect.right + PADDING;
                            break;
                        case 'left':
                             top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                            left = rect.left - tooltipRect.width - PADDING;
                            break;
                    }

                    const MARGIN = 10;
                    if (left < MARGIN) left = MARGIN;
                    if (left + tooltipRect.width > window.innerWidth - MARGIN) {
                        left = window.innerWidth - tooltipRect.width - MARGIN;
                    }
                    if (top < MARGIN) top = MARGIN;
                    if (top + tooltipRect.height > window.innerHeight - MARGIN) {
                        top = window.innerHeight - tooltipRect.height - MARGIN;
                    }

                    setTooltipStyle({ top, left });
                }

                setIsPositioned(true);
            }, 200); // Wait for scroll to settle
        };

        setIsPositioned(false);

        if (currentPage !== step.page) {
            setPage(step.page);
            setTimeout(positionElements, 500); 
        } else {
            // Use a small timeout to ensure the DOM is ready for measurement
            setTimeout(positionElements, 100);
        }

        return cleanup;
    }, [currentStep, isOpen, currentPage, setPage]);
    
    if (!isOpen) return null;

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onFinish();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };
    
    const step = steps[currentStep];

    return createPortal(
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0" />
            
             <div
                className="absolute rounded-lg transition-all duration-300 ease-in-out"
                style={{
                    ...highlightStyle,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.8)',
                    opacity: isPositioned ? 1 : 0,
                }}
            />
           
            <div
                ref={tooltipRef}
                className="absolute bg-gray-900 rounded-xl border border-gray-800 w-full max-w-sm text-center p-6 shadow-2xl flex flex-col items-center transition-all duration-300 ease-in-out"
                style={{
                    ...tooltipStyle,
                    opacity: isPositioned ? 1 : 0,
                    transform: isPositioned ? 'translateY(0)' : 'translateY(10px)',
                }}
                role="dialog"
                aria-labelledby="walkthrough-title"
            >
                 <div className="mb-4">{step.icon}</div>
                
                <h2 id="walkthrough-title" className="text-xl font-bold text-white mb-2">{step.title}</h2>
                <p className="text-gray-400 mb-6 text-sm min-h-[3rem]">{step.description}</p>
                
                <div className="flex items-center justify-center space-x-2 mb-6">
                    {steps.map((_, index) => (
                        <div key={index} className={`w-2 h-2 rounded-full transition-colors ${index === currentStep ? 'bg-purple-500' : 'bg-gray-600'}`}></div>
                    ))}
                </div>

                <div className="w-full flex justify-between items-center">
                    <button
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                        className="inline-flex items-center space-x-2 bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeftIcon className="w-5 h-5" />
                        <span>Prev</span>
                    </button>

                    <button
                        onClick={handleNext}
                        className="inline-flex items-center space-x-2 bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-500 transition-colors"
                    >
                        <span>{currentStep === steps.length - 1 ? "Get Started" : "Next"}</span>
                        {currentStep < steps.length - 1 && <ChevronRightIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
            
            <div id="walkthrough-intro-dummy" style={{ display: 'none' }} />
            <div id="walkthrough-end-dummy" style={{ display: 'none' }} />
        </div>,
        document.body
    );
};

export default Walkthrough;