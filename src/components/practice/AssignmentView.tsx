import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import type { Question, Highlight, VocabularyWord } from '@/types';
import { useTimer } from '@/hooks/useTimer';
import QuestionTextRenderer from '@/components/QuestionTextRenderer';
import LockdownWarningModal from './LockdownWarningModal';
import QuestionNavigationPanel from './QuestionNavigationPanel';
import HighlightToolbar from './HighlightToolbar';
import NotesPanel from './NotesPanel';
import { ChevronLeftIcon } from '@/components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '@/components/icons/ChevronRightIcon';
import { GridIcon } from '@/components/icons/GridIcon';
import SubmitConfirmationModal from './SubmitConfirmationModal';
import { MinusCircleIcon } from '@/components/icons/MinusCircleIcon';
import TextSelectionPopup from './TextSelectionPopup';
import { addWordsToVocab } from '@/services/vocabularyService';
import type { User } from '@/services/firebase';

interface AssignmentViewProps {
    questions: Question[];
    userAnswers: Record<number, string>;
    highlights: Record<number, Highlight[]>;
    strikethroughs: Record<number, string[]>;
    onAnswerSelect: (questionId: number, answer: string) => void;
    onHighlightsChange: (questionId: number, highlights: Highlight[]) => void;
    onStrikethroughToggle: (questionId: number, optionLetter: string) => void;
    onSubmit: () => void;
    onPause: (currentTime: number) => void;
    onTimeUp: () => void;
    timeLimitInSeconds: number;
    isLockdownEnabled: boolean;
    user: User | null;
    isGuest: boolean;
    vocabularyList: VocabularyWord[];
    onWordAddedToVocab: (word: string, context: string, questionId: number) => void;
}

const AssignmentView: React.FC<AssignmentViewProps> = ({ 
    questions, 
    userAnswers, 
    highlights,
    strikethroughs,
    onAnswerSelect, 
    onHighlightsChange,
    onStrikethroughToggle,
    onSubmit, 
    onPause,
    onTimeUp,
    timeLimitInSeconds, 
    isLockdownEnabled,
    user,
    isGuest,
    vocabularyList,
    onWordAddedToVocab
}) => {
    
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const { timeLeft, pauseTimer, resumeTimer } = useTimer(timeLimitInSeconds, onTimeUp);
    const [showWarning, setShowWarning] = useState(false);
    const [isReviewPanelOpen, setIsReviewPanelOpen] = useState(false);
    const [isHighlightMode, setIsHighlightMode] = useState(false);
    const [isStrikethroughMode, setIsStrikethroughMode] = useState(false);
    const [activeColor, setActiveColor] = useState<'yellow' | 'pink' | 'cyan'>('yellow');
    const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
    const [isConfirmingSubmit, setIsConfirmingSubmit] = useState(false);
    const [selectionPopup, setSelectionPopup] = useState<{ top: number; left: number; word: string } | null>(null);

    const infractionCount = useRef(0);
    const isSubmitted = useRef(false);
    const questionContainerRef = useRef<HTMLDivElement>(null);

    const vocabWordSet = useMemo(() => new Set(vocabularyList.map(v => v.word.toLowerCase())), [vocabularyList]);

    const currentQuestion = questions[currentQuestionIndex];
    const highlightsForCurrentQuestion = highlights[currentQuestion.id] || [];

    useEffect(() => {
        // Clear any popups or modes when question changes
        setSelectionPopup(null);
        setActiveHighlightId(null);
    }, [currentQuestionIndex]);
    
    useEffect(() => {
        // Hide vocab popup if highlight/strikethrough mode is activated
        if (isHighlightMode || isStrikethroughMode) {
            setSelectionPopup(null);
        }
    }, [isHighlightMode, isStrikethroughMode]);

    const handleReturnToTest = useCallback(() => {
        setShowWarning(false);
        resumeTimer();
        document.documentElement.requestFullscreen().catch(err => {
            console.error("Could not re-enter fullscreen:", err);
        });
    }, [resumeTimer]);

    const handleInfraction = useCallback(() => {
        if (showWarning || isSubmitted.current) return;
        
        infractionCount.current += 1;
        if (infractionCount.current === 1) {
            pauseTimer();
            setShowWarning(true);
        } else if (infractionCount.current >= 2) {
            isSubmitted.current = true;
            onTimeUp();
        }
    }, [onTimeUp, pauseTimer, showWarning]);
    
    useEffect(() => {
        if (!isLockdownEnabled) return;

        document.documentElement.requestFullscreen().catch(err => {
          console.warn(`Could not enter fullscreen mode: ${err.message}. Lockdown mode may not be fully effective.`);
        });

        const handleVisibilityChange = () => {
            if (document.hidden) handleInfraction();
        };
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) handleInfraction();
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
        };
    }, [isLockdownEnabled, handleInfraction]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleJumpToQuestion = (index: number) => {
        setCurrentQuestionIndex(index);
        setIsReviewPanelOpen(false);
    };

    const handleHighlightSelection = () => {
        if (!isHighlightMode || !questionContainerRef.current) return;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

        const range = selection.getRangeAt(0);
        const container = questionContainerRef.current;

        if (!container.contains(range.commonAncestorContainer)) return;
        
        // Create a range from the start of the container to the start of the selection
        const preSelectionRange = document.createRange();
        preSelectionRange.selectNodeContents(container);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);

        // The length of the string version of this range is our start index
        const startIndex = preSelectionRange.toString().length;
        const selectedText = range.toString();
        const endIndex = startIndex + selectedText.length;

        if (startIndex >= endIndex || selectedText.trim() === '') {
            selection.removeAllRanges();
            return;
        }

        const newHighlight: Highlight = {
            id: crypto.randomUUID(),
            startIndex,
            endIndex,
            text: selectedText,
            color: activeColor,
            note: '',
        };
        
        onHighlightsChange(currentQuestion.id, [...highlightsForCurrentQuestion, newHighlight]);
        setActiveHighlightId(newHighlight.id);
        selection.removeAllRanges();
    };

    const handleMouseUp = (event: React.MouseEvent) => {
        // If we clicked on the popup itself, do nothing
        if ((event.target as HTMLElement).closest('.text-selection-popup')) {
            return;
        }

        if (isHighlightMode) {
            handleHighlightSelection();
            setSelectionPopup(null);
        } else {
            const selection = window.getSelection();
            if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
                 if (!questionContainerRef.current?.contains(selection.anchorNode)) {
                    setSelectionPopup(null);
                    return;
                }
                const selectedText = selection.toString().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
                const lowercasedSelectedText = selectedText.toLowerCase();

                // Check if word is already in vocab or is invalid for adding
                if (
                    !lowercasedSelectedText ||
                    vocabWordSet.has(lowercasedSelectedText) ||
                    lowercasedSelectedText.length <= 1 || 
                    lowercasedSelectedText.length >= 30 || 
                    /^\d+$/.test(lowercasedSelectedText) || 
                    lowercasedSelectedText.split(' ').length > 3
                ) {
                    setSelectionPopup(null);
                    return;
                }

                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                const containerRect = questionContainerRef.current?.getBoundingClientRect();

                if (containerRect) {
                    setSelectionPopup({
                        top: rect.bottom - containerRect.top + 5,
                        left: rect.left - containerRect.left + (rect.width / 2),
                        word: selectedText
                    });
                }
            } else {
                 setSelectionPopup(null);
            }
        }
    };

    const handleAddWordToVocab = () => {
        if (selectionPopup && (user || isGuest)) {
            const { word } = selectionPopup;
            // Fire-and-forget API call, it handles its own errors silently
            addWordsToVocab(user ? user.uid : null, [word], currentQuestion.questionText, currentQuestion.id);
            // Optimistic UI update via callback to parent
            onWordAddedToVocab(word, currentQuestion.questionText, currentQuestion.id);
            setSelectionPopup(null);
        }
    };

    const handleNoteChange = (highlightId: string, newNote: string) => {
        const updatedHighlights = highlightsForCurrentQuestion.map(h =>
            h.id === highlightId ? { ...h, note: newNote } : h
        );
        onHighlightsChange(currentQuestion.id, updatedHighlights);
    };

    const deleteHighlight = (highlightId: string) => {
        const updatedHighlights = highlightsForCurrentQuestion.filter(h => h.id !== highlightId);
        onHighlightsChange(currentQuestion.id, updatedHighlights);
        if (activeHighlightId === highlightId) {
            setActiveHighlightId(null);
        }
    };

    const handleSubmitClick = () => {
        const unansweredCount = questions.length - Object.keys(userAnswers).length;
        if (unansweredCount > 0) {
            setIsConfirmingSubmit(true);
        } else {
            onSubmit();
        }
    };

    const handleConfirmAndSubmit = () => {
        setIsConfirmingSubmit(false);
        onSubmit();
    };

    const handlePause = () => {
        pauseTimer();
        onPause(timeLeft);
    };

    return (
        <>
            <SubmitConfirmationModal
                isOpen={isConfirmingSubmit}
                onConfirm={handleConfirmAndSubmit}
                onCancel={() => setIsConfirmingSubmit(false)}
                unansweredCount={questions.length - Object.keys(userAnswers).length}
            />
            <LockdownWarningModal isOpen={showWarning} onReturn={handleReturnToTest} />
            <QuestionNavigationPanel 
                isOpen={isReviewPanelOpen}
                onClose={() => setIsReviewPanelOpen(false)}
                onJumpToQuestion={handleJumpToQuestion}
                questions={questions}
                userAnswers={userAnswers}
                currentIndex={currentQuestionIndex}
            />

            <div className="flex flex-col h-full -my-8 md:-my-12">
                <div className="bg-brand-indigo/80 backdrop-blur-sm py-3 z-10 border-b border-brand-lavender/10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <h2 className="text-xl md:text-2xl font-bold text-white">SAT English Practice</h2>
                        <div className="flex items-center space-x-4">
                             <button
                                onClick={handlePause}
                                className="bg-brand-gold text-brand-indigo font-bold py-2 px-4 rounded-lg hover:bg-yellow-300 transition-colors"
                            >
                                Pause Test
                            </button>
                            <div className="text-2xl font-mono bg-black/20 text-white px-4 py-2 rounded-lg border border-brand-lavender/30">
                                {formatTime(timeLeft)}
                            </div>
                            <button onClick={() => setIsReviewPanelOpen(true)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" aria-label="Review questions">
                                <GridIcon className="w-6 h-6 text-white/70" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-grow py-8 grid grid-cols-1 md:grid-cols-4 gap-8 min-h-0">
                    <div className={`relative transition-all duration-300 ${isHighlightMode ? 'md:col-span-3' : 'md:col-span-4'}`}>
                         {selectionPopup && (
                            <TextSelectionPopup 
                                position={{ top: selectionPopup.top, left: selectionPopup.left }} 
                                onAdd={handleAddWordToVocab}
                            />
                        )}
                        {currentQuestion && (
                            <div className="bg-brand-lilac/5 border border-brand-lavender/20 rounded-2xl p-6 md:p-8 backdrop-blur-xl h-full flex flex-col" onMouseUp={handleMouseUp}>
                                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                                    <p className="font-semibold text-white">Question {currentQuestionIndex + 1} of {questions.length}</p>
                                    <HighlightToolbar 
                                        isHighlightMode={isHighlightMode}
                                        setIsHighlightMode={setIsHighlightMode}
                                        activeColor={activeColor}
                                        setActiveColor={setActiveColor}
                                        isStrikethroughMode={isStrikethroughMode}
                                        setIsStrikethroughMode={setIsStrikethroughMode}
                                    />
                                </div>
                                <div ref={questionContainerRef} className="select-text flex-grow overflow-y-auto pr-2">
                                    <QuestionTextRenderer 
                                        text={currentQuestion.questionText} 
                                        highlights={highlightsForCurrentQuestion}
                                        isHighlightMode={isHighlightMode}
                                        onHighlightClick={setActiveHighlightId}
                                    />
                                </div>
                                <div className="space-y-3 pt-4 flex-shrink-0">
                                    {currentQuestion.options.map(opt => {
                                        const questionStrikethroughs = strikethroughs[currentQuestion.id] || [];
                                        const isStruckOut = questionStrikethroughs.includes(opt.letter);
                                        return (
                                             <div key={opt.letter} className="flex items-center space-x-3">
                                                {isStrikethroughMode && (
                                                    <button
                                                        onClick={() => onStrikethroughToggle(currentQuestion.id, opt.letter)}
                                                        className={`flex-shrink-0 p-1 rounded-full transition-colors ${
                                                            isStruckOut 
                                                                ? 'text-red-400 bg-red-900/50' 
                                                                : 'text-white/40 hover:text-white hover:bg-white/10'
                                                        }`}
                                                        aria-label={`${isStruckOut ? 'Remove strikethrough from' : 'Strikethrough'} option ${opt.letter}`}
                                                        aria-pressed={isStruckOut}
                                                    >
                                                        <MinusCircleIcon className="w-6 h-6" />
                                                    </button>
                                                )}
                                                <label className={`block w-full p-4 rounded-lg border-2 transition-colors cursor-pointer ${userAnswers[currentQuestion.id] === opt.letter ? 'bg-brand-violet/30 border-brand-lavender' : 'bg-black/20 border-brand-lavender/30 hover:border-brand-lavender'}`}>
                                                    <input
                                                        type="radio"
                                                        name={`question-${currentQuestion.id}`}
                                                        value={opt.letter}
                                                        checked={userAnswers[currentQuestion.id] === opt.letter}
                                                        onChange={() => onAnswerSelect(currentQuestion.id, opt.letter)}
                                                        className="hidden"
                                                    />
                                                    <span className={`font-bold mr-3 text-brand-lavender ${isStruckOut ? 'line-through text-white/50' : ''}`}>{opt.letter}.</span>
                                                    <span className={`text-white/90 ${isStruckOut ? 'line-through text-white/50' : ''}`}>{opt.text}</span>
                                                </label>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={`md:col-span-1 transition-all duration-300 ${isHighlightMode ? 'opacity-100' : 'opacity-0 -translate-x-4 pointer-events-none'} md:relative`}>
                        {isHighlightMode && (
                            <div className="h-full md:absolute md:inset-0">
                                <NotesPanel 
                                    highlights={highlightsForCurrentQuestion}
                                    onNoteChange={handleNoteChange}
                                    activeHighlightId={activeHighlightId}
                                    setActiveHighlightId={setActiveHighlightId}
                                    onDeleteHighlight={deleteHighlight}
                                />
                            </div>
                        )}
                    </div>
                </div>


                <div className="flex justify-between items-center mt-auto pb-4">
                    <button onClick={() => setCurrentQuestionIndex(i => i - 1)} disabled={currentQuestionIndex === 0} className="inline-flex items-center space-x-2 bg-white/10 text-white font-bold py-3 px-6 rounded-lg hover:bg-white/20 disabled:bg-white/5 disabled:text-white/40 disabled:cursor-not-allowed transition-colors">
                        <ChevronLeftIcon className="w-5 h-5" />
                        <span>Previous</span>
                    </button>

                    {currentQuestionIndex < questions.length - 1 ? (
                        <button onClick={() => setCurrentQuestionIndex(i => i + 1)} className="inline-flex items-center space-x-2 bg-brand-violet text-white font-bold py-3 px-6 rounded-lg hover:bg-brand-lavender hover:text-brand-indigo transition-colors">
                            <span>Next</span>
                            <ChevronRightIcon className="w-5 h-5" />
                        </button>
                    ) : (
                        <button onClick={handleSubmitClick} className="bg-brand-gold text-brand-indigo font-bold py-3 px-6 rounded-lg hover:bg-yellow-300 transition-colors">
                            Submit Assignment
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};

export default AssignmentView;