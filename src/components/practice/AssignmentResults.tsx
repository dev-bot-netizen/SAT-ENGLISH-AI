import React from 'react';

interface AssignmentResultsProps {
    score: number;
    totalQuestions: number;
    onRestart?: () => void;
    onBack?: () => void;
}

const AssignmentResults: React.FC<AssignmentResultsProps> = ({ score, totalQuestions, onRestart, onBack }) => {
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    
    let feedback = { message: "Great job!", color: "text-green-400" };
    if (percentage < 50) {
        feedback = { message: "Keep practicing!", color: "text-red-400" };
    } else if (percentage < 75) {
        feedback = { message: "Good effort!", color: "text-yellow-400" };
    }

    return (
        <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Assignment Complete!
            </h2>
            <p className={`text-lg ${feedback.color} mb-8`}>{feedback.message}</p>

            <div className="max-w-3xl mx-auto bg-brand-lilac/5 border border-brand-lavender/20 rounded-2xl p-6 md:p-8 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                 <div className="text-center sm:text-left w-full sm:w-auto flex-grow">
                    <h3 className="text-lg font-semibold text-white mb-1">Your Score</h3>
                    <p className="text-5xl font-bold text-brand-lavender">
                        {score} <span className="text-2xl text-white/60">/ {totalQuestions}</span>
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                        <div className="w-full bg-black/20 rounded-full h-2.5">
                            <div 
                                className="bg-brand-lavender h-2.5 rounded-full transition-all duration-500 ease-out" 
                                style={{ width: `${percentage}%` }}
                                aria-valuenow={percentage}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                role="progressbar"
                                aria-label="Your score percentage"
                            ></div>
                        </div>
                        <p className="text-xl font-semibold text-white w-16 text-right tabular-nums">{percentage}%</p>
                    </div>
                </div>
                {onRestart && (
                    <button
                        onClick={onRestart}
                        className="w-full sm:w-auto bg-brand-violet text-white font-bold py-3 px-6 rounded-lg hover:bg-brand-lavender hover:text-brand-indigo transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-lavender focus:ring-offset-2 focus:ring-offset-brand-indigo whitespace-nowrap"
                    >
                        Try a New Assignment
                    </button>
                )}
                 {onBack && (
                    <button
                        onClick={onBack}
                        className="w-full sm:w-auto bg-brand-violet text-white font-bold py-3 px-6 rounded-lg hover:bg-brand-lavender hover:text-brand-indigo transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-brand-lavender focus:ring-offset-2 focus:ring-offset-brand-indigo whitespace-nowrap"
                    >
                        Back to History
                    </button>
                )}
            </div>
        </div>
    );
};

export default AssignmentResults;