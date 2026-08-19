# Research: 하네스 패키지화 (Phase 2)

**Date**: 2026-07-15 | **Plan**: [plan.md](./plan.md)

## R1. lock 파일 형식과 위치

- **Decision**: 루트 `harness.lock` (JSON). `{ "channel": "latest-minor" }`
  또는 `{ "version": "1.4.0" }` 중 하나. 기존 `.harness/lock.json`(외부 도구
  정책: gstack/speckit/superpowers)과는 관심사가 달라 별개 파일로 분리한다.
- **Rationale**: 하나의 파일이 "하네스 자신"과 "외부 도구"를 함께 다루면
  Phase 3에서 구 동기화 흐름을 은퇴시킬 때 분리 수술이 필요해진다. mjs
  파서(JSON.parse) 재사용도 단순해진다.
- **Alternatives considered**: `.harness/lock.json`에 필드 추가(위 이유로
  기각), 단순 텍스트 한 줄(채널/버전 두 형태와 향후 필드 확장에 취약해 기각).

## R2. 버전 발견·수신 (캐시)

- **Decision**: 버전 발견은 `git ls-remote --tags <repo> "v*"`(기존 git
  인증 재사용), 수신은 `git clone --depth 1 --branch vX.Y.Z`를
  `versions/<ver>.partial`에 받은 뒤 `mv`로 `versions/<ver>` 확정(완료
  마커 = 최종 디렉토리 존재). 동시 수신은 `mkdir` 기반 lockdir로 직렬화.
  캐시 루트는 `~/.codi-harness`, 테스트는 `CODI_HARNESS_CACHE_DIR`로 격리.
- **Rationale**: private 레포에 추가 인증 없이 동작(Phase 1 결정 계승).
  partial→mv 패턴이 "불완전 수신이 정식 버전으로 보이는" 상태를 배제한다.
- **Alternatives considered**: GitHub Release tarball(gh 인증 의존 추가·API
  레이트리밋, 기각), npm/GitHub Packages(토큰 온보딩 고통 재도입, 기각).

## R3. materialize 구조와 원자적 flip

- **Decision**: 레포에는 버전 무관 간접 지점 하나를 둔다 —
  `.harness/current` 심링크가 캐시의 `versions/<ver>`를 가리키고,
  `.claude/rules` 등 materialize 대상은 `.harness/current/...`를 가리키는
  고정 심링크로 만든다. 버전 전환 = `ln -sfn`으로 `.harness/current` 하나를
  바꾸는 원자적 1회 연산(FR-010). `settings.json`류 "생성 파일"은 심링크가
  아니라 템플릿에서 생성하되 훅 경로가 `.harness/current/hooks/...`를
  참조하게 해 재생성 없이 버전이 바뀌게 한다.
- **Rationale**: 파일별 재링크(수십 개)를 전환 시마다 하는 대신 간접 지점
  하나만 바꾸면 부분 적용 상태가 원천적으로 불가능하다. 기존
  `skills-link.sh`의 심링크-트리 경험을 그대로 확장한다.
- **Alternatives considered**: 대상별 직접 재링크(전환 중 실패 시 혼합 버전
  트리 발생, 기각), 복사 배치(디스크 중복·전환 원자성 상실, 기각).

## R4. rules/skills 심링크 자동 로드 (V2)

- **문서 확인 (2026-07-15, code.claude.com/docs — memory/skills/permissions)**:
  레포 밖 대상을 가리키는 심링크는 세 경로 모두 **공식 문서화된 지원**이다.
  - `.claude/rules/`: 개별 파일 심링크와 심링크된 하위 디렉토리 모두 문서
    예시 존재(`ln -s ~/shared-claude-rules .claude/rules/shared`). 재귀
    발견되며 순환 심링크도 처리됨. `paths:` 없는 룰은 시작 시 무조건 로드.
  - `.claude/skills/<name>`: "elsewhere on disk" 대상 심링크를 따라
    SKILL.md를 읽는다고 명시. 현 레포의 skills-link 방식의 확장형.
  - CLAUDE.md: 심링크·@import 모두 문서화. 외부 @import는 최초 1회 승인
    다이얼로그가 있으므로 심링크/커밋 실파일이 낫다.
- **Decision**: 실파일 복사 폴백 불필요. materialize는 문서화된 형태만
  사용한다 — ① 공유 룰은 `.claude/rules/shared` **하위 디렉토리 심링크**
  하나(`.harness/current/…` 경유)로, 프로젝트 소유 룰은 실파일로 공존.
  ② 스킬은 기존처럼 스킬 디렉토리 단위 심링크. ③ CLAUDE.md는 얇은 커밋
  실파일 유지. `.claude/rules`·`.claude/skills` **전체**를 심링크로 만드는
  형태는 문서 밖이므로 쓰지 않는다.
- **제약 (설계 반영)**: 캐시 디렉토리(`~/.codi-harness/**`)를 덮는 deny
  권한 규칙을 추가하면 도구 경로 읽기가 막히므로 금지 — guardrails 문서에
  명시할 것. 시작 시 무조건 로드 룰만 쓰므로 v2.1.198 symlinked-checkout
  경고는 비해당.
- **실측 계획**: 문서 근거가 명시적이므로 별도 사전 실측은 생략하고,
  quickstart 시나리오 5(기능 동등성)가 구현 검증 단계에서 헤드리스 실행으로
  최종 확인한다 (SC-005).

## R5. "세션 시작 시점 반영"의 구현 지점

- **Decision**: 두 지점으로 나눈다. ① SessionStart 훅의
  `update-check --background`가 채널 확인·새 버전 **수신까지만** 백그라운드로
  수행(반영 안 함, pending 마킹). ② 실제 flip은 `./harness claude|codex`의
  preflight(`agent-preflight.sh`)에서 **에이전트 프로세스 시작 전에** 수행.
- **Rationale**: SessionStart 훅은 이미 컨텍스트가 로드된 뒤 실행될 수 있어
  훅 안에서 flip하면 "진행 중 세션 불변"(FR-004)이 깨질 수 있다. preflight는
  exec 이전이므로 세션이 읽는 트리가 항상 단일 버전임이 보장되고, 수신을
  백그라운드로 분리하면 시작 지연도 5초 이내(SC-002)로 유지된다.
- **Alternatives considered**: SessionStart에서 flip(위 타이밍 문제로 기각),
  cron 상시 데몬(관리 대상 추가·머신 전역 상태 변경 시점 예측 불가로 기각).

## R6. 릴리스 발행 검증

- **Decision**: `release-check.sh` — 태그 형식 `^v[0-9]+\.[0-9]+\.[0-9]+$`
  검증 + `CHANGELOG.md`에 해당 버전 절(`## vX.Y.Z`) 존재 게이트. 편의
  커맨드 `./harness release <ver>`가 검증 통과 시에만 annotated tag를
  만든다. push는 사람이 한다(태그 push는 배포 행위이므로 수동 유지).
- **Rationale**: 발행 실수(형식 오류, CHANGELOG 누락)를 코드로 막되, 실제
  배포 트리거(push)는 사람 통제로 남겨 work-safety 정책과 일치시킨다.
- **Alternatives considered**: GitHub Actions 자동 태깅(레포 쓰기 권한을
  CI에 위임해야 하고 초기 단계에 과함, 기각).
