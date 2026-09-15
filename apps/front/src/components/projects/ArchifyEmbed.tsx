'use client';

import { useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';

import {
  FEATURE_RELATIONSHIP_ARCHIFY_URLS,
  FEATURE_SWIMLANE_ARCHIFY_URLS,
  type FeatureArchifyUrl
} from '@/data/portfolio/types/feature-detail.dto';

export const ARCHIFY_PREVIEW_ROOT_MARGIN = '240px 0px';
export const ARCHIFY_PREPARE_TIMEOUT_MS = 5_000;

const ARCHIFY_EMBED_ASPECT_RATIOS: Record<FeatureArchifyUrl, number> = {
  '/diagrams/codi-harness-dx-platform/design-development-verification.html': 869 / 836,
  '/diagrams/codi-harness-dx-platform/cicd-secrets-deployment.html': 866 / 836,
  '/diagrams/hanmaum-science-institute/ingestion-and-recovery.html': 805 / 836,
  '/diagrams/hanmaum-science-institute/search-request-flow.html': 901 / 528,
  '/diagrams/blackstone-belleforet-resort/payment-and-compensation.html': 945 / 1076,
  '/diagrams/hipass-b2b-platform/order-payment-compensation.html': 937 / 836,
  '/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html': 1085 / 528,
  '/diagrams/integrated-sso-server/central-account-auth-flow.html': 930 / 1316,
  '/diagrams/integrated-reservation-platform/uat-booking-payment-flow.html': 966 / 786,
  '/diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.html': 1362 / 652,
  '/diagrams/integrated-reservation-platform/core-product-relationships.html': 1040 / 650
};

const APPROVED_ARCHIFY_EMBED_URLS = new Set<string>([
  ...FEATURE_SWIMLANE_ARCHIFY_URLS,
  ...FEATURE_RELATIONSHIP_ARCHIFY_URLS
]);

export type ArchifyEmbedMode = 'preview' | 'dialog';
export type ArchifyEmbedState = 'idle' | 'loading' | 'ready' | 'fallback';
export type ArchifyEmbedEvent = 'request-load' | 'prepared' | 'failed';
export const ARCHIFY_EMBED_CONTROLLER_BINDING = 'archify-embed-controller-v1';

export interface ArchifyThemeSnapshot {
  background: string;
  foreground: string;
  card: string;
  muted: string;
  mutedForeground: string;
  destructive: string;
  border: string;
}

export interface ArchifyEmbedThemeObserver {
  disconnect: () => void;
}

export interface ArchifyEmbedRuntimeBindings {
  createPreviewLoadLifecycle: (target: Element, requestLoad: () => void) => () => void;
  schedulePrepareTimeout: (onTimeout: () => void) => () => void;
  applyFrame: (frame: HTMLIFrameElement, mode: ArchifyEmbedMode) => void;
  observeTheme: (onChange: () => void) => ArchifyEmbedThemeObserver | null;
}

export interface ArchifyEmbedView {
  binding: typeof ARCHIFY_EMBED_CONTROLLER_BINDING;
  shouldMountFrame: boolean;
  isReady: boolean;
  shouldShowFallback: boolean;
  shouldShowPlaceholder: boolean;
  aspectRatio: number | undefined;
}

export interface ArchifyEmbedController {
  binding: typeof ARCHIFY_EMBED_CONTROLLER_BINDING;
  runtime: ArchifyEmbedRuntimeBindings;
  initialState: ArchifyEmbedState;
  view: (state: ArchifyEmbedState, url: string) => ArchifyEmbedView;
  requestLoad: () => void;
  bindPreview: (target: Element) => (() => void) | undefined;
  bindPrepareTimeout: (state: ArchifyEmbedState) => (() => void) | undefined;
  prepareFrame: (frame: HTMLIFrameElement) => void;
  fail: () => void;
  cleanup: () => void;
}

interface ArchifyEmbedProps {
  url: FeatureArchifyUrl;
  mode: ArchifyEmbedMode;
  title: string;
  describedBy: string;
  fallback: ReactNode;
  legacySurface?: 'swimlane';
  runtime?: ArchifyEmbedRuntimeBindings;
}

const THEME_VARIABLES: Record<keyof ArchifyThemeSnapshot, string> = {
  background: '--background',
  foreground: '--foreground',
  card: '--card',
  muted: '--muted',
  mutedForeground: '--muted-foreground',
  destructive: '--destructive',
  border: '--border'
};

const ARCHIFY_SEMANTIC_KINDS = ['frontend', 'backend', 'cloud', 'messagebus', 'external'] as const;

export const isApprovedArchifyEmbedUrl = (url: string): url is FeatureArchifyUrl =>
  APPROVED_ARCHIFY_EMBED_URLS.has(url);

export const getArchifyEmbedAspectRatio = (url: string): number | undefined =>
  isApprovedArchifyEmbedUrl(url) ? ARCHIFY_EMBED_ASPECT_RATIOS[url] : undefined;

export const getNextArchifyEmbedState = (state: ArchifyEmbedState, event: ArchifyEmbedEvent): ArchifyEmbedState => {
  if (event === 'failed') return 'fallback';
  if (state === 'fallback' || state === 'ready') return state;
  if (state === 'idle' && event === 'request-load') return 'loading';
  if (state === 'loading' && event === 'prepared') return 'ready';
  return state;
};

export const getInitialArchifyEmbedState = (mode: ArchifyEmbedMode): ArchifyEmbedState =>
  mode === 'dialog' ? 'loading' : 'idle';

export const createArchifyPreviewLoadLifecycle = (target: Element, requestLoad: () => void): (() => void) => {
  if (typeof IntersectionObserver === 'undefined') {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) requestLoad();
    });
    return () => {
      cancelled = true;
    };
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some(({ isIntersecting }) => isIntersecting)) return;
      requestLoad();
      observer.disconnect();
    },
    { rootMargin: ARCHIFY_PREVIEW_ROOT_MARGIN }
  );
  observer.observe(target);

  return () => observer.disconnect();
};

export const scheduleArchifyEmbedTimeout = (onTimeout: () => void): (() => void) => {
  const timeout = globalThis.setTimeout(onTimeout, ARCHIFY_PREPARE_TIMEOUT_MS);
  return () => globalThis.clearTimeout(timeout);
};

const readPortfolioTheme = (): ArchifyThemeSnapshot => {
  const computed = window.getComputedStyle(document.documentElement);
  const read = (name: string): string => {
    const value = computed.getPropertyValue(name).trim();
    if (!value) throw new Error(`포트폴리오 테마 변수 ${name}을 찾을 수 없습니다.`);
    return value;
  };

  return Object.fromEntries(
    Object.entries(THEME_VARIABLES).map(([key, name]) => [key, read(name)])
  ) as unknown as ArchifyThemeSnapshot;
};

export const applyArchifyPresentation = (
  artifactDocument: Document,
  mode: ArchifyEmbedMode,
  theme: ArchifyThemeSnapshot
): void => {
  const root = artifactDocument.documentElement;
  const body = artifactDocument.body;
  const diagram = artifactDocument.querySelector<HTMLElement>('.diagram-container');
  const svg = artifactDocument.querySelector<SVGSVGElement>('.diagram-container > svg');

  if (!root || !body || !diagram || !svg) throw new Error('Archify diagram DOM을 찾을 수 없습니다.');

  root.setAttribute('data-embed', 'true');
  root.setAttribute('data-motion', 'still');
  body.setAttribute('inert', '');
  diagram.setAttribute('data-detail-level', mode === 'preview' ? 'map' : 'read');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  root.style.setProperty('--bg', theme.background);
  root.style.setProperty('--grid', theme.border);
  root.style.setProperty('--text', theme.foreground);
  root.style.setProperty('--text-muted', theme.mutedForeground);
  root.style.setProperty('--text-dim', theme.mutedForeground);
  root.style.setProperty('--text-faint', theme.mutedForeground);
  root.style.setProperty('--panel', theme.card);
  root.style.setProperty('--panel-border', theme.border);
  root.style.setProperty('--lane-fill', theme.muted);
  root.style.setProperty('--lane-stroke', theme.border);
  root.style.setProperty('--arrow', theme.foreground);
  root.style.setProperty('--arrow-emphasis', theme.foreground);
  root.style.setProperty('--mask', theme.card);
  root.style.setProperty('--security-fill', theme.card);
  root.style.setProperty('--security-stroke', theme.destructive);
  root.style.setProperty('--database-fill', theme.card);
  root.style.setProperty('--database-stroke', theme.destructive);

  ARCHIFY_SEMANTIC_KINDS.forEach((kind) => {
    root.style.setProperty(`--${kind}-fill`, theme.card);
    root.style.setProperty(`--${kind}-stroke`, theme.border);
  });

  artifactDocument.querySelectorAll<SVGElement>('[data-legend]').forEach((legend) => {
    legend.setAttribute('aria-hidden', 'true');
    legend.style.setProperty('display', 'none', 'important');
  });

  const emphasisEdgeIds = new Set<string>();
  artifactDocument.querySelectorAll<SVGPathElement>('path.a-emphasis[data-edge-id]').forEach((edge) => {
    const edgeId = edge.getAttribute('data-edge-id');
    if (edgeId) emphasisEdgeIds.add(edgeId);
  });
  artifactDocument.querySelectorAll<SVGGElement>('g[data-edge-id]').forEach((group) => {
    const edgeId = group.getAttribute('data-edge-id');
    if (!edgeId || !emphasisEdgeIds.has(edgeId)) return;
    group
      .querySelectorAll<SVGTextElement>('text')
      .forEach((label) => label.style.setProperty('fill', 'var(--arrow-emphasis)'));
  });

  root.style.setProperty('width', '100%', 'important');
  root.style.setProperty('height', '100%', 'important');
  root.style.setProperty('overflow', 'hidden', 'important');
  body.style.setProperty('width', '100%', 'important');
  body.style.setProperty('height', '100%', 'important');
  body.style.setProperty('margin', '0', 'important');
  body.style.setProperty('overflow', 'hidden', 'important');
  diagram.style.setProperty('width', '100vw', 'important');
  diagram.style.setProperty('height', '100vh', 'important');
  diagram.style.setProperty('min-height', '0', 'important');
  diagram.style.setProperty('padding', '0', 'important');
  diagram.style.setProperty('border', '0', 'important');
  diagram.style.setProperty('overflow', 'hidden', 'important');
  svg.style.setProperty('display', 'block', 'important');
  svg.style.setProperty('width', '100vw', 'important');
  svg.style.setProperty('height', '100vh', 'important');
  svg.style.setProperty('max-width', '100%', 'important');
  svg.style.setProperty('max-height', '100%', 'important');

  artifactDocument.querySelectorAll<HTMLElement>('[tabindex]').forEach((element) => {
    element.setAttribute('tabindex', '-1');
  });
};

export const prepareArchifyFrame = (
  frame: HTMLIFrameElement,
  mode: ArchifyEmbedMode,
  theme: ArchifyThemeSnapshot
): void => {
  const artifactDocument = frame.contentDocument;
  if (!artifactDocument) throw new Error('Archify document에 접근할 수 없습니다.');
  applyArchifyPresentation(artifactDocument, mode, theme);
};

const applyArchifyFrameFromPortfolioTheme = (frame: HTMLIFrameElement, mode: ArchifyEmbedMode): void => {
  prepareArchifyFrame(frame, mode, readPortfolioTheme());
};

const observePortfolioTheme = (onChange: () => void): ArchifyEmbedThemeObserver | null => {
  if (typeof MutationObserver === 'undefined') return null;

  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'style']
  });
  return observer;
};

export const ARCHIFY_EMBED_RUNTIME_BINDINGS: ArchifyEmbedRuntimeBindings = {
  createPreviewLoadLifecycle: createArchifyPreviewLoadLifecycle,
  schedulePrepareTimeout: scheduleArchifyEmbedTimeout,
  applyFrame: applyArchifyFrameFromPortfolioTheme,
  observeTheme: observePortfolioTheme
};

export const getArchifyEmbedView = (state: ArchifyEmbedState, url: string): ArchifyEmbedView => {
  const shouldShowFallback = state === 'fallback';

  return {
    binding: ARCHIFY_EMBED_CONTROLLER_BINDING,
    shouldMountFrame: state === 'loading' || state === 'ready',
    isReady: state === 'ready',
    shouldShowFallback,
    shouldShowPlaceholder: state === 'idle' || state === 'loading',
    aspectRatio: shouldShowFallback ? undefined : getArchifyEmbedAspectRatio(url)
  };
};

export const createArchifyEmbedController = (
  mode: ArchifyEmbedMode,
  dispatch: (event: ArchifyEmbedEvent) => void,
  runtime: ArchifyEmbedRuntimeBindings = ARCHIFY_EMBED_RUNTIME_BINDINGS
): ArchifyEmbedController => {
  let themeObserver: ArchifyEmbedThemeObserver | null = null;
  const disconnectThemeObserver = (): void => {
    themeObserver?.disconnect();
    themeObserver = null;
  };
  const fail = (): void => {
    disconnectThemeObserver();
    dispatch('failed');
  };

  return {
    binding: ARCHIFY_EMBED_CONTROLLER_BINDING,
    runtime,
    initialState: getInitialArchifyEmbedState(mode),
    view: getArchifyEmbedView,
    requestLoad: () => dispatch('request-load'),
    bindPreview: (target) =>
      mode === 'preview' ? runtime.createPreviewLoadLifecycle(target, () => dispatch('request-load')) : undefined,
    bindPrepareTimeout: (state) => (state === 'loading' ? runtime.schedulePrepareTimeout(fail) : undefined),
    prepareFrame: (frame) => {
      try {
        const applyFrame = () => runtime.applyFrame(frame, mode);
        applyFrame();
        disconnectThemeObserver();
        themeObserver = runtime.observeTheme(() => {
          try {
            applyFrame();
          } catch {
            fail();
          }
        });
        dispatch('prepared');
      } catch {
        fail();
      }
    },
    fail,
    cleanup: disconnectThemeObserver
  };
};

export function ArchifyEmbed({ url, mode, title, describedBy, fallback, legacySurface, runtime }: ArchifyEmbedProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [state, dispatch] = useReducer(getNextArchifyEmbedState, mode, getInitialArchifyEmbedState);
  const controller = useMemo(() => createArchifyEmbedController(mode, dispatch, runtime), [mode, runtime]);
  const view = controller.view(state, url);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    return controller.bindPreview(wrapper);
  }, [controller]);

  useEffect(() => controller.bindPrepareTimeout(state), [controller, state]);

  useEffect(() => () => controller.cleanup(), [controller]);

  const readyClassName =
    mode === 'preview'
      ? 'relative min-w-0 w-full max-w-full overflow-hidden'
      : 'relative min-h-80 min-w-0 w-full max-w-full overflow-hidden';

  return (
    <div
      ref={wrapperRef}
      data-archify-embed={mode}
      data-archify-controller={view.binding}
      {...(legacySurface === 'swimlane' ? { 'data-archify-swimlane': mode } : {})}
      data-archify-state={state}
      role='img'
      aria-label={`${title} ${mode === 'preview' ? '미리보기' : '상세 보기'}`}
      aria-describedby={describedBy}
      className={view.shouldShowFallback ? 'relative min-w-0 w-full max-w-full overflow-hidden' : readyClassName}
      style={view.aspectRatio ? { aspectRatio: view.aspectRatio } : undefined}
    >
      {view.shouldShowPlaceholder ? (
        <div
          data-archify-placeholder={mode}
          aria-hidden='true'
          className='absolute inset-0 flex items-center justify-center bg-muted/20 text-xs text-muted-foreground'
        >
          다이어그램 준비 중
        </div>
      ) : null}
      {view.shouldShowFallback ? fallback : null}
      {view.shouldMountFrame ? (
        <iframe
          title={`${title} Archify 표시 자료`}
          src={url}
          sandbox='allow-same-origin'
          aria-hidden='true'
          tabIndex={-1}
          loading={mode === 'preview' ? 'lazy' : 'eager'}
          data-archify-frame={mode}
          className={[
            'pointer-events-none absolute inset-0 h-full w-full border-0',
            view.isReady ? 'visible opacity-100' : 'invisible opacity-0'
          ].join(' ')}
          onLoad={(event) => controller.prepareFrame(event.currentTarget)}
          onError={controller.fail}
        />
      ) : null}
    </div>
  );
}
