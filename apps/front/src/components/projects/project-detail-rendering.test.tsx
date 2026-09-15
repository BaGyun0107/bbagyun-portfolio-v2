import { renderToStaticMarkup } from 'react-dom/server';

import { describe, expect, it } from 'vitest';

import FeatureDetailPage from '@/app/(public)/projects/[slug]/page';
import {
  getAllInsights,
  getFeatureBySlug,
  getFeatureDetailBySlug,
  type FeatureDetailDto,
  type FeatureSwimlane
} from '@/data/portfolio';
import { FEATURE_SWIMLANE_ARCHIFY_TARGETS } from '@/data/portfolio/types/feature-detail.dto';

import { HEADER_HEIGHT, calculateSwimlaneLayout, getNodeGeometry } from './project-swimlane-layout';
import { ProjectDemoLink } from './ProjectDemoLink';
import { ProjectDetailContent } from './ProjectDetailContent';
import { ProjectHighlights } from './ProjectHighlights';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import { SwimlaneDialogTranscript } from './ProjectSwimlane';
import { ProjectSwimlane } from './ProjectSwimlane';
import { ProjectSwimlaneDiagram } from './ProjectSwimlaneDiagram';

const detailFixture: FeatureDetailDto = {
  role: '설계와 구현을 단독으로 담당했다.',
  highlights: [
    {
      id: 'adoption',
      label: '적용 프로젝트',
      value: '11개',
      kind: 'reported',
      asOf: '2026-08-20',
      evidence: '적용 현황 확인'
    }
  ],
  problem: '프로젝트마다 기준이 달랐다.',
  constraints: '비공개 소스는 공개하지 않는다.',
  alternatives: '도구 교체만 하는 방안과 운영 모델을 묶는 방안을 비교했다.',
  swimlanes: [
    {
      id: 'delivery',
      title: '설계·개발·검증',
      purpose: '요구부터 검증까지의 책임을 설명한다.',
      summary: '사용자가 요청하면 계획을 세우고 검증한 뒤 완료한다.',
      lanes: [{ id: 'developer', label: '개발자' }],
      steps: [
        {
          id: 'plan',
          laneId: 'developer',
          row: 0,
          shape: 'start',
          label: '계획',
          description: '승인된 계획을 작성한다.'
        },
        {
          id: 'verify',
          laneId: 'developer',
          row: 1,
          shape: 'end',
          label: '검증',
          description: '결과를 확인한다.'
        }
      ],
      edges: [
        {
          id: 'plan-to-verify',
          from: 'plan',
          to: 'verify',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top'
        }
      ],
      exceptions: []
    }
  ],
  implementation: '[내부 인사이트](/insights/internal-detail)와 [외부 근거](https://example.com/evidence)를 연결한다.',
  outcomes: '검증 가능한 결과만 공개했다.',
  retrospective: '멀티 세션 자동화는 후속 과제다.'
};

describe('작업물 상세 렌더링', () => {
  it('구조화 상세의 10개 공통 제목을 정해진 읽기 순서로 표시한다', () => {
    const html = renderToStaticMarkup(
      <ProjectDetailContent
        overview='초기화와 운영 기준을 하나로 묶었다.'
        detail={detailFixture}
        relatedInsights={[
          {
            slug: 'harness-detail',
            title: '하네스 상세 인사이트',
            excerpt: '설계 판단을 더 깊게 설명한다.'
          }
        ]}
      />
    );
    const headings = [
      '프로젝트 개요',
      '나의 역할과 책임 범위',
      '핵심 결과 요약',
      '문제 상황과 제약 조건',
      '대안 검토와 선택',
      '시스템 흐름',
      '핵심 설계와 구현',
      '결과와 검증 근거',
      '회고와 다음 개선',
      '관련 인사이트'
    ];

    let previousIndex = -1;
    headings.forEach((heading) => {
      const headingIndex = html.indexOf(heading);
      expect(headingIndex).toBeGreaterThan(previousIndex);
      previousIndex = headingIndex;
    });
  });

  it('사용 가능한 데모 fixture는 새 창 안내와 안전한 링크 속성을 제공한다', () => {
    const html = renderToStaticMarkup(
      <ProjectDemoLink
        demo={{
          url: 'https://demo.example.com',
          label: '가이드형 시뮬레이터',
          kind: 'portfolio',
          status: 'available'
        }}
      />
    );

    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('aria-label="가이드형 시뮬레이터 (새 창에서 열림)"');
  });

  it('데모가 없거나 unavailable이면 빈 CTA를 만들지 않는다', () => {
    expect(renderToStaticMarkup(<ProjectDemoLink />)).toBe('');
    expect(
      renderToStaticMarkup(
        <ProjectDemoLink
          demo={{
            url: 'https://demo.example.com',
            label: '비공개 데모',
            kind: 'portfolio',
            status: 'unavailable'
          }}
        />
      )
    ).toBe('');
  });

  it('내부 링크는 같은 탭, 외부 링크는 새 창 안내와 안전한 속성을 사용한다', () => {
    const html = renderToStaticMarkup(
      <ProjectDetailContent
        overview='개요'
        detail={detailFixture}
        relatedInsights={[{ slug: 'internal-detail', title: '내부 인사이트', excerpt: '내부 링크 fixture' }]}
      />
    );

    expect(html).toMatch(/<a(?=[^>]*href="\/insights\/internal-detail")(?![^>]*target=)[^>]*>/);
    expect(html).toContain('href="https://example.com/evidence"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('외부 근거 (새 창에서 열림)');
  });

  it('관련 인사이트가 없으면 제목과 placeholder를 모두 생략한다', () => {
    const html = renderToStaticMarkup(
      <ProjectDetailContent overview='개요' detail={detailFixture} relatedInsights={[]} />
    );

    expect(html).not.toContain('관련 인사이트');
    expect(html).not.toContain('연결된 인사이트가 없습니다.');
  });

  it('reported 지표를 사용자 보고값으로 표시한다', () => {
    const html = renderToStaticMarkup(
      <ProjectDetailContent overview='개요' detail={detailFixture} relatedInsights={[]} />
    );

    expect(html).toContain('사용자 보고값');
    expect(html).not.toContain('운영 확인값');
  });

  it('본문 스윔레인을 가로 스크롤 없는 전체 흐름 미리보기로 표시한다', () => {
    const html = renderToStaticMarkup(
      <ProjectDetailContent overview='개요' detail={detailFixture} relatedInsights={[]} />
    );

    expect(html).toContain('data-swimlane-preview="true"');
    expect(html).toContain('data-swimlane-view="inline"');
    expect(html).not.toContain('data-swimlane-scroll');
    expect(html).not.toContain('overflow-x-auto');
    expect(html).not.toContain('role="region"');
    expect(html).not.toContain('tabindex="0"');
    expect(html).toContain('data-swimlane-lane-header="developer"');
    expect(html).not.toMatch(/data-swimlane-step="[^"]+"[^>]*tabindex/);
  });

  it('Archify metadata를 새 탭 action으로 공개하지 않는다', () => {
    const detail = structuredClone(detailFixture);
    const swimlane = detail.swimlanes?.[0];
    if (!swimlane) throw new Error('스윔레인 fixture가 없습니다.');
    Object.assign(swimlane, {
      archify: {
        url: '/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html'
      }
    });

    const html = renderToStaticMarkup(<ProjectDetailContent overview='개요' detail={detail} relatedInsights={[]} />);

    expect(html).not.toContain('data-swimlane-archify');
    expect(html).not.toContain('Archify로 보기');
    expect(html).not.toMatch(
      /<a[^>]+href="\/diagrams\/hotel-reservation-platform\/platform-change-verification-deployment\.html"/
    );
  });

  it('Archify 파일럿은 안정적인 준비 영역과 기존 설명·예외·크게 보기를 보존한다', () => {
    const detail = getFeatureDetailBySlug('hotel-reservation-platform');
    if (!detail) throw new Error('호텔 예약 시스템 상세를 찾을 수 없습니다.');

    const html = renderToStaticMarkup(
      <ProjectDetailContent overview='호텔 예약 시스템 개요' detail={detail} relatedInsights={[]} />
    );

    expect(html.match(/data-swimlane-preview="true"/g)).toHaveLength(1);
    expect(html.match(/data-swimlane-expand="true"/g)).toHaveLength(1);
    expect(html.match(/data-archify-swimlane="preview"/g)).toHaveLength(1);
    expect(html).not.toContain('data-archify-swimlane="dialog"');
    expect(html).not.toContain('data-swimlane-archify');
    expect(html).toContain('전체 흐름 설명');
    expect(html).toContain('예외 상황과 대응');
    expect(html).toContain('패리티 누락');
    expect(html).toContain('data-archify-placeholder="preview"');
    expect(html.match(/data-swimlane-line-legend-item=/g)).toHaveLength(2);
    expect(html).toContain('aria-label="플랫폼 변경·검증·배포 흐름 선 의미"');
    expect(html).toContain('data-swimlane-line-legend-item="normal"');
    expect(html).toContain('data-swimlane-line-legend-item="exception"');
    expect(html).toContain('일반 진행·검증 통과');
    expect(html).toContain('예외 발견·복구 및 재검증');
    expect(html).not.toContain('data-responsive-swimlane="inline"');
  });

  it('여덟 대상은 preview와 Dialog READ가 공유할 정확한 artifact metadata 및 공통 legend를 제공한다', () => {
    const targetsBySlug = new Map<string, number>();
    FEATURE_SWIMLANE_ARCHIFY_TARGETS.forEach(({ featureSlug }) => {
      targetsBySlug.set(featureSlug, (targetsBySlug.get(featureSlug) ?? 0) + 1);
    });

    for (const [slug, expectedPreviewCount] of targetsBySlug) {
      const detail = getFeatureDetailBySlug(slug);
      if (!detail) throw new Error(`${slug} 상세을 찾을 수 없습니다.`);

      const html = renderToStaticMarkup(
        <ProjectDetailContent overview={`${slug} 개요`} detail={detail} relatedInsights={[]} />
      );
      const linkedSwimlanes = detail.swimlanes?.filter(({ archify }) => archify !== undefined) ?? [];

      expect(linkedSwimlanes).toHaveLength(expectedPreviewCount);
      for (const swimlane of linkedSwimlanes) {
        const target = FEATURE_SWIMLANE_ARCHIFY_TARGETS.find(
          ({ featureSlug, swimlaneId }) => featureSlug === slug && swimlaneId === swimlane.id
        );
        expect(swimlane.archify?.url).toBe(target?.url);
      }
      expect(html.match(/data-archify-swimlane="preview"/g)).toHaveLength(expectedPreviewCount);
      expect(html.match(/data-swimlane-line-legend-item=/g)).toHaveLength(expectedPreviewCount * 2);
      expect(html).not.toContain('data-archify-swimlane="dialog"');
    }
  });

  it('여덟 Dialog transcript는 단계·관계 문구와 recover/stop outcome을 14px 이상으로 읽을 수 있게 제공한다', () => {
    for (const { featureSlug, swimlaneId } of FEATURE_SWIMLANE_ARCHIFY_TARGETS) {
      const swimlane = getFeatureDetailBySlug(featureSlug)?.swimlanes?.find(({ id }) => id === swimlaneId);
      if (!swimlane) throw new Error(`${featureSlug}:${swimlaneId} 스윔레인을 찾을 수 없습니다.`);

      const html = renderToStaticMarkup(<SwimlaneDialogTranscript swimlane={swimlane} />);

      expect(html.match(/data-swimlane-transcript-step=/g) ?? []).toHaveLength(swimlane.steps.length);
      expect(html.match(/data-swimlane-transcript-edge=/g) ?? []).toHaveLength(
        swimlane.edges.filter(({ label }) => label).length
      );
      expect(html).toContain('lg:hidden');
      expect(html).toContain('text-sm');
      expect(html.match(/data-swimlane-transcript-edge-kind="exception"/g) ?? []).toHaveLength(
        swimlane.edges.filter(({ kind, label }) => kind === 'exception' && label).length
      );
      expect(html.match(/>예외·복구 흐름</g) ?? []).toHaveLength(
        swimlane.edges.filter(({ kind, label, outcome }) => kind === 'exception' && outcome === 'recover' && label)
          .length
      );
      expect(html.match(/>예외·중단 흐름</g) ?? []).toHaveLength(
        swimlane.edges.filter(({ kind, label, outcome }) => kind === 'exception' && outcome === 'stop' && label).length
      );
      for (const edge of swimlane.edges.filter(({ kind, label }) => kind === 'exception' && label)) {
        const transcriptEdge = html.match(
          new RegExp(`<li(?=[^>]*data-swimlane-transcript-edge="${edge.id}")[\\s\\S]*?</li>`)
        )?.[0];
        const expectedBadge = edge.outcome === 'recover' ? '예외·복구 흐름' : '예외·중단 흐름';

        expect(transcriptEdge).toContain(`data-swimlane-transcript-edge-outcome="${edge.outcome}"`);
        expect(transcriptEdge).toContain(`>${expectedBadge}<`);
      }
      swimlane.steps.forEach(({ label, description }) => {
        expect(html).toContain(label);
        expect(html).toContain(description);
      });
      swimlane.edges.flatMap(({ label }) => (label ? [label] : [])).forEach((label) => expect(html).toContain(label));
    }
  });

  it('Archify metadata가 없는 스윔레인에는 링크나 placeholder를 만들지 않는다', () => {
    const html = renderToStaticMarkup(
      <ProjectDetailContent overview='개요' detail={detailFixture} relatedInsights={[]} />
    );

    expect(html).toContain('data-swimlane-expand="true"');
    expect(html).not.toContain('data-archify-swimlane');
    expect(html).not.toContain('data-swimlane-archify');
    expect(html).not.toContain('Archify로 보기');
    expect(html).not.toContain('Archify 준비 중');
    expect(html).not.toContain('data-swimlane-line-legend');
  });

  it('허용되지 않거나 다른 대상에 연결된 Archify metadata는 iframe 대신 기존 renderer로 수렴한다', () => {
    const source = getFeatureDetailBySlug('hotel-reservation-platform');
    const swimlane = structuredClone(source?.swimlanes?.[0]);
    if (!swimlane) throw new Error('호텔 예약 시스템 스윔레인을 찾을 수 없습니다.');
    swimlane.archify = {
      url: '/diagrams/codi-harness-dx-platform/design-development-verification.html'
    };

    const html = renderToStaticMarkup(<ProjectSwimlane swimlane={swimlane} />);

    expect(html).toContain('data-responsive-swimlane="inline"');
    expect(html).not.toContain('data-archify-swimlane');
    expect(html).not.toContain('data-swimlane-line-legend');
  });

  it('예외가 없는 흐름은 예외 상황 영역을 렌더링하지 않는다', () => {
    const html = renderToStaticMarkup(
      <ProjectDetailContent overview='개요' detail={detailFixture} relatedInsights={[]} />
    );

    expect(detailFixture.swimlanes?.[0].exceptions).toEqual([]);
    expect(html).not.toContain('예외 상황과 대응');
  });

  it('하네스의 두 흐름을 이름과 보이는 설명이 연결된 semantic SVG로 렌더링한다', () => {
    const sourceDetail = getFeatureDetailBySlug('codi-harness-dx-platform');
    if (!sourceDetail) throw new Error('하네스 상세 fixture를 찾을 수 없습니다.');
    const detail = structuredClone(sourceDetail);
    detail.swimlanes?.forEach((swimlane) => delete swimlane.archify);

    const html = renderToStaticMarkup(
      <ProjectDetailContent overview='하네스 상세 개요' detail={detail} relatedInsights={[]} />
    );
    const designDiagram = html.match(
      /<svg(?=[^>]*data-swimlane-view="inline")(?=[^>]*aria-labelledby="design-development-verification-inline-diagram-title")[^>]*>[\s\S]*?<\/svg>/
    )?.[0];
    const deploymentDiagram = html.match(
      /<svg(?=[^>]*data-swimlane-view="inline")(?=[^>]*aria-labelledby="cicd-secrets-deployment-inline-diagram-title")[^>]*>[\s\S]*?<\/svg>/
    )?.[0];

    expect(html.match(/<figure/g)).toHaveLength(2);
    expect(html.match(/<svg/g)).toHaveLength(2);
    expect(designDiagram).toBeDefined();
    expect(deploymentDiagram).toBeDefined();
    expect(designDiagram).toContain('role="img"');
    expect(designDiagram).toContain(
      'aria-describedby="design-development-verification-inline-diagram-description design-development-verification-inline-summary"'
    );
    expect(deploymentDiagram).toContain('role="img"');
    expect(deploymentDiagram).toContain(
      'aria-describedby="cicd-secrets-deployment-inline-diagram-description cicd-secrets-deployment-inline-summary"'
    );
    const designSummary = html.match(/<p id="design-development-verification-inline-summary"([^>]*)>([^<]+)<\/p>/);
    const deploymentSummary = html.match(/<p id="cicd-secrets-deployment-inline-summary"([^>]*)>([^<]+)<\/p>/);

    expect(designSummary?.[1]).not.toMatch(/hidden|sr-only/);
    expect(designSummary?.[2]).toBe(
      '요청·맥락 전달에서 시작해 문제 정의, 명세·계획, 승인, 테스트·구현, 리뷰·검증 순서로 진행하며 검증을 통과하면 완료합니다.'
    );
    expect(deploymentSummary?.[1]).not.toMatch(/hidden|sr-only/);
    expect(deploymentSummary?.[2]).toBe(
      '변경 감지에서 시작해 품질 검사, 환경·대상 결정, 시크릿 조회, 병렬 배포, 결과 확인 순서로 진행합니다.'
    );
    expect(html.match(/전체 흐름 설명/g)).toHaveLength(2);
    expect(html.match(/예외 상황과 대응/g)).toHaveLength(2);

    expect(designDiagram?.match(/data-edge-kind="normal"/g)).toHaveLength(6);
    expect(designDiagram?.match(/data-edge-kind="exception"/g)).toHaveLength(3);
    expect(deploymentDiagram?.match(/data-edge-kind="normal"/g)).toHaveLength(5);
    expect(deploymentDiagram?.match(/data-edge-kind="exception"/g)).toHaveLength(3);
    expect(html).toContain('data-node-shape="start"');
    expect(html).toContain('data-node-shape="process"');
    expect(html).toContain('data-node-shape="decision"');
    expect(html).toContain('data-node-shape="end"');
    expect(html).toContain('data-node-shape="stop"');
    expect(html).toMatch(/<g(?=[^>]*data-node-shape="decision")[^>]*>[\s\S]*?<polygon[^>]*>/);
    expect(html).toMatch(/<g(?=[^>]*data-node-shape="process")[^>]*>[\s\S]*?<rect[^>]*>/);
    expect(html).toMatch(/<g(?=[^>]*data-node-shape="start")[^>]*>[\s\S]*?<rect(?=[^>]*rx="[1-9][0-9.]*")[^>]*>/);
    expect(html).toMatch(/<g(?=[^>]*data-node-shape="end")[^>]*>[\s\S]*?<rect(?=[^>]*rx="[1-9][0-9.]*")[^>]*>/);
    expect(html).toMatch(/<g(?=[^>]*data-node-shape="stop")[^>]*>[\s\S]*?<rect(?=[^>]*rx="0")[^>]*>/);

    const normalEdgeMarkup = html.match(/<path(?=[^>]*data-edge-kind="normal")[^>]*>/g) ?? [];
    const exceptionEdgeMarkup = html.match(/<path(?=[^>]*data-edge-kind="exception")[^>]*>/g) ?? [];

    expect(normalEdgeMarkup).toHaveLength(11);
    expect(normalEdgeMarkup.every((edge) => !edge.includes('stroke-dasharray'))).toBe(true);
    expect(exceptionEdgeMarkup).toHaveLength(6);
    expect(exceptionEdgeMarkup.every((edge) => edge.includes('stroke-dasharray="8 6"'))).toBe(true);

    const laneHeaderMarkup = html.match(/<rect(?=[^>]*data-swimlane-lane-header)[^>]*>/g) ?? [];
    const laneBodyMarkup = html.match(/<rect(?=[^>]*data-swimlane-lane-body)[^>]*>/g) ?? [];

    expect(laneHeaderMarkup).toHaveLength(8);
    expect(
      laneHeaderMarkup.every((header) => {
        const height = Number(header.match(/height="([0-9.]+)"/)?.[1]);

        return header.includes('y="0"') && Number.isFinite(height) && height > 0;
      })
    ).toBe(true);
    expect(laneBodyMarkup).toHaveLength(8);
    expect(laneBodyMarkup.every((body) => body.includes('y="0"'))).toBe(true);

    for (const shape of ['process', 'decision'] as const) {
      const node = getNodeGeometry(
        {
          id: `row-zero-${shape}`,
          laneId: 'lane',
          row: 0,
          shape,
          label: shape,
          description: `${shape} geometry를 확인합니다.`
        },
        0
      );

      expect(node.y - node.height / 2).toBeGreaterThan(HEADER_HEIGHT);
    }

    const markerIds = [designDiagram, deploymentDiagram].flatMap((diagram) =>
      [...(diagram?.matchAll(/<marker id="([^"]+)"/g) ?? [])].map((match) => match[1])
    );

    expect(markerIds).toEqual([
      'design-development-verification-inline-normal-arrow',
      'design-development-verification-inline-exception-arrow',
      'cicd-secrets-deployment-inline-normal-arrow',
      'cicd-secrets-deployment-inline-exception-arrow'
    ]);
    expect(new Set(markerIds).size).toBe(4);
    for (const diagram of [designDiagram, deploymentDiagram]) {
      expect(diagram?.indexOf('data-edge-kind')).toBeGreaterThan(-1);
      expect(diagram?.indexOf('data-swimlane-step')).toBeLessThan(diagram?.indexOf('data-edge-kind') ?? -1);
    }

    const visibleText = html.replace(/<[^>]+>/g, '');

    for (const label of [
      '승인',
      '통과',
      '요구 보강',
      '미승인',
      '실패',
      '일치',
      '불일치',
      '원인 수정 후 처음부터 재실행'
    ]) {
      expect(visibleText).toContain(label);
    }
    for (const sentence of [
      '사용자에게 추가 질문한 뒤 문제 정의를 다시 진행합니다.',
      '명세와 계획을 보강한 뒤 다시 승인을 요청합니다.',
      '테스트·구현 단계로 돌아가 수정한 뒤 다시 검증합니다.',
      '시크릿 조회와 배포를 시작하지 않습니다.',
      '배포를 중단하고 설정을 수정한 뒤 workflow를 처음부터 다시 실행합니다.'
    ]) {
      expect(html).toContain(sentence);
    }
    expect(html).not.toMatch(/data-(?:swimlane-step|edge-kind)="[^"]+"[^>]*tabindex/);
    for (const forbiddenCopy of ['연결과 분기', '순서형 대체 설명', '이전 단계로 복구', '계속']) {
      expect(html).not.toContain(forbiddenCopy);
    }
  });

  it('연결선을 승인된 둥근 path·작은 marker·label pill 레이어로 렌더링한다', () => {
    const sourceDetail = getFeatureDetailBySlug('codi-harness-dx-platform');
    if (!sourceDetail) throw new Error('하네스 상세 fixture를 찾을 수 없습니다.');
    const detail = structuredClone(sourceDetail);
    detail.swimlanes?.forEach((swimlane) => delete swimlane.archify);

    const html = renderToStaticMarkup(
      <ProjectDetailContent overview='하네스 상세 개요' detail={detail} relatedInsights={[]} />
    );
    const diagrams = [...html.matchAll(/<svg[^>]*>[\s\S]*?<\/svg>/g)].map(([diagram]) => diagram);

    expect(diagrams).toHaveLength(2);
    for (const diagram of diagrams) {
      const normalEdges = diagram.match(/<path(?=[^>]*data-edge-kind="normal")[^>]*>/g) ?? [];
      const exceptionEdges = diagram.match(/<path(?=[^>]*data-edge-kind="exception")[^>]*>/g) ?? [];
      const markers = diagram.match(/<marker[^>]*>/g) ?? [];

      expect(diagram).not.toContain('<polyline');
      expect(normalEdges.length).toBeGreaterThan(0);
      expect(exceptionEdges.length).toBeGreaterThan(0);
      expect(normalEdges.every((edge) => edge.includes('stroke-width="2"'))).toBe(true);
      expect(normalEdges.every((edge) => edge.includes('stroke-linecap="butt"'))).toBe(true);
      expect(normalEdges.every((edge) => edge.includes('stroke-linejoin="round"'))).toBe(true);
      expect(normalEdges.every((edge) => !edge.includes('stroke-dasharray'))).toBe(true);
      expect(exceptionEdges.every((edge) => edge.includes('stroke-dasharray="8 6"'))).toBe(true);
      expect(markers).toHaveLength(2);
      expect(markers.every((marker) => marker.includes('markerWidth="6"') && marker.includes('markerHeight="6"'))).toBe(
        true
      );
      expect(diagram).not.toContain('<circle');
      expect(diagram).not.toMatch(/data-(?:receive-port|edge-halo)/);

      const layerOrder = ['lanes', 'node-shapes', 'edges', 'node-labels', 'edge-labels'].map((layer) =>
        diagram.indexOf(`data-swimlane-layer="${layer}"`)
      );
      expect(layerOrder.every((index) => index >= 0)).toBe(true);
      expect(layerOrder).toEqual([...layerOrder].sort((left, right) => left - right));

      const labelPills = diagram.match(/<g(?=[^>]*data-edge-label)[^>]*>[\s\S]*?<\/g>/g) ?? [];
      expect(labelPills.length).toBeGreaterThan(0);
      expect(labelPills.every((label) => label.includes('<rect') && label.includes('<text'))).toBe(true);
    }
  });

  it('긴 edge label을 pill 중앙의 여러 tspan 행으로 렌더링한다', () => {
    const swimlane = detailFixture.swimlanes?.[0];
    if (!swimlane) throw new Error('스윔레인 fixture를 찾을 수 없습니다.');
    const responsiveSwimlane: FeatureSwimlane = {
      ...swimlane,
      edges: [
        {
          ...swimlane.edges[0],
          label: '배포 workflow 실패 원인 수정 후 처음부터 다시 실행하고 verify results'
        }
      ]
    };

    const html = renderToStaticMarkup(
      <ProjectSwimlaneDiagram
        swimlane={responsiveSwimlane}
        describedBy='delivery-inline-summary'
        instanceKey='inline'
        layout={calculateSwimlaneLayout(responsiveSwimlane, { width: 252, minimumFontSize: 10 })}
      />
    );
    const labelPill = html.match(/<g(?=[^>]*data-edge-label="plan-to-verify")[^>]*>[\s\S]*?<\/g>/)?.[0];
    const tspans = labelPill?.match(/<tspan[^>]*>[\s\S]*?<\/tspan>/g) ?? [];
    const textX = labelPill?.match(/<text[^>]*x="([^"]+)"/)?.[1];

    expect(labelPill).toBeDefined();
    expect(tspans.length).toBeGreaterThan(1);
    expect(tspans.every((line) => line.includes(`x="${textX}"`))).toBe(true);
    expect(tspans[0]).toContain('dy="0"');
    expect(tspans.slice(1).every((line) => /dy="[1-9][0-9.]*"/.test(line))).toBe(true);
  });

  it('compact layout의 node와 edge label을 줄별 tspan으로 렌더링하고 구조를 보존한다', () => {
    const sourceDetail = getFeatureDetailBySlug('blackstone-belleforet-resort');
    if (!sourceDetail) throw new Error('Blackstone 상세 fixture를 찾을 수 없습니다.');
    const detail = structuredClone(sourceDetail);
    detail.swimlanes?.forEach((swimlane) => delete swimlane.archify);
    const swimlane = detail.swimlanes?.[0];
    if (!swimlane) throw new Error('Blackstone 스윔레인을 찾을 수 없습니다.');

    const html = renderToStaticMarkup(
      <ProjectDetailContent overview='Blackstone 상세 개요' detail={detail} relatedInsights={[]} />
    );
    const diagram = html.match(/<svg(?=[^>]*data-swimlane-view="inline")[^>]*>[\s\S]*?<\/svg>/)?.[0];
    if (!diagram) throw new Error('inline 스윔레인 SVG를 찾을 수 없습니다.');

    expect(diagram).toContain('data-swimlane-layout-width="252"');
    expect(diagram.match(/data-swimlane-lane-header=/g)).toHaveLength(swimlane.lanes.length);
    expect(diagram.match(/data-swimlane-step=/g)).toHaveLength(swimlane.steps.length);
    expect(diagram.match(/data-edge-id=/g)).toHaveLength(swimlane.edges.length);
    expect(diagram.match(/data-edge-label=/g)).toHaveLength(swimlane.edges.filter(({ label }) => label).length);
    expect(diagram).toMatch(
      /<text(?=[^>]*data-swimlane-node-label="submit-payment")[^>]*>[\s\S]*?<tspan[^>]*>[^<]+<\/tspan>/
    );
    expect(diagram).toMatch(/<g(?=[^>]*data-edge-label="evaluate-compensate")[^>]*>[\s\S]*?<tspan[^>]*>/);

    const layerOrder = ['lanes', 'node-shapes', 'edges', 'node-labels', 'edge-labels'].map((layer) =>
      diagram.indexOf(`data-swimlane-layer="${layer}"`)
    );
    expect(layerOrder).toEqual([...layerOrder].sort((left, right) => left - right));
    expect(diagram).toContain('payment-and-compensation-inline-normal-arrow');
    expect(diagram).toContain('payment-and-compensation-inline-exception-arrow');
  });

  it('모든 스윔레인 카드에 명시적인 크게 보기 버튼과 inline 인스턴스 식별자를 표시한다', () => {
    const sourceDetail = getFeatureDetailBySlug('codi-harness-dx-platform');
    if (!sourceDetail) throw new Error('하네스 상세 fixture를 찾을 수 없습니다.');
    const detail = structuredClone(sourceDetail);
    detail.swimlanes?.forEach((swimlane) => delete swimlane.archify);

    const html = renderToStaticMarkup(
      <ProjectDetailContent overview='하네스 상세 개요' detail={detail} relatedInsights={[]} />
    );

    expect(html.match(/data-swimlane-card/g)).toHaveLength(2);
    expect(html.match(/data-swimlane-expand/g)).toHaveLength(2);
    expect(html.match(/>크게 보기</g)).toHaveLength(2);
    expect(html.match(/data-swimlane-view="inline"/g)).toHaveLength(2);
    expect(html).toContain('design-development-verification-inline-normal-arrow');
    expect(html).toContain('cicd-secrets-deployment-inline-normal-arrow');
  });

  it('inline과 dialog 다이어그램을 고유한 설명 관계와 비포커스 정적 도형으로 구분한다', () => {
    const swimlane = detailFixture.swimlanes?.[0];
    if (!swimlane) throw new Error('스윔레인 fixture를 찾을 수 없습니다.');
    const layout = calculateSwimlaneLayout(swimlane, { width: 252, minimumFontSize: 10 });

    const html = renderToStaticMarkup(
      <div>
        <ProjectSwimlaneDiagram
          swimlane={swimlane}
          describedBy='delivery-inline-summary'
          instanceKey='inline'
          layout={layout}
        />
        <p id='delivery-inline-summary'>{swimlane.summary}</p>
        <ProjectSwimlaneDiagram
          swimlane={swimlane}
          describedBy='delivery-dialog-summary'
          instanceKey='dialog'
          layout={layout}
        />
        <p id='delivery-dialog-summary'>{swimlane.summary}</p>
      </div>
    );
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(([, id]) => id);

    expect(new Set(ids).size).toBe(ids.length);
    for (const instanceKey of ['inline', 'dialog'] as const) {
      const accessibleName =
        instanceKey === 'inline' ? '설계·개발·검증 전체 흐름 미리보기' : '설계·개발·검증 전체 흐름 크게 보기';

      expect(html).toContain(`id="delivery-${instanceKey}-diagram-title"`);
      expect(html).toContain(`id="delivery-${instanceKey}-diagram-description"`);
      expect(html).toContain(`id="delivery-${instanceKey}-normal-arrow"`);
      expect(html).toContain(`id="delivery-${instanceKey}-exception-arrow"`);
      expect(html).toContain(`aria-labelledby="delivery-${instanceKey}-diagram-title"`);
      expect(html).toContain(
        `aria-describedby="delivery-${instanceKey}-diagram-description delivery-${instanceKey}-summary"`
      );
      expect(html).toContain(`<title id="delivery-${instanceKey}-diagram-title">${accessibleName}</title>`);
      expect(html).toContain(`<p id="delivery-${instanceKey}-summary">${swimlane.summary}</p>`);
    }
    expect(html).not.toMatch(/data-(?:swimlane-step|edge-id)="[^"]+"[^>]*tabindex/);
  });

  it('relatedInsights가 없는 본문 renderer fixture에 대표 설계 네 개와 canonical 링크를 렌더링한다', () => {
    const sourceDetail = getFeatureDetailBySlug('codi-harness-dx-platform');
    if (!sourceDetail) throw new Error('하네스 상세 fixture를 찾을 수 없습니다.');
    const detail = structuredClone(sourceDetail);
    detail.swimlanes?.forEach((swimlane) => delete swimlane.archify);

    const bodyOnlyHtml = renderToStaticMarkup(
      <ProjectDetailContent overview='하네스 상세 개요' detail={detail} relatedInsights={[]} />
    );
    const approvedHeadings = [
      './harness와 doctor',
      'harness.lock과 소유권 경계',
      '공통 정책과 런타임 어댑터',
      '변경 범위 기반 배포와 Infisical 경계'
    ];
    const renderedHeadings = [...bodyOnlyHtml.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g)].map(([, content]) =>
      content.replace(/<[^>]+>/g, '')
    );

    expect(renderedHeadings.filter((heading) => approvedHeadings.includes(heading))).toEqual(approvedHeadings);

    expect(bodyOnlyHtml.match(/href="\/insights\/codi-harness-dx-platform-design"/g)).toHaveLength(1);
    for (const removedSlug of [
      'harness-lock-and-project-ownership-boundary',
      'harness-cli-and-doctor-productization',
      'claude-codex-policy-parity-and-regression-testing',
      'multi-session-testbed-and-context-lifecycle'
    ]) {
      expect(bodyOnlyHtml).not.toContain(`/insights/${removedSlug}`);
    }
    expect(bodyOnlyHtml.match(/<figure/g)).toHaveLength(2);
    expect(bodyOnlyHtml.match(/근거 종류/g)).toHaveLength(6);
    expect(bodyOnlyHtml).not.toMatch(/데모|시뮬레이터|준비 중/);
  });

  it('지표 보충 설명을 근거 종류별 범위로 표시하고 설명이 없으면 범위 영역을 생략한다', () => {
    const html = renderToStaticMarkup(
      <ProjectHighlights
        highlights={[
          {
            id: 'estimate',
            label: '비용',
            value: '$151.84/월',
            kind: 'estimated',
            asOf: '2026-08-20',
            evidence: '공개 가격 기준',
            caveat: '스토리지와 세금은 제외합니다.'
          },
          {
            id: 'measurement',
            label: '배포 시간',
            value: '약 3분',
            kind: 'measured',
            asOf: '2026-08-20',
            evidence: '실행 화면 비교',
            caveat: '동일한 다섯 대상을 비교했습니다.'
          },
          {
            id: 'observation',
            label: '운영 관찰',
            value: '미발생',
            kind: 'reported',
            asOf: '2026-08-20',
            evidence: '운영 현황 확인',
            caveat: '향후 발생 가능성이 0이라는 뜻은 아닙니다.'
          },
          {
            id: 'without-caveat',
            label: '적용 프로젝트',
            value: '11개',
            kind: 'reported',
            asOf: '2026-08-20',
            evidence: '적용 현황 확인'
          }
        ]}
      />
    );

    expect(html).toContain('산정 범위');
    expect(html).toContain('측정 범위');
    expect(html).toContain('관찰 범위');
    expect(html.match(/(?:산정|측정|관찰) 범위/g)).toHaveLength(3);
    expect(html).toContain('$151.84/월');
    expect(html).toContain('약 3분');
    expect(html).toContain('11개');
    expect(html).toContain('공개 가격 기준');
    expect(html).toContain('실행 화면 비교');
    expect(html).toContain('적용 현황 확인');
    expect(html).not.toContain('제한:');
  });
});

describe('하이패스 구조화 상세 렌더링', () => {
  const renderHipass = () => {
    const feature = getFeatureBySlug('hipass-b2b-platform');
    const detail = getFeatureDetailBySlug('hipass-b2b-platform');
    const relatedInsights = getAllInsights()
      .filter(({ featureSlug }) => featureSlug === 'hipass-b2b-platform')
      .map(({ slug, title, excerpt }) => ({ slug, title, excerpt }));

    expect(detail).not.toBeNull();
    return {
      feature,
      relatedInsights,
      html: renderToStaticMarkup(
        <ProjectDetailContent overview={feature?.overview ?? ''} detail={detail!} relatedInsights={relatedInsights} />
      )
    };
  };

  it('공통 읽기 순서와 결제 스윔레인 하나를 legacy 본문 중복 없이 표시한다', () => {
    const { feature, html } = renderHipass();
    const headings = [
      '프로젝트 개요',
      '나의 역할과 책임 범위',
      '핵심 결과 요약',
      '문제 상황과 제약 조건',
      '대안 검토와 선택',
      '시스템 흐름',
      '핵심 설계와 구현',
      '결과와 검증 근거',
      '회고와 다음 개선',
      '관련 인사이트'
    ];
    let previous = -1;
    for (const heading of headings) {
      const current = html.indexOf(heading);
      expect(current, heading).toBeGreaterThan(previous);
      previous = current;
    }
    expect(html.match(/data-swimlane-preview="true"/g)).toHaveLength(1);
    expect(feature?.content).toBeUndefined();
  });

  it('정산과 Socket.io 인사이트 두 개를 의미 있는 링크로 제공한다', () => {
    const { html, relatedInsights } = renderHipass();

    expect(relatedInsights).toHaveLength(2);
    expect(html).toContain('href="/insights/json-outbox-pattern-for-settlement"');
    expect(html).toContain('href="/insights/socketio-realtime-architecture-and-reliability"');
    expect(html).toContain('정산 상태는 DB에, 재처리 입력은 JSON에 둔 이유');
    expect(html).toContain('공용 Room에서 화원별 User Room으로: 전달 범위와 전달 보장은 다르다');
  });
});

describe('호텔 예약 플랫폼 구조화 상세 렌더링', () => {
  const renderHotelPlatform = () => {
    const feature = getFeatureBySlug('hotel-reservation-platform');
    const detail = getFeatureDetailBySlug('hotel-reservation-platform');
    const relatedInsights = getAllInsights()
      .filter(({ featureSlug }) => featureSlug === 'hotel-reservation-platform')
      .map(({ slug, title, excerpt }) => ({ slug, title, excerpt }));

    expect(detail).not.toBeNull();
    return {
      feature,
      relatedInsights,
      html: renderToStaticMarkup(
        <ProjectDetailContent overview={feature?.overview ?? ''} detail={detail!} relatedInsights={relatedInsights} />
      )
    };
  };

  it('공통 읽기 순서와 플랫폼 변경 스윔레인 하나를 legacy 본문 중복 없이 표시한다', () => {
    const { feature, html } = renderHotelPlatform();
    const headings = [
      '프로젝트 개요',
      '나의 역할과 책임 범위',
      '핵심 결과 요약',
      '문제 상황과 제약 조건',
      '대안 검토와 선택',
      '시스템 흐름',
      '핵심 설계와 구현',
      '결과와 검증 근거',
      '회고와 다음 개선',
      '관련 인사이트'
    ];
    let previous = -1;
    for (const heading of headings) {
      const current = html.indexOf(heading);
      expect(current, heading).toBeGreaterThan(previous);
      previous = current;
    }
    expect(html.match(/data-swimlane-preview="true"/g)).toHaveLength(1);
    expect(html).toContain('근거 종류');
    expect(html).toContain('기준 시점');
    expect(feature?.content).toBeUndefined();
  });

  it('코드 경계와 예약 Context 인사이트 두 개를 의미 있는 링크로 제공한다', () => {
    const { html, relatedInsights } = renderHotelPlatform();

    expect(relatedInsights).toHaveLength(2);
    expect(html).toContain('href="/insights/config-driven-architecture-react"');
    expect(html).toContain('href="/insights/context-api-encapsulation-and-router-level-isolation"');
  });
});

describe('시에나 골프 예약 구조화 상세 렌더링', () => {
  const slug = 'the-siena-golf-reservation';
  const swimlaneId = 'reservation-request-and-exception-flow';

  it('예약 예외의 텍스트 대안과 linked syslog insight를 실제 상세에 렌더링한다', () => {
    const feature = getFeatureBySlug(slug);
    const detail = getFeatureDetailBySlug(slug);
    const relatedInsights = getAllInsights()
      .filter(({ featureSlug }) => featureSlug === slug)
      .map(({ slug: insightSlug, title, excerpt }) => ({ slug: insightSlug, title, excerpt }));

    expect(detail).not.toBeNull();
    const html = renderToStaticMarkup(
      <ProjectDetailContent overview={feature?.overview ?? ''} detail={detail!} relatedInsights={relatedInsights} />
    );
    const flow = detail?.swimlanes?.find(({ id }) => id === swimlaneId);
    expect(html).toContain(`href="/insights/logging-decoupling-and-buffering-in-external-api-systems"`);
    expect(html).toContain('로그는 남기는 것보다 조회할 수 있어야 한다: 외부 API 로그 분리기');
    expect(flow?.id).toBe(swimlaneId);
    expect(flow?.summary).toMatch(/예약.*PMS|PMS.*예약/);
    flow?.steps.forEach(({ label, description }) => {
      expect(html).toContain(label);
      expect(html).toContain(description);
    });
    flow?.exceptions.forEach(({ trigger, response }) => {
      expect(html).toContain(trigger);
      expect(html).toContain(response);
    });
  });
});

describe('행사 호텔 예약·결제 통합 플랫폼 상세 렌더링 RED 계약', () => {
  const renderIntegratedReservationDetail = () => {
    const feature = getFeatureBySlug('integrated-reservation-platform');
    const detail = getFeatureDetailBySlug('integrated-reservation-platform');
    const relatedInsights = getAllInsights()
      .filter(({ featureSlug }) => featureSlug === 'integrated-reservation-platform')
      .map(({ slug, title, excerpt }) => ({ slug, title, excerpt }));

    if (!detail) throw new Error('행사 호텔 예약·결제 통합 플랫폼 detail이 아직 등록되지 않았습니다.');
    return {
      html: renderToStaticMarkup(
        <ProjectDetailContent overview={feature?.overview ?? ''} detail={detail} relatedInsights={relatedInsights} />
      ),
      relatedInsights
    };
  };

  it('통합 예약 detail이 실제 ProjectDetailContent 렌더 경로에 등록되어 있다', () => {
    expect(getFeatureDetailBySlug('integrated-reservation-platform')).not.toBeNull();
  });

  it('공통 읽기 순서를 실제 detail content에 렌더링한다', () => {
    const { html } = renderIntegratedReservationDetail();
    const headings = [
      '프로젝트 개요',
      '나의 역할과 책임 범위',
      '핵심 결과 요약',
      '문제 상황과 제약 조건',
      '대안 검토와 선택',
      '핵심 설계와 구현',
      '결과와 검증 근거',
      '회고와 다음 개선',
      '관련 인사이트'
    ];
    let previous = -1;
    for (const heading of headings) {
      const current = html.indexOf(heading);
      expect(current, heading).toBeGreaterThan(previous);
      previous = current;
    }
  });

  it('관계도 preview를 실제 detail content에 렌더링한다', () => {
    const { html } = renderIntegratedReservationDetail();

    expect(html).toContain('data-relationship-diagram="preview"');
  });

  it('핵심 데이터 관계 섹션을 시스템 흐름 뒤에 렌더링한다', () => {
    const { html } = renderIntegratedReservationDetail();

    expect(html.indexOf('시스템 흐름')).toBeGreaterThan(-1);
    expect(html.indexOf('핵심 데이터 관계')).toBeGreaterThan(html.indexOf('시스템 흐름'));
  });

  it.each([undefined, []] as const)(
    'relationshipDiagrams가 %s이면 빈 관계 섹션을 렌더링하지 않는다',
    (relationshipDiagrams) => {
      const detail = structuredClone(getFeatureDetailBySlug('integrated-reservation-platform'))!;
      detail.relationshipDiagrams = relationshipDiagrams ? [...relationshipDiagrams] : undefined;
      const html = renderToStaticMarkup(<ProjectDetailContent overview='개요' detail={detail} relatedInsights={[]} />);

      expect(html).not.toContain('핵심 데이터 관계');
      expect(html).not.toContain('data-relationship-diagram');
    }
  );

  it('canonical 인사이트 세 건을 실제 detail content의 related set으로 전달한다', () => {
    const { relatedInsights } = renderIntegratedReservationDetail();

    expect(relatedInsights.map(({ slug }) => slug).sort()).toEqual([
      'https-and-plaintext-password-transmission',
      'nestjs-middleware-vs-guard-tradeoff',
      'nextjs-nestjs-domain-separation-and-bff'
    ]);
  });

  it('실제 /projects/[slug] server page가 On Hold badge와 보류 사유를 상단 메타에 연결한다', async () => {
    const page = await FeatureDetailPage({ params: Promise.resolve({ slug: 'integrated-reservation-platform' }) });
    const html = renderToStaticMarkup(page);

    expect(html).toContain('On Hold');
    expect(html).toContain('고객사 측 사업 여건으로 개발 보류');
    expect(html).toContain('data-project-status="on-hold"');
  });

  it('공통 status badge는 On Hold에서 프로젝트 고유 보류 사유를 추론하지 않는다', () => {
    const html = renderToStaticMarkup(<ProjectStatusBadge status='On Hold' />);

    expect(html).toContain('On Hold');
    expect(html).toContain('data-project-status="on-hold"');
    expect(html).not.toContain('고객사 측 사업 여건으로 개발 보류');
  });

  it.each([
    ['the-siena-golf-reservation', 'Production', 'production'],
    ['hipass-b2b-platform', 'Archived', 'archived']
  ] as const)('기존 %s page는 %s status 표현을 회귀 없이 렌더링한다', async (slug, status, statusSlug) => {
    const page = await FeatureDetailPage({ params: Promise.resolve({ slug }) });
    const html = renderToStaticMarkup(page);

    expect(html).toContain(status);
    expect(html).toContain(`data-project-status="${statusSlug}"`);
    expect(html).not.toContain('고객사 측 사업 여건으로 개발 보류');
  });
});
