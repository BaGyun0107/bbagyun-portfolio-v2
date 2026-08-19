# Implementation Plan: 최초 프로젝트 설정 단순화

**Branch**: `feature/019-first-setup-simplification` | **Date**: 2026-08-06 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/019-first-setup-simplification/spec.md`

## Summary

단기(US1·US2): init-project 스킬을 신규 프로젝트 기본 경로로 승격하고
`--reset-git` 질문 갭을 계약 테스트와 함께 메운다. 중기(US3): lock 모드의
기존 자가 부트스트랩(런처 + `harness.lock`만으로 첫 수신·materialize)을
활용해, "최소 스켈레톤 생성 → `./harness bootstrap`"으로 최초 생성 경험을
합류자와 통일한다. 스켈레톤 파일 목록은 단일 정본으로 커밋한다.

## Technical Context

**Language/Version**: Bash/POSIX sh(스크립트), Node.js 24(mise), Markdown

**Primary Dependencies**: 기존 lock 모드 기계장치(`harness` 런처 자가
부트스트랩, `pkg-sync`, 버전 캐시), `gh` CLI(repo 생성 — 기존 init-project
경로 재사용)

**Storage**: N/A (커밋 파일 — 스켈레톤 정본 목록, 스킬 문서, README)

**Testing**: `npm test`(node --test), 스킬 계약 테스트(질문 목록·정본 CLI
호출 검사), 스켈레톤 구성 테스트(잔재 0건·필수 파일 존재)

**Target Platform**: macOS 개발 머신(2인 팀), GitHub

**Project Type**: 하네스 인프라 (스킬 문서 + 설치 스크립트 + 문서)

**Performance Goals**: N/A

**Constraints**: AI는 PR 머지 금지. 구현 착수는 018 머지 후(FR-009) —
그 전에는 specs/019 산출물만 커밋. GitHub Secrets는 Infisical 클라이언트
2종만 허용 → 교차-repo 발행 토큰이 필요한 설계는 피한다.

**Scale/Scope**: 스킬 1종 + 참조 문서, README 시나리오 A, 신규 스크립트
1개(스켈레톤 생성), 테스트 2~3파일. 신규 프로젝트 ~20개 규모 팀.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Dual-Runtime Parity**: PASS — 스킬은 `.harness/skills/init-project`
  단일 소스로 양 런타임에 머지 트리로 배포됨. 신규 스크립트는 런처 경유로
  런타임 중립.
- **II. Policy as Source of Truth**: PASS — 초기화 로직 정본은 CLI 스크립트
  하나(FR-003), 스켈레톤 파일 목록도 단일 정본. 문서는 안내만.
- **III. Test-First**: PASS — 스킬 질문 계약·스켈레톤 구성 테스트를 구현
  전 작성(RED)해 FR-008 이행.
- **IV. Human Gates**: PASS — clarify 1문항 완료(스켈레톤 형태 B),
  tasks.md 리뷰에서 일시정지 예정. 파괴적 작업 없음.
- **V. Upgrade Resilience**: PASS — 스켈레톤은 lock 채널로 버전을 추종하며
  floating 소스를 만들지 않음. 업스트림 소유 디렉터리 수정은 본 레포(하네스
  업스트림)에서만 발생.

Post-design 재점검(Phase 1 완료 후): 위반 없음, Complexity Tracking 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/019-first-setup-simplification/
├── spec.md
├── plan.md              # 이 문서
├── research.md          # Phase 0 결정 기록
├── quickstart.md        # 검증 시나리오
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks 출력
```

data-model.md, contracts/: 생략 — 데이터 엔티티·외부 계약 없는 인프라 작업.

### Source Code (repository root)

```text
.harness/skills/init-project/     # SKILL.md 질문 계약 + references/flow.md
.harness/scripts/setup/           # new-project-skeleton.sh (신규), init-project.sh
.harness/scripts/setup/upstream-project-state.mjs  # 분류 정본 (재사용)
.harness/docs/packaging-guide.md  # 스켈레톤 경로 문서화
README.md                         # 시나리오 A 재안내
tests/                            # init-project-skill-contract.test.mjs,
                                  # new-project-skeleton.test.mjs (신규)
```

**Structure Decision**: 기존 구조 유지, 신규 디렉터리 없음. 별도 시작점
저장소는 만들지 않는다(research R2) — 스켈레톤은 생성 스크립트가 만들고,
파일 목록 정본은 본 레포에 커밋된다.

## Complexity Tracking

위반 없음 — 해당 없음.
