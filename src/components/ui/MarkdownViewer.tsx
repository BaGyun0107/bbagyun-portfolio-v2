"use client";

import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

interface MarkdownViewerProps {
  content: string;
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  const components: Components = {
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
      <blockquote {...props} className="border-l-4 border-primary/30 bg-muted/40 px-4 py-2 my-4 rounded-r-md italic text-muted-foreground" />
    ),
    strong: ({ node, ...props }) => (
      <strong {...props} className="font-bold text-zinc-900 dark:text-zinc-100" />
    ),
    b: ({ node, ...props }) => (
      <b {...props} className="font-bold text-zinc-900 dark:text-zinc-100" />
    ),
    // 인라인 코드 (`backtick`)
    code: ({ node, className, children, ...props }) => {
      const isBlock = className?.includes("language-");
      if (isBlock) {
        return <code {...props} className={className}>{children}</code>;
      }
      return (
        <code {...props} className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-sm text-rose-600 dark:text-rose-400">
          {children}
        </code>
      );
    },
    // 코드블록 컨테이너
    pre: ({ node, children, ...props }) => (
      <div className="relative my-5 rounded-xl overflow-hidden border border-zinc-700 shadow-lg">
        {/* 상단 바 (macOS 도트 스타일) */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-800 border-b border-zinc-700">
          <span className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
          <span className="w-3 h-3 rounded-full bg-yellow-400 opacity-80" />
          <span className="w-3 h-3 rounded-full bg-green-500 opacity-80" />
        </div>
        <pre
          {...props}
          className="p-5 bg-zinc-900 text-zinc-100 overflow-x-auto text-sm leading-relaxed font-mono m-0 rounded-none"
        >
          {children}
        </pre>
      </div>
    ),
  };

  return (
    <>
      {/* rehype-highlight CSS — GitHub Dark 테마 */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css"
      />
      <div
        className="prose prose-zinc max-w-none dark:prose-invert
                   prose-headings:font-semibold prose-headings:tracking-tight
                   prose-h1:text-3xl prose-h1:mb-4 prose-h1:mt-8
                   prose-h2:text-2xl prose-h2:mb-4 prose-h2:mt-8 prose-h2:border-b prose-h2:border-zinc-200 prose-h2:dark:border-zinc-700 prose-h2:pb-2
                   prose-h3:text-xl prose-h3:mb-2 prose-h3:mt-6
                   prose-p:leading-relaxed prose-p:text-base prose-p:mb-5
                   prose-hr:border-zinc-200 dark:prose-hr:border-zinc-800
                   prose-pre:m-0 prose-pre:bg-transparent prose-pre:p-0"
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={components}>
          {content?.replace(/(^|[^\\])\*\*(?=\S)(.*?\S)\*\*/g, '$1 **$2** ') || ""}
        </ReactMarkdown>
      </div>
    </>
  );
}
