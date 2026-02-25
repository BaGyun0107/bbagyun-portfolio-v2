import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownViewerProps {
  content: string;
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  const components: Components = {
    // Customize rendering of specific elements if needed
    a: ({ node, ...props }) => (
      <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline underline-offset-4 decoration-primary/50" />
    ),
    ul: ({ node, ...props }) => (
      <ul {...props} className="list-disc pl-6 space-y-1 marker:text-muted-foreground" />
    ),
    ol: ({ node, ...props }) => (
      <ol {...props} className="list-decimal pl-6 space-y-1 marker:text-muted-foreground" />
    ),
    blockquote: ({ node, ...props }) => (
      <blockquote {...props} className="border-l-4 border-primary/20 bg-muted/30 px-4 py-2 my-4 rounded-r-md italic text-muted-foreground" />
    ),
    code: ({ node, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || "");
      const isInline = !match && !className?.includes('language-');
      
      return isInline ? (
        <code {...props} className="px-1.5 py-0.5 rounded-md bg-muted font-mono text-sm text-primary">
          {children}
        </code>
      ) : (
        <code {...props} className={className}>
          {children}
        </code>
      );
    },
    pre: ({ node, ...props }) => (
      <pre {...props} className="p-4 my-4 rounded-lg bg-zinc-950 text-zinc-50 overflow-x-auto text-sm" />
    ),
  };

  return (
    <div className="prose prose-zinc max-w-none dark:prose-invert 
                    // Notion Headings
                    prose-headings:font-semibold prose-heading:tracking-tight
                    prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-8
                    prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-8
                    prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-6
                    
                    // Paragraphs and general text
                    prose-p:leading-relaxed prose-p:text-base prose-p:mb-5
                    
                    // Notion styling overrides
                    prose-hr:border-zinc-200 dark:prose-hr:border-zinc-800
                    
                    // Remove default margins where our custom components handle them
                    prose-pre:m-0 prose-pre:bg-transparent">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}
