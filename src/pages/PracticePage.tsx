

import React, { useState, useCallback, useEffect } from 'react';
import { generateSatAssignment, generateTargetedPracticeTest, generateFromText } from '@/services/geminiService';
import { saveAssignment, checkForPausedAssignment, getAssignmentDetails, deleteAssignment } from '@/services/assignmentService';
import { addWordsToVocab, getVocabularyList } from '@/services/vocabularyService';
import type { Question, Highlight, UserProfile, PastAssignmentSummary, PastAssignment, VocabularyWord } from '@/types';
import AssignmentStart from '@/components/practice/AssignmentStart';
import AssignmentView from '@/components/practice/AssignmentView';
import AssignmentReview from '@/components/practice/AssignmentReview';
import type { User } from '@/services/firebase';
import { SpinnerIcon } from '@/components/icons/SpinnerIcon';
import { ClockIcon } from '@/components/icons/ClockIcon';
import PausedTestModal from '@/components/practice/PausedTestModal';
import ImageUploader from '@/components/ImageUploader';
import TestCounter from '@/components/practice/TestCounter';
import ConfirmationModal from '@/components/ConfirmationModal';
import { ErrorIcon } from '@/components/icons/ErrorIcon';
import GeneratingTestView from '@/components/practice/GeneratingTestView';
import PremiumGate from '@/components/PremiumGate';
import { DocumentTextIcon } from '@/components/icons/DocumentTextIcon';

type AssignmentState = 'idle' | 'generating' | 'active' | 'review' | 'submitting' | 'submitting_timeup';
type PracticeTab = 'regular' | 'targeted' | 'text';

interface PracticePageProps {
    onTestActiveChange: (isActive: boolean) => void;
    user: User | null;
    isGuest: boolean;
    userProfile: UserProfile | null;
    assignmentToResume: PastAssignment | null;
    onTestResumed: () => void;
    preGeneratedAssignment: Question[] | null;
    onClearPreGeneratedAssignment: () => void;
    onTestGenerated: (questions: Question[]) => void;
    onRefreshProfile: () => void;
    onAssignmentCompleted: () => void;
    onShowUpgradeModal: () => void;
    onAuthRedirect: () => void;
}

interface PendingAssignmentOptions {
    timeInMinutes: number;
    topics: string[];
    difficulty: number;
    lockdownEnabled: boolean;
    customizations: string;
}

const PracticePage: React.FC<PracticePageProps> = ({ 
    onTestActiveChange, 
    user, 
    isGuest, 
    userProfile, 
    assignmentToResume, 
    onTestResumed, 
    preGeneratedAssignment, 
    onClearPreGeneratedAssignment,
    onTestGenerated,
    onRefreshProfile,
    onAssignmentCompleted,
    onShowUpgradeModal,
    onAuthRedirect,
}) => {
    const [assignmentState, setAssignmentState] = useState<AssignmentState>('idle');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [highlights, setHighlights] = useState<Record<number, Highlight[]>>({});
    const [strikethroughs, setStrikethroughs] = useState<Record<number, string[]>>({});
    const [score, setScore] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [timeLimit, setTimeLimit] = useState<number>(23 * 60);
    const [isLockdownEnabled, setIsLockdownEnabled] = useState<boolean>(false);
    
    const [assignmentOptions, setAssignmentOptions] = useState<{topics: string[], difficulty: number, customizations: string}>({topics: [], difficulty: 1, customizations: ''});

    const [pausedAssignment, setPausedAssignment] = useState<PastAssignmentSummary | null>(null);
    const [showPausedModal, setShowPausedModal] = useState(false);
    const [pendingAssignmentOptions, setPendingAssignmentOptions] = useState<PendingAssignmentOptions | null>(null);
    
    const [vocabularyList, setVocabularyList] = useState<VocabularyWord[]>([]);
    
    // New state for the hub
    const [activeTab, setActiveTab] = useState<PracticeTab>('regular');
    
    // State from former TargetedPracticePage
    const [files, setFiles] = useState<(File | null)[]>([null, null, null]);
    const [correctAnswers, setCorrectAnswers] = useState<string[]>(['', '', '']);
    const [isTargetedLoading, setIsTargetedLoading] = useState<boolean>(false);
    const [targetedError, setTargetedError] = useState<string | null>(null);
    const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
    const [hoveredUploaderIndex, setHoveredUploaderIndex] = useState<number | null>(null);
    
    // New state for Text Practice
    const [textInput, setTextInput] = useState<string>('');
    const [isTextLoading, setIsTextLoading] = useState<boolean>(false);
    const [textError, setTextError] = useState<string | null>(null);

    const resetTestState = () => {
        setAssignmentState('idle');
        setQuestions([]);
        setUserAnswers({});
        setScore(0);
        setError(null);
        setHighlights({});
        setStrikethroughs({});
        setPendingAssignmentOptions(null);
        setActiveTab('regular'); // Reset to default tab
    }

    useEffect(() => {
        onTestActiveChange(assignmentState === 'active');
        return () => onTestActiveChange(false);
    }, [assignmentState, onTestActiveChange]);
    
    useEffect(() => {
        const check = async () => {
            if ((user || isGuest) && assignmentState === 'idle') {
                const paused = await checkForPausedAssignment(user ? user.uid : null);
                setPausedAssignment(paused);
            }
        };
        check();
    }, [user, isGuest, assignmentState]);

    // This effect handles the walkthrough's need to switch to the targeted practice tab.
    useEffect(() => {
        const targetedPracticeSteps = [
            'walkthrough-targeted-practice-button',
            'walkthrough-targeted-uploader-0',
            'walkthrough-targeted-answer-0',
            'walkthrough-targeted-generate-button',
        ];
        const textPracticeSteps = ['walkthrough-text-practice-button'];

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-walkthrough-step') {
                    const stepId = (mutation.target as HTMLElement).dataset.walkthroughStep;
                    if (stepId && targetedPracticeSteps.includes(stepId)) {
                        setActiveTab('targeted');
                    }
                    if (stepId && textPracticeSteps.includes(stepId)) {
                        setActiveTab('text');
                    }
                }
            });
        });

        observer.observe(document.body, { attributes: true });

        // Initial check in case the component mounts when the attribute is already set
        const initialStepId = document.body.dataset.walkthroughStep;
        if (initialStepId && targetedPracticeSteps.includes(initialStepId)) {
            setActiveTab('targeted');
        }
        if (initialStepId && textPracticeSteps.includes(initialStepId)) {
            setActiveTab('text');
        }


        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const fetchVocab = async () => {
            if (user) {
                try {
                    const list = await getVocabularyList(user.uid);
                    setVocabularyList(list);
                } catch (e) {
                    console.error("Failed to fetch vocabulary list:", e);
                }
            } else {
                setVocabularyList([]);
            }
        };
        fetchVocab();
    }, [user]);

    const loadAssignment = useCallback((details: PastAssignment) => {
        setQuestions(details.questions);
        setUserAnswers(details.userAnswers || {});
        setHighlights(details.highlights || {});
        setStrikethroughs(details.strikethroughs || {});
        setTimeLimit(details.timeRemaining ?? details.timeLimitInSeconds);
        setAssignmentOptions({
            topics: details.topics,
            difficulty: details.difficulty,
            customizations: details.customizations || '',
        });
        setIsLockdownEnabled(false);
        setAssignmentState('active');
    }, []);

    useEffect(() => {
        if (assignmentToResume) {
            loadAssignment(assignmentToResume);
            onTestResumed();
        }
    }, [assignmentToResume, onTestResumed, loadAssignment]);
    
    const loadGeneratedAssignment = useCallback((generatedQuestions: Question[]) => {
        const questionCount = generatedQuestions.length;
        const baseTimePerQuestion = 23 * 60 / 20; // 69 seconds
        let timeLimit;
        
        if (questionCount > 0 && questionCount <= 5) { // For "Generate from Text"
            timeLimit = Math.ceil(questionCount * (75)); // 75 seconds per question
        } else { // For standard 20-question tests
            timeLimit = Math.ceil(questionCount * baseTimePerQuestion);
        }

        setQuestions(generatedQuestions);
        setTimeLimit(timeLimit);
        
        setUserAnswers({});
        setHighlights({});
        setStrikethroughs({});
        setIsLockdownEnabled(false);
        const testName = generatedQuestions[0]?.topic || 'AI Generated Practice';
        setAssignmentOptions({
            topics: [testName], 
            difficulty: generatedQuestions[0]?.difficulty || 2,
            customizations: 'Generated from user input',
        });
        setAssignmentState('active');
    }, []);

    useEffect(() => {
        if (preGeneratedAssignment && preGeneratedAssignment.length > 0) {
            loadGeneratedAssignment(preGeneratedAssignment);
            onClearPreGeneratedAssignment();
        }
    }, [preGeneratedAssignment, onClearPreGeneratedAssignment, loadGeneratedAssignment]);

    const startNewAssignment = useCallback(async (options: PendingAssignmentOptions) => {
        setAssignmentState('generating');
        setError(null);
        setUserAnswers({});
        setHighlights({});
        setStrikethroughs({});
        setTimeLimit(options.timeInMinutes * 60);
        setIsLockdownEnabled(options.lockdownEnabled);
        setAssignmentOptions({ topics: options.topics, difficulty: options.difficulty, customizations: options.customizations });

        try {
            const generatedQuestions = await generateSatAssignment(options.topics, options.difficulty, options.customizations);
            onRefreshProfile();
            setQuestions(generatedQuestions);
            setAssignmentState('active');
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            let displayError = `Failed to generate assignment: ${errorMessage}`;
            if (errorMessage.includes("limit")) {
                 displayError = errorMessage;
            }
            setError(displayError);
            setAssignmentState('idle');
        }
    }, [onRefreshProfile]);

    const handleStartAssignment = useCallback(async (timeInMinutes: number, topics: string[], difficulty: number, lockdownEnabled: boolean, customizations: string) => {
        const options = { timeInMinutes, topics, difficulty, lockdownEnabled, customizations };
        if (pausedAssignment) {
            setPendingAssignmentOptions(options);
            setShowPausedModal(true);
        } else {
            startNewAssignment(options);
        }
    }, [pausedAssignment, startNewAssignment]);

    const handleResumeTest = async () => {
        if (!pausedAssignment) return;
        setShowPausedModal(false);
        setAssignmentState('generating');
        try {
            const details = await getAssignmentDetails(pausedAssignment.id);
            if (!details) throw new Error("Paused assignment could not be found.");
            loadAssignment(details);
        } catch(e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to resume test: ${errorMessage}`);
            setAssignmentState('idle');
        }
    };
    
    const handleDiscardAndCreate = async () => {
        if (!pausedAssignment || !pendingAssignmentOptions) return;
        setShowPausedModal(false);
        setAssignmentState('generating');
        try {
            await deleteAssignment(pausedAssignment.id);
            setPausedAssignment(null);
            await startNewAssignment(pendingAssignmentOptions);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Error: ${errorMessage}`);
            setAssignmentState('idle');
        }
    };
    
    const handleAnswerSelect = (questionId: number, answer: string) => {
        setUserAnswers(prev => ({...prev, [questionId]: answer}));
    };

    const handleHighlightsChange = (questionId: number, newHighlights: Highlight[]) => {
        setHighlights(prev => ({ ...prev, [questionId]: newHighlights }));
    };

    const handleStrikethroughToggle = (questionId: number, optionLetter: string) => {
        setStrikethroughs(prev => {
            const currentStrikes = prev[questionId] || [];
            const newStrikes = currentStrikes.includes(optionLetter)
                ? currentStrikes.filter(l => l !== optionLetter)
                : [...currentStrikes, optionLetter];
            return { ...prev, [questionId]: newStrikes };
        });
    };

    const handleWordAddedToVocab = useCallback((word: string, contextPassage: string, sourceQuestionId: number) => {
        const newWordEntry: VocabularyWord = {
            _id: `temp-${word}-${Date.now()}`,
            word: word.toLowerCase(),
            contextPassage,
            sourceQuestionId,
            addedAt: new Date().toISOString(),
            status: 'new',
        };
        setVocabularyList(prevList => [...prevList, newWordEntry]);
    }, []);

    const handleSubmitAssignment = useCallback(async (source: 'user' | 'timer') => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        setAssignmentState(source === 'timer' ? 'submitting_timeup' : 'submitting');
        
        let currentScore = 0;
        questions.forEach(q => {
            if (userAnswers[q.id] === q.correctAnswer) {
                currentScore++;
            }
        });
        setScore(currentScore);

        if (user) {
            questions.forEach(q => {
                if (q.challengingWords && q.challengingWords.length > 0) {
                    addWordsToVocab(user.uid, q.challengingWords, q.questionText, q.id).catch(err => {
                        console.error("Failed to add challenging words to vocabulary:", err);
                    });
                }
            });
        }

        if (user || isGuest) {
            try {
                await saveAssignment(user ? user.uid : null, {
                    score: currentScore,
                    questions,
                    userAnswers,
                    highlights,
                    strikethroughs,
                    topics: assignmentOptions.topics,
                    difficulty: assignmentOptions.difficulty,
                    timeLimitInSeconds: timeLimit,
                    customizations: assignmentOptions.customizations,
                    status: 'completed',
                    timeRemaining: 0,
                });
                onAssignmentCompleted();

                if (pausedAssignment) {
                    await deleteAssignment(pausedAssignment.id);
                    setPausedAssignment(null);
                }

            } catch (error) {
                console.error("Failed to save assignment:", error);
            }
        }
        setAssignmentState('review');
    }, [questions, userAnswers, user, isGuest, highlights, strikethroughs, assignmentOptions, timeLimit, pausedAssignment, onAssignmentCompleted]);
    
    const handlePause = useCallback(async (currentTime: number) => {
        setAssignmentState('submitting');
        if (user || isGuest) {
            try {
                if (pausedAssignment) {
                     await deleteAssignment(pausedAssignment.id);
                }

                await saveAssignment(user ? user.uid : null, {
                    score: 0,
                    questions,
                    userAnswers,
                    highlights,
                    strikethroughs,
                    topics: assignmentOptions.topics,
                    difficulty: assignmentOptions.difficulty,
                    timeLimitInSeconds: timeLimit,
                    customizations: assignmentOptions.customizations,
                    status: 'paused',
                    timeRemaining: currentTime,
                });
            } catch (error) {
                console.error("Failed to save paused assignment:", error);
                setError("Could not save your paused test. Please try again.");
            }
        }
        resetTestState();
    }, [questions, userAnswers, user, isGuest, highlights, strikethroughs, assignmentOptions, timeLimit, pausedAssignment]);
    
    // Logic from TargetedPracticePage
    const handleImageUpload = (file: File | null, index: number) => {
        const newFiles = [...files];
        newFiles[index] = file;
        setFiles(newFiles);
    };
    
    useEffect(() => {
        const handleGlobalPaste = (event: ClipboardEvent) => {
            if (activeTab !== 'targeted' || hoveredUploaderIndex === null || isTargetedLoading) {
                return;
            }
        
            const items = event.clipboardData?.items;
            if (!items) return;
    
            for (const item of Array.from(items)) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) {
                        setFiles(prevFiles => {
                            const newFiles = [...prevFiles];
                            newFiles[hoveredUploaderIndex] = file;
                            return newFiles;
                        });
                        event.preventDefault(); 
                        break;
                    }
                }
            }
        };

        window.addEventListener('paste', handleGlobalPaste);

        return () => {
            window.removeEventListener('paste', handleGlobalPaste);
        };
    }, [activeTab, hoveredUploaderIndex, isTargetedLoading]);

    const handleCorrectAnswerChange = (answer: string, index: number) => {
        const newAnswers = [...correctAnswers];
        newAnswers[index] = answer.toUpperCase().slice(0, 1);
        setCorrectAnswers(newAnswers);
    };

    const uploadedFiles = files.filter((f): f is File => f !== null);
    const hasReachedLimit = !!(userProfile && userProfile.dailyTestLimit < 100 && userProfile.testsTakenToday >= userProfile.dailyTestLimit);
    const canGenerate = uploadedFiles.length > 0 && !hasReachedLimit && !isTargetedLoading;

    const handleGenerateClick = () => {
        if (!canGenerate) return;
        
        if (isGuest || !user) {
            onAuthRedirect();
            return;
        }

        setTargetedError(null);
        setShowConfirmation(true);
    };
    
    const handleConfirmGenerate = async () => {
        setShowConfirmation(false);
        setIsTargetedLoading(true);
        setTargetedError(null);

        try {
            const answersForUploadedFiles = correctAnswers.filter((_, index) => files[index] !== null);
            const questions = await generateTargetedPracticeTest(uploadedFiles, answersForUploadedFiles);
            onTestGenerated(questions);
            onAssignmentCompleted(); // Generating a test counts as using the feature.
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setTargetedError(`Failed to generate test: ${errorMessage}`);
        } finally {
            setIsTargetedLoading(false);
        }
    };
    
    const handleGenerateFromText = async () => {
        if (!textInput.trim() || isTextLoading || hasReachedLimit) return;
        setIsTextLoading(true);
        setTextError(null);
        try {
            const questions = await generateFromText(textInput);
            onTestGenerated(questions);
            onAssignmentCompleted();
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setTextError(`Failed to generate test from text: ${errorMessage}`);
        } finally {
            setIsTextLoading(false);
        }
    };

    const renderTextPractice = () => {
         if (isTextLoading) {
            return <GeneratingTestView title="Generating Quiz from Your Text..." />;
        }
        return (
            <PremiumGate 
                userProfile={userProfile}
                isGuest={isGuest}
                onUpgradeClick={isGuest ? onAuthRedirect : onShowUpgradeModal}
                featureName="Practice from Text"
            >
                <div className="bg-brand-lilac/5 border border-brand-lavender/20 rounded-2xl p-8 backdrop-blur-xl space-y-8">
                    <div className="text-left">
                        <h3 className="text-lg font-semibold text-white mb-1">Generate a Quiz from Any Text</h3>
                        <p className="text-sm text-white/70">
                            Paste an article, a story, or any passage below (at least 100 characters). Our AI will create a 5-question reading comprehension quiz based on your text.
                        </p>
                    </div>
                    <textarea
                        id="walkthrough-text-practice-textarea"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        className="w-full h-48 bg-black/20 border border-brand-lavender/30 rounded-lg p-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-lavender"
                        placeholder="Paste your text here..."
                        disabled={isTextLoading}
                    />
                     {textError && (
                        <div className="p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg flex items-center justify-center space-x-2">
                            <ErrorIcon className="w-5 h-5" />
                            <span>{textError}</span>
                        </div>
                    )}
                    <button
                        id="walkthrough-text-practice-generate-button"
                        onClick={handleGenerateFromText}
                        disabled={isTextLoading || textInput.trim().length < 100 || hasReachedLimit}
                        className="w-full bg-brand-violet text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-lavender hover:text-brand-indigo disabled:bg-brand-lavender/20 disabled:text-white/50 disabled:cursor-not-allowed transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-lavender focus:ring-offset-2 focus:ring-offset-brand-indigo flex items-center justify-center space-x-2"
                    >
                         {isTextLoading ? <SpinnerIcon className="w-5 h-5" /> : <DocumentTextIcon className="w-5 h-5" />}
                        <span>{isTextLoading ? 'Generating...' : 'Generate 5-Question Quiz'}</span>
                    </button>
                    {hasReachedLimit && <p className="text-sm text-center text-yellow-400">You have reached your daily limit for practice tests.</p>}
                </div>
            </PremiumGate>
        );
    };

    const renderTargetedPractice = () => {
        if (isTargetedLoading) {
            return <GeneratingTestView title="Crafting Your Targeted Test..." />;
        }
        
        return (
            <div className="space-y-8">
                {userProfile && (
                    <div className="pt-8">
                        <TestCounter
                            testsTakenToday={userProfile.testsTakenToday}
                            dailyTestLimit={userProfile.dailyTestLimit}
                        />
                    </div>
                )}
                
                <div className="bg-brand-lilac/5 border border-brand-lavender/20 rounded-2xl p-8 backdrop-blur-xl space-y-8">
                    <div className="text-left">
                        <h3 className="text-lg font-semibold text-white mb-1">Upload Your Questions</h3>
                        <p className="text-sm text-white/70">
                            Provide up to 3 screenshots of SAT English questions.
                            <span className="block mt-1 font-semibold text-brand-lavender">
                                Hover your mouse over an upload box and press Ctrl+V (or Cmd+V) to paste an image.
                            </span>
                            Our AI will analyze them to generate a personalized practice set that targets the same skills and topics.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[0, 1, 2].map(index => (
                            <div 
                                key={index}
                                id={index === 0 ? 'walkthrough-targeted-uploader-0' : undefined}
                                className="space-y-2"
                                onMouseEnter={() => setHoveredUploaderIndex(index)}
                                onMouseLeave={() => setHoveredUploaderIndex(null)}
                            >
                                <h4 className="text-sm font-semibold text-white text-left">Image {index + 1}</h4>
                                <ImageUploader 
                                    id={`targeted-uploader-${index}`}
                                    file={files[index]}
                                    onImageUpload={(file) => handleImageUpload(file, index)}
                                    isProcessing={isTargetedLoading}
                                    disablePasteHandler={true}
                                />
                                <div id={index === 0 ? 'walkthrough-targeted-answer-0' : undefined} className="mt-2">
                                    <label htmlFor={`correct-answer-${index}`} className="block text-xs font-medium text-white/60 mb-1">Correct Answer (Optional)</label>
                                    <input
                                        type="text"
                                        id={`correct-answer-${index}`}
                                        value={correctAnswers[index]}
                                        onChange={(e) => handleCorrectAnswerChange(e.target.value, index)}
                                        maxLength={1}
                                        placeholder="e.g., C"
                                        className="w-full bg-black/20 border border-brand-lavender/30 rounded-md px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-lavender"
                                        pattern="[a-dA-D]?"
                                        disabled={isTargetedLoading}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {targetedError && (
                        <div className="p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg flex items-center justify-center space-x-2">
                            <ErrorIcon className="w-5 h-5" />
                            <span>{targetedError}</span>
                        </div>
                    )}
                    
                    <button
                        id="walkthrough-targeted-generate-button"
                        onClick={handleGenerateClick}
                        disabled={!canGenerate}
                        className="w-full bg-brand-violet text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-lavender hover:text-brand-indigo disabled:bg-brand-lavender/20 disabled:text-white/50 disabled:cursor-not-allowed transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-lavender focus:ring-offset-2 focus:ring-offset-brand-indigo flex items-center justify-center space-x-2"
                    >
                        <span>Generate Practice Test</span>
                    </button>
                    {hasReachedLimit && <p className="text-sm text-center text-yellow-400">You have reached your daily limit for practice tests.</p>}
                </div>
            </div>
        );
    };

    const renderPracticeHub = () => (
         <>
            <ConfirmationModal
                isOpen={showConfirmation}
                onClose={() => setShowConfirmation(false)}
                onConfirm={handleConfirmGenerate}
                title="Confirm Test Generation"
                message="This will use one of your daily test allowances. Are you sure you want to proceed?"
                confirmText="Generate Test"
            />
            {pausedAssignment && (
                 <PausedTestModal
                    isOpen={showPausedModal}
                    onClose={() => setShowPausedModal(false)}
                    onResume={handleResumeTest}
                    onDiscardAndCreateNew={handleDiscardAndCreate}
                    pausedAssignmentName={pausedAssignment.name}
                />
            )}
            <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    Practice Hub
                </h2>
                <p className="text-white/70 mb-8">
                    Choose your practice mode: a standard test or a targeted session from your own questions.
                </p>
            </div>
            
            <div id="walkthrough-practice-tabs-container" className="flex justify-center mb-8">
                <div className="flex p-1 bg-black/20 rounded-lg border border-brand-lavender/20">
                    <button
                        onClick={() => setActiveTab('regular')}
                        className={`px-6 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'regular' ? 'bg-brand-violet text-white' : 'text-white/80 hover:bg-white/10'}`}
                        aria-pressed={activeTab === 'regular'}
                    >
                        Standard Practice
                    </button>
                    <button
                        id="walkthrough-targeted-practice-button"
                        onClick={() => setActiveTab('targeted')}
                        className={`px-6 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'targeted' ? 'bg-brand-violet text-white' : 'text-white/80 hover:bg-white/10'}`}
                         aria-pressed={activeTab === 'targeted'}
                    >
                        Targeted Practice
                    </button>
                    <button
                        id="walkthrough-text-practice-button"
                        onClick={() => setActiveTab('text')}
                        className={`px-6 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === 'text' ? 'bg-brand-violet text-white' : 'text-white/80 hover:bg-white/10'}`}
                         aria-pressed={activeTab === 'text'}
                    >
                        Text Practice
                    </button>
                </div>
            </div>

            {activeTab === 'regular' && (
                <AssignmentStart 
                    onStart={handleStartAssignment} 
                    isGenerating={assignmentState === 'generating'}
                    error={error}
                    testsTakenToday={userProfile?.testsTakenToday}
                    dailyTestLimit={userProfile?.dailyTestLimit}
                    topicsId="walkthrough-topics-section"
                    difficultyId="walkthrough-difficulty-section"
                    startButtonId="walkthrough-start-button"
                />
            )}

            {activeTab === 'targeted' && renderTargetedPractice()}
            {activeTab === 'text' && renderTextPractice()}
        </>
    );

    const renderCurrentState = () => {
        switch (assignmentState) {
            case 'generating':
                return <GeneratingTestView title="Generating Your Practice Test..." />;
            case 'idle':
                return renderPracticeHub();
            case 'active':
                return (
                    <AssignmentView
                        questions={questions}
                        userAnswers={userAnswers}
                        highlights={highlights}
                        strikethroughs={strikethroughs}
                        onAnswerSelect={handleAnswerSelect}
                        onHighlightsChange={handleHighlightsChange}
                        onStrikethroughToggle={handleStrikethroughToggle}
                        onSubmit={() => handleSubmitAssignment('user')}
                        onPause={handlePause}
                        onTimeUp={() => handleSubmitAssignment('timer')}
                        timeLimitInSeconds={timeLimit}
                        isLockdownEnabled={isLockdownEnabled}
                        user={user}
                        isGuest={isGuest}
                        vocabularyList={vocabularyList}
                        onWordAddedToVocab={handleWordAddedToVocab}
                    />
                );
            case 'submitting':
                return (
                    <div className="text-center py-16">
                        <SpinnerIcon className="w-12 h-12 text-brand-lavender mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white">Saving Progress...</h2>
                        <p className="text-white/80 mt-2">Please wait.</p>
                    </div>
                );
            case 'submitting_timeup':
                return (
                    <div className="text-center py-16">
                        <ClockIcon className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-white">Time's Up!</h2>
                        <p className="text-white/80 mt-2">Submitting your assignment and calculating your score. Please wait...</p>
                    </div>
                );
            case 'review':
                return (
                    <AssignmentReview 
                        score={score}
                        questions={questions}
                        userAnswers={userAnswers}
                        onRestart={resetTestState}
                        highlights={highlights}
                        strikethroughs={strikethroughs}
                        onTestGenerated={onTestGenerated}
                        userProfile={userProfile}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <>
            {renderCurrentState()}
        </>
    );
};

export default PracticePage;