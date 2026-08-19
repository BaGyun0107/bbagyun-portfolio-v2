# Research: 하네스 원클릭 온보딩 부트스트랩 (Phase 1)

**Date**: 2026-07-15 | **Plan**: [plan.md](./plan.md)

## R1. mise의 도구 지원 범위

- **Decision**: 다섯 도구 모두 루트 mise.toml `[tools]`로 선언한다 —
  node(core), bun(core), uv(aqua), pnpm(aqua/npm), gh(aqua).
- **Rationale**: 로컬 `mise registry` 실측(2026-07-15)으로 전부 등재 확인.
  단일 출처(FR-004)와 CI 재사용이 성립한다.
- **Alternatives considered**: Homebrew Brewfile(두 번째 매니저 추가라 기각),
  개별 curl 인스톨러(버전 고정·멱등 관리를 자체 구현해야 해서 기각).

## R2. mise 설치와 셸 활성화 (멱등)

- **Decision**: mise 부재 시 `curl https://mise.run | sh`로 설치하고,
  `~/.zshrc`에 `eval "$(mise activate zsh)"` 라인을 마커 주석과 함께
  grep-후-append 방식으로 1회만 추가한다.
- **Rationale**: 공식 설치 경로이고 Homebrew 의존이 없다. 마커 기반
  grep-후-append가 셸 프로필 중복(엣지 케이스)을 막는다.
- **Alternatives considered**: Homebrew 설치(brew 자체가 또 하나의 수동
  선행 조건이라 기각), PATH 직접 export(mise activate가 셸 통합 표준이라
  기각).

## R3. Xcode CLT / OS 감지

- **Decision**: OS는 `uname -s` == `Darwin`으로만 허용(FR-002). Xcode CLT는
  `xcode-select -p` 성공 여부로 감지하고, 부재 시 `xcode-select --install`
  실행 후 "설치 완료 후 재실행" 안내로 종료한다(엣지 케이스 명세와 일치).
- **Rationale**: 시스템 GUI 설치 창은 스크립트가 완료를 대신할 수 없다.
  종료-후-재실행이 멱등 설계(FR-003/FR-012)와 맞물려 가장 단순하다.
- **Alternatives considered**: 설치 완료 폴링 대기(터미널 점유 + 실패 모드
  증가로 기각).

## R4. Superpowers 자동 설치 (V1)

- **실측/문서 확인 (2026-07-15, code.claude.com/docs)**: 커밋된
  `.claude/settings.json`의 `enabledPlugins`만으로는 자동 설치되지 않는다 —
  Claude Code는 "not installed"로 보고하고 설치 명령을 안내만 한다
  (v2.1.195+). 완전 비대화식 설치는 셸 CLI가 공식 경로다:
  `claude plugin install superpowers@claude-plugins-official`
  (기본 scope: user). 공식 마켓플레이스는 최초 대화식 실행 시 자동
  등록되며, 그 전이라면 `claude plugin marketplace add
  anthropics/claude-plugins-official`로 선등록 가능.
- **Decision**: bootstrap 6단계에서 ① `command -v claude` 확인 → 있으면
  `claude plugin marketplace add`(멱등) 후 `claude plugin install`을
  비대화식 실행, ② claude CLI가 없거나 실패하면 기존 안내문 폴백(FR-010).
  보강으로 프로젝트 `.claude/settings.json`의 `enabledPlugins` 선언을
  유지해 미설치 사용자가 세션에서 설치 명령 안내를 받게 한다.
- **Rationale**: 문서화된 유일한 비대화식 경로이고, 실패해도 안내 폴백으로
  사용자 흐름이 완결된다(US3). claude CLI 설치 자체는 범위 밖(합의 사항)
  이므로 부재 시 안내가 맞다.
- **Alternatives considered**: enabledPlugins 단독(자동 설치 안 됨 —
  문서로 반증), managed-settings.json(레포 커밋이 아닌 MDM 배포 파일이라
  범위 밖).
- **후속**: install.sh의 "비대화형 설치 경로 미지원" 안내문은 현행 문서
  기준으로 낡았다 — 구현 시 함께 갱신한다.

## R5. 패키지 매니저 정책 carve-out (V3)

- **현상 확인 (2026-07-15 실측)**: `.harness/hooks/tool-permission-guard.mjs`의
  `packageManagerFromCommand()`가 Bash 커맨드 문자열 전체에서 `\byarn\b`/
  `\bbun\b`을 매치해 `.harness/config/tool-permissions.json`의
  `package_managers.banned`와 대조한다. 그래서 `rg "bun" file` 같은 검색
  인자, `mise use bun@1` 같은 도구 관리 커맨드까지 차단된다(오탐).
- **Decision**: 부정확한 "문자열 어디든 매칭"을 "커맨드 위치 매칭"으로
  좁힌다 — 단순 커맨드 분리(;, &&, ||, |) 후 각 첫 토큰(래퍼
  `mise exec --`, `corepack` 제거 후)이 banned 매니저일 때만 차단.
  `bun install`과 `mise exec -- bun run x`는 계속 차단되고,
  `mise use bun@1`, `mise install`, `rg "bun"`은 통과한다.
- **Rationale**: guardrails.mjs danger-table이 2026-06-10에 같은 부류의
  오탐(검색 인자/출력 텍스트 매칭)을 per-simple-command 평가로 고친 전례가
  있다(`.claude/rules/references/skill-ownership-enforcement.md`). 앱 패키지
  정책의 목적은 "앱 의존성을 bun/yarn으로 설치하지 못하게"이지 "bun이라는
  문자열 금지"가 아니다.
- **Alternatives considered**: mise 커맨드만 화이트리스트(검색 인자 오탐이
  남아 기각), banned에서 bun 제거(정책 약화라 기각).
- **회귀 테스트**: 차단 유지 케이스(bun install, yarn add,
  mise exec -- bun x)와 통과 케이스(mise use bun@1, rg "bun") 모두
  `tests/tool-permission-guard-carveout.test.mjs`로 고정한다.

## R6. 부트스트랩 진입 형태

- **Decision**: `./harness bootstrap` 서브커맨드(런처 case 추가)로 진입하고,
  본체는 `.harness/scripts/setup/bootstrap.sh`. 기존 install.sh처럼
  `--dry-run` 플래그를 지원한다.
- **Rationale**: 런처가 이미 모든 setup 스크립트의 진입점 컨벤션이다.
  clone 직후 사용자는 레포 안에 있으므로 별도 배포 채널(공개 curl)이
  필요 없다(레포는 private — Phase 2 패키지화에서도 동일 전제).
- **Alternatives considered**: 독립 공개 bootstrap 레포(private 정책과
  충돌·관리 대상 증가로 Phase 1에서는 기각, Phase 2에서 재검토).
