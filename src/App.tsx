import React, { useState, useCallback, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ImageUploader from '@/components/ImageUploader';
import ResponseDisplay from '@/components/ResponseDisplay';
import { solveSatQuestion } from '@/services/geminiService';
import PracticePage from '@/pages/PracticePage';
import HistoryPage from '@/pages/HistoryPage';
import VocabularyPage from '@/pages/VocabularyPage';
import AuthPage from '@/pages/AuthPage';
import { auth, onAuthStateChanged, signOut, type User } from '@/services/firebase';
import { SpinnerIcon } from '@/components/icons/SpinnerIcon';
import type { UserProfile, PastAssignment, Question, Page } from '@/types';
import { getOrCreateUserProfile, deleteUserAccount, markTutorialAsCompleted, updateUserFeedbackPreference } from '@/services/userService';
import { getAssignmentDetails } from '@/services/assignmentService';
import AuthPromptModal from '@/components/AuthPromptModal';
import DeleteAccountModal from '@/components/DeleteAccountModal';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Walkthrough from '@/components/Walkthrough';
import FeedbackModal from '@/components/FeedbackModal';
import { submitFeedback } from '@/services/feedbackService';
import FeedbackPage from '@/pages/FeedbackPage';
import FeedbackBanner from '@/components/FeedbackBanner';
import { getGuestFeedbackData, handleGuestTestCompletion, snoozeGuestFeedback, dismissGuestFeedback } from '@/services/guestService';
import UpgradeModal from '@/components/UpgradeModal';
import ServerStatusChecker from '@/components/ServerStatusChecker';
import LandingPage from '@/pages/LandingPage';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [solution, setSolution] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<Page>('solver');
  const [isTestActive, setIsTestActive] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [showAuthPrompt, setShowAuthPrompt] = useState<boolean>(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState<boolean>(false);
  const [assignmentToResume, setAssignmentToResume] = useState<PastAssignment | null>(null);
  const [preGeneratedAssignment, setPreGeneratedAssignment] = useState<Question[] | null>(null);
  const [showWalkthrough, setShowWalkthrough] = useState<boolean>(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showFeedbackBanner, setShowFeedbackBanner] = useState(false);
  const [guestFeedbackData, setGuestFeedbackData] = useState(getGuestFeedbackData());
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [showStatusChecker, setShowStatusChecker] = useState<boolean>(false);
  const [showApp, setShowApp] = useState<boolean>(false);

  const refreshUserProfile = useCallback(async () => {
    if (user) {
        try {
            const profile = await getOrCreateUserProfile(user);
            setUserProfile(profile);
        } catch (e) {
            console.error("Failed to refresh user profile:", e);
        }
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setAuthLoading(true);
        setIsGuest(false);
        try {
            const profile = await getOrCreateUserProfile(currentUser);
            setUser(currentUser);
            setUserProfile(profile);
            if (!profile.hasCompletedTutorial) {
                setShowWalkthrough(true);
            }
            setError(null); // Clear any previous auth errors
            setAuthLoading(false); // Set loading false on success
            setShowApp(true); // User is logged in, show the app
        } catch (e) {
            console.error("Authentication process failed:", e);
            if ((e as any).code === 'SERVER_CONFIG_ERROR') {
              setShowStatusChecker(true);
            }
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during sign-in.";
            setError(errorMessage);
            signOut(auth); // Sign out to prevent inconsistent state
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setGuestFeedbackData(getGuestFeedbackData());
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);
  
  // Effect to determine if the feedback banner should be shown
  useEffect(() => {
      if (isTestActive || showFeedbackModal || showWalkthrough) {
        setShowFeedbackBanner(false);
        return;
      }

      let shouldShow = false;
      if (user && userProfile) {
          if (userProfile.feedbackState === 'eligible' && (userProfile.totalTestsCompleted || 0) >= 2) {
              shouldShow = true;
          }
      } else if (isGuest) {
          if (guestFeedbackData.feedbackState === 'eligible' && guestFeedbackData.totalTestsCompleted >= 2) {
              shouldShow = true;
          }
      }
      setShowFeedbackBanner(shouldShow);

  }, [user, userProfile, isGuest, guestFeedbackData, isTestActive, showFeedbackModal, showWalkthrough]);

  const handleFinishWalkthrough = async () => {
      if (!user) return;
      try {
          await markTutorialAsCompleted();
          setUserProfile(prevProfile => prevProfile ? { ...prevProfile, hasCompletedTutorial: true } : null);
          setShowWalkthrough(false);
      } catch (error) {
          console.error("Failed to mark tutorial as completed:", error);
          setShowWalkthrough(false);
      }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      setIsGuest(false);
      setPage('solver');
      setError(null);
      setShowApp(false); // Go back to landing page on sign out
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  
  const handleDeleteAccount = async (): Promise<void> => {
    try {
        await deleteUserAccount();
        await signOut(auth);
        setUser(null);
        setUserProfile(null);
        setIsGuest(false);
        setPage('solver');
        setShowDeleteAccountModal(false);
        setError(null);
        setShowApp(false);
        alert('Your account and all associated data have been successfully deleted.');
    } catch (error) {
        console.error("Failed to delete account:", error);
        throw error;
    }
  };

  const handleExitGuestMode = () => {
    setIsGuest(false);
    setPage('solver');
  };

  const handleAuthRedirect = () => {
    setShowAuthPrompt(false);
    setShowUpgradeModal(false);
    handleExitGuestMode();
  }

  const handleImageUpload = useCallback((file: File | null) => {
    setImageFile(file);
    setSolution(null);
    setError(null);
  }, []);
  
  useEffect(() => {
    const handleGlobalPaste = (event: ClipboardEvent) => {
        // Only act if on the solver page and not currently processing
        if (page !== 'solver' || isLoading) {
            return;
        }

        const items = event.clipboardData?.items;
        if (!items) return;

        for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    handleImageUpload(file);
                    event.preventDefault(); // Prevent default paste behavior
                    break; // Stop after finding the first image
                }
            }
        }
    };

    window.addEventListener('paste', handleGlobalPaste);

    return () => {
        window.removeEventListener('paste', handleGlobalPaste);
    };
  }, [page, isLoading, handleImageUpload]);


  const handleSolve = useCallback(async () => {
    if (!imageFile) {
      setError("Please upload an image of an SAT English question first.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSolution(null);

    try {
      const result = await solveSatQuestion(imageFile);
      setSolution(result);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      if (errorMessage.includes("limit of 3 solves exceeded")) {
          setError("You have reached your daily limit of 3 solves. Please sign in or create an account for unlimited solves.");
          setShowAuthPrompt(true);
      } else {
          setError(`Failed to get solution: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [imageFile]);

  const handleResumeFromHistory = async (assignmentId: string) => {
        setIsLoading(true);
        try {
            const details = await getAssignmentDetails(assignmentId);
            if (details) {
                setAssignmentToResume(details);
                setPage('practice');
            } else {
                setError("Could not find the paused assignment to resume.");
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to resume assignment: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };
    
  const handleStartGeneratedTest = (questions: Question[]) => {
      if (questions && questions.length > 0) {
          refreshUserProfile();
          setPreGeneratedAssignment(questions);
          setPage('practice');
      }
  };

  const handleAssignmentCompleted = useCallback(() => {
    if (user) {
        refreshUserProfile();
    } else if (isGuest) {
        const updatedData = handleGuestTestCompletion();
        setGuestFeedbackData(updatedData);
    }
  }, [user, isGuest, refreshUserProfile]);

  const handleSnoozeFeedback = () => {
      setShowFeedbackBanner(false);
      if (user && userProfile) {
          updateUserFeedbackPreference('snooze');
          setUserProfile(p => p ? { ...p, feedbackState: 'snoozed' } : null);
      } else if (isGuest) {
          snoozeGuestFeedback();
          setGuestFeedbackData(getGuestFeedbackData());
      }
  };

  const handleDismissFeedback = () => {
      setShowFeedbackBanner(false);
      if (user && userProfile) {
          updateUserFeedbackPreference('dismiss');
          setUserProfile(p => p ? { ...p, feedbackState: 'dismissed' } : null);
      } else if (isGuest) {
          dismissGuestFeedback();
          setGuestFeedbackData(getGuestFeedbackData());
      }
  };
  
  const handleFeedbackSubmit = async (feedbackData: { rating: number, aiRating: number, mostValuableFeature?: string, aiIssues?: string, comments?: string }): Promise<void> => {
    await submitFeedback({
        ...feedbackData,
        page,
    });
    // After submitting, we won't ask again.
    handleDismissFeedback();
  };
  
  const handleGuestLogin = () => {
      setIsGuest(true); 
      setGuestFeedbackData(getGuestFeedbackData());
      setShowApp(true);
  }

  const SolverPage = (
    <>
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Solve SAT English Questions with AI
        </h2>
        <p className="text-white/70">
          Upload an image of an SAT English question and get the correct answer instantly.
        </p>
      </div>
      
      <div className="bg-brand-lilac/5 border border-brand-lavender/20 rounded-2xl p-8 backdrop-blur-xl">
          <div className="space-y-12">
            <div id="walkthrough-solver-step" className="space-y-4">
              <h3 className="text-lg font-semibold text-white">1. Upload & Solve</h3>
              <ImageUploader id="solver-uploader" file={imageFile} onImageUpload={handleImageUpload} isProcessing={isLoading} disablePasteHandler={true} />
              <button
                onClick={handleSolve}
                disabled={!imageFile || isLoading}
                className="w-full bg-brand-gold text-brand-indigo font-bold py-3 px-4 rounded-lg hover:bg-yellow-300 disabled:bg-brand-lavender/20 disabled:text-white/50 disabled:cursor-not-allowed transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 focus:ring-offset-brand-indigo"
              >
                {isLoading ? 'Analyzing...' : 'Solve Question'}
              </button>
            </div>
            <div id="walkthrough-solution-step" className="space-y-4">
              <h3 className="text-lg font-semibold text-white">2. AI-Powered Solution</h3>
              <ResponseDisplay 
                solution={solution}
                isLoading={isLoading}
                error={error}
                userProfile={userProfile}
              />
            </div>
          </div>
      </div>
    </>
  );

  const renderPage = () => {
     if (isGuest && (page === 'practice' || page === 'history' || page === 'vocabulary' || page === 'feedback')) {
        return SolverPage;
    }

    switch(page) {
      case 'solver':
        return SolverPage;
      case 'practice':
        return <PracticePage 
                    onTestActiveChange={setIsTestActive} 
                    user={user} 
                    isGuest={isGuest} 
                    userProfile={userProfile} 
                    assignmentToResume={assignmentToResume}
                    onTestResumed={() => setAssignmentToResume(null)}
                    preGeneratedAssignment={preGeneratedAssignment}
                    onClearPreGeneratedAssignment={() => setPreGeneratedAssignment(null)}
                    onTestGenerated={handleStartGeneratedTest}
                    onRefreshProfile={refreshUserProfile}
                    onAssignmentCompleted={handleAssignmentCompleted}
                    onShowUpgradeModal={() => setShowUpgradeModal(true)}
                    onAuthRedirect={handleAuthRedirect}
                />;
      case 'history':
        return <HistoryPage 
                    user={user} 
                    isGuest={isGuest} 
                    onResumeAssignment={handleResumeFromHistory}
                    onTestGenerated={handleStartGeneratedTest}
                    userProfile={userProfile}
                />;
      case 'vocabulary':
        return <VocabularyPage 
                    user={user}
                    isGuest={isGuest}
                    userProfile={userProfile}
                    onShowUpgradeModal={() => setShowUpgradeModal(true)}
                    onAuthRedirect={handleAuthRedirect}
                />;
      case 'feedback':
        return <FeedbackPage />;
      default:
        return SolverPage;
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-brand-indigo text-white">
        <SpinnerIcon className="w-12 h-12 text-brand-lavender" />
        <p className="mt-4 text-lg">Loading SAT English Solver AI...</p>
      </div>
    );
  }

  // If not logged in and not explicitly navigating to the app, show the new landing page.
  if (!user && !isGuest && !showApp) {
      return <LandingPage onNavigateToApp={() => setShowApp(true)} />;
  }

  const containerClass = page === 'practice' && isTestActive
    ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    : "max-w-5xl mx-auto px-4 sm:px-6 lg:px-8";

  return (
    <div className="flex flex-col min-h-screen font-sans bg-brand-indigo text-white/90">
      {showStatusChecker && <ServerStatusChecker onClose={() => setShowStatusChecker(false)} />}
      <Walkthrough 
          isOpen={showWalkthrough} 
          onFinish={handleFinishWalkthrough}
          currentPage={page}
          setPage={setPage}
      />
      {showFeedbackBanner && (
        <FeedbackBanner
          onGiveFeedback={() => {
            setShowFeedbackBanner(false);
            setShowFeedbackModal(true);
          }}
          onRemind={handleSnoozeFeedback}
          onDismiss={handleDismissFeedback}
        />
      )}
      <AuthPromptModal
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        onAuthRedirect={handleAuthRedirect}
      />
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onAuthRedirect={handleAuthRedirect}
        isGuest={isGuest}
      />
      <DeleteAccountModal
          isOpen={showDeleteAccountModal}
          onClose={() => setShowDeleteAccountModal(false)}
          onConfirmDelete={handleDeleteAccount}
      />
      <FeedbackModal
            isOpen={showFeedbackModal}
            onClose={() => setShowFeedbackModal(false)}
            onSubmit={handleFeedbackSubmit}
        />
      <Header 
        currentPage={page} 
        setPage={setPage} 
        isTestActive={isTestActive}
        user={user}
        userProfile={userProfile}
        isGuest={isGuest}
        onSignOut={handleSignOut}
        onExitGuestMode={handleExitGuestMode}
        onShowAuthPrompt={() => setShowAuthPrompt(true)}
        onShowDeleteAccountModal={() => setShowDeleteAccountModal(true)}
      />
      <main className="flex-grow w-full py-8 md:py-12">
        <div className={containerClass}>
            <div className="space-y-10">
              {user || isGuest ? renderPage() : <AuthPage onGuestLogin={handleGuestLogin} appError={error} setAppError={setError} />}
            </div>
        </div>
      </main>
      <Footer onGiveFeedback={() => setShowFeedbackModal(true)} />
      <Analytics />
      <SpeedInsights />
    </div>
  );
};

export default App;