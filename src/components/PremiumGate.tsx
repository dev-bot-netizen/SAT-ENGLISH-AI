import React from 'react';
import type { UserProfile } from '@/types';
import { LockIcon } from './icons/LockIcon';

interface PremiumGateProps {
    userProfile: UserProfile | null;
    isGuest: boolean;
    onUpgradeClick: () => void;
    children: React.ReactNode;
    featureName: string;
}

const PremiumGate: React.FC<PremiumGateProps> = ({ userProfile, isGuest, onUpgradeClick, children, featureName }) => {
    const hasAccess = userProfile?.tier === 'premium' || userProfile?.tier === 'developer';

    if (hasAccess) {
        return <>{children}</>;
    }

    const handleAccessClick = () => {
        onUpgradeClick();
    };

    return (
        <div className="bg-brand-violet/10 rounded-xl border border-dashed border-brand-lavender/30 p-8 backdrop-blur-sm text-center">
            <div className="flex flex-col items-center">
                <LockIcon className="w-10 h-10 text-brand-lavender mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{featureName}</h3>
                <p className="text-white/70 mb-4 max-w-sm">
                    {isGuest 
                        ? "Please sign up or sign in to access this feature."
                        : "This feature is not available on your current plan."}
                </p>
                {isGuest && (
                    <button
                        onClick={handleAccessClick}
                        className="bg-brand-violet text-white font-bold py-2 px-5 rounded-lg hover:bg-brand-lavender hover:text-brand-indigo transition-colors"
                    >
                        Sign Up or Sign In
                    </button>
                )}
            </div>
        </div>
    );
};
export default PremiumGate;
