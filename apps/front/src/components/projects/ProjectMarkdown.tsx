import Link from 'next/link';
import { Children, type ReactNode } from 'react';

import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ProjectMarkdownProps {
  content: string;
}

const getLinkLabel = (children: ReactNode): string =>
  Children.toArray(children)
    .map((child) => (typeof child === 'string' || typeof child === 'number' ? String(child) : ''))
    .join('')
    .trim() || '외부 링크';

const components: Components = {
  a: ({ children, href }) => {
    const className = 'text-primary underline-offset-4 decoration-primary/50 hover:underline';

    if (href?.startsWith('/')) {
      return (
        <Link href={href} className={className}>
          {children}
        </Link>
      );
    }

    return (
      <a
        href={href}
        target='_blank'
        rel='noopener noreferrer'
        aria-label={`${getLinkLabel(children)} (새 창에서 열림)`}
        className={className}
      >
        {children}
      </a>
    );
  },
  ul: ({ children }) => <ul className='list-disc space-y-1 pl-6 marker:text-muted-foreground'>{children}</ul>,
  ol: ({ children }) => <ol className='list-decimal space-y-1 pl-6 marker:text-muted-foreground'>{children}</ol>,
  blockquote: ({ children }) => (
    <blockquote className='my-4 rounded-r-md border-l-4 border-primary/30 bg-muted/40 px-4 py-2 italic text-muted-foreground'>
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className='rounded-md border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 font-mono text-sm text-rose-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-rose-400'>
      {children}
    </code>
  )
};

export function ProjectMarkdown({ content }: ProjectMarkdownProps) {
  return (
    <div className='prose prose-zinc max-w-none dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-7 prose-p:text-base prose-ul:mb-4 prose-ol:mb-4'>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
