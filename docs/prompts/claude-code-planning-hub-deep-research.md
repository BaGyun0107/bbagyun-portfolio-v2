# Claude Code 실행 프롬프트: Planning Hub 구조 개선 심층 조사

> **이력 문서 (2026-07-16 시점)** — 이 프롬프트는
> `docs/audits/2026-07-17-planning-hub-deep-research.md` 감사의 입력
> 기록이다. 여기 서술된 구조는 이후 specs/010~012에서 크게 바뀌었으므로
> 현재 구조의 근거로 인용하지 마라. 현행 정본은
> `docs/feature-definition-planning-hub-guide.md`와 `codi-feature-hub`
> 스킬이다.

아래 작업을 **심층 조사(Deep Research) 모드**로 수행하라. 이 요청의 목적은 지금 구현 중인 Planning Hub를 바로 수정하는 것이 아니라, 현재 구조가 PM/PL·개발자·AI에게 실제로 이해 가능하고 운영 가능한지 근거를 들어 진단하고 다음 구현 순서를 결정하는 것이다.

## Goal

`codi-harness-v2`의 현재 Planning Hub, 문서 허브, 사이트맵, 기능정의, 기능현황, 사용자 흐름, 추적성, 동기화 구조를 코드·스키마·테스트·생성 화면과 외부 전문 자료를 함께 조사하라.

조사 결과로 다음 질문에 답하라.

1. 지금 만든 화면과 데이터 구조는 각각 **무엇을 표현하는 도구인지** 처음 보는 PM/PL·개발자·AI가 구분할 수 있는가?
2. 기능정의만 읽고 사람이 “어디에 무엇을 왜 만들고, 어떤 조건에서 완료인지” 판단할 수 있는가?
3. `FeatureDefinition 1:N FeatureWorkItem` 모델이 기능정의와 구현 현황을 올바르게 분리하면서도 함께 탐색하게 하는가?
4. 화면 구조, 기능정의, 기능현황, 사용자 흐름, 추적성이 같은 stable ID를 통해 자연스럽게 왕복되는가?
5. 사이트맵은 screen-only 정보구조와 화면 간 직접 이동을 명확히 보여주는가? 조직도, 계층 목록, 비교표가 같은 의미를 일관되게 전달하는가?
6. 기능현황의 기본 표현으로 선택 기능 중심 작업 Kanban이 적합한가? 더 나은 기본안 또는 보조안은 무엇인가?
7. 사용자 흐름은 정상 경로와 결정·실패·복구 분기를 사람이 빠르게 파악할 수 있게 표현하는가?
8. 추적성은 기능이 수백 개로 늘어도 coverage, gap queue, 선택 항목의 local neighborhood를 통해 행동 가능한 정보를 제공하는가?
9. top-down planning intent와 bottom-up delivery evidence가 원본 소유권을 침범하지 않고 지속적으로 동기화되는가?
10. 향후 별도 `planning-hub` 저장소에서 계획 패키지를 발행하고 다운스트림 프로젝트가 수신하는 구조로 안전하게 분리할 수 있는가?
11. Claude Code·Codex·사람의 직접 편집이 hook, 명시적 sync, CI check를 통해 같은 결정론적 결과로 수렴하는가?
12. 현재 설계에서 유지할 것, 단순화할 것, 제거할 것, 새로 추가할 것은 무엇인가?

## Context

저장소 루트는 다음과 같다.

```text
/Users/codiworks_dev/Desktop/codi-harness-v2
```

먼저 저장소의 `AGENTS.md`와 관련 정책·스킬을 읽고 따른다. 특히 다음을 확인한다.

```text
AGENTS.md
.harness/prompt-style/karpathy.md
.harness/policies/context-engineering.md
.harness/policies/scenario-phase-routing.md
.harness/policies/agent-routing.md
.harness/workflow.md
.harness/skills/codi-feature-hub/SKILL.md
.harness/skills/codi-feature-definition-normalizer/SKILL.md
```

현재 작업의 계획 원본은 `specs/010-planning-hub-redesign/`이다. 최소한 다음 파일은 전부 읽는다.

```text
specs/010-planning-hub-redesign/spec.md
specs/010-planning-hub-redesign/plan.md
specs/010-planning-hub-redesign/tasks.md
specs/010-planning-hub-redesign/research.md
specs/010-planning-hub-redesign/data-model.md
specs/010-planning-hub-redesign/quickstart.md
specs/010-planning-hub-redesign/verification.md
specs/010-planning-hub-redesign/contracts/
docs/planning-hub-handoff.md
docs/superpowers/specs/2026-07-16-planning-hub-demo-sync-redesign.md
docs/superpowers/specs/2026-07-16-planning-hub-feature-workbench-redesign.md
docs/superpowers/specs/2026-07-16-docs-planning-page-separation-design.md
```

실제 계약과 구현을 확인하기 위해 다음 영역을 조사한다.

```text
.harness/config/*schema.json
.harness/scripts/docs/build-hub.mjs
.harness/scripts/docs/planning-*.mjs
.harness/scripts/docs/lib/*.mjs
.harness/scripts/docs/templates/hub.css
.harness/hooks/docs-build-on-stop.mjs
.harness/hooks/codex-stop.mjs
data/
examples/community-app/
tests/planning-*.test.mjs
tests/feature-hub-*.test.mjs
docs/index.html
docs/planning.html
mise.toml
package.json
```

첨부 예시 사이트맵과 현재 조직도 표현을 비교할 때 다음 이미지도 확인한다.

```text
social-media-app-sitemap.png
```

필요하면 생성 명령을 **no-write 또는 안전한 검증 목적**으로 실행해도 된다. 생성 HTML은 원본이 아니므로 직접 편집하지 않는다.

## Current decisions to validate, not blindly accept

아래는 현재 승인된 방향이다. 결론으로 전제하지 말고, 구현·사용성·전문 자료에 비추어 각각 `유지 / 조건부 유지 / 변경 / 제거`로 판정하라.

1. 문서 허브와 Planning Hub는 별도 HTML로 생성한다.
2. Planning Hub의 일상 제품 보기는 `개요 · 화면 구조 · 기능 정의 · 기능 현황 · 사용자 흐름 · 추적성`의 정확한 여섯 개다.
3. package version/digest, sync, automation은 `운영·고급` disclosure에 둔다.
4. Delivery Evidence는 독립 일상 탭이 아니라 개요와 기능 현황의 근거로 흡수한다.
5. 사이트맵에는 screen만 넣고 기능·Spec·task·test·evidence는 넣지 않는다.
6. 사이트맵의 hierarchy와 direct navigation은 서로 다른 관계다.
7. 조직도, `계층 목록(접근성 보기)`, 비교표는 같은 screen ID 집합을 표현한다.
8. 기능 정의의 기본 탐색 축은 `Surface → Screen → 기능 그룹 → FeatureDefinition`이다.
9. 기능 검색은 이름뿐 아니라 사용자 목표, 화면, 기능 그룹을 지원한다.
10. planning-owned `FeatureDefinition` 하나에 project-owned `FeatureWorkItem` 여러 개가 연결된다.
11. Release는 FeatureWorkItem의 속성·필터이며 FeatureDefinition에 downstream 저장소 위치를 넣지 않는다.
12. 기능 현황의 기본은 선택 기능 컨텍스트의 4열 작업 Kanban이고, 기능별 계층 보기는 같은 작업 집합의 대안 표현이다.
13. 사용자 흐름은 actor와 goal 중심 story로 표현하고 정상 경로에 결정·실패·복구를 연결한다.
14. 추적성 기본 화면은 전체 matrix가 아니라 coverage, gap queue, bounded local neighborhood다. matrix/CSV는 보조다.
15. planning package는 immutable version/digest로 명시적 수신하며 downstream Spec·task·work item을 자동 덮어쓰지 않는다.
16. bottom-up 차이는 planning 원본을 수정하지 않고 근거가 포함된 Change Proposal로 만든다.
17. Claude/Codex Stop hook은 빠른 피드백용이며, 사람 편집까지 포함한 최종 보장은 명시적 sync/check와 CI가 담당한다.

현재 문서·스킬·계약·구현 사이에 위 결정과 다른 오래된 표현이 있으면 **문서 드리프트**로 분류하고 정확한 파일과 줄을 제시하라. 예를 들어 “여덟 개 보기”와 “여섯 제품 보기 + 운영·고급”이 공존하는지 반드시 확인한다.

## Research method

조사는 다음 세 층을 분리해 진행한다.

### 1. Repository evidence

- 계획 문서에 적힌 의도와 실제 schema/model/renderer/test가 일치하는지 추적한다.
- “계획됨”, “부분 구현”, “구현 완료”, “테스트됨”, “브라우저 검증됨”을 구분한다.
- 체크박스만 믿지 말고 코드와 테스트를 대조한다.
- 생성 HTML만 보고 원본이라고 판단하지 않는다.
- 모든 저장소 근거는 가능한 한 `상대경로:줄번호` 형식으로 인용한다.
- 서로 충돌하는 근거는 한쪽을 임의로 선택하지 말고 충돌 자체를 기록한다.

### 2. External deep research

WebSearch/WebFetch 또는 Claude Code에서 사용할 수 있는 심층 조사 도구로 외부 자료를 조사한다. 다음 주제를 포함한다.

- PM/PL의 제품 구조 문서 흐름: product goal, user journey, information architecture/sitemap, feature definition, acceptance criteria, delivery tracking, traceability의 생성 순서와 반복 관계
- 기능정의서가 사람과 AI 모두에게 구현 가능한 명세가 되기 위한 최소 정보
- sitemap/information architecture와 user flow/service blueprint/process model의 역할 차이
- Kanban의 work item, WIP, 상태 정책, blocked/verification 표현 원칙
- 요구사항 추적성의 목적과 대규모 matrix/graph의 인지 부담을 줄이는 방법
- progressive disclosure, overview-detail, faceted search, information scent, recognition over recall
- 정적 HTML에서의 접근성, 키보드 탐색, reflow, reduced motion, 색상 비의존 표현
- 계획 원본과 구현 근거를 분리한 immutable artifact, provenance, digest, pull/reconciliation 패턴
- multi-repository에서 source of truth, generated projection, change proposal, CI convergence를 운영하는 방식
- LLM/agent가 schema 기반 문서를 생성·갱신할 때 provenance, unknown, confidence, validation을 보존하는 방법

출처 우선순위는 다음과 같다.

1. 국제 표준·공식 규격·정부 또는 공공기관 디자인 시스템
2. W3C/WAI, ISO/IEC/IEEE 관련 자료, 공식 도구 문서
3. 동료 심사 논문, 학회, 대학 연구
4. 해당 방법론의 공식 가이드
5. 신뢰할 수 있는 실무 기관의 원문

검색 결과 요약, 무출처 블로그, SEO 글을 핵심 근거로 사용하지 않는다. 2차 자료를 사용할 때는 원문을 찾고, 찾지 못하면 한계를 명시한다. 모든 핵심 주장은 바로 뒤에 실제 URL과 문서 제목을 붙인다. 접근일은 `2026-07-17`로 기록한다. 인용문은 최소화하고 대부분 정확히 요약한다.

### 3. Synthesis

외부 모범 사례를 그대로 복사하지 말고 다음 제약에 맞게 판단한다.

- 현재 구현은 Node.js 24 ESM 기반의 dependency-free 정적 HTML 생성기다.
- 데이터베이스와 상시 실행 서버를 필수로 두지 않는다.
- `file://`에서도 읽을 수 있어야 한다.
- planning intent와 delivery evidence는 소유자가 다르며 projection 중 원본을 쓰지 않는다.
- preview는 fail-open, merge-ready check/CI는 fail-closed가 기본이다.
- 기능 수 500개, work item 2,000개, screen 100개, flow 50개의 기준을 고려한다.
- 사람의 이해 가능성, AI의 구조적 생성 가능성, 운영 복잡도를 함께 평가한다.

## Mandatory comparisons

각 비교는 최소 3개 대안을 표로 제시하고, 장점·단점·인지 비용·확장성·접근성·데이터 계약 영향·현재 구조에서의 구현 비용을 평가한다.

1. 사이트맵: 가로 조직도 / 자유 그래프 / 계층 트리·표
2. 기능 정의 탐색: 배치 중심 / 기능 목록 중심 / 문서 목차 중심
3. 기능 현황: 선택 기능 작업 Kanban / 전체 작업 Kanban / 기능별 계층·목록
4. 사용자 흐름: goal story / swimlane / BPMN·전통 flowchart
5. 추적성: coverage+gap+local neighborhood / 전체 matrix / 전체 graph
6. 계획 전달: immutable manifest+explicit pull / Git 기반 파일 복사·subtree / 원격 API 또는 중앙 서비스

“현재안이 이미 있으므로 유지”를 근거로 삼지 않는다. 대안 비교 후 현재안이 가장 적절하면 이유와 적용 조건을 제시한다.

## Evaluation scorecard

다음 항목을 각각 10점 만점으로 평가한다. 점수마다 저장소 근거와 외부 판단 기준을 붙인다.

1. 목적과 용어의 명확성
2. 첫 화면의 정보 위계
3. 화면·기능 배치 탐색성
4. 기능정의의 구현 가능성
5. FeatureDefinition 1:N FeatureWorkItem 모델 적합성
6. 기능현황의 행동 가능성
7. 사용자 흐름의 이해 가능성
8. 대규모 추적성의 사용성
9. source of truth와 provenance 명확성
10. top-down/bottom-up 조정 안전성
11. Claude/Codex/사람 자동화 동등성
12. 접근성 및 반응형 설계
13. 정적 생성 성능과 bounded rendering
14. 향후 planning-hub 분리 가능성
15. 문서·스키마·코드·테스트 일관성

점수는 장식이 아니다. `현재 점수`, `목표 점수`, `목표에 도달하기 위한 구체적 조건`을 함께 쓴다.

## Constraints

- 이번 작업은 **읽기·분석·보고서 작성만** 수행한다.
- 구현 코드, schema, source data, test, hook, generated HTML을 수정하지 않는다.
- `docs/index.html`과 `docs/planning.html`을 직접 편집하지 않는다.
- 새 의사결정을 승인된 사실처럼 spec에 반영하지 않는다.
- `ROADMAP.md`, `CHANGELOG.md`, 기존 audit, 기존 spec/task 체크박스를 수정하지 않는다.
- 기존 dirty worktree의 변경을 되돌리거나 정리하거나 덮어쓰지 않는다.
- destructive command, commit, push, PR 생성, 외부 저장소 쓰기를 하지 않는다.
- 테스트나 빌드를 실행했다면 명령, exit code, 핵심 결과를 보고서에 기록한다.
- 외부 조사를 할 수 없으면 그 사실과 영향 범위를 명시하고 출처를 만들어내지 않는다.
- 불확실한 사실은 `확인됨 / 추론 / 가설 / 미확인`으로 구분한다.
- 개선안은 근거 없는 전면 재작성보다 현재 계약을 보존하는 최소 변경부터 제시한다.

허용되는 유일한 파일 변경은 아래 최종 보고서의 신규 작성 또는 갱신이다.

```text
docs/audits/2026-07-17-planning-hub-deep-research.md
```

## Required report structure

보고서는 한국어로 작성하고, 다음 구조를 정확히 따른다.

```text
# Planning Hub 구조 개선 심층 조사

## 1. Executive Summary
## 2. 조사 범위와 방법
## 3. 현재 시스템은 정확히 무엇인가
## 4. Source of Truth와 생성물 지도
## 5. 구현 현황: 계획됨 / 부분 구현 / 완료 / 검증됨
## 6. PM/PL 표준 산출물 흐름 조사
## 7. 기능정의서의 최소 구현 정보
## 8. 현재 정보구조와 화면 사용성 평가
## 9. 사이트맵 표현 방식 비교
## 10. 기능 정의 탐색 방식 비교
## 11. 기능 현황 표현 방식 비교
## 12. 사용자 흐름 표현 방식 비교
## 13. 대규모 추적성 표현 방식 비교
## 14. Top-down / Bottom-up / Planning Hub 분리 아키텍처
## 15. Claude / Codex / 사람 편집 자동화와 수렴성
## 16. 승인된 17개 결정 검증
## 17. 15개 항목 Scorecard
## 18. 발견 사항과 위험: P0 / P1 / P2 / P3
## 19. 권장 목표 정보구조와 사용자 여정
## 20. 권장 데이터·계약 변경
## 21. 단계별 개선 Backlog
## 22. 유지 / 단순화 / 제거 / 추가 표
## 23. 열린 질문과 사용자 승인 필요 결정
## 24. 검증 명령과 결과
## 25. Source Index
```

## Finding format

각 발견 사항은 다음 형식으로 쓴다.

```text
### [P0|P1|P2|P3] 발견 제목

- 상태: 확인됨 | 추론 | 가설 | 미확인
- 사용자 영향:
- 저장소 근거: `path/to/file:line`
- 외부 근거: [문서 제목](https://...)
- 원인:
- 권장 조치:
- 수용 기준:
- 변경 영향: UI | schema | data | renderer | automation | docs | test
- 예상 난이도: S | M | L
- 선행 조건:
```

우선순위 의미는 다음과 같다.

- `P0`: 데이터 손상, 잘못된 source of truth, 자동 덮어쓰기, 핵심 계약 위반
- `P1`: 사용자가 핵심 업무를 잘못 이해하거나 수행하지 못함
- `P2`: 확장성, 접근성, 운영성, 일관성의 중요한 저하
- `P3`: 품질 향상 또는 후속 최적화

## Done When

다음 조건을 모두 만족하면 조사가 끝난다.

1. 지정한 저장소 파일과 현재 미완료 작업을 확인했다.
2. 계획 문서와 실제 schema/model/renderer/test/generated page 사이의 drift를 찾았다.
3. PM/PL 산출물 흐름과 각 화면 표현 방식에 대해 권위 있는 외부 근거를 조사했다.
4. 모든 핵심 주장에 저장소 인용 또는 외부 링크가 붙었다.
5. 여섯 가지 mandatory comparison과 15개 scorecard가 완성됐다.
6. 승인된 17개 결정을 각각 `유지 / 조건부 유지 / 변경 / 제거`로 판정했다.
7. 구현 여부와 브라우저 검증 여부를 과장하지 않았다.
8. 개선 항목을 P0~P3 및 `Now / Next / Later` 순서로 나눴다.
9. 각 `Now` 항목에는 파일 영향 범위와 측정 가능한 수용 기준이 있다.
10. 향후 별도 `planning-hub` 저장소로 분리할 때 유지해야 할 계약과 금지해야 할 자동 쓰기를 명시했다.
11. 결과를 `docs/audits/2026-07-17-planning-hub-deep-research.md`에 기록했다.
12. 코드나 생성 HTML을 수정하지 않았음을 `git diff --name-only`로 확인했다.

완료 후 채팅에는 다음만 간결하게 보고하라.

- 보고서 경로
- 가장 중요한 P0/P1 발견 3~5개
- 현재 구조의 종합 판정
- 다음 구현 전에 사용자 승인이 필요한 결정
- 조사 중 실행한 검증 명령과 실패 여부

보고서를 작성한 뒤에는 구현을 시작하지 말고 사용자 승인을 기다려라.
