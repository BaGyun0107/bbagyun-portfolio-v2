# Implementation Plan: 하네스 정보구조·기능 추적성·사용자 흐름 정본화

**Branch**: `009-harness-information-architecture` | **Date**: 2026-07-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-harness-information-architecture/spec.md`

## Summary

현재 허브 화면 17개 node, Spec Kit 기능 001~009의 need/screen/spec/dependency/
verification 관계 64개, 온보딩·기능 전달·하네스 배포 flow 3개를 사람 소유
JSON으로 정본화한다. 기존 007/008의 schema, scanner, linked model과 renderer를
변경하지 않고 focused canonical-data test로 coverage와 health를 고정한다.

## Technical Context

**Language/Version**: Node.js 24, ECMAScript modules, JSON, Markdown/YAML

**Primary Dependencies**: Node.js 내장 모듈과 기존 하네스 scanner/model; 신규 의존성 없음

**Storage**: 사람이 소유한 `data/*.json`, Spec Kit Markdown/YAML, 생성된 단일 HTML

**Testing**: `node:test`, 전체 `tests/*.test.mjs`, rule lifecycle check, `mise run docs:build`, Chromium 수동 검증

**Target Platform**: 로컬 Node.js CLI와 최신 Chromium 계열 브라우저

**Project Type**: 하네스 내부 정적 문서 생성기용 canonical data

**Performance Goals**: 기존 500 feature/100 screen/50 flow 2초 build 기준을 회귀시키지 않음

**Constraints**: 외부 런타임 의존성 0, fail-open, builder의 `data/` 쓰기 금지, renderer/scanner/schema 변경 금지, 기존 007 contract/fixture 보존

**Scale/Scope**: surface 3개, screen node 17개, feature/need/spec 9개씩, typed relation 64개, user flow 3개

## Constitution Check

`.specify/memory/constitution.md`는 미치환 템플릿으로 ratified 원칙이 없다.
따라서 저장소 `AGENTS.md`, `.harness/policies/scenario-phase-routing.md`,
`.harness/policies/guardrails.md`와 승인된 설계를 적용한다.

- PASS: Large 작업의 durable state를 구현 전에 `specs/009-*`에 기록한다.
- PASS: 명세→명확화→계획→태스크→분석 후 TDD Red→Green으로 실행한다.
- PASS: 기존 미완료 004를 보존하고 사용자의 009 전환을 `research.md`에 기록한다.
- PASS: 사람이 소유한 `data/`는 명시적 구현 단계에서만 편집하며 builder는 쓰지 않는다.
- PASS: renderer, scanner, schema와 기존 007 contract/fixture를 변경하지 않는다.
- PASS: 현재 정상 checkout의 승인된 미커밋 007/008 변경에 의존하므로 별도 worktree를 만들지 않는다.
- PASS: 인라인 실행 선택에 따라 서브에이전트를 사용하지 않는다.
- PASS: 커밋·PR·merge는 별도 승인 전 수행하지 않는다.

## Project Structure

### Documentation (this feature)

```text
specs/009-harness-information-architecture/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── canonical-data-contract.md
├── checklists/
│   └── requirements.md
├── tasks.md
├── status.yaml
└── verification.md
```

### Source Code (repository root)

```text
data/
├── sitemap.json                 # 실제 허브 화면 계층 17개 node
├── feature-relations.json       # need 9개와 typed relation 64개
└── user-flows.json              # 목표 flow 3개

tests/
└── feature-hub-canonical-data.test.mjs

docs/
└── index.html                   # mise run docs:build 생성물

ROADMAP.md                       # 얇은 cross-feature overview
```

**Structure Decision**: 기존 하네스 내부 JSON 계약과 scanner/model/render 파이프라인을
그대로 사용한다. 실제 사람 소유 data와 이를 검증하는 단일 focused test만 추가하고,
구현 근거와 수동 검증은 009 Spec Kit 디렉터리에 둔다.

## Implementation Phases

1. **Plan of record**: 009 spec/research/model/contract/tasks/status/verification을 확정한다.
2. **Sitemap Red→Green**: 실제 17개 node와 샘플 격리를 먼저 실패 테스트로 고정한다.
3. **Relations Red→Green**: 9개 기능 coverage, 64개 evidence link와 health 0을 고정한다.
4. **Flows Red→Green**: 세 flow의 의미·연결·acyclic health를 고정한다.
5. **Automated verification**: focused/전체/rule/build 결과를 verification에 기록한다.
6. **Human-facing verification**: desktop/keyboard/mobile/source inspection과 converge를 기록하고 상태를 동기화한다.

## Test Strategy

- 테스트는 실제 repository root를 읽어 사람이 소유한 정본의 회귀를 탐지한다.
- 각 data slice는 테스트를 먼저 추가하고 현재 상태에서 실패를 직접 확인한 뒤
  최소 JSON 변경으로 green을 만든다.
- sitemap은 exact surface/node 순서와 sample 격리를 검증한다.
- relation은 scan 결과와 linked model을 결합해 기능·need·screen·spec coverage,
  status dependency parity, evidence 및 health 0을 검증한다.
- flow는 actor/goal, start/decision/end, stable reference, broken next/cycle 0과
  세 목표 ID를 검증한다.
- 최종으로 전체 Node suite, rule check, docs build와 Chromium을 수행한다.

## Data Ownership and Fail-open

`data/sitemap.json`, `data/feature-relations.json`, `data/user-flows.json`은 사람이
검토하는 primary input이다. 생성기는 이를 읽어 projection을 만들 뿐 자동으로
수정하거나 오류를 보정해 쓰지 않는다. 전체 JSON 오류는 해당 source만 비활성화하고,
개별 link/edge 오류는 유효 항목을 보존한다. 오류 규칙은 기존 007/008 테스트가
계속 소유한다.

## Post-design Constitution Re-check

PASS. 새 외부 인터페이스나 schema가 없고, 승인된 범위는 실제 canonical data와
검증 기록으로 제한된다. inferred relation은 정본에 포함되지만 label/evidence로
재검토 상태를 잃지 않는다. 구현 완료 전 `speckit-converge`, 기능 상태 동기화와
ROADMAP 갱신을 수행한다.

## Complexity Tracking

위반 없음.
