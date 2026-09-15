'use client';

import type { ReactNode } from 'react';

import type { FeatureSwimlaneArchifyUrl } from '@/data/portfolio/types/feature-detail.dto';

import { ArchifyEmbed, getArchifyEmbedAspectRatio } from './ArchifyEmbed';

export {
  ARCHIFY_PREPARE_TIMEOUT_MS,
  ARCHIFY_PREVIEW_ROOT_MARGIN,
  ARCHIFY_EMBED_CONTROLLER_BINDING,
  ARCHIFY_EMBED_RUNTIME_BINDINGS,
  ArchifyEmbed,
  applyArchifyPresentation,
  createArchifyEmbedController,
  createArchifyPreviewLoadLifecycle,
  getArchifyEmbedAspectRatio,
  getArchifyEmbedView,
  getInitialArchifyEmbedState,
  getNextArchifyEmbedState,
  isApprovedArchifyEmbedUrl,
  prepareArchifyFrame,
  scheduleArchifyEmbedTimeout,
  scheduleArchifyEmbedTimeout as scheduleArchifyPrepareTimeout,
  type ArchifyEmbedEvent,
  type ArchifyEmbedMode,
  type ArchifyEmbedController,
  type ArchifyEmbedRuntimeBindings,
  type ArchifyEmbedState,
  type ArchifyEmbedThemeObserver,
  type ArchifyEmbedView,
  type ArchifyThemeSnapshot
} from './ArchifyEmbed';

interface ArchifySwimlaneEmbedProps {
  url: FeatureSwimlaneArchifyUrl;
  mode: 'preview' | 'dialog';
  title: string;
  describedBy: string;
  fallback: ReactNode;
}

export const getArchifyPreviewAspectRatio = (url: FeatureSwimlaneArchifyUrl): number =>
  getArchifyEmbedAspectRatio(url)!;

export function ArchifySwimlaneEmbed(props: ArchifySwimlaneEmbedProps) {
  return <ArchifyEmbed {...props} legacySurface='swimlane' />;
}
