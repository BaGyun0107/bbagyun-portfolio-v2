# Implementation Plan: 하네스 카탈로그 전환 + legacy 잔재 제거

**Branch**: `feature/harness-migrate` (spec dir: `012-harness-catalog-migration`) | **Date**: 2026-07-17 | **Spec**: [spec.md](spec.md)

## Summary

(1) health를 source 문제/advisory로 코드 부류 기반 분리, (2) 하네스
자체 카탈로그(data/feature-definitions.json, spec ID 재사용) 도입,
(3) 죽은 렌더러·미사용 파일·구 설계 문서 제거(참조 0 확인 + 테스트
이식), legacy 행 신규 계약 제거 + 변환 안내.

## Technical Context

**Language/Version**: Node.js (mise), ESM(.mjs) — 기존 파이프라인 유지

**Testing**: node:test, TDD. 데모 golden·canonical 스냅샷 회귀 금지

**Constraints**: fail-open, 자동 승격 금지, ID 불변, 생성물 직접 수정
금지. 새 프레임워크 없음. 제거는 참조 0 확인 후.

**Scale/Scope**: 카탈로그 11항목, 제거 후보 ~10파일, health 분류 1회 변경

## Constitution Check

constitution 미작성 → 저장소 상위 규칙 적용: TDD·fail-open·회귀 금지
전부 준수. 파일 제거는 참조 검사 태스크가 선행 게이트다.

## Project Structure

### Documentation (this feature)

```text
specs/012-harness-catalog-migration/
├── spec.md / plan.md / research.md / data-model.md / quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
.harness/scripts/docs/lib/
├── build-workspace-hub-model.mjs   # 수정 — advisory/source health 분리
├── render-planning-page.mjs        # 확인 — advisory 노출 회귀 없음
├── render-hub.mjs                  # 제거 — 프로덕션 참조 0
└── merge-service-definition.mjs 등 # FR-007 범위 내 조정

data/feature-definitions.json       # 신규 — 하네스 카탈로그 11항목
data/decisions.json                 # 신규 — 상세 백필 열린 결정 1건

제거 후보(참조 0 확인 후): render-hub.mjs, 그 전용 테스트 2파일(살아있는
공유 로직 검증은 이식), examples/community-app/expected/hub-snapshot.json,
docs/superpowers/ 설계 초안 7파일(스펙 링크 갱신 동반)

tests/
├── planning-workspaces.test.mjs        # 수정 — advisory 분리
├── feature-hub-sitemap-build.test.mjs  # 수정 — 하네스 카탈로그 빌드
├── feature-hub-canonical-data.test.mjs # 수정 — 카탈로그 정합
└── (이식) 살아있는 사이트맵 렌더 검증 → 현행 렌더러 대상 테스트
```

**Structure Decision**: 기존 구조 유지. 신규 파일은 카탈로그 데이터
2개뿐이고 나머지는 수정·제거다. 제거 항목은 반드시 "참조 0 확인 →
테스트 이식 → 삭제 → 전체 검증" 순서를 지킨다.
