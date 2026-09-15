import { ProjectMarkdown } from './ProjectMarkdown';

interface ProjectNarrativeProps {
  title: string;
  content: string;
}

export function ProjectNarrative({ title, content }: ProjectNarrativeProps) {
  return (
    <section className='space-y-4'>
      <h2 className='border-b pb-2 text-2xl font-semibold'>{title}</h2>
      <ProjectMarkdown content={content} />
    </section>
  );
}
