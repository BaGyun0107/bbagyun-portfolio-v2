# Research: 감사 발견 일괄 수정 (1차)

근거의 정본은 `docs/audits/2026-07-31-full-harness-audit.md`. 여기는 접근 결정만 기록한다.

## R1. H-1+H-7 — docs 링크 복원 + 정확 일치 양방향 드리프트 가드

- **Decision**: materialize.sh 링크 루프에 `docs` 추가, `required-gitignore.json`
  lockModeEntries 에 `.harness/docs` 추가, `STALE_WORKCOPY_PATHS` 에 `.harness/docs`
  추가. 가드는 픽스처에서 materialize 를 실제 실행해 생성 링크 집합을 수집한 뒤
  세 집합(링크 / lockModeEntries 중 `.harness/*` / STALE_WORKCOPY_PATHS 중 `.harness/*`)
  을 **정확 일치 양방향** `deepEqual` 로 대조. 의도적 예외(materialize 가 링크하지만
  stale-workcopy 비대상인 `.harness/scripts`·`.harness/config` 등)는 테스트 안
  명시적 allowlist 상수로 선언하고, allowlist 원소가 실제로 링크 집합에 존재하는지도
  검증한다(죽은 예외 방지).
- **Rationale**: basename 부분문자열 단방향 대조는 시뮬레이션으로 무효가 입증됐다
  (H-7). 실행 기반 수집은 `materialize-relative-links.test.mjs` 의 기존 패턴 재사용.
- **Alternatives**: materialize.sh 원문 정규식 파싱 — 셸 리팩터에 취약, 기각.

## R2. M-5 — ROADMAP.md 바이트 일치 판정

- **Decision**: prune-downstream 의 ROADMAP.md 처리를 이름 판정에서
  "패키지 사본과 바이트 일치할 때만 삭제"로 교체. 패키지에 사본이 없으면 보존.
  examples/·docs 산출물의 무조건 삭제는 현행 유지(커밋 ff8394b 의 명시 결정).
- **Rationale**: ROADMAP 은 AGENTS.md 가 다운스트림 durable state 로 규정한 파일.
  다른 selfstate 판정과 같은 보수 원칙(오삭제보다 잔재)으로 정렬.
- **주의**: `tests/prune-downstream-project-state.test.mjs:224-234` 가 ROADMAP 삭제를
  단언하는 기존 픽스처는 "패키지 사본과 동일한 ROADMAP" 케이스로 수정해 의도를 보존.

## R3. H-6+M-17+L-9 — fixture-base 추출

- **Decision**: `tests/helpers/fixture-base.mjs` 신규 — `tmp(prefix)`(mkdtemp + 경로
  레지스트리), `write`, `git(cwd, args)`(공통 실행기), `lexists`. 정리는
  `process.on('exit')` 에서 레지스트리 일괄 `rmSync({recursive, force})` — node:test
  의 파일별 `after()` 등록 없이 헬퍼를 import 한 모든 테스트 파일에 자동 적용된다.
  git 실행기는 env 에 `GIT_CONFIG_GLOBAL=/dev/null`, `GIT_CONFIG_SYSTEM=/dev/null` 을
  넣어 전역 설정(gpgsign, hooksPath, templateDir)을 격리하고, 레포 초기화 시
  user.name/user.email/commit.gpgsign=false 를 로컬로 설정한다.
- **Rationale**: 누수·미격리가 모두 헬퍼 이원화에서 왔으므로 기반 공유가 근본 수정.
  exit 훅은 실패한 테스트 실행에서도 동작한다.
- **Alternatives**: 각 테스트 파일에 after() 추가(34개 파일 산탄), 기각.
- **주의**: `KEEP_TMP=1` 환경 변수로 정리를 끌 수 있게 해 디버깅 경로를 남긴다.
  기존 두 헬퍼의 공개 API(함수명·시그니처)는 유지해 34개 테스트 파일 수정을 피한다.

## R4. 1-3 — 리허설 스크립트 이동

- **Decision**: `git mv .harness/scripts/setup/test-init-project-flows.sh
  tests/init-project-flows.sh` + `./harness manifest` 재생성(project-owned 분류로
  다운스트림 배포 제외) + `mise.toml` 에 `[tasks.init-rehearse]` 등재.
- **주의**: `tests/harness-cli.test.mjs:469` 부근의 기존 검사(스크립트 원문에서 옛
  dev-runner 경로 부재 확인)는 새 경로를 읽도록 갱신. 스크립트 헤더의
  `INIT_PROJECT_TEST_WORK_DIR` 사용법 주석 보강.

## R5. 1-4 — 스킬 카탈로그 실재화

- **Decision**: `codi-config.yaml` 에서 `team-mode-operator` 제거,
  `disabled_as_overlapping` 의 실재하지 않는 4건(codi-architecture/qa/debug/scm) 제거.
  누락 7건(codi-auto-loop, codi-design-system, codi-e2e, codi-feature-hub,
  codi-feature-definition-authoring, codi-feature-definition-normalizer,
  codi-rule-authoring)을 enabled 에 추가. `manifest.json` `team_skills` 동기화.
- **주의**: `tests/harness-cli.test.mjs` 의 (a) `doesNotMatch(/team-mode-operator/)`
  단언 — 제거로 충족, (b) 'team skill catalog is documented' 테스트 — enabled 각
  항목이 `codi-config.yaml` 과 `codi-phase-routing/SKILL.md` 에 문서화돼야 하므로
  신규 7건의 SKILL.md 언급 여부를 확인하고 없으면 함께 추가한다.

## R6. M-6 — planning-check 조용한 스킵 제거

- **Decision**: `ci-node-verify.sh` 의 `[ -f ]` 가드에 else 분기를 붙여
  "planning-check skipped: script not present (lock-mode checkout)" 경고를 stdout 에
  남긴다. `ci-node.yml` 에는 lock 모드에서 이 게이트를 돌리려면 pkg-sync 선행이
  필요하다는 주석 1줄. 게이트 차단화(실패 처리)는 하지 않는다 — 로컬 pre-commit 이
  1차 방어선으로 남아 있고, lock 다운스트림 CI 를 깨지 않기 위함.

## R7. 문서·주석 정정 (H-2, H-3, H-4, M-8~M-10, M-18, M-20, M-21, L-5, 1-5)

- **Decision**: 감사 보고서의 권고 문안을 그대로 채택. 공통 원칙 — 경로 목록을
  문서에 재열거하지 않고 정본 파일 참조로 대체한다(재열거는 같은 드리프트 재발).
  1-5 는 grep 검증(엄격)만 남기고 case 블록 제거.
- **M-9 범위**: README 표의 install 행 수정 + "팀원 일상 명령은 bootstrap 하나" 문장
  추가. ARCHITECTURE/update-policy 계층 보강은 후속 웨이브(M-9 잔여)로 미룬다 —
  자기모순 해소가 1차 목표.
