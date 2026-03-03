import ReactMarkdown from "react-markdown";

interface InlineMarkdownProps {
  content: string;
  className?: string;
}

export function InlineMarkdown({ content, className }: InlineMarkdownProps) {
  return (
    <span className={className}>
      <ReactMarkdown
        components={{
          p: ({ node, ...props }) => <span {...props} />, // Prevent nested <p> blocks where inline text is expected
          strong: ({ node, ...props }) => (
            <strong {...props} className="font-bold text-zinc-900 dark:text-zinc-100" />
          ),
          b: ({ node, ...props }) => (
            <b {...props} className="font-bold text-zinc-900 dark:text-zinc-100" />
          ),
          code: ({ node, className, children, ...props }) => (
            <code {...props} className="px-1.5 py-0.5 mx-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-xs text-rose-600 dark:text-rose-400">
              {children}
            </code>
          )
        }}
      >
        {content?.replace(/(^|[^\\])\*\*(?=\S)(.*?\S)\*\*/g, '$1 **$2** ') || ""}
      </ReactMarkdown>
    </span>
  );
}
