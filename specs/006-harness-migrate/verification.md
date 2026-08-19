# Verification Record: 006-harness-migrate

**Date**: 2026-07-15 | **Branch**: feature/harness-migrate

## 테스트

- `npm test`: **357/357 pass** (신규: pkg-migrate 9, pkg-legacy-guard 4)
- TDD 준수: migrate-plan(2 red→green), migrate 플로우(6 red→green),
  --fresh 이중 로드(1 red→green), legacy guard(3 red→green)

## Quickstart 실측 (격리 픽스처)

- 시나리오 1 (dry-run): 목록 출력 + 변경 0건 + lock 미생성 ✅
- 시나리오 2 (전환): lock 생성 + 공유 제거 + 소유물 보존 + 멱등 재실행 ✅
- 시나리오 3 (보호): dirty 중단 exit 1, 업스트림 거부 exit 2, 오프라인
  중단(lock 미생성) exit 1 ✅
- 시나리오 4 (룰 단일 출처): 전환·--fresh 양쪽에서 복사본 제거 + shared
  링크 내용 확인 ✅
- 시나리오 5 (구 동기화 가드): lock 모드에서 update 적용·prune --apply·
  restore 목록이 무변경+안내, lock 없으면 기존 동작 ✅
- 시나리오 6 (실전 리허설): **수행 완료 (2026-07-15, codi-crew 스크래치
  사본, 로컬 bare 업스트림 + 테스트 태그 8라운드)** — 아래 결함을 발견·수정
  후 최종 상태: doctor 실패 1건(codi-crew 자체의 CRON_SECRET — 전환 무관,
  기존 이슈), pkg-sync 정상, 전환 diff = 삭제 167 + 진입점 수정 4 +
  untracked는 harness.lock 하나뿐.

### 리허설이 발견한 결함 (전부 수정·테스트 고정)

1. **[치명] materialize가 제거보다 먼저 실행** — 겹침 경로(.claude/
   settings.json, .harness/hooks 등)가 링크 없이 통째로 소실. 순서 재배치.
2. **[치명] 심링크 경유 CLI 무력화** — import.meta.url(물리) ≠ argv[1]
   (링크) 불일치로 resolve-version/migrate-plan CLI가 조용히 no-op →
   lock 레포의 자동 업데이트 전체가 무력화. realpath 비교로 수정.
3. stale 공유 파일(개명·삭제된 구본 잔재)이 링크 지점을 막음 —
   SHARED_DIR_ROOTS sweep 도입.
4. KEEP_COMMITTED 구버전 런처에 pkg 커맨드 부재 — 패키지 버전으로 갱신.
5. materialize 생성물이 untracked로 노출 — lockModeEntries(gitignore)
   도입 + entries 객체 형식 정규화 버그 수정.
6. doctor/rule-check가 lock 모드 룰 위치(shared/) 미인지 — 두 위치 인정.
7. 신규 clone의 mise 미신뢰로 훅 무력화 — bootstrap에 mise trust 추가.
8. migrate 직후 .agents 트리 부재 — skills-link 실행 포함.

## 구현 중 확장된 범위 (plan 대비)

- materialize에 공유 인프라 링크 추가(.harness/hooks·scripts·policies·
  config 개별 파일·.claude/settings.json·.codex 항목) — lock 모드에서
  런처·doctor 경로가 계속 동작하기 위한 필수 보충.
- migrate-plan에 KEEP_COMMITTED(harness·AGENTS.md·CLAUDE.md·.husky/)
  도입 — clone 직후 설치 전에 필요한 진입점은 커밋 유지.

## 알려진 후속 항목

- **훅 rootDir 물리 경로**: CLI 무력화(결함 2)는 수정했으나, mjs 훅 자체가
  파일 위치 realpath로 rootDir을 계산하는 부류는 남아 있다 — 리허설에서
  doctor·훅 실행은 정상이었지만, lock 레포에서 훅이 캐시 rootDir 기준으로
  동작하는 경계 사례(브랜치 보호 등)는 첫 실전 전환 후 세션 사용으로 확인.
- init-project의 `migrate --fresh`는 업스트림 릴리스 태그가 있어야
  완주한다. 태그 발행 전에는 안내만 남긴다(의도된 동작).
- codi-crew 자체 이슈(전환 무관): `.github/workflows/lunch-cron.yml`이
  비허용 GitHub Secret `CRON_SECRET`을 사용 — 실전 전환 시 별도 정리 필요.

## e2e 게이트

- 개발자 CLI 도구 — e2e 비대상, `touches-user-flow` 마커 미설정.

## 재검증 체크리스트 (2026-07-18)

- [x] 다운스트림 migrate 흐름(구 동기화 은퇴 포함) —
  `tests/pkg-migrate.test.mjs` 통과
- [x] harness CLI·update-check 경로 정합 — `tests/harness-cli.test.mjs` 통과
- [x] 전체 스위트 내 migrate 회귀 없음 (npm test 625/625, 2026-07-18)
