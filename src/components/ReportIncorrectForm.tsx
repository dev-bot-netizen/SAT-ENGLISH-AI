
import React, { useState } from 'react';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface ReportIncorrectFormProps {
    onSubmit: (correctAnswer: string) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
}

const ReportIncorrectForm: React.FC<ReportIncorrectFormProps> = ({ onSubmit, onCancel, isSubmitting }) => {
    const [correctAnswer, setCorrectAnswer] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (correctAnswer.trim().length === 1 && "ABCD".includes(correctAnswer.toUpperCase())) {
            onSubmit(correctAnswer.toUpperCase());
        }
    };

    return (
        <div className="bg-brand-indigo/40 p-4 rounded-lg border border-brand-lavender/20 text-left max-w-sm mx-auto">
            <h4 className="font-semibold text-white mb-2">Report Incorrect Solution</h4>
            <p className="text-sm text-white/70 mb-4">Please provide the correct answer choice (A, B, C, or D). Your feedback helps improve the AI.</p>
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
                <input
                    type="text"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value.toUpperCase())}
                    maxLength={1}
                    placeholder="e.g., C"
                    className="w-full bg-black/20 border border-brand-lavender/30 rounded-md px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-brand-lavender"
                    required
                    pattern="[a-dA-D]"
                />
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-brand-violet text-white font-bold py-2 px-4 rounded-md hover:bg-brand-lavender hover:text-brand-indigo disabled:bg-brand-lavender/20 disabled:text-white/50 flex items-center justify-center"
                >
                    {isSubmitting ? <SpinnerIcon className="w-5 h-5" /> : 'Submit'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="bg-white/10 text-white font-bold py-2 px-4 rounded-md hover:bg-white/20"
                >
                    Cancel
                </button>
            </form>
        </div>
    );
};

export default ReportIncorrectForm;
