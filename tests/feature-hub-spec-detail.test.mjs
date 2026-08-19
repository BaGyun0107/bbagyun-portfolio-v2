import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSpecDetail } from '../.harness/scripts/docs/lib/parse-spec-detail.mjs';

const SPEC = `# Feature Specification: 검색

사용자가 원하는 문서를 빠르게 찾는다.

## User Scenarios & Testing

### User Story 1 - 문서 검색 (Priority: P1)

사용자가 검색어로 문서를 좁힌다.

**Acceptance Scenarios**:

1. **Given** 문서가 있음, **When** 검색, **Then** 일치 문서만 보인다.
2. **Given** 결과가 없음, **When** 검색, **Then** 빈 상태가 보인다.

### Edge Cases

- 공백 검색어는 전체 목록을 유지한다.

## Requirements

### Functional Requirements

- **FR-001**: 검색어를 제목과 본문에 적용해야 한다.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 두 번 이하의 입력으로 결과를 확인한다.
`;

test('spec-detail: 핵심 상세 섹션을 구조화한다', () => {
  const detail = parseSpecDetail(SPEC);
  assert.equal(detail.summary, '사용자가 원하는 문서를 빠르게 찾는다.');
  assert.equal(detail.userStories.length, 1);
  assert.equal(detail.userStories[0].title, '문서 검색');
  assert.equal(detail.userStories[0].priority, 'P1');
  assert.equal(detail.userStories[0].acceptanceScenarios.length, 2);
  assert.deepEqual(detail.edgeCases, ['공백 검색어는 전체 목록을 유지한다.']);
  assert.deepEqual(detail.functionalRequirements, [
    { id: 'FR-001', text: '검색어를 제목과 본문에 적용해야 한다.' },
  ]);
  assert.deepEqual(detail.successCriteria, [
    { id: 'SC-001', text: '두 번 이하의 입력으로 결과를 확인한다.' },
  ]);
});

test('spec-detail: 선택 섹션이 없으면 빈 배열을 반환하고 추측하지 않는다', () => {
  const detail = parseSpecDetail('# Feature Specification: 최소\n\n한 줄 요약.\n');
  assert.equal(detail.summary, '한 줄 요약.');
  assert.deepEqual(detail.userStories, []);
  assert.deepEqual(detail.edgeCases, []);
  assert.deepEqual(detail.functionalRequirements, []);
  assert.deepEqual(detail.successCriteria, []);
});
