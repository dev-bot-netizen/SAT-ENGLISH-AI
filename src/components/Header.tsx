import React from 'react';
import type { User } from '@/services/firebase';
import { AcademicCapIcon } from '@/components/icons/AcademicCapIcon';
import { PencilIcon } from '@/components/icons/PencilIcon';
import { ClockIcon } from '@/components/icons/ClockIcon';
import { BookOpenIcon } from '@/components/icons/BookOpenIcon';
import { LogoutIcon } from '@/components/icons/LogoutIcon';
import { LoginIcon } from '@/components/icons/LoginIcon';
import type { UserProfile, Page } from '@/types';
import TierBadge from '@/components/TierBadge';
import { UserIcon } from '@/components/icons/UserIcon';
import { TrashIcon } from '@/components/icons/TrashIcon';
import { FeedbackIcon } from './icons/FeedbackIcon';

interface HeaderProps {
    currentPage: Page;
    setPage: (page: Page) => void;
    isTestActive: boolean;
    user: User | null;
    userProfile: UserProfile | null;
    isGuest: boolean;
    onSignOut: () => void;
    onExitGuestMode: () => void;
    onShowAuthPrompt: () => void;
    onShowDeleteAccountModal: () => void;
}

const NavLink: React.FC<{
    onClick: () => void;
    isActive: boolean;
    icon: React.ReactNode;
    text: string;
    isDisabled?: boolean;
    id?: string;
}> = ({ onClick, isActive, icon, text, isDisabled = false, id }) => (
    <button
        id={id}
        onClick={onClick}
        disabled={isDisabled}
        className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive 
            ? 'bg-white/10 text-white' 
            : 'text-white/60 hover:bg-white/10 hover:text-white'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
        {icon}
        <span>{text}</span>
    </button>
);

const Header: React.FC<HeaderProps> = ({ currentPage, setPage, isTestActive, user, userProfile, isGuest, onSignOut, onExitGuestMode, onShowAuthPrompt, onShowDeleteAccountModal }) => {
  
  const handleProtectedLinkClick = (page: 'practice' | 'history' | 'vocabulary') => {
      if (!user && isGuest) {
          onShowAuthPrompt();
      } else {
          setPage(page);
      }
  };

  const headingClass = "text-lg sm:text-xl font-bold text-white whitespace-nowrap";

  return (
    <header className="w-full border-b border-brand-lavender/10 bg-brand-indigo/80 backdrop-blur-lg sticky top-0 z-20">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center space-x-3">
            <AcademicCapIcon className="w-8 h-8 text-brand-lavender" />
            <h1 className={headingClass}>SAT Solver AI</h1>
        </div>
        {(user || isGuest) && (
            <nav className="flex items-center space-x-2">
                <NavLink
                    onClick={() => setPage('solver')}
                    isActive={currentPage === 'solver'}
                    icon={<AcademicCapIcon className="w-5 h-5" />}
                    text="Solver"
                    isDisabled={isTestActive}
                />
                <NavLink
                    id="walkthrough-practice-tab"
                    onClick={() => handleProtectedLinkClick('practice')}
                    isActive={currentPage === 'practice'}
                    icon={<PencilIcon className="w-5 h-5" />}
                    text="Practice"
                    isDisabled={isTestActive}
                />
                 <NavLink
                    id="walkthrough-history-tab"
                    onClick={() => handleProtectedLinkClick('history')}
                    isActive={currentPage === 'history'}
                    icon={<ClockIcon className="w-5 h-5" />}
                    text="History"
                    isDisabled={isTestActive}
                />
                <NavLink
                    id="walkthrough-vocabulary-tab"
                    onClick={() => handleProtectedLinkClick('vocabulary')}
                    isActive={currentPage === 'vocabulary'}
                    icon={<BookOpenIcon className="w-5 h-5" />}
                    text="Vocabulary"
                    isDisabled={isTestActive}
                />
                {userProfile?.tier === 'developer' && (
                    <NavLink
                        onClick={() => setPage('feedback')}
                        isActive={currentPage === 'feedback'}
                        icon={<FeedbackIcon className="w-5 h-5" />}
                        text="Feedback"
                        isDisabled={isTestActive}
                    />
                )}
            </nav>
        )}
        {user && userProfile ? (
            <div className="flex items-center space-x-4">
                {(userProfile.tier === 'premium' || userProfile.tier === 'developer') && (
                    <TierBadge tier={userProfile.tier} />
                )}
                <div className="relative group">
                    <button
                        disabled={isTestActive}
                        className="w-9 h-9 bg-brand-violet/80 rounded-full flex items-center justify-center text-brand-lavender font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand-lavender focus:ring-offset-2 focus:ring-offset-brand-indigo disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="User menu"
                    >
                        {user.email ? user.email.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />}
                    </button>
                    <div className="absolute top-full right-0 mt-2 w-60 bg-brand-indigo border border-brand-lavender/20 rounded-lg shadow-xl z-30 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 transform origin-top-right -translate-y-2 group-hover:translate-y-0">
                        <div className="px-4 py-3 border-b border-brand-lavender/20">
                            <p className="text-sm font-medium text-white/60">Signed in as</p>
                            <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                        </div>
                        <div className="p-2">
                            <button
                                onClick={onSignOut}
                                disabled={isTestActive}
                                className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <LogoutIcon className="w-5 h-5" />
                                <span>Sign Out</span>
                            </button>
                            <button
                                onClick={onShowDeleteAccountModal}
                                disabled={isTestActive}
                                className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm text-red-400 hover:bg-red-900/50 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <TrashIcon className="w-5 h-5" />
                                <span>Delete Account</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        ) : isGuest && (
            <div className="flex items-center space-x-4">
                <span className="text-sm text-white/60 hidden md:block">Guest Mode</span>
                <button
                    onClick={onExitGuestMode}
                    disabled={isTestActive}
                    className="text-white/60 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Sign In"
                >
                    <LoginIcon className="w-6 h-6" />
                </button>
            </div>
        )}
      </div>
    </header>
  );
};

export default Header;