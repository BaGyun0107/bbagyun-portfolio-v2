# Verification Record: 005-harness-packaging

**Date**: 2026-07-15 | **Branch**: feature/harness-packaging

## 테스트

- `npm test`: **344/344 pass** (신규: pkg-resolve 15, pkg-fetch-materialize 7,
  pkg-pin-update 9, pkg-release 4; 기존 회귀 무결)
- TDD 준수: 각 스토리에서 red 확인 후 구현 — resolve(15 red→green),
  fetch/materialize(6 red→green), update/pending(4 red→green),
  pin/major(5 red→green), release(3 red→green)
- 기존 테스트 수정 1건: `harness-cli.test.mjs`의 init-project Step 5 라인
  시퀀스 고정 정규식에 `write_harness_lock` 단계 반영 (의도된 동작 변경)

## Quickstart 실측

- 시나리오 1 (lock 설치): 가짜 업스트림 → 캐시 → materialize, 두 레포 상이
  버전 공존, 동시 수신, 실파일 보존 — 전부 green ✅
- 시나리오 2 (자동 채널): patch 수신은 pending까지(트리 불변) → preflight
  flip, major-only는 안내만, 오프라인 조용히 스킵 ✅
- 시나리오 3 (pin/롤백/오프라인): 캐시 보유 버전 pin은 오프라인 즉시 전환,
  미확보 pin은 lock·트리 불변 exit 1, --channel 복귀 ✅
- 시나리오 4 (릴리스 검증): 형식 위반·CHANGELOG 누락·중복 태그 거부, 정상
  시 annotated tag + push 미수행 ✅
- 시나리오 5 (기능 동등성, V2 실측): 레포 밖 디렉토리를 가리키는
  `.claude/rules/shared` 심링크만 있는 임시 프로젝트에서 `claude -p` 헤드리스
  실행 → 심링크 룰의 내용을 정확히 로드해 응답 (**실측 통과**, 문서 근거:
  code.claude.com/docs/en/memory·skills) ✅

## 알려진 전환기 제약 (Phase 3 대상)

- 신규 프로젝트는 lock 모드 + 복사본 트리가 공존한다. materialize의
  `rules/shared` 링크와 복사본 룰이 같은 내용을 이중 로드하는 전환기 중복은
  Phase 3 migrate(복사본 제거)가 해소한다.
- 기존 다운스트림 전환(`harness migrate`)과 구 동기화 흐름 은퇴는 Phase 3
  spec으로 분리되어 있다.

## e2e 게이트

- 개발자 CLI 도구 — e2e 비대상, `touches-user-flow` 마커 미설정.

## 재검증 체크리스트 (2026-07-18)

- [x] 버전 fetch·materialize·lock 동작 —
  `tests/pkg-fetch-materialize.test.mjs` 통과
- [x] harness CLI 진입점·태스크 정합 — `tests/harness-cli.test.mjs` 통과
- [x] 전체 스위트 내 패키지화 회귀 없음 (npm test 625/625, 2026-07-18)
