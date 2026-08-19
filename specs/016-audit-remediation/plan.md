# Implementation Plan: 감사 발견 일괄 수정 (1차)

**Branch**: `fix/016-audit-remediation` | **Date**: 2026-07-31 | **Spec**: [spec.md](spec.md)

**Input**: `specs/016-audit-remediation/spec.md` + 감사 보고서
`docs/audits/2026-07-31-full-harness-audit.md` (항목별 근거·권고의 정본)

## Summary

2026-07-31 전수 감사에서 검증된 34건 중 소유자 결정이 불필요한 19개 항목을 수정한다.
핵심 축은 (1) H-1+H-7 — `.harness/docs` 소실 방지와 무효 드리프트 가드의 정확 일치
양방향 교체를 한 묶음으로, (2) 문서 서술 부채 일괄 정정, (3) 픽스처 공통 기반 추출로
temp 누수·gpgsign 미격리 동시 해소, (4) 배포 표면·카탈로그 실재화.

## Technical Context

**Language/Version**: Node.js 24 (mise 고정) + POSIX sh 스크립트

**Primary Dependencies**: 없음(내장 모듈만) — 하네스 자체 스크립트 수정

**Storage**: 파일 시스템 (git 인덱스, `.harness/state`, 시스템 temp)

**Testing**: `node --test tests/*.test.mjs` (`npm test`), `./harness doctor`

**Target Platform**: macOS/Linux (다운스트림 팀원 머신 + GitHub Actions)

**Project Type**: CLI/스크립트 하네스 (단일 저장소)

**Performance Goals**: 해당 없음 (테스트 총 시간 비악화만 확인)

**Constraints**: 다운스트림 하위 호환 — 기존 6개 레포의 lock 모드 동작을 깨지 않는다.
오삭제보다 잔재(보수적 판정 우선). 팀원 머신에서 인덱스 불변.

**Scale/Scope**: 19개 감사 항목, 스크립트 ~8개·문서 ~7개·테스트 ~6개 파일

## Constitution Check

`.specify/memory/constitution.md` 게이트 통과: 파괴적 작업 없음(temp 삭제는 범위 밖
D-6), 인덱스 변경은 업스트림 자신의 커밋뿐, TDD 적용(동작 변경 항목 회귀 테스트 선행),
문서 언어 규칙 준수(AI-read 파일 영어 산문 유지 — M-7 자체는 범위 밖이나 새로 추가하는
산문은 규칙을 따른다).

## Project Structure

### Documentation (this feature)

```text
specs/016-audit-remediation/
├── spec.md
├── plan.md              # 이 파일
├── research.md          # 항목별 접근 결정 (R1~R7)
├── quickstart.md        # 검증 시나리오 (V1~V5)
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks 산출
```

data-model.md / contracts/ 생략 — 신규 데이터 엔티티·외부 인터페이스 없음
(기존 잔재 분류 모델은 specs/015 data-model.md 가 정본).

### Source Code (repository root)

```text
.harness/scripts/pkg/materialize.sh        # H-1 링크 루프
.harness/scripts/pkg/release-check.sh      # 1-5
.harness/scripts/pkg/pkg-sync.sh           # M-10 안내 문구
.harness/scripts/setup/upstream-project-state.mjs  # H-1 목록, M-5 판정
.harness/scripts/setup/prune-downstream.mjs        # M-5 적용부(필요시)
.harness/scripts/setup/project-owned.mjs   # H-3 주석
.harness/scripts/setup/bootstrap.sh        # L-5 주석
.harness/scripts/checks/ci-node-verify.sh  # M-6
.harness/config/required-gitignore.json    # H-1, H-2(description)
.harness/config/codi-config.yaml           # 1-4
.harness/manifest.json                     # 1-4
.harness/policies/update-policy.md         # H-2, H-3 각주
.harness/docs/{project-init-guide,update-guide}.md  # H-4
README.md / CONTRIBUTING.md / ROADMAP.md   # H-4, M-8, M-9, M-18, M-20
harness                                    # M-10 안내 문구
docs/audits/tools/skill-usage.mjs          # M-21
tests/init-project-flows.sh                # 1-3 이동 대상
tests/helpers/fixture-base.mjs             # H-6/M-17/L-9 신규
tests/helpers/{pkg-fixture,downstream-fixture}.mjs # 공통 기반 사용으로 개편
tests/prune-downstream-project-state.test.mjs      # H-7 가드 교체, M-5 회귀
mise.toml                                  # 1-3 태스크
```

**Structure Decision**: 기존 단일 저장소 구조 유지, 신규 파일은
`tests/helpers/fixture-base.mjs` 와 이동되는 `tests/init-project-flows.sh` 뿐.

## Complexity Tracking

위반 없음.
