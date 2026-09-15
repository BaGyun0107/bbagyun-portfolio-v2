import * as React from 'react';
import { createElement, type ComponentType, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { getFeatureDetailBySlug, type FeatureRelationshipDiagram } from '@/data/portfolio';

import {
  ARCHIFY_PREVIEW_ROOT_MARGIN,
  ARCHIFY_PREPARE_TIMEOUT_MS,
  ArchifyEmbed,
  ArchifySwimlaneEmbed,
  applyArchifyPresentation,
  createArchifyPreviewLoadLifecycle,
  getArchifyEmbedAspectRatio,
  getArchifyPreviewAspectRatio,
  getInitialArchifyEmbedState,
  getNextArchifyEmbedState,
  prepareArchifyFrame,
  scheduleArchifyPrepareTimeout,
  type ArchifyEmbedRuntimeBindings,
  type ArchifyThemeSnapshot
} from './ArchifySwimlaneEmbed';

type HookProbeDispatcher = {
  useEffect: (create: () => void | (() => void), dependencies?: readonly unknown[]) => void;
  useMemo: <Value>(factory: () => Value, dependencies?: readonly unknown[]) => Value;
  useReducer: <State, Event, InitialArg>(
    reducer: (state: State, event: Event) => State,
    initialArg: InitialArg,
    initializer?: (initialArg: InitialArg) => State
  ) => [State, (event: Event) => void];
  useRef: <Value>(initialValue: Value) => { current: Value };
};

type HookProbeSlot = {
  value?: unknown;
  dependencies?: readonly unknown[];
  cleanup?: () => void;
  dispatch?: (event: unknown) => void;
};

type HookProbeElement = ReactElement<Record<string, unknown>>;

const dependenciesMatch = (left?: readonly unknown[], right?: readonly unknown[]): boolean =>
  left !== undefined &&
  right !== undefined &&
  left.length === right.length &&
  left.every((dependency, index) => Object.is(dependency, right[index]));

const createArchifyHookProbe = <Props extends object>(
  Component: (props: Props) => ReactElement,
  props: Props,
  refTarget: Element
) => {
  const slots: HookProbeSlot[] = [];
  let cursor = 0;
  let pendingEffects: Array<{ slot: HookProbeSlot; create: () => void | (() => void) }> = [];
  let tree: HookProbeElement;

  const dispatcher: HookProbeDispatcher = {
    useEffect: (create, dependencies) => {
      const slot = (slots[cursor] ??= {});
      cursor += 1;
      if (dependenciesMatch(slot.dependencies, dependencies)) return;
      slot.dependencies = dependencies;
      pendingEffects.push({ slot, create });
    },
    useMemo: (factory, dependencies) => {
      const slot = (slots[cursor] ??= {});
      cursor += 1;
      if (!dependenciesMatch(slot.dependencies, dependencies)) {
        slot.value = factory();
        slot.dependencies = dependencies;
      }
      return slot.value as ReturnType<typeof factory>;
    },
    useReducer: <State, Event, InitialArg>(
      reducer: (state: State, event: Event) => State,
      initialArg: InitialArg,
      initializer?: (initialArg: InitialArg) => State
    ) => {
      const slot = (slots[cursor] ??= { value: initializer ? initializer(initialArg) : initialArg });
      cursor += 1;
      slot.dispatch ??= (event: unknown) => {
        slot.value = reducer(slot.value as State, event as Event);
      };
      return [slot.value as State, slot.dispatch as (event: Event) => void];
    },
    useRef: <Value,>(initialValue: Value) => {
      const slot = (slots[cursor] ??= { value: { current: initialValue } });
      cursor += 1;
      return slot.value as { current: Value };
    }
  };

  const internals = Reflect.get(React, '__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE') as {
    H: HookProbeDispatcher | null;
  };

  const render = (): HookProbeElement => {
    cursor = 0;
    pendingEffects = [];
    const previousDispatcher = internals.H;
    internals.H = dispatcher;
    try {
      tree = Component(props) as HookProbeElement;
    } finally {
      internals.H = previousDispatcher;
    }
    (tree.props.ref as { current: Element }).current = refTarget;
    return tree;
  };

  const flushEffects = (): void => {
    const effects = pendingEffects;
    pendingEffects = [];
    effects.forEach(({ slot, create }) => {
      slot.cleanup?.();
      slot.cleanup = create() ?? undefined;
    });
  };

  const unmount = (): void => {
    slots.forEach((slot) => slot.cleanup?.());
  };

  return { render, flushEffects, unmount };
};

const findProbeElement = (node: ReactNode, attribute: string): HookProbeElement | undefined => {
  if (!React.isValidElement<Record<string, unknown>>(node)) {
    if (Array.isArray(node)) {
      for (const child of node) {
        const match = findProbeElement(child, attribute);
        if (match) return match;
      }
    }
    return undefined;
  }
  if (attribute in node.props) return node;
  return findProbeElement(node.props.children as ReactNode, attribute);
};

const theme: ArchifyThemeSnapshot = {
  background: 'oklch(1 0 0)',
  foreground: 'oklch(0.2 0 0)',
  card: 'oklch(0.98 0 0)',
  muted: 'oklch(0.94 0 0)',
  mutedForeground: 'oklch(0.5 0 0)',
  destructive: 'oklch(0.58 0.22 27)',
  border: 'oklch(0.88 0 0)'
};

interface FakeElement {
  attributes: Map<string, string>;
  styleValues: Map<string, string>;
  stylePriorities: Map<string, string>;
  setAttribute: (name: string, value: string) => void;
  style: {
    setProperty: (name: string, value: string, priority?: string) => void;
  };
}

const createFakeElement = (): FakeElement => {
  const attributes = new Map<string, string>();
  const styleValues = new Map<string, string>();
  const stylePriorities = new Map<string, string>();

  return {
    attributes,
    styleValues,
    stylePriorities,
    setAttribute: (name, value) => attributes.set(name, value),
    style: {
      setProperty: (name, value, priority = '') => {
        styleValues.set(name, value);
        stylePriorities.set(name, priority);
      }
    }
  };
};

const createArchifyDocument = () => {
  const root = createFakeElement();
  const body = createFakeElement();
  const diagram = createFakeElement();
  const svg = createFakeElement();
  const legend = createFakeElement();
  const node = createFakeElement();

  const document = {
    documentElement: root,
    body,
    querySelector: (selector: string) => {
      if (selector === '.diagram-container') return diagram;
      if (selector === '.diagram-container > svg') return svg;
      return null;
    },
    querySelectorAll: (selector: string) => {
      if (selector === '[data-legend]') return [legend];
      if (selector === '[tabindex]') return [node];
      return [];
    }
  } as unknown as Document;

  return { document, root, body, diagram, svg, legend, node };
};

describe('ArchifySwimlaneEmbed', () => {
  it('artifact별 실제 viewBox 비율을 preview 컨테이너에 적용해 세로형 흐름을 자르지 않는다', () => {
    expect(
      getArchifyPreviewAspectRatio('/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html')
    ).toBeCloseTo(1085 / 528);
    expect(getArchifyPreviewAspectRatio('/diagrams/integrated-sso-server/central-account-auth-flow.html')).toBeCloseTo(
      930 / 1316
    );
    expect(getArchifyPreviewAspectRatio('/diagrams/hipass-b2b-platform/order-payment-compensation.html')).toBeCloseTo(
      937 / 836
    );
  });

  it('시에나 예약 artifact는 생략되지 않는 양수 preview 캔버스를 렌더링한다', () => {
    const url = '/diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.html' as never;
    const html = renderToStaticMarkup(
      <ArchifySwimlaneEmbed
        url={url}
        mode='preview'
        title='예약 요청·중복 방어·외부 장애 안내 흐름'
        describedBy='siena-flow-summary'
        fallback={<div data-siena-fallback>예약 흐름</div>}
      />
    );
    const aspectRatio = Number(html.match(/style="aspect-ratio:([0-9.]+)"/)?.[1]);

    expect(aspectRatio).toBeGreaterThan(0);
    expect(html).toContain('다이어그램 준비 중');
    expect(html).not.toContain('예약 흐름');
  });

  it('IntersectionObserver를 지원하지 않을 때 unmount된 preview의 예약 microtask는 load하지 않는다', async () => {
    const originalIntersectionObserver = globalThis.IntersectionObserver;
    const requestLoad = vi.fn();

    globalThis.IntersectionObserver = undefined as unknown as typeof IntersectionObserver;

    try {
      const cleanup = createArchifyPreviewLoadLifecycle({} as Element, requestLoad);
      cleanup();
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      expect(requestLoad).not.toHaveBeenCalled();
    } finally {
      globalThis.IntersectionObserver = originalIntersectionObserver;
    }
  });

  it('preview effect lifecycle은 observer 접근·교차·정리와 timeout cleanup을 실제 helper 경로에서 분리한다', () => {
    const observers: Array<{
      callback: (entries: Array<{ isIntersecting: boolean }>) => void;
      disconnect: () => void;
    }> = [];
    const OriginalIntersectionObserver = globalThis.IntersectionObserver;
    const requestLoad = vi.fn();
    const isolatedRequestLoad = vi.fn();
    const onTimeout = vi.fn();
    const isolatedTimeout = vi.fn();
    vi.useFakeTimers();
    globalThis.IntersectionObserver = class {
      private readonly record: (typeof observers)[number];

      constructor(callback: (entries: Array<{ isIntersecting: boolean }>) => void) {
        this.record = { callback, disconnect: vi.fn() };
        observers.push(this.record);
      }
      observe = vi.fn();
      disconnect = () => this.record.disconnect();
      unobserve = vi.fn();
      takeRecords = vi.fn();
      root = null;
      rootMargin = ARCHIFY_PREVIEW_ROOT_MARGIN;
      thresholds = [];
    } as unknown as typeof IntersectionObserver;

    const cleanupPreview = createArchifyPreviewLoadLifecycle({} as Element, requestLoad);
    const cleanupIsolatedPreview = createArchifyPreviewLoadLifecycle({} as Element, isolatedRequestLoad);
    const cleanupTimeout = scheduleArchifyPrepareTimeout(onTimeout);
    const cleanupIsolatedTimeout = scheduleArchifyPrepareTimeout(isolatedTimeout);
    observers[0].callback([{ isIntersecting: true }]);
    cleanupIsolatedPreview();
    cleanupIsolatedTimeout();
    vi.advanceTimersByTime(ARCHIFY_PREPARE_TIMEOUT_MS);
    cleanupPreview();

    expect(requestLoad).toHaveBeenCalledTimes(1);
    expect(onTimeout).toHaveBeenCalledTimes(1);
    expect(isolatedRequestLoad).not.toHaveBeenCalled();
    expect(isolatedTimeout).not.toHaveBeenCalled();
    expect(observers[0].disconnect).toHaveBeenCalledTimes(2);

    cleanupTimeout();

    globalThis.IntersectionObserver = OriginalIntersectionObserver;
    vi.useRealTimers();
  });
  it('preview lifecycle을 idle에서 loading과 ready로만 전이한다', () => {
    expect(getNextArchifyEmbedState('idle', 'request-load')).toBe('loading');
    expect(getNextArchifyEmbedState('loading', 'prepared')).toBe('ready');
    expect(getNextArchifyEmbedState('ready', 'request-load')).toBe('ready');
  });

  it('preview observer는 viewport 240px 전부터 artifact를 준비한다', () => {
    expect(ARCHIFY_PREVIEW_ROOT_MARGIN).toBe('240px 0px');
  });

  it('MAP 문서를 표시 전에 포트폴리오 색상과 비상호작용 상태로 준비한다', () => {
    const { document, root, body, diagram, svg, legend, node } = createArchifyDocument();

    applyArchifyPresentation(document, 'preview', theme);

    expect(root.attributes.get('data-embed')).toBe('true');
    expect(root.attributes.get('data-motion')).toBe('still');
    expect(diagram.attributes.get('data-detail-level')).toBe('map');
    expect(body.attributes.get('inert')).toBe('');
    expect(node.attributes.get('tabindex')).toBe('-1');
    expect(root.styleValues.get('--bg')).toBe(theme.background);
    expect(root.styleValues.get('--frontend-fill')).toBe(theme.card);
    expect(root.styleValues.get('--frontend-stroke')).toBe(theme.border);
    expect(root.styleValues.get('--arrow')).toBe(theme.foreground);
    expect(root.styleValues.get('--database-stroke')).toBe(theme.destructive);
    expect(root.styleValues.get('--security-stroke')).toBe(theme.destructive);
    expect(root.styleValues.get('height')).toBe('100%');
    expect(body.styleValues.get('height')).toBe('100%');
    expect(diagram.styleValues.get('height')).toBe('100vh');
    expect(svg.styleValues.get('height')).toBe('100vh');
    expect(svg.stylePriorities.get('height')).toBe('important');
    expect(legend.attributes.get('aria-hidden')).toBe('true');
    expect(legend.styleValues.get('display')).toBe('none');
    expect(legend.stylePriorities.get('display')).toBe('important');
  });

  it('강조 관계 라벨은 관계선과 같은 강조 색상 변수를 사용한다', () => {
    const { root, body, diagram } = createArchifyDocument();
    const emphasisLabel = createFakeElement();
    const emphasisEdge = {
      getAttribute: (name: string) => (name === 'data-edge-id' ? 'verify-deploy' : null)
    };
    const emphasisLabelGroup = {
      getAttribute: (name: string) => (name === 'data-edge-id' ? 'verify-deploy' : null),
      querySelectorAll: (selector: string) => (selector === 'text' ? [emphasisLabel] : [])
    };
    const documentWithEmphasis = {
      documentElement: root,
      body,
      querySelector: (selector: string) => {
        if (selector === '.diagram-container') return diagram;
        if (selector === '.diagram-container > svg') return createFakeElement();
        return null;
      },
      querySelectorAll: (selector: string) => {
        if (selector === 'path.a-emphasis[data-edge-id]') return [emphasisEdge];
        if (selector === 'g[data-edge-id]') return [emphasisLabelGroup];
        return [];
      }
    } as unknown as Document;

    applyArchifyPresentation(documentWithEmphasis, 'dialog', theme);

    expect(emphasisLabel.styleValues.get('fill')).toBe('var(--arrow-emphasis)');
  });

  it('preview가 관찰되기 전에는 최종 비율의 준비 상태를 유지한다', () => {
    const html = renderToStaticMarkup(
      <ArchifySwimlaneEmbed
        url='/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html'
        mode='preview'
        title='플랫폼 변경·검증·배포 흐름'
        describedBy='flow-summary'
        fallback={<div data-existing-swimlane>기존 흐름</div>}
      />
    );

    expect(html).toContain('data-archify-swimlane="preview"');
    expect(html).toContain('data-archify-controller="archify-embed-controller-v1"');
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-describedby="flow-summary"');
    expect(html).toContain('data-archify-placeholder="preview"');
    expect(html).toContain('style="aspect-ratio:2.054924242424242"');
    expect(html).not.toContain('data-existing-swimlane="true"');
    expect(html).not.toContain('<iframe');
  });

  it('Dialog 표현은 mount와 함께 loading에서 시작한다', () => {
    expect(getInitialArchifyEmbedState('dialog')).toBe('loading');
    expect(getInitialArchifyEmbedState('preview')).toBe('idle');
  });

  it('READ 문서는 같은 geometry에서 세부 설명과 관계 문구를 복원한다', () => {
    const { document, body, diagram } = createArchifyDocument();

    applyArchifyPresentation(document, 'dialog', theme);

    expect(diagram.attributes.get('data-detail-level')).toBe('read');
    expect(body.attributes.get('inert')).toBe('');
  });

  it('Dialog iframe은 즉시 mount하지만 script와 사용자 상호작용을 허용하지 않는다', () => {
    const html = renderToStaticMarkup(
      <ArchifySwimlaneEmbed
        url='/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html'
        mode='dialog'
        title='플랫폼 변경·검증·배포 흐름'
        describedBy='dialog-summary'
        fallback={<div data-existing-dialog-swimlane>기존 상세 흐름</div>}
      />
    );

    expect(html).toContain('data-archify-swimlane="dialog"');
    expect(html).toContain('data-archify-state="loading"');
    expect(html).toContain('style="aspect-ratio:2.054924242424242"');
    expect(html).not.toContain('h-[min(70dvh,48rem)]');
    expect(html).toContain('<iframe');
    expect(html).toContain('loading="eager"');
    expect(html).toContain('sandbox="allow-same-origin"');
    expect(html).not.toContain('allow-scripts');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('data-archify-placeholder="dialog"');
    expect(html).not.toContain('data-existing-dialog-swimlane="true"');
  });

  it('load·DOM·same-origin 실패와 5초 timeout을 fallback으로 수렴시킨다', () => {
    expect(ARCHIFY_PREPARE_TIMEOUT_MS).toBe(5_000);
    expect(getNextArchifyEmbedState('idle', 'failed')).toBe('fallback');
    expect(getNextArchifyEmbedState('loading', 'failed')).toBe('fallback');
    expect(getNextArchifyEmbedState('ready', 'failed')).toBe('fallback');

    const missingSvgDocument = {
      documentElement: createFakeElement(),
      body: createFakeElement(),
      querySelector: (selector: string) => (selector === '.diagram-container' ? createFakeElement() : null),
      querySelectorAll: () => []
    } as unknown as Document;
    expect(() => applyArchifyPresentation(missingSvgDocument, 'preview', theme)).toThrow(
      'Archify diagram DOM을 찾을 수 없습니다.'
    );

    const inaccessibleFrame = {
      get contentDocument() {
        throw new DOMException('Blocked', 'SecurityError');
      }
    } as unknown as HTMLIFrameElement;
    expect(() => prepareArchifyFrame(inaccessibleFrame, 'preview', theme)).toThrow();

    const emptyFrame = { contentDocument: null } as HTMLIFrameElement;
    expect(() => prepareArchifyFrame(emptyFrame, 'preview', theme)).toThrow('Archify document에 접근할 수 없습니다.');
  });
});

describe('행사 호텔 예약·결제 Archify embed RED 계약', () => {
  const workflowUrl = '/diagrams/integrated-reservation-platform/uat-booking-payment-flow.html';
  const architectureUrl = '/diagrams/integrated-reservation-platform/core-product-relationships.html';

  it('전달된 두 SVG의 실제 viewBox 비율을 공통 preview metadata에 사용한다', () => {
    const workflowArtifact = readFileSync(
      resolve(process.cwd(), 'public/diagrams/integrated-reservation-platform/uat-booking-payment-flow.html'),
      'utf8'
    );
    const architectureArtifact = readFileSync(
      resolve(process.cwd(), 'public/diagrams/integrated-reservation-platform/core-product-relationships.html'),
      'utf8'
    );

    expect(workflowArtifact).toContain('<svg viewBox="0 0 966 786"');
    expect(architectureArtifact).toContain('<svg viewBox="0 0 1040 650"');
    expect(getArchifyPreviewAspectRatio(workflowUrl as never)).toBeCloseTo(966 / 786);
    expect(getArchifyEmbedAspectRatio(architectureUrl)).toBeCloseTo(1040 / 650);
  });

  type CommonArchifyEmbedApi = {
    ArchifyEmbed: ComponentType<{
      url: string;
      mode: 'preview' | 'dialog';
      title: string;
      describedBy: string;
      fallback: ReactNode;
    }>;
    getArchifyEmbedAspectRatio: (url: string) => number | undefined;
    isApprovedArchifyEmbedUrl: (url: string) => boolean;
    getNextArchifyEmbedState: (
      state: 'idle' | 'loading' | 'ready' | 'fallback',
      event: 'request-load' | 'prepared' | 'failed'
    ) => 'idle' | 'loading' | 'ready' | 'fallback';
    scheduleArchifyEmbedTimeout: (onTimeout: () => void) => () => void;
    ARCHIFY_EMBED_CONTROLLER_BINDING: string;
    ARCHIFY_EMBED_RUNTIME_BINDINGS: ArchifyEmbedRuntimeBindingsFixture;
    createArchifyEmbedController: (
      mode: 'preview' | 'dialog',
      dispatch: (event: 'request-load' | 'prepared' | 'failed') => void,
      runtime?: ArchifyEmbedRuntimeBindingsFixture
    ) => ArchifyEmbedControllerFixture;
  };

  type EmbedStateFixture = 'idle' | 'loading' | 'ready' | 'fallback';
  type ThemeObserverFixture = { disconnect: () => void };
  type ArchifyEmbedRuntimeBindingsFixture = {
    createPreviewLoadLifecycle: (target: Element, requestLoad: () => void) => () => void;
    schedulePrepareTimeout: (onTimeout: () => void) => () => void;
    applyFrame: (frame: HTMLIFrameElement, mode: 'preview' | 'dialog') => void;
    observeTheme: (onChange: () => void) => ThemeObserverFixture | null;
  };
  type ArchifyEmbedViewFixture = {
    binding: string;
    shouldMountFrame: boolean;
    isReady: boolean;
    shouldShowFallback: boolean;
    shouldShowPlaceholder: boolean;
  };
  type ArchifyEmbedControllerFixture = {
    binding: string;
    runtime: ArchifyEmbedRuntimeBindingsFixture;
    initialState: EmbedStateFixture;
    view: (state: EmbedStateFixture, url: string) => ArchifyEmbedViewFixture;
    requestLoad: () => void;
    bindPreview: (target: Element) => (() => void) | undefined;
    bindPrepareTimeout: (state: EmbedStateFixture) => (() => void) | undefined;
    prepareFrame: (frame: HTMLIFrameElement) => void;
    fail: () => void;
    cleanup: () => void;
  };

  const hasCommonArchifyEmbedApi = (value: object): value is CommonArchifyEmbedApi =>
    typeof Reflect.get(value, 'ArchifyEmbed') === 'function' &&
    typeof Reflect.get(value, 'getArchifyEmbedAspectRatio') === 'function' &&
    typeof Reflect.get(value, 'isApprovedArchifyEmbedUrl') === 'function' &&
    typeof Reflect.get(value, 'getNextArchifyEmbedState') === 'function' &&
    typeof Reflect.get(value, 'scheduleArchifyEmbedTimeout') === 'function' &&
    typeof Reflect.get(value, 'ARCHIFY_EMBED_CONTROLLER_BINDING') === 'string' &&
    typeof Reflect.get(value, 'ARCHIFY_EMBED_RUNTIME_BINDINGS') === 'object' &&
    typeof Reflect.get(value, 'createArchifyEmbedController') === 'function';

  type RelationshipDiagramRendererApi = {
    ProjectRelationshipDiagram: ComponentType<{ diagram: FeatureRelationshipDiagram }>;
  };

  const hasRelationshipDiagramRendererApi = (value: object): value is RelationshipDiagramRendererApi =>
    typeof Reflect.get(value, 'ProjectRelationshipDiagram') === 'function';

  const relationshipFixture = {
    id: 'core-product-relationships',
    title: 'Core Product 관계도',
    purpose: '공통 Product와 객실·관광·주문·재고 관계를 설명합니다.',
    summary: 'Products를 중심으로 객실·관광·주문 항목과 객실 옵션·재고가 연결됩니다.',
    textAlternative:
      'Products는 ProductRooms와 ProductTours의 부모이며 주문 항목과 객실 재고 관계를 텍스트로 제공합니다.',
    entities: [
      { id: 'products', label: 'Products', description: '공통 상품 부모', role: 'parent' },
      { id: 'product-rooms', label: 'ProductRooms', description: '객실 세부 모델', role: 'subtype' },
      { id: 'product-tours', label: 'ProductTours', description: '관광 세부 모델', role: 'subtype' },
      { id: 'purchase-order-items', label: 'PurchaseOrderItems', description: '주문 항목', role: 'transaction' },
      { id: 'product-room-options', label: 'ProductRoomOptions', description: '객실 옵션', role: 'option' },
      { id: 'product-room-stocks', label: 'ProductRoomStocks', description: '날짜별 재고', role: 'inventory' }
    ],
    relationships: [
      { id: 'products-rooms', from: 'products', to: 'product-rooms', label: '객실 세부', cardinality: '1 → 0..1' },
      { id: 'products-tours', from: 'products', to: 'product-tours', label: '관광 세부', cardinality: '1 → 0..1' },
      {
        id: 'products-orders',
        from: 'products',
        to: 'purchase-order-items',
        label: 'productId 참조',
        cardinality: '1 → N'
      },
      {
        id: 'rooms-options',
        from: 'product-rooms',
        to: 'product-room-options',
        label: '객실 옵션',
        cardinality: '1 → N'
      },
      {
        id: 'rooms-stocks',
        from: 'product-rooms',
        to: 'product-room-stocks',
        label: '객실 참조',
        cardinality: '1 → N'
      },
      {
        id: 'options-stocks',
        from: 'product-room-options',
        to: 'product-room-stocks',
        label: '옵션 참조',
        cardinality: '1 → N'
      }
    ],
    archify: { url: architectureUrl }
  } satisfies FeatureRelationshipDiagram;

  it('workflow와 architecture URL은 공통 typed allowlist에 함께 등록된다', async () => {
    const commonEmbedModule = await import('./ArchifySwimlaneEmbed');

    expect(hasCommonArchifyEmbedApi(commonEmbedModule), '공통 ArchifyEmbed API가 아직 추출되지 않았습니다.').toBe(true);
    if (!hasCommonArchifyEmbedApi(commonEmbedModule)) return;

    for (const url of [workflowUrl, relationshipFixture.archify.url]) {
      expect(commonEmbedModule.isApprovedArchifyEmbedUrl(url), url).toBe(true);
      expect(commonEmbedModule.getArchifyEmbedAspectRatio(url), url).toBeGreaterThan(0);
    }
    expect(commonEmbedModule.isApprovedArchifyEmbedUrl('/diagrams/integrated-reservation-platform/unknown.html')).toBe(
      false
    );
    expect(commonEmbedModule.isApprovedArchifyEmbedUrl('https://example.test/diagram.html')).toBe(false);
  });

  it('architecture preview는 workflow와 같은 실제 common embed에서 placeholder와 typed fallback을 렌더링한다', async () => {
    const commonEmbedModule = await import('./ArchifySwimlaneEmbed');

    expect(hasCommonArchifyEmbedApi(commonEmbedModule), '관계도용 공통 ArchifyEmbed가 아직 구현되지 않았습니다.').toBe(
      true
    );
    if (!hasCommonArchifyEmbedApi(commonEmbedModule)) return;

    const preview = renderToStaticMarkup(
      createElement(commonEmbedModule.ArchifyEmbed, {
        url: architectureUrl,
        mode: 'preview',
        title: 'Core Product 관계도',
        describedBy: 'relationship-summary',
        fallback: <div data-relationship-fallback>entity와 relation fallback</div>
      })
    );
    expect(preview).toContain('data-archify-embed="preview"');
    expect(preview).toContain(`data-archify-controller="${commonEmbedModule.ARCHIFY_EMBED_CONTROLLER_BINDING}"`);
    expect(preview).toContain('data-archify-placeholder="preview"');
    expect(preview).toContain('style="aspect-ratio:');
    expect(preview).toContain('aria-label="Core Product 관계도 미리보기"');
    expect(preview).not.toContain('흐름 미리보기');
    expect(preview).not.toContain('data-archify-frame="preview"');
    expect(preview).not.toContain('data-relationship-fallback="true"');

    const dialog = renderToStaticMarkup(
      createElement(commonEmbedModule.ArchifyEmbed, {
        url: architectureUrl,
        mode: 'dialog',
        title: 'Core Product 관계도',
        describedBy: 'relationship-dialog-summary',
        fallback: <div data-relationship-fallback>entity와 relation fallback</div>
      })
    );
    expect(dialog).toContain(`data-archify-controller="${commonEmbedModule.ARCHIFY_EMBED_CONTROLLER_BINDING}"`);
    expect(dialog).toContain('data-archify-state="loading"');
    expect(dialog).toContain('data-archify-frame="dialog"');
    expect(dialog).toContain('aria-label="Core Product 관계도 상세 보기"');
  });

  it('production preview component의 effect와 iframe load가 동일 controller lifecycle을 실행한다', () => {
    let requestLoad: (() => void) | undefined;
    let themeChange: (() => void) | undefined;
    const cancelPreview = vi.fn();
    const cancelTimeout = vi.fn();
    const disconnectTheme = vi.fn();
    const createPreviewLoadLifecycle = vi.fn((_target: Element, request: () => void) => {
      requestLoad = request;
      return cancelPreview;
    });
    const schedulePrepareTimeout = vi.fn((_onTimeout: () => void) => cancelTimeout);
    const applyFrame = vi.fn();
    const observeTheme = vi.fn((onChange: () => void) => {
      themeChange = onChange;
      return { disconnect: disconnectTheme };
    });
    const runtime: ArchifyEmbedRuntimeBindings = {
      createPreviewLoadLifecycle,
      schedulePrepareTimeout,
      applyFrame,
      observeTheme
    };
    type ProbeProps = Parameters<typeof ArchifyEmbed>[0] & { runtime: ArchifyEmbedRuntimeBindings };
    const ProbeComponent = ArchifyEmbed as unknown as (props: ProbeProps) => ReactElement;
    const wrapper = {} as Element;
    const frame = {} as HTMLIFrameElement;
    const probe = createArchifyHookProbe(
      ProbeComponent,
      {
        url: architectureUrl,
        mode: 'preview',
        title: 'Core Product 관계도',
        describedBy: 'relationship-summary',
        fallback: <div data-probe-fallback>typed fallback</div>,
        runtime
      },
      wrapper
    );

    let tree = probe.render();
    expect(tree.props['data-archify-state']).toBe('idle');
    probe.flushEffects();
    expect(createPreviewLoadLifecycle).toHaveBeenCalledWith(wrapper, expect.any(Function));
    expect(schedulePrepareTimeout).not.toHaveBeenCalled();

    requestLoad?.();
    tree = probe.render();
    expect(tree.props['data-archify-state']).toBe('loading');
    probe.flushEffects();
    expect(schedulePrepareTimeout).toHaveBeenCalledOnce();
    const iframe = findProbeElement(tree, 'data-archify-frame');
    expect(iframe).toBeDefined();
    (iframe?.props.onLoad as (event: { currentTarget: HTMLIFrameElement }) => void)({ currentTarget: frame });

    tree = probe.render();
    probe.flushEffects();
    expect(tree.props['data-archify-state']).toBe('ready');
    expect(applyFrame).toHaveBeenCalledWith(frame, 'preview');
    expect(observeTheme).toHaveBeenCalledOnce();
    expect(cancelTimeout).toHaveBeenCalledOnce();
    themeChange?.();
    expect(applyFrame).toHaveBeenCalledTimes(2);

    probe.unmount();
    expect(cancelPreview).toHaveBeenCalledOnce();
    expect(disconnectTheme).toHaveBeenCalledOnce();
  });

  it('production dialog component의 timeout과 iframe error가 보이는 typed fallback으로 전환한다', () => {
    const createRuntime = () => {
      let timeout: (() => void) | undefined;
      const cancelTimeout = vi.fn();
      const runtime: ArchifyEmbedRuntimeBindings = {
        createPreviewLoadLifecycle: vi.fn(() => vi.fn()),
        schedulePrepareTimeout: vi.fn((onTimeout) => {
          timeout = onTimeout;
          return cancelTimeout;
        }),
        applyFrame: vi.fn(),
        observeTheme: vi.fn(() => null)
      };
      return { runtime, cancelTimeout, getTimeout: () => timeout };
    };
    type ProbeProps = Parameters<typeof ArchifyEmbed>[0] & { runtime: ArchifyEmbedRuntimeBindings };
    const ProbeComponent = ArchifyEmbed as unknown as (props: ProbeProps) => ReactElement;
    const createDialogProbe = (runtime: ArchifyEmbedRuntimeBindings) =>
      createArchifyHookProbe(
        ProbeComponent,
        {
          url: architectureUrl,
          mode: 'dialog',
          title: 'Core Product 관계도',
          describedBy: 'relationship-summary',
          fallback: <div data-probe-fallback>typed fallback</div>,
          runtime
        },
        {} as Element
      );

    const timeoutRuntime = createRuntime();
    const timeoutProbe = createDialogProbe(timeoutRuntime.runtime);
    let timeoutTree = timeoutProbe.render();
    expect(timeoutTree.props['data-archify-state']).toBe('loading');
    expect(findProbeElement(timeoutTree, 'data-archify-frame')).toBeDefined();
    timeoutProbe.flushEffects();
    timeoutRuntime.getTimeout()?.();
    timeoutTree = timeoutProbe.render();
    timeoutProbe.flushEffects();
    expect(timeoutTree.props['data-archify-state']).toBe('fallback');
    expect(findProbeElement(timeoutTree, 'data-probe-fallback')).toBeDefined();
    expect(findProbeElement(timeoutTree, 'data-archify-frame')).toBeUndefined();
    expect(timeoutRuntime.cancelTimeout).toHaveBeenCalledOnce();
    timeoutProbe.unmount();

    const errorRuntime = createRuntime();
    const errorProbe = createDialogProbe(errorRuntime.runtime);
    let errorTree = errorProbe.render();
    errorProbe.flushEffects();
    const iframe = findProbeElement(errorTree, 'data-archify-frame');
    (iframe?.props.onError as () => void)();
    errorTree = errorProbe.render();
    errorProbe.flushEffects();
    expect(errorTree.props['data-archify-state']).toBe('fallback');
    expect(findProbeElement(errorTree, 'data-probe-fallback')).toBeDefined();
    expect(errorRuntime.cancelTimeout).toHaveBeenCalledOnce();
    errorProbe.unmount();
  });

  it('공통 component가 소비하는 controller로 preview·dialog·ready·모든 실패·theme cleanup을 전환한다', async () => {
    const commonEmbedModule = await import('./ArchifySwimlaneEmbed');

    expect(
      hasCommonArchifyEmbedApi(commonEmbedModule),
      '공통 ArchifyEmbed controller API가 아직 추출되지 않았습니다.'
    ).toBe(true);
    if (!hasCommonArchifyEmbedApi(commonEmbedModule)) return;

    let previewRequest: (() => void) | undefined;
    let timeoutFailure: (() => void) | undefined;
    let themeChange: (() => void) | undefined;
    const disconnectTheme = vi.fn();
    const cancelPreview = vi.fn();
    const cancelTimeout = vi.fn();
    const applyFrame = vi.fn();
    const runtime: ArchifyEmbedRuntimeBindingsFixture = {
      createPreviewLoadLifecycle: (_target, requestLoad) => {
        previewRequest = requestLoad;
        return cancelPreview;
      },
      schedulePrepareTimeout: (onTimeout) => {
        timeoutFailure = onTimeout;
        return cancelTimeout;
      },
      applyFrame,
      observeTheme: (onChange) => {
        themeChange = onChange;
        return { disconnect: disconnectTheme };
      }
    };
    let state: EmbedStateFixture = 'idle';
    const controller = commonEmbedModule.createArchifyEmbedController(
      'preview',
      (event) => {
        state = commonEmbedModule.getNextArchifyEmbedState(state, event);
      },
      runtime
    );

    expect(controller.binding).toBe(commonEmbedModule.ARCHIFY_EMBED_CONTROLLER_BINDING);
    expect(controller.initialState).toBe('idle');
    expect(controller.view(state, architectureUrl)).toMatchObject({
      binding: commonEmbedModule.ARCHIFY_EMBED_CONTROLLER_BINDING,
      shouldMountFrame: false,
      shouldShowPlaceholder: true,
      shouldShowFallback: false
    });
    const releasePreview = controller.bindPreview({} as Element);
    previewRequest?.();
    expect(state).toBe('loading');
    expect(controller.view(state, architectureUrl).shouldMountFrame).toBe(true);
    releasePreview?.();
    expect(cancelPreview).toHaveBeenCalledOnce();

    const releaseTimeout = controller.bindPrepareTimeout(state);
    timeoutFailure?.();
    expect(state).toBe('fallback');
    expect(controller.view(state, architectureUrl).shouldShowFallback).toBe(true);
    releaseTimeout?.();
    expect(cancelTimeout).toHaveBeenCalledOnce();

    let readyState: EmbedStateFixture = 'loading';
    const readyController = commonEmbedModule.createArchifyEmbedController(
      'preview',
      (event) => {
        readyState = commonEmbedModule.getNextArchifyEmbedState(readyState, event);
      },
      runtime
    );
    readyController.prepareFrame({} as HTMLIFrameElement);
    expect(readyState).toBe('ready');
    expect(readyController.view(readyState, architectureUrl).isReady).toBe(true);
    expect(applyFrame).toHaveBeenCalledOnce();
    themeChange?.();
    expect(applyFrame).toHaveBeenCalledTimes(2);
    readyController.cleanup();
    expect(disconnectTheme).toHaveBeenCalledOnce();

    let errorState: EmbedStateFixture = 'loading';
    const errorController = commonEmbedModule.createArchifyEmbedController(
      'preview',
      (event) => {
        errorState = commonEmbedModule.getNextArchifyEmbedState(errorState, event);
      },
      runtime
    );
    errorController.fail();
    expect(errorController.view(errorState, architectureUrl).shouldShowFallback).toBe(true);

    let domFailureState: EmbedStateFixture = 'loading';
    const domFailureController = commonEmbedModule.createArchifyEmbedController(
      'preview',
      (event) => {
        domFailureState = commonEmbedModule.getNextArchifyEmbedState(domFailureState, event);
      },
      {
        ...runtime,
        applyFrame: () => {
          throw new Error('DOM failure');
        }
      }
    );
    domFailureController.prepareFrame({} as HTMLIFrameElement);
    expect(domFailureController.view(domFailureState, architectureUrl).shouldShowFallback).toBe(true);

    const dialogController = commonEmbedModule.createArchifyEmbedController('dialog', () => undefined, runtime);
    expect(dialogController.initialState).toBe('loading');
    expect(dialogController.view(dialogController.initialState, architectureUrl).shouldMountFrame).toBe(true);
    expect(controller.runtime).toBe(runtime);
    expect(commonEmbedModule.createArchifyEmbedController('preview', () => undefined).runtime).toBe(
      commonEmbedModule.ARCHIFY_EMBED_RUNTIME_BINDINGS
    );
  });

  it('관계도 wrapper는 실제 common embed lifecycle과 entity/relation fallback transcript를 함께 사용한다', async () => {
    const moduleUrl = new URL('./ProjectRelationshipDiagram.tsx', import.meta.url);
    const rendererModule = await import(/* @vite-ignore */ moduleUrl.href).catch(() => null);
    const embedModule = await import('./ArchifySwimlaneEmbed');

    expect(rendererModule).not.toBeNull();
    if (!rendererModule) return;
    expect(hasRelationshipDiagramRendererApi(rendererModule)).toBe(true);
    expect(hasCommonArchifyEmbedApi(embedModule)).toBe(true);
    if (!hasRelationshipDiagramRendererApi(rendererModule) || !hasCommonArchifyEmbedApi(embedModule)) return;

    const productionDiagram = getFeatureDetailBySlug('integrated-reservation-platform')?.relationshipDiagrams?.[0];
    expect(productionDiagram).toBeDefined();
    if (!productionDiagram) return;
    const html = renderToStaticMarkup(
      createElement(rendererModule.ProjectRelationshipDiagram, { diagram: productionDiagram })
    );
    expect(html).toContain('data-relationship-diagram="preview"');
    expect(html).toContain('data-archify-embed="preview"');
    expect(html).toContain(productionDiagram.summary);
    expect(html).toContain(productionDiagram.textAlternative);
    for (const { label, description } of productionDiagram.entities) {
      expect(html).toContain(label);
      expect(html).toContain(description);
    }
    for (const { label, cardinality } of productionDiagram.relationships) {
      expect(html).toContain(label);
      expect(html).toContain(cardinality);
    }
    expect(embedModule.getNextArchifyEmbedState('idle', 'request-load')).toBe('loading');
    expect(embedModule.getNextArchifyEmbedState('loading', 'prepared')).toBe('ready');
    expect(embedModule.getNextArchifyEmbedState('loading', 'failed')).toBe('fallback');
  });

  it('공통 embed는 prepared/read와 실패 fallback에 같은 theme presentation을 적용한다', () => {
    const { document, root, body, diagram } = createArchifyDocument();
    applyArchifyPresentation(document, 'dialog', theme);
    expect(root.attributes.get('data-embed')).toBe('true');
    expect(body.attributes.get('inert')).toBe('');
    expect(diagram.attributes.get('data-detail-level')).toBe('read');
    expect(root.styleValues.get('--bg')).toBe(theme.background);
  });
});
