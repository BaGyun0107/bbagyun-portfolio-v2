import { createContext, createElement, useContext, useId, type ComponentType, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it, vi } from 'vitest';

import { getAllInsights } from '../../data/portfolio';

type VisualFixture =
  | {
      id: string;
      variant: 'data-flow';
      title: string;
      question: string;
      textAlternative: string;
      nodes: { id: string; label: string; detail: string; role: 'state' | 'data' | 'action' | 'terminal' }[];
      edges: {
        id: string;
        from: string;
        to: string;
        label: string;
        outcome: 'normal' | 'success' | 'failure' | 'retry';
      }[];
    }
  | {
      id: string;
      variant: 'before-after';
      title: string;
      question: string;
      textAlternative: string;
      panels: {
        id: 'before' | 'after';
        title: string;
        summary: string;
        actors: {
          id: string;
          label: string;
          role: 'server' | 'room' | 'recipient' | 'unrelated' | 'source' | 'relay' | 'boundary' | 'consumer';
        }[];
        connections: {
          id: string;
          from: string;
          to: string;
          label: string;
          scope: 'intended' | 'overbroad' | 'indirect' | 'direct';
        }[];
      }[];
    };

let InsightVisual: ComponentType<{ visual: VisualFixture }> | null = null;

beforeAll(async () => {
  const moduleUrl = new URL('./InsightVisual.tsx', import.meta.url);
  if (!existsSync(fileURLToPath(moduleUrl))) return;

  const loadedModule = (await import(/* @vite-ignore */ moduleUrl.href)) as {
    InsightVisual: ComponentType<{ visual: VisualFixture }>;
  };
  InsightVisual = loadedModule.InsightVisual;
});

const render = (visual: VisualFixture) => {
  expect(InsightVisual, '인사이트 시각 자료 renderer가 아직 구현되지 않았습니다.').toEqual(expect.any(Function));
  if (!InsightVisual) return '';
  return renderToStaticMarkup(createElement(InsightVisual, { visual }));
};

const DialogOwnerContext = createContext<string | null>(null);

const DialogRootProbe = ({ children }: { children?: ReactNode }) => {
  const owner = useId();
  return createElement(
    DialogOwnerContext.Provider,
    { value: owner },
    createElement('div', { 'data-dialog-root-owner': owner }, children)
  );
};

const DialogTriggerProbe = ({ asChild, children }: { asChild?: boolean; children?: ReactNode }) => {
  const owner = useContext(DialogOwnerContext);
  return createElement(
    'div',
    {
      'data-dialog-trigger-owner': owner ?? 'missing',
      'data-dialog-trigger-as-child': asChild === true ? 'true' : 'false'
    },
    children
  );
};

const DialogContentProbe = ({ children }: { children?: ReactNode }) => {
  const owner = useContext(DialogOwnerContext);
  return createElement('div', { 'data-dialog-content-owner': owner ?? 'missing' }, children);
};

const DialogTitleProbe = ({ children }: { children?: ReactNode }) => createElement('h2', null, children);
const DialogDescriptionProbe = ({ children }: { children?: ReactNode }) => createElement('p', null, children);

const renderDialogStructure = async (visual: VisualFixture) => {
  vi.doMock('@/components/ui/dialog', async () => {
    const actual = await vi.importActual<typeof import('@/components/ui/dialog')>('@/components/ui/dialog');
    return {
      ...actual,
      Dialog: DialogRootProbe,
      DialogTrigger: DialogTriggerProbe,
      DialogContent: DialogContentProbe,
      DialogTitle: DialogTitleProbe,
      DialogDescription: DialogDescriptionProbe
    };
  });

  try {
    const moduleUrl = new URL('./InsightVisual.tsx', import.meta.url);
    moduleUrl.searchParams.set('dialog-contract-probe', 'true');
    const loadedModule = (await import(/* @vite-ignore */ moduleUrl.href)) as {
      InsightVisual: ComponentType<{ visual: VisualFixture }>;
    };
    return renderToStaticMarkup(createElement(loadedModule.InsightVisual, { visual }));
  } finally {
    vi.doUnmock('@/components/ui/dialog');
  }
};

const dataFlow: VisualFixture = {
  id: 'settlement-retry',
  variant: 'data-flow',
  title: '정산 상태와 재처리 입력',
  question: '지급 판단 상태와 재처리 입력은 어디에 있는가?',
  textAlternative: 'DB 상태를 확인하고 JSON 입력으로 지급한 뒤 성공 항목은 제거하고 실패 항목은 보존해 재시도합니다.',
  nodes: [
    { id: 'state', label: 'DB PROCESSING', detail: '지급 판단 기준', role: 'state' },
    { id: 'payout', label: '지급 호출', detail: 'JSON 입력 사용', role: 'action' },
    { id: 'success', label: '성공 완료', detail: 'DB 완료·JSON 제거', role: 'terminal' },
    { id: 'failure', label: '실패 보존', detail: 'JSON 유지', role: 'terminal' }
  ],
  edges: [
    { id: 'normal', from: 'state', to: 'payout', label: '정상', outcome: 'normal' },
    { id: 'success', from: 'payout', to: 'success', label: '성공', outcome: 'success' },
    { id: 'failure', from: 'payout', to: 'failure', label: '실패', outcome: 'failure' },
    { id: 'retry', from: 'failure', to: 'state', label: '재시도', outcome: 'retry' }
  ]
};

const beforeAfter: VisualFixture = {
  id: 'room-scope',
  variant: 'before-after',
  title: 'Room 전달 범위 변화',
  question: '공용 Room에서 화원별 User Room으로 바꾸며 수신 대상은 어떻게 달라졌는가?',
  textAlternative:
    '변경 전에는 관련 화원과 무관 사용자가 공용 Room에 함께 있었고 변경 후에는 주문 관련 화원별 User Room만 전달 대상으로 삼았습니다.',
  panels: [
    {
      id: 'before',
      title: '변경 전',
      summary: '공용 Room은 관계없는 사용자까지 같은 전달 범위에 포함했습니다.',
      actors: [
        { id: 'server', label: 'Socket.io 서버', role: 'server' },
        { id: 'room', label: '공용 order_room', role: 'room' },
        { id: 'garden', label: '관련 화원', role: 'recipient' },
        { id: 'other', label: '무관 사용자', role: 'unrelated' }
      ],
      connections: [
        { id: 'server-room', from: 'server', to: 'room', label: 'broadcast', scope: 'overbroad' },
        { id: 'room-garden', from: 'room', to: 'garden', label: '수신', scope: 'intended' },
        { id: 'room-other', from: 'room', to: 'other', label: '불필요한 수신 범위', scope: 'overbroad' }
      ]
    },
    {
      id: 'after',
      title: '변경 후',
      summary: '관련 화원의 User Room만 전달 대상으로 선택했습니다.',
      actors: [
        { id: 'server', label: 'Socket.io 서버', role: 'server' },
        { id: 'room', label: 'user_<gardenId>', role: 'room' },
        { id: 'garden', label: '관련 화원', role: 'recipient' }
      ],
      connections: [
        { id: 'server-room', from: 'server', to: 'room', label: 'target emit', scope: 'intended' },
        { id: 'room-garden', from: 'room', to: 'garden', label: '관련 대상만', scope: 'intended' }
      ]
    }
  ]
};

const componentBeforeAfter: VisualFixture = {
  id: 'reservation-context-scope',
  variant: 'before-after',
  title: '예약 상태 전달 전후',
  question: '예약 상태의 소유 범위와 전달 경로는 어떻게 달라졌는가?',
  textAlternative:
    '변경 전에는 상위 상태 소유자가 중간 컴포넌트를 거쳐 예약 단계에 props를 전달했고, 변경 후에는 예약 라우터 Provider를 예약 단계가 직접 소비합니다.',
  panels: [
    {
      id: 'before',
      title: '변경 전',
      summary: '사용하지 않는 중간 컴포넌트가 props를 전달했습니다.',
      actors: [
        { id: 'owner', label: '상위 상태 소유자', role: 'source' },
        { id: 'relay', label: '중간 컴포넌트', role: 'relay' },
        { id: 'step', label: '예약 단계 화면', role: 'consumer' }
      ],
      connections: [
        { id: 'owner-relay', from: 'owner', to: 'relay', label: 'props 전달', scope: 'indirect' },
        { id: 'relay-step', from: 'relay', to: 'step', label: 'props 재전달', scope: 'indirect' }
      ]
    },
    {
      id: 'after',
      title: '변경 후',
      summary: '예약 라우터가 상태 생명주기 경계를 소유합니다.',
      actors: [
        { id: 'provider', label: 'ReservationProvider', role: 'boundary' },
        { id: 'step', label: '예약 단계 화면', role: 'consumer' }
      ],
      connections: [
        { id: 'provider-step', from: 'provider', to: 'step', label: 'useReservation 직접 소비', scope: 'direct' }
      ]
    }
  ]
};

describe('InsightVisual', () => {
  it('data-flow의 질문·대체 설명과 정상·성공·실패·재시도 관계를 문자로 제공한다', () => {
    const html = render(dataFlow);

    expect(html).toContain('aria-labelledby="settlement-retry-title"');
    expect(html).toContain('aria-describedby="settlement-retry-description"');
    expect(html).toContain(dataFlow.question);
    expect(html).toContain(dataFlow.textAlternative);
    for (const label of ['정상', '성공', '실패', '재시도']) expect(html).toContain(label);
  });

  it('before-after를 독립된 변경 전·후 패널과 관계 label로 제공한다', () => {
    const html = render(beforeAfter);

    expect(html).toContain('변경 전');
    expect(html).toContain('변경 후');
    expect(html).toContain('불필요한 수신 범위');
    expect(html).toContain('관련 대상만');
    expect(html).toContain('data-insight-visual="before-after"');
  });

  it('before-after 패널 heading ID를 visual별로 고유하게 만든다', () => {
    const alternateVisual = { ...beforeAfter, id: 'alternate-room-scope' };
    const html = render(alternateVisual);

    expect(html).toContain('aria-labelledby="alternate-room-scope-before-title"');
    expect(html).toContain('id="alternate-room-scope-before-title"');
    expect(html).toContain('aria-labelledby="alternate-room-scope-after-title"');
    expect(html).toContain('id="alternate-room-scope-after-title"');
  });

  it('문서 폭 안에서 줄바꿈하는 mobile-first 컨테이너 계약을 사용한다', () => {
    const html = render(beforeAfter);

    expect(html).toContain('min-w-0');
    expect(html).toContain('break-words');
    expect(html).toContain('grid-cols-1');
    expect(html).not.toContain('overflow-x-auto');
  });

  it('data-flow node 순서와 분기 label을 교차 선 없는 관계 행으로 제공한다', () => {
    const html = render(dataFlow);
    const nodeIndexes = dataFlow.nodes.map(({ id }) => html.indexOf(`data-insight-node="${id}"`));
    const edgeIndexes = dataFlow.edges.map(({ id }) => html.indexOf(`data-insight-edge="${id}"`));

    expect(nodeIndexes.every((index) => index >= 0)).toBe(true);
    expect(edgeIndexes.every((index) => index >= 0)).toBe(true);
    expect(nodeIndexes).toEqual([...nodeIndexes].sort((left, right) => left - right));
    expect(edgeIndexes).toEqual([...edgeIndexes].sort((left, right) => left - right));
    expect(Math.min(...edgeIndexes)).toBeGreaterThan(Math.max(...nodeIndexes));
    expect(html).toContain('data-edge-outcome="success"');
    expect(html).toContain('data-edge-outcome="failure"');
    expect(html).toContain('data-edge-outcome="retry"');
    expect(html).toContain(`aria-label="${dataFlow.title} 연결 관계"`);
    expect(html).not.toContain('단계 3');
    expect(html).toContain('결과');
  });

  it('before-after actor와 connection을 패널별 독립 요소로 표시한다', () => {
    const html = render(beforeAfter);

    expect(html).toContain('data-insight-panel="before"');
    expect(html).toContain('data-insight-panel="after"');
    for (const panel of beforeAfter.panels) {
      for (const actor of panel.actors) expect(html).toContain(`data-insight-actor="${panel.id}:${actor.id}"`);
      for (const connection of panel.connections) {
        expect(html).toContain(`data-insight-connection="${panel.id}:${connection.id}"`);
      }
    }
    expect(html).toContain('data-connection-scope="overbroad"');
    expect(html).toContain('data-connection-scope="intended"');
  });

  it('컴포넌트 actor 역할과 indirect·direct 관계를 의미·문자·semantic token 스타일로 구분한다', () => {
    const html = render(componentBeforeAfter);

    for (const role of ['source', 'relay', 'boundary', 'consumer']) {
      expect(html).toContain(`data-actor-role="${role}"`);
    }
    expect(html).toContain('data-connection-scope="indirect"');
    expect(html).toContain('data-connection-scope="direct"');
    for (const label of ['상태 소유자', '중간 전달', '생명주기 경계', '상태 사용 지점', '간접 전달', '직접 연결']) {
      expect(html).toContain(label);
    }
    expect(html).toContain('border-border');
    expect(html).toContain('bg-muted/40');
    expect(html).toContain('border-primary/40');
    expect(html).toContain('bg-primary/10');
  });
});

describe('호텔 예약 플랫폼 코드 경계 visual', () => {
  it('세 종류의 차이를 normal 관계로만 분류하고 동등한 텍스트 대안을 제공한다', () => {
    const insight = getAllInsights().find(({ slug }) => slug === 'config-driven-architecture-react');
    const visual = insight?.visual;

    expect(visual?.variant).toBe('data-flow');
    if (visual?.variant !== 'data-flow') return;

    const html = render(visual as VisualFixture);
    expect(visual.question).toBe('공통 동작, 값 차이, 화면·로직 차이는 각각 어디에 배치할 것인가?');
    expect(visual.nodes.map(({ label }) => label)).toEqual(
      expect.arrayContaining(['변경 요구', '차이 분류', 'core', 'rsConfig', 'platform'])
    );
    expect(visual.edges.every(({ outcome }) => outcome === 'normal')).toBe(true);
    for (const label of ['모든 플랫폼 공통', '값만 다름', '화면·로직 차이']) expect(html).toContain(label);
    expect(html).not.toContain('단계 3');
    expect(html.match(/>결과</g) ?? []).toHaveLength(3);
    expect(visual.textAlternative).toMatch(
      /공통 동작[^.]*core[^.]*값 차이[^.]*rsConfig[^.]*화면·로직 차이[^.]*platform/i
    );
  });
});

describe('호텔 예약 플랫폼 예약 Context visual', () => {
  it('간접 props 전달과 라우터 경계의 직접 소비를 두 패널로 읽을 수 있게 제공한다', () => {
    const insight = getAllInsights().find(
      ({ slug }) => slug === 'context-api-encapsulation-and-router-level-isolation'
    );
    const visual = insight?.visual;

    expect(visual?.variant).toBe('before-after');
    if (visual?.variant !== 'before-after') return;

    const html = render(visual as VisualFixture);
    expect(html).toContain('data-insight-panel="before"');
    expect(html).toContain('data-insight-panel="after"');
    for (const role of ['source', 'relay', 'boundary', 'consumer']) {
      expect(html).toContain(`data-actor-role="${role}"`);
    }
    expect(html).toContain('data-connection-scope="indirect"');
    expect(html).toContain('data-connection-scope="direct"');
    expect(visual.textAlternative).toMatch(
      /상위 상태 소유자[^.]*중간 컴포넌트[^.]*예약 단계[^.]*예약 라우터[^.]*ReservationProvider[^.]*useReservation/
    );
  });
});

describe('행사 호텔 예약·결제 인사이트 visual 확대 RED 계약', () => {
  const visualBySlug = (slug: string) => getAllInsights().find((insight) => insight.slug === slug)?.visual;

  it('Middleware/Guard visual은 승인된 before/after actor·connection과 동등한 text alternative를 제공한다', () => {
    const visual = visualBySlug('nestjs-middleware-vs-guard-tradeoff');

    expect(visual?.variant).toBe('before-after');
    if (visual?.variant !== 'before-after') return;

    expect(visual.question).toBe('당시 인증·권한 책임과 현재의 개선 판단은 요청 생명주기에서 어떻게 다른가?');
    expect(visual.textAlternative).toMatch(/AdminAuthMiddleware[^.]*req\.user[^.]*AdminLevelGuard/);
    expect(visual.textAlternative).toMatch(/공개 경로[^.]*Global Auth Guard[^.]*Permission Guard/);
    expect(visual.panels[0].actors.map(({ label }) => label)).toEqual([
      '관리자 요청',
      'AdminAuthMiddleware',
      'AdminLevelGuard',
      'Controller'
    ]);
    expect(visual.panels[1].actors.map(({ label }) => label)).toEqual([
      '요청',
      'Global Auth Guard',
      'Permission Guard',
      'Controller'
    ]);
    expect(visual.panels.flatMap(({ connections }) => connections.map(({ label }) => label)).join('\n')).toMatch(
      /token|cookie|CSRF|등급|공개 경로|권한/i
    );
  });

  it('BFF visual은 direct API cookie failure와 /bff reverse proxy·Cloudflare 경계를 분리한다', () => {
    const visual = visualBySlug('nextjs-nestjs-domain-separation-and-bff');

    expect(visual?.variant).toBe('before-after');
    if (visual?.variant !== 'before-after') return;

    expect(visual.question).toBe(
      '브라우저 직접 호출에서 reverse proxy 경계로 바뀌며 쿠키와 Cloudflare 문제는 어떻게 분리됐는가?'
    );
    expect(visual.textAlternative).toMatch(/A-domain\.com[^.]*api\.A-domain\.com[^.]*쿠키/);
    expect(visual.textAlternative).toMatch(
      /A-domain\.com[^.]*\/bff[^.]*Next\.js reverse proxy[^.]*Cloudflare[^.]*NestJS API/
    );
    expect(visual.panels[0].actors.map(({ label }) => label)).toEqual([
      'Browser · A-domain.com',
      'api.A-domain.com',
      'NestJS API'
    ]);
    expect(visual.panels[1].actors.map(({ label }) => label)).toEqual([
      'Browser',
      'A-domain.com · /bff',
      'Cloudflare',
      'NestJS API'
    ]);
  });

  it('인증과 BFF visual에는 상태관리 전용 actor 역할 캡션을 노출하지 않는다', () => {
    for (const slug of ['nestjs-middleware-vs-guard-tradeoff', 'nextjs-nestjs-domain-separation-and-bff']) {
      const visual = visualBySlug(slug);

      expect(visual?.variant, slug).toBe('before-after');
      if (visual?.variant !== 'before-after') continue;

      const html = render(visual as VisualFixture);
      for (const unsupportedCaption of ['상태 소유자', '생명주기 경계', '상태 사용 지점']) {
        expect(html, `${slug}: ${unsupportedCaption}`).not.toContain(unsupportedCaption);
      }
    }
  });

  it('실제 InsightVisual renderer는 기본 호출에서 keyboard-triggerable Dialog button을 제공한다', () => {
    const visual = visualBySlug('nestjs-middleware-vs-guard-tradeoff');

    expect(visual?.variant).toBe('before-after');
    if (visual?.variant !== 'before-after') return;

    const html = render(visual as VisualFixture);
    expect(html).toContain('<button');
    expect(html).toContain('type="button"');
    expect(html).toContain('크게 보기');
    expect(html).toContain(`aria-label="${visual.title} 크게 보기"`);
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
  });

  it('기본 <InsightVisual visual={...}> 호출은 같은 shadcn Dialog에 Trigger·Content를 결속한다', async () => {
    const html = await renderDialogStructure(beforeAfter);
    const rootOwners = [...html.matchAll(/data-dialog-root-owner="([^"]+)"/g)].map(([, owner]) => owner);
    const triggerOwners = [...html.matchAll(/data-dialog-trigger-owner="([^"]+)"/g)].map(([, owner]) => owner);
    const contentOwners = [...html.matchAll(/data-dialog-content-owner="([^"]+)"/g)].map(([, owner]) => owner);

    expect(rootOwners, '기본 InsightVisual 경로에 shadcn Dialog root가 아직 없습니다.').toHaveLength(1);
    expect(triggerOwners, 'Enter·Space open을 맡는 DialogTrigger는 Dialog root 안에 있어야 합니다.').toEqual(
      rootOwners
    );
    expect(
      contentOwners,
      'Escape close와 trigger focus 복귀를 맡는 DialogContent는 같은 Dialog root 안에 있어야 합니다.'
    ).toEqual(rootOwners);
    expect(html).toContain('data-dialog-trigger-as-child="true"');
  });

  it('HTTPS 글은 not-needed 판정이며 visual과 Dialog trigger를 제공하지 않는다', () => {
    const https = getAllInsights().find(({ slug }) => slug === 'https-and-plaintext-password-transmission');
    expect(https?.editorial?.visualAssessment.decision).toBe('not-needed');
    expect(https?.visual).toBeNull();
  });
});
