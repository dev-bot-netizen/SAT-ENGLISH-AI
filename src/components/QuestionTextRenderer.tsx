import React from 'react';
import type { Highlight } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface QuestionTextRendererProps {
  text: string;
  highlights: Highlight[];
  isHighlightMode: boolean;
  onHighlightClick: (id: string) => void;
}

const renderMarkdownSegment = (text: string) => (
    <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
            h3: ({...props}) => <p className="font-bold my-2" {...props} />,
            p: ({...props}) => <p className="mb-2" {...props} />,
        }}
    >
        {text}
    </ReactMarkdown>
);

const markdownToPlainText = (markdown: string): string => {
    // This function attempts to convert markdown to a plain text string that closely
    // matches what a browser's .textContent property would produce.
    return markdown
      // Remove headers and other block elements first
      .replace(/###.*?###\s*/g, '')
      .replace(/(\*\*|__)(.*?)\1/g, '$2') // Bold
      .replace(/(\*|_)(.*?)\1/g, '$2')   // Italic
      .replace(/~~(.*?)~~/g, '$1')      // Strikethrough
      .replace(/`([^`]+)`/g, '$1')      // Inline code
      .replace(/\!\[(.*?)\]\(.*?\)/g, '$1') // Image alt text
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')   // Link text
      // Collapse newlines and tabs to a single space
      .replace(/\s+/g, ' ')
      .trim();
};


const QuestionTextRenderer: React.FC<QuestionTextRendererProps> = ({ text, highlights, isHighlightMode, onHighlightClick }) => {
  const renderContent = () => {
    // When not in highlight mode, render the full markdown for best appearance.
    if (!isHighlightMode) {
      return renderMarkdownSegment(text);
    }
    
    // When in highlight mode, switch to a plain text renderer to ensure
    // that highlight indices (based on plain text selection) are accurate.
    const plainText = markdownToPlainText(text);

    if (!highlights || highlights.length === 0) {
        return <>{plainText}</>;
    }

    const points = new Set([0, plainText.length]);
    highlights.forEach(h => {
        points.add(h.startIndex);
        points.add(h.endIndex);
    });
    
    const sortedPoints = Array.from(points).sort((a, b) => a - b);
    
    const segments = [];
    for (let i = 0; i < sortedPoints.length - 1; i++) {
        const start = sortedPoints[i];
        const end = sortedPoints[i+1];
        if (start >= end) continue;

        const activeHighlight = [...highlights]
            .reverse()
            .find(h => h.startIndex <= start && h.endIndex >= end);
            
        segments.push({
            subtext: plainText.substring(start, end),
            highlight: activeHighlight
        });
    }

    // Render each segment, applying highlights.
    return segments.map((seg, index) => {
        if (seg.highlight) {
            const currentHighlight = seg.highlight;
            const colorClass = {
                yellow: 'bg-yellow-400/60 hover:bg-yellow-400/80',
                pink: 'bg-pink-400/60 hover:bg-pink-400/80',
                cyan: 'bg-cyan-400/60 hover:bg-cyan-400/80',
            }[currentHighlight.color];
            return (
                <mark
                    key={index}
                    className={`${colorClass} rounded-sm px-0.5 cursor-pointer transition-colors`}
                    onClick={() => onHighlightClick(currentHighlight.id)}
                >
                    {seg.subtext}
                </mark>
            );
        } else {
            return <React.Fragment key={index}>{seg.subtext}</React.Fragment>;
        }
    });
  }

  return (
    <div className="text-slate-800 dark:text-gray-200 whitespace-pre-line mb-6">
      {renderContent()}
    </div>
  );
};

export default QuestionTextRenderer;
