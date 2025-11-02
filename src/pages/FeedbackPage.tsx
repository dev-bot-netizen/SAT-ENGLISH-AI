import React, { useState, useEffect } from 'react';
import { getFeedback } from '@/services/feedbackService';
import type { Feedback } from '@/types';
import { SpinnerIcon } from '@/components/icons/SpinnerIcon';
import { ErrorIcon } from '@/components/icons/ErrorIcon';
import { FeedbackIcon } from '@/components/icons/FeedbackIcon';
import { StarIcon } from '@/components/icons/StarIcon';

const RatingDisplay: React.FC<{ label: string; rating: number }> = ({ label, rating }) => (
    <div className="flex items-center">
        <p className="text-sm text-white/60 w-32">{label}</p>
        <div className="flex">
            {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className={`w-5 h-5 ${rating > i ? 'text-brand-gold' : 'text-white/20'}`} />
            ))}
        </div>
    </div>
);

const FeedbackCard: React.FC<{ feedback: Feedback }> = ({ feedback }) => {
    return (
        <div className="bg-brand-lilac/5 border border-brand-lavender/20 rounded-2xl p-6 backdrop-blur-xl space-y-4">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <RatingDisplay label="Overall Experience" rating={feedback.rating} />
                    <RatingDisplay label="AI Explanations" rating={feedback.aiRating} />
                </div>
                <div className="text-right text-xs">
                    <p className="font-semibold text-white capitalize">{feedback.userId === 'guest' ? 'Guest User' : 'Registered User'}</p>
                    <p className="text-white/60">Page: <span className="font-medium text-white/90">/{feedback.page}</span></p>
                    <p className="text-white/50 mt-1">{new Date(feedback.createdAt).toLocaleString()}</p>
                </div>
            </div>

            {(feedback.mostValuableFeature || feedback.aiIssues || feedback.comments) && (
                <div className="space-y-3 pt-4 border-t border-brand-lavender/20">
                    {feedback.mostValuableFeature && (
                        <div className="bg-black/20 p-3 rounded-lg">
                            <p className="text-xs font-semibold text-brand-lavender mb-1">Most Valuable Feature</p>
                            <p className="text-sm text-white/90">{feedback.mostValuableFeature}</p>
                        </div>
                    )}
                    {feedback.aiIssues && (
                        <div className="bg-black/20 p-3 rounded-lg">
                            <p className="text-xs font-semibold text-brand-lavender mb-1">AI Issues Reported</p>
                            <p className="text-sm text-white/90 whitespace-pre-wrap">{feedback.aiIssues}</p>
                        </div>
                    )}
                    {feedback.comments && (
                        <div className="bg-black/20 p-3 rounded-lg">
                            <p className="text-xs font-semibold text-brand-lavender mb-1">Other Comments</p>
                            <p className="text-sm text-white/90 whitespace-pre-wrap">{feedback.comments}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const FeedbackPage: React.FC = () => {
    const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFeedback = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const feedback = await getFeedback();
                setFeedbackList(feedback);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load feedback.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchFeedback();
    }, []);

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center text-white/70 py-16">
                    <SpinnerIcon className="w-10 h-10 text-brand-lavender mb-4" />
                    <p>Loading user feedback...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg flex items-center justify-center space-x-2">
                    <ErrorIcon className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            );
        }
        
        if (feedbackList.length === 0) {
            return (
                <div className="text-center py-16">
                    <FeedbackIcon className="w-12 h-12 text-brand-lavender/50 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white">No Feedback Yet</h2>
                    <p className="text-white/70 mt-2">Check back later to see what users are saying.</p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                {feedbackList.map(feedback => (
                    <FeedbackCard key={feedback._id} feedback={feedback} />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    User Feedback Console
                </h2>
                <p className="text-white/70">
                    Reviewing feedback submitted by application users.
                </p>
            </div>
            {renderContent()}
        </div>
    );
};

export default FeedbackPage;
