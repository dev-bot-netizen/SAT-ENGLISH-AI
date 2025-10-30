import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    if (!content) return null;

    // Custom renderer for paragraphs to handle the "Final Answer" styling
    const renderParagraph = (props: any) => {
        const { node } = props;
        // Check if the paragraph contains a strong element that starts with "The final answer is"
        if (node.children[0]?.tagName === 'strong' && node.children[0].children[0]?.value?.startsWith('The final answer is')) {
            return <p className="font-bold text-lg text-brand-lavender mb-4" {...props} />;
        }
        // Check for "Step-by-step explanation" which is also bold
        if (node.children[0]?.tagName === 'strong' && node.children[0].children[0]?.value?.startsWith('Step-by-step explanation')) {
             return <h3 className="font-semibold text-white text-lg mt-4 mb-2" {...props} />;
        }
        // Check for "Explanations:" which is also bold
        if (node.children[0]?.tagName === 'strong' && node.children[0].children[0]?.value?.startsWith('Explanations:')) {
             return <h3 className="font-semibold text-white text-lg mt-4 mb-2" {...props} />;
        }
        return <p className="mb-4" {...props} />;
    };

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                p: renderParagraph,
                strong: ({ ...props }) => <strong className="font-semibold text-white" {...props} />,
                ol: ({ ...props }) => <ol className="list-decimal list-inside pl-2 my-4" {...props} />,
                ul: ({ ...props }) => <ul className="list-disc list-inside pl-4 my-4" {...props} />,
                li: ({ ...props }) => <li className="pb-1" {...props} />,
            }}
        >
            {content}
        </ReactMarkdown>
    );
};

export default MarkdownRenderer;