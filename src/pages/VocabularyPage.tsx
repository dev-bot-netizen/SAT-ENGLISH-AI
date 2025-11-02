import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { User } from '@/services/firebase';
import { getVocabularyList, getWordDetails, getPronunciationAudio, submitWordReview, bulkUpdateWords } from '@/services/vocabularyService';
import { getReviewQueue } from '@/services/vocabularyService';
import type { VocabularyWord, WordDetails, VocabularyWordStatus, UserProfile } from '@/types';
import { ProgressiveAcademicCapIcon } from '@/components/icons/ProgressiveAcademicCapIcon';
import { ErrorIcon } from '@/components/icons/ErrorIcon';
import ReactMarkdown from 'react-markdown';
import { SpeakerIcon } from '@/components/icons/SpeakerIcon';
import { SpinnerIcon } from '@/components/icons/SpinnerIcon';
import PremiumGate from '@/components/PremiumGate';
import { AcademicCapIcon } from '@/components/icons/AcademicCapIcon';
import { CheckCircleIcon } from '@/components/icons/CheckCircleIcon';
import VocabularyQuiz from '@/components/vocabulary/VocabularyQuiz';
import { PencilIcon } from '@/components/icons/PencilIcon';
import { ChevronDownIcon } from '@/components/icons/ChevronDownIcon';

interface VocabularyPageProps {
    user: User | null;
    isGuest: boolean;
    userProfile: UserProfile | null;
    onShowUpgradeModal: () => void;
    onAuthRedirect: () => void;
}

type ViewMode = 'dashboard' | 'session' | 'summary' | 'quiz';

const vocabLoadingMessages = [
    "Consulting the dictionary...", "Analyzing contextual usage...", "Tracing the word's origin...",
    "Crafting example sentences...", "Preparing a deep dive...", "Finalizing the details..."
];

const TABS: VocabularyWordStatus[] = ['new', 'review', 'mastered'];

const ACCENTS = [
    { code: 'en-US', label: 'American' },
    { code: 'en-GB', label: 'British' },
    { code: 'en-IN', label: 'Indian' },
];


const VocabularyPage: React.FC<VocabularyPageProps> = ({ user, isGuest, userProfile, onShowUpgradeModal, onAuthRedirect }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
    const [vocabList, setVocabList] = useState<VocabularyWord[]>([]);
    const [reviewQueue, setReviewQueue] = useState<VocabularyWord[]>([]);
    const [wordDetailsCache, setWordDetailsCache] = useState<Record<string, WordDetails>>({});

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Session State
    const [sessionIndex, setSessionIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sessionWords, setSessionWords] = useState<VocabularyWord[]>([]);

    // Details State
    const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
    const [detailsError, setDetailsError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState(vocabLoadingMessages[0]);
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
    const [selectedAccent, setSelectedAccent] = useState('en-US');

    const userId = user ? user.uid : null;

    const fetchAllData = useCallback(async () => {
        if (!userId) return;
        setIsLoading(true);
        setError(null);
        try {
            const [list, queue] = await Promise.all([
                getVocabularyList(userId),
                getReviewQueue()
            ]);
            setVocabList(list);
            setReviewQueue(queue);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load vocabulary.');
        } finally {
            setIsLoading(false);
        }
    }, [userId]);


    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);
    
    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>;
        if (isLoadingDetails) {
            setLoadingMessage(vocabLoadingMessages[0]);
            let messageIndex = 0;
            const scheduleNext = () => {
                timeoutId = setTimeout(() => {
                    messageIndex = (messageIndex + 1) % vocabLoadingMessages.length;
                    setLoadingMessage(vocabLoadingMessages[messageIndex]);
                    scheduleNext();
                }, 2500);
            };
            scheduleNext();
        }
        return () => clearTimeout(timeoutId);
    }, [isLoadingDetails]);

    const startSession = () => {
        setSessionWords(reviewQueue);
        setSessionIndex(0);
        setIsFlipped(false);
        setDetailsError(null);
        setViewMode('session');
    };

    const currentWord = sessionWords[sessionIndex];

    const handleFlip = useCallback(async () => {
        if (isFlipped || !currentWord) return;
        
        setIsFlipped(true);
        if (wordDetailsCache[currentWord.word]) return;

        setIsLoadingDetails(true);
        setDetailsError(null);
        try {
            const details = await getWordDetails(currentWord.word, currentWord.contextPassage);
            setWordDetailsCache(prev => ({ ...prev, [currentWord.word]: details }));
        } catch (e) {
            setDetailsError(e instanceof Error ? e.message : `Failed to load details.`);
        } finally {
            setIsLoadingDetails(false);
        }
    }, [isFlipped, currentWord, wordDetailsCache]);

    const advanceToNextCard = useCallback(() => {
        if (sessionIndex < sessionWords.length - 1) {
            setSessionIndex(prev => prev + 1);
            setIsFlipped(false);
            setDetailsError(null);
        } else {
            setViewMode('summary');
        }
        setIsSubmitting(false);
    }, [sessionIndex, sessionWords.length]);


    const handleReview = async (performance: 'again' | 'good') => {
        if (!currentWord || isSubmitting) return;
        
        setIsSubmitting(true);
        
        try {
            await submitWordReview(currentWord._id, performance);
            setTimeout(advanceToNextCard, 300);
        } catch (err) {
            setDetailsError(err instanceof Error ? err.message : 'Failed to save review.');
            setIsSubmitting(false);
        }
    };

    const handleMarkAsKnown = async () => {
        if (!currentWord || isSubmitting || currentWord.status !== 'new') return;
        setIsSubmitting(true);
        try {
            await submitWordReview(currentWord._id, 'good'); // 'good' on a new word moves it to review
            setTimeout(advanceToNextCard, 300);
        } catch (err) {
            setDetailsError(err instanceof Error ? err.message : 'Failed to update word.');
            setIsSubmitting(false);
        }
    };
    
    const handleSpeak = useCallback(async (text: string, accent: string) => {
        if (isSpeaking) return;
        setIsSpeaking(true);
        setDetailsError(null);
        try {
            const audioBase64 = await getPronunciationAudio(text, accent);
            const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
            audio.play();
            audio.onended = () => setIsSpeaking(false);
            audio.onerror = () => setIsSpeaking(false);
        } catch (e) {
            setDetailsError(e instanceof Error ? e.message : 'Could not fetch pronunciation.');
            setIsSpeaking(false);
        }
    }, [isSpeaking]);
    
    const wordsInReview = useMemo(() => vocabList.filter(w => w.status === 'review'), [vocabList]);
    
    const wordsForQuiz = useMemo(() => {
        // The quiz is an optional path to 'mastered' and is available for any 10+ words in review,
        // not just those currently due in the SRS queue.
        const sortedReviewWords = [...wordsInReview].sort((a, b) => new Date(a.nextReviewDate || 0).getTime() - new Date(b.nextReviewDate || 0).getTime());
        // Take up to 20 words for the quiz. The button logic ensures we have at least 10.
        return sortedReviewWords.slice(0, 20);
    }, [wordsInReview]);


    const startQuiz = () => {
        if (wordsForQuiz.length > 0) {
            setViewMode('quiz');
        }
    };
    
    const handleQuizComplete = async (results: { wordId: string; isCorrect: boolean }[]) => {
        const updates = results.map(result => ({
            wordId: result.wordId,
            status: result.isCorrect ? 'mastered' as const : undefined,
            performance: result.isCorrect ? undefined : 'again' as const,
        }));
        
        try {
            await bulkUpdateWords(updates);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to save quiz results.');
        } finally {
            await fetchAllData();
            setViewMode('dashboard');
        }
    };
    
    const PronunciationControls: React.FC<{ word: string }> = ({ word }) => {
        const [showAccentMenu, setShowAccentMenu] = useState(false);
        const buttonRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                    setShowAccentMenu(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, []);

        const speak = (accent: string) => {
            handleSpeak(word, accent);
            setSelectedAccent(accent);
            setShowAccentMenu(false);
        };

        return (
            <div ref={buttonRef} className="relative inline-flex items-center bg-black/20 border border-brand-lavender/30 rounded-full">
                <button onClick={() => speak(selectedAccent)} disabled={isSpeaking} className="p-2 rounded-l-full text-white/60 hover:bg-white/10 transition-colors" aria-label="Play pronunciation">
                    {isSpeaking ? <SpinnerIcon className="w-6 h-6" /> : <SpeakerIcon className="w-6 h-6" />}
                </button>
                <div className="border-l border-brand-lavender/30 h-6"></div>
                <button onClick={() => setShowAccentMenu(prev => !prev)} className="px-2 py-2 rounded-r-full text-white/60 hover:bg-white/10 transition-colors" aria-haspopup="true" aria-expanded={showAccentMenu}>
                     <ChevronDownIcon className="w-5 h-5" />
                </button>

                {showAccentMenu && (
                    <div className="absolute top-full right-0 mt-2 w-36 bg-brand-indigo border border-brand-lavender/20 rounded-md shadow-lg z-10 animate-modal-enter">
                        {ACCENTS.map(accent => (
                            <button key={accent.code} onClick={() => speak(accent.code)} className="w-full text-left px-4 py-2 text-sm text-white/80 hover:bg-white/10 flex items-center justify-between">
                                <span>{accent.label}</span>
                                {selectedAccent === accent.code && <CheckCircleIcon className="w-4 h-4 text-brand-lavender" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderFlashcard = () => {
        if (!currentWord) return null;

        return (
            <div className="w-full max-w-2xl mx-auto space-y-6">
                <p className="text-center text-sm text-white/60 font-semibold">{sessionIndex + 1} / {sessionWords.length}</p>
                <div className="relative w-full h-96 [perspective:1000px]">
                    <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                        {/* Front */}
                        <div className="absolute w-full h-full bg-black/20 border border-brand-lavender/20 rounded-xl flex flex-col items-center justify-center p-6 [backface-visibility:hidden] shadow-2xl shadow-brand-lavender/10">
                            <h2 className="text-4xl lg:text-5xl font-bold text-white capitalize">{currentWord.word}</h2>
                            <div className="absolute top-4 right-4">
                                <PronunciationControls word={currentWord.word} />
                            </div>
                        </div>
                        {/* Back */}
                        <div className="absolute w-full h-full bg-black/20 border border-brand-lavender/20 rounded-xl [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-hidden shadow-2xl shadow-brand-lavender/10">
                            {isLoadingDetails ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <ProgressiveAcademicCapIcon className="w-16 h-16 mb-4 text-brand-lavender" />
                                    <p className="font-semibold text-white">{loadingMessage}</p>
                                </div>
                            ) : detailsError ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-4 text-red-400">
                                    <ErrorIcon className="w-10 h-10 mb-4" />
                                    <p className="font-semibold">Error</p>
                                    <p className="text-sm text-red-500">{detailsError}</p>
                                </div>
                            ) : wordDetailsCache[currentWord.word] ? (
                                <div className="p-6 h-full text-sm overflow-y-auto">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-white capitalize">{currentWord.word}</h3>
                                        <PronunciationControls word={currentWord.word} />
                                    </div>
                                    {wordDetailsCache[currentWord.word].pronunciation && <p className="text-white/60 -mt-2 mb-3">{wordDetailsCache[currentWord.word].pronunciation}</p>}
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold text-brand-lavender mb-1">Definition</h4>
                                            <p className="text-white/90">{wordDetailsCache[currentWord.word].definition}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-brand-lavender mb-1">In Context</h4>
                                            <blockquote className="border-l-4 border-brand-lavender/30 pl-4 text-white/60 italic">
                                                <ReactMarkdown>{currentWord.contextPassage}</ReactMarkdown>
                                            </blockquote>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-brand-lavender mb-1">Examples</h4>
                                            <ul className="list-disc list-inside space-y-1 pl-2 text-white/90">
                                                {wordDetailsCache[currentWord.word].exampleSentences.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-brand-lavender mb-1">Deep Dive</h4>
                                            <p className="text-white/90">{wordDetailsCache[currentWord.word].deepDive}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>

                 <div className="flex items-center justify-center h-14">
                    {!isFlipped ? (
                        <div className="flex items-center gap-4">
                            {currentWord.status === 'new' && (
                                <button onClick={handleMarkAsKnown} disabled={isSubmitting} className="bg-white/10 text-white font-semibold py-3 px-8 rounded-lg hover:bg-white/20 disabled:bg-white/5 transition-colors">
                                    I Know This
                                </button>
                            )}
                            <button onClick={handleFlip} className="bg-brand-violet text-white font-bold py-3 px-12 rounded-lg hover:bg-brand-lavender hover:text-brand-indigo transition-transform hover:scale-105">
                                Show Answer
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-4 animate-modal-enter">
                            <button onClick={() => handleReview('again')} disabled={isSubmitting || isLoadingDetails} className="bg-red-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-red-500 disabled:bg-brand-lavender/20 disabled:text-white/50">Again</button>
                            <button onClick={() => handleReview('good')} disabled={isSubmitting || isLoadingDetails} className="bg-green-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-green-500 disabled:bg-brand-lavender/20 disabled:text-white/50">Good</button>
                        </div>
                    )}
                </div>
            </div>
        );
    };
    
    const StatCard: React.FC<{ icon: React.ReactNode; title: string; count: number; buttonText: string; onClick: () => void; disabled: boolean; id?: string }> = ({ icon, title, count, buttonText, onClick, disabled, id }) => (
        <div id={id} className="bg-brand-lilac/5 border border-brand-lavender/20 rounded-2xl p-6 backdrop-blur-xl hover:border-brand-lavender/50 transition-all duration-300 text-center flex flex-col items-center">
            {icon}
            <h3 className="text-xl font-bold text-white mt-4">{title}</h3>
            <p className="text-white/70 mt-2 flex-grow">You have <span className="font-bold text-brand-lavender">{count}</span> {count === 1 ? 'word' : 'words'} {title === 'Study Session' ? 'to study' : 'ready for a quiz'}.</p>
            <button
                onClick={onClick}
                disabled={disabled}
                className="mt-6 w-full bg-brand-violet text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-lavender hover:text-brand-indigo transition-colors disabled:bg-brand-lavender/20 disabled:text-white/50 disabled:cursor-not-allowed"
            >
                {buttonText}
            </button>
        </div>
    );

    const renderDashboard = () => (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <StatCard 
                        id="walkthrough-study-session-card"
                        icon={<AcademicCapIcon className="w-12 h-12 text-brand-lavender" />}
                        title="Study Session"
                        count={reviewQueue.length}
                        buttonText={isLoading ? 'Loading...' : reviewQueue.length === 0 ? "All Caught Up!" : "Start Studying"}
                        onClick={startSession}
                        disabled={isLoading || reviewQueue.length === 0}
                    />
                    <StatCard 
                        icon={<PencilIcon className="w-12 h-12 text-brand-lavender" />}
                        title="Adaptive Quiz"
                        count={wordsInReview.length}
                        buttonText={wordsInReview.length < 10 ? `Need ${10 - wordsInReview.length} more words` : "Start Quiz"}
                        onClick={startQuiz}
                        disabled={isLoading || wordsInReview.length < 10}
                    />
                </div>

                <div className="lg:col-span-1 bg-brand-lilac/5 border border-brand-lavender/20 rounded-2xl p-6 backdrop-blur-xl">
                    <h3 className="text-xl font-bold text-white mb-4">My Vocabulary Lists</h3>
                    <p className="text-sm text-white/70 mb-4">Browse all the words you've collected. The status is automatically updated during study sessions.</p>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {TABS.map(status => {
                            const wordsInStatus = vocabList.filter(w => w.status === status);
                            return (
                                <details key={status} className="bg-black/20 rounded-lg group" open={status !== 'mastered'}>
                                    <summary className="font-semibold text-brand-lavender capitalize p-3 cursor-pointer list-none flex justify-between items-center">
                                        <span>{status} ({wordsInStatus.length})</span>
                                        <ChevronDownIcon className="w-5 h-5 transition-transform group-open:rotate-180" />
                                    </summary>
                                    <div className="p-3 border-t border-brand-lavender/20">
                                        {wordsInStatus.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {wordsInStatus.map(w => (
                                                    <span key={w._id} className="capitalize bg-brand-lavender/10 text-brand-lavender text-xs font-medium px-2.5 py-1 rounded-full">{w.word}</span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-white/50 text-xs italic">No words in this list yet.</p>
                                        )}
                                    </div>
                                </details>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
    
    const renderSummary = () => (
        <div className="bg-brand-lilac/5 border border-brand-lavender/20 rounded-2xl p-8 backdrop-blur-xl text-center animate-modal-enter">
            <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Session Complete!</h2>
            <p className="text-white/70 mb-6">You've reviewed all your due words for today. Great job!</p>
            <button
                onClick={() => {
                    setViewMode('dashboard');
                    fetchAllData();
                }}
                className="bg-brand-violet text-white font-bold py-3 px-8 rounded-lg hover:bg-brand-lavender hover:text-brand-indigo"
            >
                Back to Dashboard
            </button>
        </div>
    );

    const renderContent = () => {
        if (isLoading) return <div className="text-center p-8"><SpinnerIcon className="w-10 h-10 mx-auto text-brand-lavender" /></div>;
        if (error) return <div className="p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-center">{error}</div>;

        switch(viewMode) {
            case 'session': return renderFlashcard();
            case 'summary': return renderSummary();
            case 'quiz': return <VocabularyQuiz words={wordsForQuiz} onQuizComplete={handleQuizComplete} />;
            case 'dashboard':
            default:
                return renderDashboard();
        }
    };
    
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Personal Vocabulary Trainer</h2>
                <p className="text-white/70">Master challenging words from your practice tests with AI-powered, spaced repetition flashcards.</p>
            </div>
            <PremiumGate userProfile={userProfile} isGuest={isGuest} onUpgradeClick={isGuest ? onAuthRedirect : onShowUpgradeModal} featureName="Vocabulary Trainer">
                {renderContent()}
            </PremiumGate>
        </div>
    );
};

export default VocabularyPage;
