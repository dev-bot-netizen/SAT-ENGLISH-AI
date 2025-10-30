import React, { useState, useEffect, useMemo } from 'react';
import type { User } from '@/services/firebase';
import { getAssignmentSummaries, getAssignmentDetails } from '@/services/assignmentService';
import type { PastAssignment, PastAssignmentSummary, Question, UserProfile } from '@/types';
import { SpinnerIcon } from '@/components/icons/SpinnerIcon';
import { ErrorIcon } from '@/components/icons/ErrorIcon';
import { ClockIcon } from '@/components/icons/ClockIcon';
import AssignmentReview from '@/components/practice/AssignmentReview';

const DIFFICULTIES: Record<number, string> = { 1: 'Easy', 2: 'Moderate', 3: 'Hard' };
type SortKey = 'date' | 'topic' | 'difficulty';
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'date', label: 'Sort by Date' },
    { key: 'topic', label: 'Sort by Topic' },
    { key: 'difficulty', label: 'Sort by Difficulty' },
];

interface HistoryPageProps {
    user: User | null;
    isGuest: boolean;
    onResumeAssignment: (assignmentId: string) => void;
    onTestGenerated: (questions: Question[]) => void;
    userProfile: UserProfile | null;
}

const HistoryPage: React.FC<HistoryPageProps> = ({ user, isGuest, onResumeAssignment, onTestGenerated, userProfile }) => {
    const [pausedAssignments, setPausedAssignments] = useState<PastAssignmentSummary[]>([]);
    const [completedAssignments, setCompletedAssignments] = useState<PastAssignmentSummary[]>([]);
    const [selectedAssignment, setSelectedAssignment] = useState<PastAssignment | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [sortKey, setSortKey] = useState<SortKey>('date');

    useEffect(() => {
        const fetchSummaries = async () => {
            if (!user && !isGuest) return;

            setIsLoading(true);
            setError(null);
            try {
                const summaries = await getAssignmentSummaries(user ? user.uid : null);
                setPausedAssignments(summaries.filter(s => s.status === 'paused'));
                setCompletedAssignments(summaries.filter(s => s.status !== 'paused'));
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
                setError(`Failed to load history: ${errorMessage}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSummaries();
    }, [user, isGuest]);
    
    const sortAssignments = (assignments: PastAssignmentSummary[], key: SortKey): PastAssignmentSummary[] => {
        return [...assignments].sort((a, b) => {
            switch (key) {
                case 'topic':
                    return a.name.localeCompare(b.name);
                case 'difficulty':
                    return a.difficulty - b.difficulty;
                case 'date':
                default:
                    return b.dateCompleted.getTime() - a.dateCompleted.getTime();
            }
        });
    };

    const sortedPausedAssignments = useMemo(() => sortAssignments(pausedAssignments, sortKey), [pausedAssignments, sortKey]);
    const sortedCompletedAssignments = useMemo(() => sortAssignments(completedAssignments, sortKey), [completedAssignments, sortKey]);


    const handleSelectAssignment = async (summary: PastAssignmentSummary) => {
        setIsLoading(true);
        setError(null);
        try {
            const details = await getAssignmentDetails(summary.id);
            if (details) {
                setSelectedAssignment(details);
            } else {
                throw new Error("Assignment details not found. It may have been deleted.");
            }
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to load assignment details: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const AssignmentList: React.FC<{
        summaries: PastAssignmentSummary[];
        isPausedList: boolean;
    }> = ({ summaries, isPausedList }) => (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 backdrop-blur-sm">
            <ul className="divide-y divide-slate-200 dark:divide-gray-800">
                {summaries.map((summary) => (
                    <li key={summary.id} className="flex justify-between items-center p-4 sm:p-6">
                        <div className="flex-1">
                            <p className="font-semibold text-slate-900 dark:text-white capitalize">
                                {summary.name}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-gray-400">
                                {isPausedList ? 'Paused on ' : 'Completed on '}
                                {summary.dateCompleted.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                {' \u2022 '}
                                Difficulty: {DIFFICULTIES[summary.difficulty] || 'N/A'}
                            </p>
                        </div>
                        <div className="flex items-center gap-4 ml-4">
                            {!isPausedList && (
                                <div className="text-right">
                                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                                        {summary.score} <span className="text-base text-slate-500 dark:text-gray-400">/ {summary.totalQuestions}</span>
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-gray-500">
                                        {Math.round((summary.score / summary.totalQuestions) * 100)}%
                                    </p>
                                </div>
                            )}
                             {isPausedList ? (
                                <button
                                    onClick={() => onResumeAssignment(summary.id)}
                                    className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-500 transition-colors"
                                >
                                    Resume
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleSelectAssignment(summary)}
                                    className="bg-slate-100 dark:bg-gray-700 text-slate-900 dark:text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Review
                                </button>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );

    if (isLoading && !selectedAssignment) {
        return (
            <div className="flex flex-col items-center justify-center text-slate-500 dark:text-gray-400 py-16">
                <SpinnerIcon className="w-10 h-10 text-purple-500 mb-4" />
                <p>Loading your assignment history...</p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="p-4 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg flex items-center justify-center space-x-2">
                <ErrorIcon className="w-5 h-5" />
                <span>{error}</span>
            </div>
        );
    }

    if (selectedAssignment) {
        return (
            <AssignmentReview
                score={selectedAssignment.score}
                questions={selectedAssignment.questions}
                userAnswers={selectedAssignment.userAnswers}
                highlights={selectedAssignment.highlights}
                strikethroughs={selectedAssignment.strikethroughs || {}}
                onBack={() => {
                    setSelectedAssignment(null);
                    // No need to refetch, just go back to the list
                    setIsLoading(false);
                }}
                onTestGenerated={onTestGenerated}
                userProfile={userProfile}
            />
        );
    }
    
    if (pausedAssignments.length === 0 && completedAssignments.length === 0) {
        return (
             <div className="text-center py-16">
                <ClockIcon className="w-12 h-12 text-slate-400 dark:text-gray-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">No History Yet</h2>
                <p className="text-slate-600 dark:text-gray-400 mt-2">Complete a practice test to see your results here.</p>
                 {isGuest && (
                    <p className="text-sm text-slate-500 dark:text-gray-500 mt-4">Note: Guest history is saved on this device only.</p>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-10">
            <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                    Assignment History
                </h2>
                <p className="text-slate-600 dark:text-gray-400">
                    Review your past practice tests to track your progress.
                     {isGuest && (
                        <span className="block text-sm text-gray-500 mt-1">Your guest history is saved on this device only.</span>
                    )}
                </p>
            </div>
            
            <div className="flex justify-center mb-0">
                <div className="flex p-1 bg-slate-100 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 space-x-1">
                    {SORT_OPTIONS.map(({ key, label }) => (
                         <button
                            key={key}
                            onClick={() => setSortKey(key)}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${sortKey === key ? 'bg-purple-600 text-white' : 'text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-700'}`}
                            aria-pressed={sortKey === key}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {sortedPausedAssignments.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Paused Assignments</h3>
                    <AssignmentList summaries={sortedPausedAssignments} isPausedList={true} />
                </div>
            )}
            
            {sortedCompletedAssignments.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Completed Assignments</h3>
                    <AssignmentList summaries={sortedCompletedAssignments} isPausedList={false} />
                </div>
            )}
        </div>
    );
};

export default HistoryPage;
