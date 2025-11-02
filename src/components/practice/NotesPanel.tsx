import React, { useEffect, useRef } from 'react';
import { Highlight } from '../../types';

interface NotesPanelProps {
    highlights: Highlight[];
    onNoteChange: (highlightId: string, note: string) => void;
    activeHighlightId: string | null;
    setActiveHighlightId: (id: string | null) => void;
    onDeleteHighlight: (id: string) => void;
}

const NotesPanel: React.FC<NotesPanelProps> = ({ highlights, onNoteChange, activeHighlightId, setActiveHighlightId, onDeleteHighlight }) => {
    const activeNoteRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeHighlightId && activeNoteRef.current) {
            activeNoteRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [activeHighlightId]);
    
    return (
        <div className="bg-black/20 rounded-xl border border-brand-lavender/20 h-full flex flex-col max-h-[50vh] md:max-h-none">
            <h3 className="text-lg font-bold text-white p-4 border-b border-brand-lavender/20">Notes</h3>
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                {highlights.length === 0 && (
                     <p className="text-white/60 text-sm text-center py-8">Select text in the question to create a highlight and add a note.</p>
                )}
                {highlights.map(h => {
                    const isActive = activeHighlightId === h.id;
                    const colorClass = {
                        yellow: 'border-yellow-400/80',
                        pink: 'border-pink-400/80',
                        cyan: 'border-cyan-400/80',
                    }[h.color];

                    return (
                        <div
                            key={h.id}
                            ref={isActive ? activeNoteRef : null}
                            onClick={() => setActiveHighlightId(h.id)}
                            className={`bg-brand-indigo/40 p-3 rounded-lg border-2 transition-all cursor-pointer ${isActive ? `${colorClass} ring-2 ${colorClass.replace('border-','ring-')}` : 'border-transparent hover:border-brand-lavender/50'}`}
                        >
                            <blockquote className={`border-l-4 ${colorClass} pl-3 text-white/70 text-sm italic mb-3`}>
                                "{h.text}"
                            </blockquote>
                            <textarea
                                value={h.note}
                                onChange={(e) => onNoteChange(h.id, e.target.value)}
                                placeholder="Add a note..."
                                className="w-full bg-black/30 rounded p-2 text-sm text-white/90 focus:outline-none focus:ring-2 focus:ring-brand-lavender resize-none"
                                rows={3}
                            />
                             <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteHighlight(h.id);
                                }}
                                className="text-xs text-red-400 hover:text-red-300 hover:underline mt-2 float-right"
                            >
                                Delete
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default NotesPanel;