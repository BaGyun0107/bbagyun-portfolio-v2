import { renderToStaticMarkup } from 'react-dom/server';

import { describe, expect, it } from 'vitest';

import type { FeatureSwimlane } from '@/data/portfolio';

import {
  COMPACT_SWIMLANE_WIDTH,
  ResponsiveSwimlaneDiagram,
  normalizeObservedSwimlaneWidth
} from './ResponsiveSwimlaneDiagram';

const swimlane: FeatureSwimlane = {
  id: 'responsive-wrapper',
  title: '측정 wrapper',
  purpose: '측정 전에도 읽을 수 있는 layout을 제공합니다.',
  summary: '시작에서 종료로 이동합니다.',
  lanes: [
    { id: 'request', label: '요청' },
    { id: 'response', label: '응답' }
  ],
  steps: [
    { id: 'start', laneId: 'request', row: 0, shape: 'start', label: '요청 시작', description: '시작' },
    { id: 'end', laneId: 'response', row: 1, shape: 'end', label: '응답 완료', description: '종료' }
  ],
  edges: [{ id: 'start-end', from: 'start', to: 'end', kind: 'normal', outcome: 'continue' }],
  exceptions: []
};

describe('ResponsiveSwimlaneDiagram', () => {
  it('SSR에서는 10px 글자를 유지하는 compact fallback layout을 렌더링한다', () => {
    const html = renderToStaticMarkup(
      <ResponsiveSwimlaneDiagram swimlane={swimlane} describedBy='responsive-wrapper-summary' instanceKey='inline' />
    );

    expect(html).toContain(`data-swimlane-layout-width="${COMPACT_SWIMLANE_WIDTH}"`);
    expect(html).toMatch(/data-swimlane-node-label="start"[^>]*font-size="1[0-9.]*"/);
  });

  it('유효한 폭은 정수로 반영하고 동일·0·비유한 폭은 이전 값을 유지한다', () => {
    expect(normalizeObservedSwimlaneWidth(684.4, 252)).toBe(684);
    expect(normalizeObservedSwimlaneWidth(684.49, 684)).toBe(684);
    expect(normalizeObservedSwimlaneWidth(0, 684)).toBe(684);
    expect(normalizeObservedSwimlaneWidth(Number.NaN, 684)).toBe(684);
    expect(normalizeObservedSwimlaneWidth(Number.POSITIVE_INFINITY, 684)).toBe(684);
  });
});
