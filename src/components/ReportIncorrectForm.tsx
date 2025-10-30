
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
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 text-left max-w-sm mx-auto">
            <h4 className="font-semibold text-white mb-2">Report Incorrect Solution</h4>
            <p className="text-sm text-gray-400 mb-4">Please provide the correct answer choice (A, B, C, or D). Your feedback helps improve the AI.</p>
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
                <input
                    type="text"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value.toUpperCase())}
                    maxLength={1}
                    placeholder="e.g., C"
                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                    pattern="[a-dA-D]"
                />
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-purple-600 text-white font-bold py-2 px-4 rounded-md hover:bg-purple-500 disabled:bg-gray-700 flex items-center justify-center"
                >
                    {isSubmitting ? <SpinnerIcon className="w-5 h-5" /> : 'Submit'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="bg-gray-600 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-500"
                >
                    Cancel
                </button>
            </form>
        </div>
    );
};

export default ReportIncorrectForm;