<!-- 2026-07-31 ultracode 전수 감사 (13 에이전트: 6 탐지 + 6 반증 + 1 종합). -->
<!-- 검증 통과 58건 → 중복 병합 34건. 원 실행: wf_5a9bc963-1b4. -->
# codi-harness-v2 저장소 감사 종합 보고서

기준: v2 브랜치, v1.3.1 릴리스 직후 / 검증 통과 항목만 수록 (중복 병합 후 34건)

---

## 1) 즉시 정리 가능 (파일/코드 삭제 후보)

정리 전 반드시 확인: 아래 항목 중 다수가 "고아처럼 보이지만 참조가 살아 있다". 각 항목의 **선행 조건**을 먼저 처리하지 않으면 테스트가 깨진다.

### 1-1. `docs/superpowers/specs/2026-07-15-bootstrap-packaging-design.md` — 다운스트림 배포 중인 설계 초안 잔재

- **경로**
  - `/Users/codiworks_dev/Desktop/codi-harness-v2/docs/superpowers/specs/2026-07-15-bootstrap-packaging-design.md`
  - `/Users/codiworks_dev/Desktop/codi-harness-v2/.harness/shared-manifest.json` (326행에 등재)
  - `/Users/codiworks_dev/Desktop/codi-harness-v2/.harness/scripts/setup/project-owned.mjs`
- **근거**: specs/012 research.md:44가 `docs/superpowers/specs/*.md`를 제거 대상으로 명시했고 T011은 `[X]`인데 1건이 남았다(`docs/superpowers/plans`는 실제로 삭제됨). project-owned 분류의 `docs/` 예외는 `docs/index.html`, `docs/planning.html`, `docs/audits/`뿐이라 이 파일이 shared-manifest에 등재되어 모든 다운스트림이 자기 저장소와 무관한 이력 문서를 받는다.
- **선행 조건 (필수)**: `data/feature-definitions.json`의 3개 항목(121·153·185행 summary)이 이 경로를 "상위 설계" 근거로 인용한다. 그냥 지우면 카탈로그에 죽은 참조 3건이 남는다.
- **삭제 방법**
  ```sh
  # 1) feature-definitions.json 의 3개 인용을 specs/010 정본 경로로 먼저 교체
  # 2) 파일 제거
  git rm docs/superpowers/specs/2026-07-15-bootstrap-packaging-design.md
  # 3) 매니페스트 재생성
  ./harness manifest
  ```
- **주의**: `docs/superpowers/**` 디렉터리 개념 자체는 없애지 말 것. `.harness/hooks/guardrails.mjs:1042`와 `tests/plan-of-record-hint.test.mjs`가 이 경로를 "plan of record 아님" 힌트 경로로 활성 유지한다.
- **재발 방지**: `project-owned.mjs`에 `docs/superpowers/`, `docs/prompts/` 접두사 추가.

### 1-2. `.specify/templates` · `.specify/scripts/bash` · `.specify/workflows/speckit/workflow.yml` — 벤더 원본의 바이트 동일 사본

- **경로**
  - `/Users/codiworks_dev/Desktop/codi-harness-v2/.specify/templates` (5건)
  - `/Users/codiworks_dev/Desktop/codi-harness-v2/.specify/scripts/bash` (5건, common.sh만 29KB)
  - `/Users/codiworks_dev/Desktop/codi-harness-v2/.harness/config/required-gitignore.json:45-47`
- **근거**: `diff -rq .specify/templates .harness/vendor/speckit/templates` 출력 없음(완전 동일), `.specify/scripts/bash` ↔ `.harness/vendor/speckit/scripts`도 동일. `place-speckit-assets.sh:33-38`이 vendor→.specify 복사 관계를 만든다. `required-gitignore.json`이 lock 모드에서 이 경로들을 `real: true`로 선언하면서 하네스 저장소에서만 커밋 상태로 두는 비대칭.
- **선행 조건 (필수, 미검증 위험 3건)**
  1. `copy_templates_without_overrides`가 `overrides` 디렉터리를 제외한다 → vendor에 하네스 고유 오버라이드 레이어가 있어 단순 미러가 아닐 수 있음.
  2. `.specify` 전체가 project-owned라 상류에서 `git rm --cached` 하면 신규 clone이 `place-speckit-assets.sh` 실행 전까지 템플릿 없이 시작 → speckit 스킬 실패 가능.
  3. `speckit-drift-check.mjs`가 커밋된 사본을 전제하는지 먼저 확인.
- **삭제 방법 (위 3건 확인 후에만)**
  ```sh
  git rm -r --cached .specify/templates .specify/scripts/bash .specify/workflows/speckit/workflow.yml
  # .gitignore 에 3경로 추가 후 커밋
  ```

### 1-3. `.harness/scripts/setup/test-init-project-flows.sh` — 실행되지 않는 389줄 리허설 + 다운스트림 배포

- **경로**
  - `/Users/codiworks_dev/Desktop/codi-harness-v2/.harness/scripts/setup/test-init-project-flows.sh`
  - `/Users/codiworks_dev/Desktop/codi-harness-v2/.harness/shared-manifest.json:178`
- **근거**: `package.json` test는 `node --test tests/*.test.mjs`, CI(`ci-node.yml:47`)는 `ci-node-verify.sh` 하나만 실행 → 이 스크립트를 부르는 곳 0건. 유일한 참조인 `tests/harness-cli.test.mjs:469`는 `readFileSync` 후 옛 경로 문자열 부재만 검사한다. `.harness/scripts/setup/`에 있어 project-owned 분류를 피해 shared-manifest에 등재 → 모든 다운스트림에 심링크로 배포.
- **삭제 금지**: 함께 지우라는 harness-cli.test.mjs 검사는 dev-runner 경로 회귀를 막는 활성 가드이고, `specs/004 plan.md:26`·`specs/005 tasks.md:64`가 이 리허설을 온보딩 검증 수단으로 설계한 기록이 있다.
- **권장 조치 (삭제 대신 이동 + 실행 경로 부여)**
  ```sh
  git mv .harness/scripts/setup/test-init-project-flows.sh tests/init-project-flows.sh
  ./harness manifest   # project-owned(tests/)로 이동해 다운스트림 배포 중단
  # mise.toml 에 [tasks.init-rehearse] 등재, 헤더에 INIT_PROJECT_TEST_WORK_DIR 사용법 명시
  ```
  (참고: "macOS 전용이라 Linux CI에서 실패"는 사실이 아님 — 5행에 `INIT_PROJECT_TEST_WORK_DIR` 오버라이드가 이미 있다.)

### 1-4. `codi-config.yaml` / `manifest.json` 의 스킬 목록 — 실재하지 않는 항목 5건

- **경로**
  - `/Users/codiworks_dev/Desktop/codi-harness-v2/.harness/config/codi-config.yaml:39`
  - `/Users/codiworks_dev/Desktop/codi-harness-v2/.harness/manifest.json` (`team_skills.enabled`)
- **근거**: `codi-config.yaml`이 `team-mode-operator`를 enabled로 등재하는데 스킬 디렉터리에 없고, `tests/harness-cli.test.mjs:2271`이 `assert.doesNotMatch(surfaces, /team-mode-operator/)`로 노출 금지를 단언한다(설정 ↔ 테스트 정면 충돌). `disabled_as_overlapping`의 codi-architecture/qa/debug/scm 4건도 실재하지 않는다.
- **블록 통째 삭제 금지**: `tests/harness-cli.test.mjs:215-241` `'team skill catalog is documented in phase routing config'` 테스트가 `manifest.team_skills.enabled`를 순회하며 `codi-config.yaml`·`codi-phase-routing/SKILL.md` 문서화를 검증한다. 삭제하면 CI 즉시 실패.
- **삭제 범위**: `team-mode-operator` 1줄 + `disabled_as_overlapping` 4항목만 제거. 누락 7건(codi-auto-loop, codi-design-system, codi-e2e, codi-feature-hub, codi-feature-definition-authoring, codi-feature-definition-normalizer, codi-rule-authoring)은 추가.

### 1-5. `release-check.sh` 중복 태그 검증 블록

- **경로**: `/Users/codiworks_dev/Desktop/codi-harness-v2/.harness/scripts/pkg/release-check.sh:12-18`
- **근거**: 12~18행 case 검증과 19~22행 grep 검증이 같은 조건·같은 메시지·같은 `exit 2`를 중복 수행. case 패턴 `v[0-9]*.[0-9]*.[0-9]*`는 느슨해서 `v1.2.3-rc1`을 통과시키므로 grep이 실질 게이트다.
- **삭제 방법**: 12~18행 case 블록만 제거하고 grep 정규식 하나만 남긴다. (반대 방향 — case만 남기기 — 은 검증을 약화시키므로 채택 금지.)

### 1-6. 테스트 임시 디렉터리 누적분 5.3GB

- **경로**: 시스템 temp (`/var/folders/*/*/T/codi-*`)
- **근거**: `codi-*` 디렉터리 78,230개 / 총 5.17GB 실측. `tests/helpers/pkg-fixture.mjs`·`downstream-fixture.mjs` 모두 `rmSync`/`after` 훅 0건.
- **삭제 방법 (사용자 승인 필요 — 파괴적)**
  ```sh
  # 승인 후에만
  find "$TMPDIR" -maxdepth 1 -name 'codi-*' -type d -exec rm -rf {} +
  ```
  근본 수정은 2-1 참조.

---

## 2) 개선 권고

### HIGH

#### H-1. `.harness/docs/**` 13개 가이드가 lock 전환 시 영구 소실

- **경로**: `.harness/scripts/pkg/materialize.sh:68` / `.harness/config/required-gitignore.json` / `.harness/scripts/setup/upstream-project-state.mjs`
- **문제**: shared-manifest에 `.harness/docs/**` 13건이 등재돼 `migrate.sh`가 `git rm`으로 지우는데, materialize의 링크 대상 루프(`hooks policies imported-rules prompt-style vendor skills workflow.md manifest.json lock.json shared-manifest.json`)에 `docs`가 없고 lockModeEntries에도 없다. `restore-missing-shared.mjs`는 `harness.lock` 존재 시 즉시 exit 0, `pkg-sync.sh`도 복원하지 않는다. 실사용처가 살아 있다 — `init-project.sh:683/684/705`가 3개 파일을 온보딩 마지막에 안내하고, `build-hub.mjs:32`의 `MD_DIRS`가 `.harness/docs`를 스캔하며, `scan-md.mjs:54`가 '하네스 가이드' 카테고리로 분류한다. 결과: 다운스트림에서 `docs:build`는 하네스 가이드 0건, init-project 안내는 없는 파일을 가리킨다. v1.1.4에서 CONTRIBUTING.md에 대해 이미 한 번 고친 것과 동일 부류(materialize.sh:144-146 주석).
- **권고**: materialize.sh 68행 링크 루프에 `docs` 추가 + `required-gitignore.json` lockModeEntries에 `.harness/docs` 등재 + `STALE_WORKCOPY_PATHS`에도 추가. 세 목록이 항상 함께 갱신되도록 정확 경로 집합 양방향 드리프트 가드 테스트를 추가한다.

#### H-2. `update-policy.md` required-gitignore 절의 3중 사실 오류

- **경로**: `.harness/policies/update-policy.md:114-125` / `.harness/config/required-gitignore.json`
- **문제**: ① "two mechanisms, both applied idempotently during `./harness update`" — 실제 메커니즘은 3개(`entries`/`lockModeEntries`/`managedBlocks`)이고, lock 모드에서는 `update.sh:19-23`이 조기 종료하므로 `pkg-sync.sh:84-101`이 유일한 적용 경로다(pkg-sync.sh:84-86 주석이 이를 자인). ② `entries`를 "currently empty"라고 적었으나 v1.3.0에서 `.claude/skills`·`.agents/skills` 2건 추가됨. ③ "`.specify/**` … needs no ignore entries" — v1.3.1이 `.specify/templates`·`scripts`·`workflows` 3건을 `real:true`로 등재함. 정책 정본이라 운영자/에이전트가 gitignore 진단 시 곧장 잘못된 결론에 도달한다.
- **권고**: 메커니즘 3개 열거 + 모드별 적용 경로 분리 + "currently empty" 삭제하고 목록 정본은 `required-gitignore.json` 참조로 대체 + `.specify` 문장을 "커밋되는 프로젝트 상태 vs install이 재배치하는 벤더 경로" 구분으로 교체. `required-gitignore.json`의 `description` 필드에 남은 동일 오류도 함께 수정. (이 문구를 assert하는 테스트는 없어 수정이 CI를 깨지 않음.)

#### H-3. `project-owned.mjs` 주석이 examples/ prune 정책을 정면 부정

- **경로**: `.harness/scripts/setup/project-owned.mjs:48-51` / `.harness/scripts/setup/upstream-project-state.mjs:19` / `.harness/policies/update-policy.md:39`
- **문제**: 주석이 "examples/ 는 … 다운스트림에 남아 있어도 prune 하지 않는다"라고 단언하지만, `upstream-project-state.mjs:19`가 `examples`를 `UPSTREAM_PROJECT_STATE_PATHS`에 넣었고 38~40행 필터(`.specify`/`specs`/`tests`만 제외)에 걸리지 않아 `prune-downstream --apply`가 통째로 `rmSync`한다. `tests/prune-downstream-project-state.test.mjs:45,106`이 `examples`를 기대 정리 대상으로 assert하므로 **코드가 옳고 주석이 틀렸다**. 커밋 92fa706 메시지가 바로 이 개념 혼동을 결함의 뿌리로 지목했는데 정작 뿌리를 만든 주석은 고쳐지지 않았다(해당 커밋은 upstream-project-state.mjs만 수정).
- **권고**: 주석에서 "prune 하지 않는다"를 삭제하고 두 개념을 분리해 재작성 — "project-owned = update가 덮어쓰지 않는다. clone 잔재 정리 대상 여부는 별개이며 `UPSTREAM_PROJECT_STATE_PATHS`가 정한다." `update-policy.md:39` 표의 `examples/**` 셀에도 같은 각주.

#### H-4. init-project 잔재 정리를 4개 문서가 잘못 설명 + 경로 목록 낡음

- **경로**: `README.md:71-74,130-132` / `CONTRIBUTING.md:442-448` / `.harness/docs/project-init-guide.md:60-84` / `.harness/docs/update-guide.md:48-51`
- **문제**: 커밋 26e0e71이 upstream 상태 정리를 `--reset-git` 분기 밖으로 빼내 항상 실행하게 바꿨는데(`init-project.sh:541-545` 주석) 4개 문서가 여전히 "`--reset-git`을 주면 … 도 제거합니다"로 서술한다. 더 나쁜 것은 네 곳 모두 정리 경로를 5개로 하드코딩했는데 실제 `UPSTREAM_PROJECT_STATE_PATHS`는 7개(`docs/planning.html`, `.github/workflows/release.yml`, `examples` 추가)라는 점 — `project-init-guide.md:84`·`CONTRIBUTING.md:446`의 수동 대체 명령 `rm -rf .specify specs tests ROADMAP.md docs/index.html`을 그대로 따르면 3개 잔재가 첫 커밋에 들어간다. specs/015가 6개 레포에서 사후 청소해야 했던 바로 그 잔재.
- **권고**: (1) "`--reset-git` 여부와 무관하게 항상 정리합니다(`--reset-git`은 `.git` 재생성만 담당)"로 수정. (2) 하드코딩 5경로 목록과 수동 `rm -rf` 예시를 삭제하고 `upstream-project-state.mjs`의 `UPSTREAM_PROJECT_STATE_PATHS` **참조**로 대체(재열거하면 같은 드리프트 재발).

#### H-5. v1.3.1 릴리스가 실제로 발행되지 않음 (Actions 결제 실패)

- **경로**: `CHANGELOG.md` / `.github/workflows/release.yml`
- **문제**: CHANGELOG 최상단에 `## v1.3.1`이 있고 커밋 87d90d6이 origin/v2에 머지됐지만, `git ls-remote --tags origin`의 최신 태그는 여전히 `v1.3.0`이다. `gh run view 30593309080` → "The job was not started because recent account payments have failed or your spending limit needs to be increased." 코드 결함이 아닌 결제 문제. 다운스트림은 `latest-minor`를 태그 목록에서 해석하므로 v1.3.1의 수정 3건(README 제목-마커 판정, stale-workcopy 부류, `.specify` gitignore 등재)이 어떤 다운스트림에도 전달되지 않았다. #115 머지 건도 동일 실패 — 결제 해소 전까지 이후 모든 릴리스가 조용히 누락된다.
- **권고**: GitHub Billing & plans에서 결제/지출한도 해소 → v2에 빈 커밋 푸시 또는 run 30593309080 re-run → `git ls-remote --tags origin`으로 v1.3.1 확인 → 이미 v1.3.0으로 정리된 6개 레포에 `./harness update` 재실행 안내. 구조적으로 릴리스 워크플로 실패 알림을 붙일 것.

#### H-6. 테스트 임시 디렉터리 미정리 (5.3GB 누수)

- **경로**: `tests/helpers/pkg-fixture.mjs` / `tests/helpers/downstream-fixture.mjs`
- **문제**: 두 공용 픽스처 모두 `mkdtempSync`만 하고 `rmSync`/`after` 훅이 0건. 임시 디렉터리를 만드는 34개 테스트 파일 중 `after()` 훅을 가진 것은 `guardrails-fp-battery.test.mjs` 1개뿐이고, `harness-cli.test.mjs`의 rmSync 7건 중 실제 정리는 2014행 한 줄뿐이다. `makeFakeUpstream`은 호출마다 bare + work 두 개의 실 git 레포를 만들어 누수 단위가 크다. 실측 78,230개 / 5.17GB.
- **권고**: 헬퍼에 생성 경로 모듈 레지스트리를 두고 `after()`에서 일괄 `rmSync({recursive:true, force:true})`. 인라인 `mkdtempSync`도 헬퍼 `tmp()`로 모은다. 헬퍼가 만든 것만 정리해도 대부분 해소되며 CI·다운스트림·업그레이드 경로를 깨지 않는다.

#### H-7. stale-workcopy 드리프트 가드가 basename 부분문자열 단방향이라 사실상 무효

- **경로**: `tests/prune-downstream-project-state.test.mjs:201-212` / `.harness/scripts/setup/upstream-project-state.mjs:106-108`
- **문제**: `const tail = p.split('/').pop(); assert.ok(mat.includes(tail))` — 마지막 세그먼트만 materialize.sh 원문에 부분문자열로 대조한다. **시뮬레이션으로 입증**: materialize.sh 사본에서 링크 루프의 hooks·policies·skills 세 대상을 제거했는데 18개 단언 중 단 1개(`.harness/policies`)만 실패했다. hooks/skills는 18행(`mkdir .claude/skills`)·56~57행·152행의 무관한 문자열에 우연히 걸려 통과한다. 방향도 한쪽뿐 — 단언이 `STALE_WORKCOPY_PATHS` 원소만 순회하므로 materialize에 새 대상이 추가돼도 절대 실패하지 않는다. **H-1(`.harness/docs` 누락)이 정확히 이 가드를 그냥 통과한다.** 그런데 소스 주석은 "드리프트 가드 테스트가 소스 대조로 고정"이라고 실제 보장보다 강하게 선언해 다음 편집자가 가드에 목록 동기화를 맡기게 만든다.
- **권고**: `materialize-relative-links.test.mjs`의 `collectLinks`를 재사용해 materialize가 실제로 만드는 링크 집합을 픽스처 실행으로 구한 뒤, `lockModeEntries` · `STALE_WORKCOPY_PATHS` · materialize 링크 대상 세 집합을 **정확 일치 양방향** 비교로 교체. H-1 수정과 함께 처리.

### MEDIUM

#### M-1. `materialize.sh` 호출 6곳 중 4곳이 `keep-committed.sh`를 부르지 않음

- **경로**: `.harness/scripts/pkg/pkg-apply-pending.sh:15` / `pin.sh:45` / `pkg-update-major.sh:39` / `keep-committed.sh`
- **문제**: materialize 호출 지점은 6곳인데 keep-committed를 부르는 곳은 `pkg-sync.sh:103-104`, `migrate.sh:180-182` 둘뿐. 특히 `pkg-apply-pending.sh`는 `agent-preflight.sh:12`가 매 세션 실행하는 자동 flip 경로다. 다만 원문의 "CI 스크립트가 영구히 구버전" 주장은 성립하지 않는다 — `materialize.sh:104-128`이 KEEP_COMMITTED 하위 디렉터리(checks/deploy/audit)를 migrate-plan.mjs의 KEEP_SUBS에서 읽어 cp로 갱신하므로 ci-node-verify.sh 등 4개는 materialize만으로도 갱신된다. 실제 미갱신 대상은 루트 3개(`harness`, `AGENTS.md`, `CLAUDE.md`)뿐이고 다음 bootstrap→pkg-sync에서 복구된다. 즉 "영구"가 아니라 "다음 pkg-sync까지 지연", 그리고 호출 규약이 호출부마다 다른 구조적 드리프트.
- **권고**: materialize + keep-committed를 단일 진입점(`apply-version.sh <version>`)으로 묶고 5개 스크립트가 그것만 호출. 최소 조치로 세 스크립트에 pkg-sync와 동일한 KEEP_SH 블록 추가. "materialize를 호출하는 모든 스크립트는 keep-committed도 호출한다" 소스 대조 테스트 추가.

#### M-2. `./harness update --check` / `mise run update`가 하네스 업데이트를 확인하지 않음

- **경로**: `.harness/scripts/setup/update.sh:433-477` / `mise.toml:26-28` / `harness`
- **문제**: `MODE=check` 경로(447~477행)는 GStack fetch/rev-parse와 Superpowers 안내 echo 후 "확인 완료"로 끝나고 하네스 파일 diff/stale 판정을 전혀 하지 않는다. lock 모드에서는 update.sh:19-23이 즉시 exit 0 하므로 `mise run update`가 안내 한 줄만 찍는다. `mise.toml`의 description("Check harness dependency updates")과 `package.json:20` `update:check`가 오해를 넓힌다. 단, 확인 수단 자체는 존재한다 — `mise.toml:22-24 [tasks.update-check]` → `update-check.sh`가 lock/copy 모두 실제 확인을 수행하고 preflight가 자동 호출한다. 즉 "확인 수단 없음"이 아니라 "이름이 비슷한 두 태스크 중 하나가 오도".
- **권고**: `--check`가 `update-check.sh`의 `check_canonical_harness_update()` 경로를 재사용하게 하거나(lock 모드는 pkg-update-check.sh 위임), 그것이 과하면 `mise [tasks.update]`와 런처 help 문구를 실제 동작("GStack/Superpowers 설치 상태 안내")에 맞게 바꾸고 하네스 확인은 update-check로 안내.

#### M-3. `init-project.sh` fallback 경로 목록이 정본과 드리프트 (examples/·release.yml 누락)

- **경로**: `.harness/scripts/setup/init-project.sh:383,386-391` / `.harness/scripts/setup/upstream-project-state.mjs:8-19`
- **문제**: `prune_upstream_project_state()`가 node로 정본을 읽되 실패 시 하드코딩 fallback 6개를 쓰는데, 정본은 8개(`.github/workflows/release.yml`, `examples` 추가). 383행이 `2>/dev/null || true`로 실패를 삼켜 사용자는 정리가 완전했다고 오인한다. **악화 요인**: `tests/harness-cli.test.mjs:408` 회귀 테스트가 함수를 tmpdir에서 실행하는데 PROJECT_ROOT가 tmpdir이라 node import가 실패하고 fallback 경로만 검증된다 — 유일한 테스트가 6개짜리 fallback을 사실상 고정해 드리프트를 잡지 못한다.
- **권고**: fallback을 제거하고 node import 실패 시 명시적으로 경고/실패(415~419행에서 node 부재 시 이미 exit 1 하므로 fallback은 도달 불가에 가깝다). **단, `harness-cli.test.mjs:408` 테스트가 fallback을 실행하므로 함께 수정해야 한다.** 유지한다면 "fallback 목록 == UPSTREAM_PROJECT_STATE_PATHS" 소스 대조 테스트 추가.

#### M-4. manifest 등재 파일이 git rm 후 링크·ignore 어디에도 없는 고아 상태

- **경로**: `.harness/shared-manifest.json` / `.harness/config/required-gitignore.json` / `.harness/scripts/pkg/materialize.sh`
- **문제**: 총계 28건이나 이 중 `.claude/rules/*.md` 7건은 materialize.sh:53이 `.claude/rules`를 통째로 `.claude/rules/shared`로 링크하고 lockModeEntries:48이 등재하므로 실질 커버됨 → **실제 무보호는 약 21건**(원 보고의 계산이 간접 커버를 모델링하지 못함). 확인된 실질 피해 2건: (1) `CONTRIBUTING.md`는 materialize 링크로 다운스트림에 존재하는데 그 244행이 `docs/planning-hub-handoff.md`를 링크 → 다운스트림에서 항상 깨진 링크. (2) `CHANGELOG.md`는 `release-check.sh:29`가 `## <tag>` 절을 요구하는 릴리스 게이트 입력인데 다운스트림에서 사라진다. `.agents/results/.gitkeep`은 install.sh:50/migrate.sh:190의 mkdir로 무해.
- **권고**: 착수 전 `.claude/rules/shared` 간접 커버를 반영해 실제 고아 집합을 재계산한 뒤 3부류 처리 — (a) 다운스트림 필요 문서(`.harness/docs/**`, `docs/harness-overview.md`, `docs/planning-hub-handoff.md`)는 materialize 링크 + lockModeEntries, (b) 업스트림 전용(`CHANGELOG.md`, `harness.lock.example`, `docs/prompts/**`, `docs/superpowers/**`)은 shared-manifest에서 제외, (c) `.gitkeep` 현상 유지. 이후 '제거 대상 ∖ (링크 ∪ ignore) = ∅' 회귀 테스트 추가.

#### M-5. `prune-downstream --apply`가 ROADMAP.md를 내용 판정 없이 삭제

- **경로**: `.harness/scripts/setup/upstream-project-state.mjs` (`PRUNE_DOWNSTREAM_PATHS`) / `prune-downstream.mjs:283-288`
- **문제**: 다른 잔재 판정(`selectHarnessSelfstate`, `selectUntouchedCopies`)은 모두 바이트 비교를 쓰는데 이 경로만 이름 판정이라 `rmSync(recursive:true)`를 무조건 실행한다. `ROADMAP.md`는 `AGENTS.md:29`와 `scenario-phase-routing.md:85`가 "P5 Ship: converge green → update the root ROADMAP.md"로 다운스트림 필수 durable state로 규정한 파일 — 프로젝트가 자기 로드맵을 채운 뒤 `--apply`하면 소실된다. **주의**: examples/·docs/index.html 삭제는 커밋 ff8394b가 명시적으로 내린 결정이고 `tests/prune-downstream-project-state.test.mjs:224-234`가 ROADMAP 삭제를 단언하는 픽스처를 갖고 있으므로, "project-owned는 prune 대상이 될 수 없다"는 불변식으로 되돌리면 의도된 동작을 깬다.
- **권고**: ROADMAP.md에만 `selectHarnessSelfstate`와 동일한 "패키지 사본과 바이트 일치할 때만 삭제" 내용 판정을 붙인다. examples/docs 산출물은 현행 유지하되 `--apply` 출력에 '재생성 필요'를 명시.

#### M-6. CI planning-check 게이트가 lock 모드 다운스트림에서 조용히 스킵

- **경로**: `.harness/scripts/checks/ci-node-verify.sh:302` / `.harness/scripts/pkg/migrate-plan.mjs:13-16`
- **문제**: ci-node-verify.sh는 KEEP_COMMITTED 4개 중 하나로 "복원 스텝 없이 CI가 그대로 동작한다"는 전제로 커밋되는데, 마지막 단계가 `.harness/scripts/docs/planning-check.mjs`를 호출한다. `.harness/scripts/docs`는 materialize가 심링크로 만들고 `required-gitignore.json:12`가 lock 모드 ignore로 등재하므로 actions/checkout 트리에 없다. `[ -f ]` 가드 덕에 exit 127로 깨지진 않지만, "로컬 hook이 실행되지 않는 직접 편집/다른 agent 경로도 merge 전에 차단한다"는 게이트가 로그 한 줄 없이 통째로 건너뛰어진다. 다만 로컬 pre-commit 훅에서는 여전히 돌아 1차 방어선은 남아 있다(이중 방어의 두 번째 층만 결손).
- **권고**: `-f` 가드에 else 분기를 붙여 "스크립트 부재로 planning-check 스킵"을 CI 로그에 경고로 남기고, lock 모드 CI에서 이 게이트를 돌리는 방법(예: `./harness pkg-sync` 선행 스텝)을 `ci-node.yml`에 명시. **조용한 스킵만은 남기지 않는다.** (planning-check.mjs를 KEEP_COMMITTED에 넣는 대안은 Node 내장 모듈만 쓰는 자기완결성 선확인이 필요.)

#### M-7. AI-read 파일에 한국어 산문 잔존 + AGENTS.md 열거 누락

- **경로**: `.harness/policies/quality-gates.md:78-96` / `.claude/rules/skill-ownership.md:84-93` / `AGENTS.md:123`
- **문제**: AGENTS.md:123이 `.harness/policies/` 하위 전체의 *산문*을 영어로 규정하는데 quality-gates.md의 "## Planning Hub 절차 규칙의 강제 수준 (2026-07-17 결정)" 절 전체가 제목부터 한국어이고 코드 블록이 아니라 예외에 해당하지 않는다. skill-ownership.md Enforcement 절도 동일. 부수적으로 AGENTS.md:123 열거에 `.claude/rules/`가 빠져 있어 always-loaded 미러가 규칙 대상인지 자체가 모호하다.
- **권고**: 두 절을 영어로 이전(skill-ownership 쪽은 이미 괄호 안에 병기된 "The hook is a 'navigate-by-mistake' defense only — do NOT rely on it"을 본문으로 승격하면 됨). AGENTS.md:123 열거에 `.claude/rules/`·`.claude/rules/references/` 추가. `./harness rule-check`/`context-check`가 못 잡는 종류이므로 검사 추가 검토.

#### M-8. CONTRIBUTING.md migrate 절차가 packaging-guide보다 3단계 짧아 잔재 정리 누락

- **경로**: `CONTRIBUTING.md:452-463` / `.harness/docs/packaging-guide.md:87-99`
- **문제**: CONTRIBUTING은 4단계(dry-run/migrate/커밋/bootstrap), packaging-guide는 8단계. 누락분이 정확히 이번 릴리스가 추가한 부분 — 선행 `./harness update --apply-harness`(packaging-guide:100-102가 "migrate의 초반 단계는 레포에 커밋된 자기 사본으로 실행된다. 사본이 낡으면 전환이 실패할 수 있으므로"라고 이유 명시)와 후행 `./harness prune-downstream [--apply]` + `git add -u && git commit`. specs/015가 밝힌 근본 원인이 "flow 2(전환 레포)에 정리 로직이 없어 잔재 영구 잔존"이고 그 해법이 이 prune 단계인데, CONTRIBUTING만 읽고 전환한 레포는 레포당 약 40건 잔재를 안고 시작한다. AGENTS.md가 CONTRIBUTING을 실무 워크플로우 입구로 지목해 도달률이 높다.
- **권고**: 절 전체를 "전환 절차의 정본은 `.harness/docs/packaging-guide.md` 7절"이라는 포인터 한 줄로 축약(현재 455행이 `specs/006-harness-migrate/`를 참조해 정본이 셋으로 갈라짐 — 그 참조는 specs/015 이전 문서라 낡은 절차로 인도). `git add -A`가 아니라 `git add -u`여야 한다는 점(T013 실측 근거: 비추적 materialize 링크를 도로 인덱스에 넣어 잔재를 재생산)은 반드시 보존.

#### M-9. bootstrap 단일 표면 결론이 문서 계층에 미반영 + README 자기모순

- **경로**: `README.md:92-95 ↔ 311-318` / `ARCHITECTURE.md:56-71` / `.harness/policies/update-policy.md:11-19`
- **문제**: 가장 실질적인 부분은 README 내부 모순 — 92~95행 "최초 설치든 일상 갱신이든 같은 명령입니다 … 상황에 따라 다른 명령을 고를 필요가 없습니다"와 317행 "`./harness install` | 이미 생성된 레포를 clone한 팀원"이 같은 문서에서 정면 충돌한다. 명령 선택 판단 제거가 specs/014 SC-002의 전부였는데 표가 그 판단을 되살린다. `bootstrap`이라는 단어는 `.harness/policies/**`·`.claude/rules/**`·`.codex/rules/**` 어디에도 없다(agent-routing.md:151은 일반명사).
- **권고**: (1) README 표의 `install` 행 실행 시점을 "문제 진단 시 또는 bootstrap 하위 단계로 자동 실행"으로 수정하고 표 앞에 "팀원 일상 명령은 `./harness bootstrap` 하나" 문장 추가. (2) ARCHITECTURE.md 배포 아키텍처 절에 "사용자 표면은 `./harness bootstrap` 단일" + 소유자 전용 경로(`prune-downstream --apply`) 구분 추가. (3) update-policy.md lock 모드 항목에 팀원 표면(bootstrap, 인덱스 불변)과 소유자 표면(prune-downstream, 인덱스 변경 허용) 경계 명시. (정책 계층은 에이전트 행동 규칙이지 사용자 명령 안내 계층이 아니므로 (3)은 우선순위 낮음.)

#### M-10. CI 안내가 삭제된 `restore-harness` 액션을 가리킴

- **경로**: `harness:32` / `.harness/scripts/pkg/pkg-sync.sh:46`
- **문제**: 업스트림 접근 실패(주로 private 레포 인증 실패) 경로에서 두 스크립트가 "(CI에서는 restore-harness 액션의 harness-token 입력을 사용하세요)"를 출력한다. `.github/actions/`에는 `cache-node-deps`만 있고 `CHANGELOG.md:201`이 "`.github/actions/restore-harness` 는 제거했다"고 자인한다. packaging-guide.md에도 `restore-harness`·`harness-token` 언급이 전혀 없어 참조할 대체 경로도 없다. CI가 lock 모드 하네스를 받지 못해 멈춘 가장 급한 순간의 오도.
- **권고**: 두 곳 문구를 실행 가능한 절차로 교체 — "actions/checkout 이후 하네스 레포 읽기 권한이 있는 토큰을 git credential 또는 `git config url.<...>.insteadOf`로 주입" 또는 `packaging-guide.md` 해당 절 참조. 안내 문구의 `.github/actions/<name>` 실존 검사 테스트 추가 시 재발 방지.

#### M-11. real:true gitignore 경로가 pkg-sync 통합 흐름에서 미검증 (버전 스큐 사각지대)

- **경로**: `tests/pkg-sync-gitignore.test.mjs:29,105` / `.harness/scripts/pkg/pkg-sync.sh:87-88`
- **문제**: v1.3.1의 `lockModeEntries {pattern, real:true}`는 105행에서 `ensure-gitignore.mjs`를 직접 spawn하는 단위 수준으로만 검증되고, 통합 테스트가 쓰는 SHARED 픽스처(29행)는 lockModeEntries를 전부 문자열로 넣어 real 분기를 한 번도 타지 않는다. `pkg-sync.sh:87-88`이 ensure-gitignore.mjs를 **캐시된 패키지 버전에서 먼저** 찾고 없을 때만 레포 사본으로 폴백하므로, 다운스트림이 구버전에 핀 고정돼 있으면 `real:true` 항목을 해석 못 하는 구버전이 실행된다(`ensure-gitignore.mjs:73`의 `typeof e.pattern === 'string'` 필터가 조용히 누락). 이 조합을 커버하는 테스트가 저장소 전체에 없다. 단, 실현되려면 구버전 핀 고정이 선행 조건이고 최신 채널 사용자는 영향 없음.
- **권고**: SHARED 픽스처 lockModeEntries에 `{pattern:'.specify/templates', real:true}`를 추가해 통합 경로가 real 분기를 타게 하고, "패키지의 ensure-gitignore.mjs가 구버전(real 미지원)" 시나리오를 `makeMigrateUpstream`으로 만들어 침묵 누락 대신 감지 가능한 동작을 고정.

#### M-12. stale-workcopy 파괴적 삭제 경로에 `.harness/skills` 실디렉터리 테스트 없음

- **경로**: `tests/prune-downstream-project-state.test.mjs:146` / `.harness/scripts/setup/prune-downstream.mjs:279-281`
- **문제**: `STALE_WORKCOPY_PATHS`에 `.harness/skills`가 있고 `gitRm` + `rmSync({recursive,force})`로 무조건 삭제하는데, 146행 테스트가 실제로 생성·삭제를 검증하는 대상은 `.harness/vendor`, `.harness/shared-manifest.json`, `CONTRIBUTING.md` 셋뿐이다. `.harness/skills`가 실디렉터리인 상태(migrate 중단, copy→lock 전환 실패, 수동 복사)는 미테스트. `gitRm`이 `--cached`라 인덱스만 회수하고 `rmSync`가 실파일을 지우므로 비추적 내용은 복구 불가. **반박됨**: `.harness/skills-local`은 `.harness/skills`의 하위가 아니라 형제 경로이고 `STALE_WORKCOPY_PATHS`에도 없어 이 경로로는 절대 지워지지 않는다.
- **권고**: 실디렉터리 `.harness/skills` 픽스처로 `--apply` 회귀 추가 + 같은 실행에서 `.harness/skills-local` 미삭제 assert. 삭제 대상 목록을 `--apply` 전에 stdout으로 확정 출력하는지도 고정하면 사용자 검토 지점이 생긴다.

#### M-13. 기능 허브 정본 테스트가 하드코딩 카운트에 묶임

- **경로**: `tests/feature-hub-canonical-data.test.mjs:56,89-115`
- **문제**: features 15, sitemap 노드 17, links 116, appears-on 53, depends-on 18 등 리터럴 카운트가 8곳 이상에 박혀 있고 테스트 이름에도 "최종 15개 기능"이 들어간다. 도메인 불변식이 아니라 데이터 스냅샷이라 spec 추가마다 무조건 고쳐야 한다(v1.3.1 커밋 87d90d6이 실제로 12줄을 14→15로 수정). 116·53·18 같은 링크 카운트는 사람이 옳은지 판단할 수 없는 숫자다.
- **권고**: 같은 파일 122~138행의 좋은 패턴(`expectedDependencies`/`expectedVerifications`를 features에서 유도해 `deepEqual`)을 appears-on·specified-by·satisfied-by에도 적용. length 단언은 `features.length === serviceDefinition.rows.length === traceability.entities.length` 상호 일치 + `> 0`으로 교체. 절대 카운트가 필요하면 `specs/` 디렉터리 개수에서 유도(현재 15로 일치).

#### M-14. 구현 소스에 정규식을 거는 단언들이 무해한 리팩터에 깨짐

- **경로**: `tests/harness-cli.test.mjs` (`Source = readFileSync` 5건)
- **문제**: `assert.match(guardSource, /SEGMENT_TERMINATOR\s*=/)`는 `tool-permission-guard.mjs:78`의 지역 상수 이름을 계약으로 굳혀 이름만 바꿔도 실패하고, 정규식이 존재만 보므로 내용이 틀려도 통과한다. `/from\s+"\.\/project-owned\.mjs"/`는 큰따옴표를 하드코딩해 저장소 대부분이 쓰는 작은따옴표로 통일하는 포매팅 변경만으로 깨진다. `project-owned.mjs` 소스에 `"apps"`,`".github"` 문자열이 있는지 보는 단언은 `isProjectOwned`가 export돼 있어 행위로 대체 가능하다.
- **권고**: `isProjectOwned('apps/x')`, `isProjectOwned('.github/x')` 직접 호출로 교체. `SEGMENT_TERMINATOR` 소스 정규식은 삭제(1041행 부근에 apps/front 차단·apps/back 허용을 실제 실행으로 검증하는 행위 테스트가 이미 있어 커버리지 손실 없음). 구조 규칙을 남길 경우 정규식을 `['\"]`로 완화.

#### M-15. `harness-cli.test.mjs` 149개 테스트·237KB 단일 파일 비대화

- **경로**: `tests/harness-cli.test.mjs`
- **문제**: 6,497행 237KB에 최상위 `test()` 149개, `describe()` 0개. 단독 실행 37.9초로 2위 pkg-migrate(14.2초)의 약 2.7배이며, `node --test`가 파일 단위로 병렬화하므로 이 파일 하나가 전체 완료 시간의 하한을 정한다. CLI 도움말·doctor·skill-injector·tool-permission-guard·init-project·prune-downstream이 섞여 있어 특정 기능만 골라 돌리기 어렵다.
- **권고**: prune-downstream(13건), init-project, skill-injector, tool-permission-guard를 각각 별도 파일로 분리(순수 이동이라 위험 낮음, `package.json`의 `tests/*.test.mjs` 글롭이 자동 포함). 남는 부분은 `describe()`로 그룹핑.

#### M-16. prune-downstream 테스트가 두 파일에 서로 다른 픽스처 스타일로 분산

- **경로**: `tests/harness-cli.test.mjs:5648-6471` (13건) / `tests/prune-downstream-project-state.test.mjs`
- **문제**: 전용 파일은 `helpers/downstream-fixture.mjs`의 `makePackage`/`makeDownstream`을 쓰는 반면 `harness-cli.test.mjs:6303`의 `makeMixedSpecsDownstream`은 인라인이며 `git init -q`만 호출해 user.email/user.name/commit.gpgsign 설정이 전혀 없다(헬퍼의 `initGitRepo`는 셋 다 설정). 같은 스크립트의 specs·examples·data 정리 동작이 흩어져 한쪽만 고치고 놓치기 쉽다.
- **권고**: harness-cli의 prune-downstream 블록을 전용 파일로 옮기고 인라인 픽스처를 헬퍼 조합으로 재작성. M-15 분할과 함께 처리.

#### M-17. `pkg-fixture.mjs`가 gpgsign을 끄지 않아 서명 환경에서 잠복 파손

- **경로**: `tests/helpers/pkg-fixture.mjs:21-22`
- **문제**: 저장소 전체 grep 결과 `gpgsign`은 `downstream-fixture.mjs:26` 한 줄만 매치하고 pkg-fixture는 user.email/user.name만 설정한다. `GIT_CONFIG_GLOBAL`은 `tests/` 전체에 0건이라 전역 설정 격리가 전무 — 개발자의 `commit.gpgsign=true`, `core.hooksPath`, `init.templateDir`이 테스트 레포에 그대로 상속된다. 전역 서명을 켠 머신에서 `makeFakeUpstream`의 `git commit`이 서명 시도로 실패하거나 GPG 프롬프트로 멈춘다. 현재 이 머신은 미설정이라 드러나지 않는 잠복 문제.
- **권고**: pkg-fixture의 `git()` 헬퍼에 `commit.gpgsign=false` 추가. 더 견고하게는 execFileSync 환경에 `GIT_CONFIG_GLOBAL=/dev/null`, `GIT_CONFIG_SYSTEM=/dev/null`. 두 헬퍼가 공통 git 실행기를 공유하면 한 번만 고치면 된다(L-9 참조).

#### M-18. ROADMAP.md에 specs/015 행 통째 누락 + 드리프트 자동 감지 장치 부재

- **경로**: `ROADMAP.md` / `.harness/scripts/docs/feature-status-sync.mjs`
- **문제**: ROADMAP 표는 001~014만 담고 방금 출하한 015 행이 없다(`grep -n "015" ROADMAP.md` 매치 없음). 같은 기능이 CHANGELOG(v1.3.0/v1.3.1)와 `data/feature-definitions.json`(15건)에는 모두 등재돼 ROADMAP만 뒤처졌다. **구조적 갭**: `.harness/scripts`·`tests` 전체 검색 결과 ROADMAP 참조가 전부 project-owned 분류 또는 테스트 픽스처뿐이고 내용 정합 검사는 하나도 없다. `feature-status-sync.mjs`는 status.yaml만 수정하고 ROADMAP을 읽지 않으며, `doctor.sh:513-516`은 `-f ROADMAP.md` 존재만 확인한다. AGENTS.md는 "P5 Ship: update the root ROADMAP.md"로 ROADMAP을 cross-feature 정본으로 규정하는데 그 목적이 조용히 무너진다.
- **권고**: 015 행 추가(`| 다운스트림 잔재 정리 완결 | done | [specs/015-downstream-residue-cleanup](specs/015-downstream-residue-cleanup/) |`). 재발 방지로 doctor 또는 `planning:check`에 "specs/<NNN>/ 디렉터리마다 ROADMAP 링크 행이 있고 status.yaml과 일치하는가" 비차단 경고 추가. `release-check.sh`에 "ROADMAP에 해당 spec 행이 있고 status가 done인가" 항목 추가.

#### M-19. specs/015 status.yaml이 in-review로 고착 (동기화 도구가 done 전이 제안 중)

- **경로**: `specs/015-downstream-residue-cleanup/status.yaml`
- **문제**: tasks.md 27/27 완료, verification 6/6, 열린 결정 0건, 롤아웃 기록(6개 레포 잔재 0건)까지 끝났는데 status는 `in-review`, history 마지막 전이가 2026-07-30. **레포 자체 도구가 자기 증명**: `node .harness/scripts/docs/feature-status-sync.mjs` 실행 시 정확히 `015-downstream-residue-cleanup: in-review → done (모든 작업 완료 · 검증 100% 기록 · 열린 결정 0건)`을 제안한다. AGENTS.md가 요구하는 `mise run feature:status:sync`가 v1.3.1 작업에서 빠진 순수 누락. 도구가 004/014는 제안하지 않아 그 둘의 in-review는 사람 게이트 미완으로 정당하며 **015만 진짜 stale**이다.
- **권고**: **H-5(태그 발행) 해소 후에** 적용 — 미발행 상태에서 done으로 전이하면 실체 없는 '출하 완료' 표기가 하나 더 늘어 드리프트가 악화된다.
  ```sh
  FEATURE_STATUS_DATE=$(date +%Y-%m-%d) mise run feature:status:sync --apply --id 015-downstream-residue-cleanup
  ```

#### M-20. 2026-08 스킬 재측정 기한(3일 뒤)에 트래킹 표면 없음

- **경로**: `docs/audits/2026-08-skill-usage-recheck-plan.md:1-3` / `ROADMAP.md`
- **문제**: 계획서가 "execute on/after 2026-08-03", "Status: PENDING"인데 오늘 2026-07-31. `skill-usage-recheck`·`2026-08-03`을 ROADMAP·CHANGELOG·AGENTS.md에서 검색한 결과 매치 0건이고 specs의 unchecked task로도 등재되지 않아 in-flight 점검에 걸리지 않는다. 유일한 기억 장치가 사용자 MEMORY.md뿐이라 세션이 바뀌면 넘어갈 가능성이 높다. L-4(죽은 `.planning` 경로)와 결합하면 실행자가 존재하지 않는 경로를 따라간다.
- **권고**: ROADMAP.md 하단 '예정 작업'에 한 줄 등재하거나 별도 spec/이슈로 승격해 unchecked task로 만든다. 실행 시 `2026-07-speckit-pilot-plan.md:150-152`가 "rules B/C are superseded by this migration once the pilot passes"라고 하므로 rule A(GStack 게이트) 중심으로 범위 축소 판단 가능.

#### M-21. 감사 문서가 삭제된 `.planning/` 경로를 실행 경로로 안내

- **경로**: `docs/audits/2026-07-06-skill-usage-audit.md:104-105` / `docs/audits/tools/skill-usage.mjs:2`
- **문제**: `.planning/`은 2026-07-07 결정으로 완전 삭제됐는데(`ls .planning` → No such file), 감사 문서 104~105행이 재측정 계획서와 측정 스크립트를 `.planning/audits/...`로 안내하고 스크립트 헤더 주석도 `node .planning/audits/tools/skill-usage.mjs --since 2026-07-07` 예시를 그대로 갖고 있다. 사흘 뒤 재측정 실행자가 이를 근거로 삼으면 ENOENT를 만나거나 `.planning/`을 새로 만들어 은퇴 결정을 되돌린다.
- **권고**: `skill-usage.mjs:2` 헤더 주석을 `node docs/audits/tools/skill-usage.mjs`로 정정(필수). 감사 문서 104~105행은 당시 사실 기록이므로 서술을 고치기보다 현재 위치를 덧붙이는 편이 정확하다. (실행 진입점인 재측정 계획서 22행은 이미 올바른 경로를 담고 있어 실제 오작동 확률은 낮음.)

#### M-22. specs/010이 15일째 in-progress — 사람 게이트 T098 무기한 정체

- **경로**: `specs/010-planning-hub-redesign/tasks.md:270,273` / `status.yaml`
- **문제**: 130개 중 128개 완료, 미체크는 T098(PM/PL·개발자 5명 대상 SC-001 사용성 검증)과 T101 둘뿐. status는 2026-07-16 이후 전이 없음(현재 2026-07-31). T098은 "자동 검증으로 대체 금지"가 verification.md와 리서치 문서 양쪽에 못 박혀 있어 에이전트가 임의로 닫을 수 없는 구조적 블로커다. 문제는 AGENTS.md의 "unchecked tasks가 있는 in-flight feature를 먼저 재개하라" 규칙 때문에 새 Medium+ 작업마다 010이 걸린다는 점 — 013/014/015가 실제로 010 미해소 상태로 진행돼 그 규칙이 이미 형해화됐다.
- **권고**: 사용자 결정 필요 → 3) 참조.

### LOW

#### L-1. `is_project_owned_path` 셸 fallback 3중 관리
- **경로**: `.harness/scripts/setup/update.sh:66-82` / `update-check.sh:105-121` / `project-owned.mjs`
- **문제**: 두 셸 사본이 문자 단위로 동일하고 `harness-cli.test.mjs:2842`가 두 셸 사본 간 동일성만 검증하며 mjs 정본과는 대조하지 않는다. **단, 현재 시점에 실제 드리프트는 없다** — 항목 집합이 정확히 일치하며 examples/도 세 곳 모두 반영됨. 잠재 위험.
- **권고**: fallback을 공용 `.sh` 하나로 추출해 두 스크립트가 source하고, mjs 정본과의 항목 집합 일치를 소스 대조 테스트로 고정. (fallback 은퇴 대안은 M-3과 마찬가지로 기존 테스트를 건드림.)

#### L-2. `prune-downstream`이 launcher에서 HARNESS_ROOT 없이 실행
- **경로**: `harness:146-148` / `prune-downstream.mjs:37-52` / `pkg-sync.sh:112`
- **문제**: launcher가 다른 node 서브커맨드에는 `$ROOT_DIR`를 넘기는데 prune-downstream만 HARNESS_ROOT 미설정. `reclaim-shared.sh:22`는 넘겨 호출 규약이 불일치. **다만 실패 시나리오는 매우 좁다** — `git rev-parse --show-toplevel`이 레포 하위 어디서든 루트를 반환하므로 정상 git 레포에서는 캐시 폴백이 발동하지 않고, git 없는 환경에서는 핵심 로직 자체가 no-op다. `pkg-sync.sh:112`는 cd가 레포 루트라 안전.
- **권고**: 순수 방어로 `HARNESS_ROOT="$ROOT_DIR" mise exec -- node ...` 로 변경.

#### L-3. upstream 소유 경로 목록 3중 병렬 하드코딩
- **경로**: `materialize.sh:68-69,147,152` / `migrate-plan.mjs:33-42` / `upstream-project-state.mjs:109-128`
- **문제**: 세 목록이 부분집합/초집합 관계로 병렬 관리되고 동기화가 파일 주석에만 의존. **단 한 쌍은 이미 가드가 있다** — `tests/prune-downstream-project-state.test.mjs:201-212`(다만 H-7이 지적하듯 약함). 남는 갭은 `SHARED_DIR_ROOTS` ↔ materialize 쌍.
- **권고**: materialize 링크 목록을 `.mjs` 상수로 추출해 셸이 node로 읽게(materialize.sh:86-99의 KEEP_SUBS 패턴 재사용). H-7 강화와 함께 처리.

#### L-4. `skill-usage.mjs` 헤더 주석 죽은 경로 → M-21과 동일 항목(병합)

#### L-5. `reclaim-shared.sh` 은퇴 예고에 시한이 없음 + bootstrap 주석 부정확
- **경로**: `.harness/scripts/pkg/reclaim-shared.sh:2-6` / `bootstrap.sh:25` / `bootstrap-summary.mjs:33` / `shared-manifest.json:161`
- **문제**: 실행 호출자 0건이지만 **삭제하면 안 된다** — 헤더가 "외부 직접 호출 호환을 위해 한 버전 동안 보고 전용 wrapper 로 남는다"고 명시하고 대상은 구버전 다운스트림의 직접 실행이다. `bootstrap-summary.mjs:33`의 `reclaimed` legacy 키도 의도적 관용 처리. 실제 결함은 둘 — (a) `bootstrap.sh:25` 주석이 여전히 "하위 단계(pkg-sync / reclaim-shared / doctor)"라고 존재하지 않는 생산자를 가리킨다, (b) 은퇴 예고가 스크립트 헤더와 CHANGELOG v1.3.0에만 있고 "다음 major"라고만 해 시한이 뜬다.
- **권고**: `bootstrap.sh:25` 주석에서 `reclaim-shared` 제거 → "하위 단계(pkg-sync / doctor)". 제거 대상 버전(예: v2.0.0)을 헤더에 명시하고 ROADMAP.md에 한 줄 등재.

#### L-6. `package.json` start 스크립트 3종이 빈 스캐폴드를 가리켜 즉시 실패
- **경로**: `package.json:13-15` / `apps/front` / `apps/back`
- **문제**: `apps/front`·`apps/back`에 `package.json`이 없어(`.env.example`, `.infisical.json`, `.prettierrc`, `AGENTS.md`, `CLAUDE.md`, `eslint.config.mjs`만 존재) 하네스 저장소에서 `npm start`가 실패한다. **단 고아 스크립트가 아니다** — `init-project.sh:310`의 `normalize_app_start_scripts`가 `package.json` 부재 시 즉시 return하고, 실제 감싸는 것은 `dev`뿐이며 `start`는 오히려 dev-runner 접두를 **제거**하는 마이그레이션 대상이다(배포 환경에 `.harness` 경로가 없어 깨지기 때문). 즉 앱 스캐폴드가 채워지면 정상 동작하는 템플릿 진입점.
- **권고**: 삭제보다 `"start"`에 안내 메시지를 넣거나 README에 "앱 스캐폴드 이후 동작"을 명시.

#### L-7. copy 모드 기본 help에 일상 갱신 경로 없음
- **경로**: `harness:165-173` / `bootstrap.sh:128-129`
- **문제**: 기본 help가 bootstrap을 "최초 설치와 일상 갱신 모두 이 명령"으로 설명하지만 bootstrap.sh는 `./harness install`만 호출하고 `harness:65-72`의 install 분기는 `harness.lock`이 있을 때만 pkg-sync를 실행한다 → copy 모드에서 bootstrap은 하네스 파일을 갱신하지 않는다. 다만 copy 모드는 은퇴 예고 상태이고 preflight가 update-check를 자동 실행해 갱신 필요를 알린다.
- **권고**: help 문구에 lock 전제 명시, 또는 bootstrap.sh에서 `harness.lock` 부재 시 "copy 모드입니다 — 갱신은 `./harness update`, 전환은 `./harness migrate`" 1회 출력.

#### L-8. copy 모드 은퇴 예고가 CLI 출력에만 존재
- **경로**: `.harness/docs/update-guide.md:6-13` / `packaging-guide.md:14` / `update-policy.md:20-22` / `ARCHITECTURE.md:67-68`
- **문제**: `update.sh:434-442`가 `--apply-harness`마다 은퇴 예고를 출력하지만, 문서 계층에서 `은퇴|retire|deprecat` grep 히트 0건(`.planning` 건만 검출)이고 전부 "(레거시)" 한 단어에 그친다. `update-guide.md`는 문서 전체가 copy 적용 상세인데 독자가 자기 모드의 제거 예정을 알 방법이 없다.
- **권고**: `update-guide.md` 상단에 은퇴 예고 박스 추가 + `packaging-guide.md` 1절 표 copy 행 각주 + `update-policy.md` copy 항목. 제거 시점은 specs/014가 "전환 완료 확인이 조건이며 기간은 조건이 아니다"로 정했으므로 날짜 없이 조건만 서술.

#### L-9. 두 픽스처 헬퍼가 git 레포 생성 로직 중복
- **경로**: `tests/helpers/pkg-fixture.mjs:9` / `downstream-fixture.mjs:18`
- **문제**: `git()` 래퍼가 거의 동일(trim 유무만 차이), pkg-fixture는 `mkdtempSync`를 16·17·55·56·64·99행에서 인라인 반복하고 파일 쓰기도 인라인. `makeDownstreamRepo`/`makeDownstream` 두 이름 공존. **중복 자체보다 비대칭이 비용** — 실제로 gpgsign(M-17)과 임시 디렉터리 정리(H-6) 누락이 한쪽에만 생겼다.
- **권고**: `git` 실행기·`tmp()`·`write()`를 `helpers/fixture-base.mjs`로 추출해 공유. 도메인 함수(makeFakeUpstream=패키징, makeDownstream=잔재 정리)는 관심사가 달라 분리 유지.

#### L-10. `codi-feature-hub`·`codi-rule-authoring`이 skill-triggers.json에 없음
- **경로**: `.harness/config/skill-triggers.json` / `AGENTS.md:104`
- **문제**: 15개 키에 두 스킬이 없다. `AGENTS.md:104`가 `codi-rule-authoring` 사용을 명시하고 `codi-feature-hub`는 SKILL.md description에 한국어 트리거를 선언하는데, UserPromptSubmit 훅은 skill-triggers.json의 keywords로만 제안한다. **단 실효는 좁다** — 두 스킬이 available-skills 목록에 description과 함께 이미 노출돼 Skill 도구로 직접 호출 가능하고, skill-injector는 CLAUDE.md가 명시하듯 "suggestion only, not enforced". 역방향 드리프트는 없음.
- **권고**: SKILL.md에 이미 있는 트리거 어휘 추가 + "`.harness/skills/`의 모든 스킬은 skill-triggers.json 항목을 갖는다(의도적 제외는 명시 allowlist)" 테스트 추가.

#### L-11. `shared-manifest.json`의 `source_ref`가 기능 브랜치명으로 고착
- **경로**: `.harness/shared-manifest.json` / `generate-manifest.mjs:14`
- **문제**: v1.3.1 릴리스 직후 v2 브랜치인데 `source_ref: "fix/015-followups"`. files 목록 자체는 최신(tracked ∩ !isProjectOwned와 양방향 차집합 공집합, 324건). pre-commit이 `git rev-parse --abbrev-ref HEAD`로 채우므로 기능 브랜치 마지막 커밋 이름이 굳는다. `generate-manifest.mjs:14` 주석이 source_ref 오염을 다운스트림 재생성 금지 근거로 들 만큼 출처 식별자로 취급하는데 정작 업스트림 값이 임시 브랜치를 가리킨다. 런타임 소비자는 없어 실害 없음.
- **권고**: `release-check.sh`에 "source_ref가 릴리스 대상 브랜치/태그와 일치하는가" 검증 추가. (태그/SHA로 바꾸는 대안은 브랜치명 오염 탐지 근거를 약화시키므로 비권장.)

#### L-12. 열린 결정 `DEC-HARNESS-DETAIL-BACKFILL` 3주 방치
- **경로**: `data/decisions.json` / `data/feature-definitions.json`
- **문제**: 012(2026-07-18 done)의 열린 결정이 `status: open` 그대로. `data/feature-details.json` 파일 자체가 없는데 15개 기능 전부 `detailId`를 보유하고, definitionStatus는 draft 11 / approved 4로 신규 013/014/015가 전부 draft로 들어와 부채가 늘고 있다. **단 기능적 파손은 없다** — `build-traceability-coverage.mjs:140`, `render-planning-page.mjs:274`, `render-feature-workbench-view.mjs:100,304`가 모두 `|| null` 폴백을 쓰고 `scan-feature-details.mjs:51`이 `feature-detail-missing` 헬스 경고를 정상 방출한다. 추적된 부채이지 지금 망가진 것이 아님.
- **권고**: 사용자 결정 필요 → 3) 참조.

#### L-13. `harness.lock.example`이 spec 005 T002 명세 미반영
- **경로**: `harness.lock.example` / `migrate.sh:90,116`
- **문제**: `{"schema_version": 1, "channel": "latest-minor"}` 3줄뿐. `specs/005/tasks.md:24` T002는 "채널/고정 두 형태 주석 포함"으로 명세했고 `[x]` 체크됐으나 미이행. 실제 생성 lock은 `repo` 필드를 항상 포함(migrate.sh:116). `resolve-version.mjs:24`가 repo를 optional로 처리해 파싱은 안 깨진다. 마지막 수정이 v1.1.4(2b3e178)라 v1.2~v1.3 변화 미반영.
- **권고**: `repo` 필드 추가(최소). **주의: JSON은 주석을 지원하지 않으므로 "주석 포함 두 형태"를 파일 하나에 담으면 파싱 불가 파일이 된다** — 별도 문서/두 파일/README 병기 중 택일.

#### L-14. `doctor`의 배포 모드 보고가 문서에 미안내
- **경로**: `.harness/scripts/checks/doctor.sh:267-281` / `packaging-guide.md:11-15`
- **문제**: doctor가 `배포 모드 lock (버전 X)` / `배포 모드 copy — 전환하려면 ./harness migrate`를 보고하는데(specs/014 FR-008), packaging-guide 표는 판별 수단을 `harness.lock` 존재라는 수동 확인으로만 적는다. 문서가 틀린 것은 아니고 더 나은 수단의 미안내.
- **권고**: packaging-guide 1절 표 아래와 README doctor 언급 지점에 한 줄 추가.

#### L-15. 패키징 계열 테스트가 매번 실 git 레포 재구축
- **경로**: `tests/pkg-migrate.test.mjs` / `bootstrap-flow.test.mjs` / `pkg-fetch-materialize.test.mjs`
- **문제**: `makeFakeUpstream` 호출이 pkg-fetch-materialize 9회, pkg-migrate 7회, pkg-pin-update·pkg-sync-gitignore 각 3회이고 매번 bare + work 두 레포를 만든다. harness-cli 37.9초 + pkg-migrate 14.2초만으로 52초. **단 실 셸 스크립트 통합 검증이라 실 git 사용 자체는 정당하며 모킹은 가치를 떨어뜨린다.**
- **권고**: 동일 versions 인자 업스트림을 파일 단위 1회 생성해 읽기 전용 공유(테스트는 각자 다른 다운스트림으로 격리). `addUpstreamVersion`은 `pkg-pin-update.test.mjs:52,65,75,135`에서 업스트림에 태그를 push해 상태를 변형하므로 **전용 인스턴스 필수**. H-6 정리 작업과 함께.

---

## 3) 결정 필요 (소유자 판단)

### D-1. GitHub Actions 결제 문제 해소 및 v1.3.1 재발행 — **최우선**
`gh run view 30593309080`가 "recent account payments have failed or your spending limit needs to be increased"를 반환한다. 이것이 풀리기 전까지 **모든 릴리스가 조용히 누락된다.** 결제 해소 → 재발행 → 6개 다운스트림 레포에 `./harness update` 안내까지가 한 묶음이며, M-19(015 done 전이)는 이것이 끝난 뒤에 해야 한다.

### D-2. specs/010 T098(실사용자 5명 사용성 검증)을 어떻게 닫을 것인가
"자동 검증으로 대체 금지"가 verification.md와 리서치 문서에 명시돼 에이전트가 임의로 닫을 수 없다. 선택지: (a) 5명 세션 일정을 실제로 잡는다, (b) SC-001을 축소한다(3명 또는 내부 인원), (c) 별도 후속 spec으로 분리해 010을 닫는다. 결정 전까지는 010이 in-flight 재개 규칙의 상시 예외라는 점을 status.yaml 또는 ROADMAP에 한 줄 명시해 후속 작업이 매번 판단을 반복하지 않게 한다. (`./harness notify-decision` 권장)

### D-3. `DEC-HARNESS-DETAIL-BACKFILL` 결정 종결 방향
(a) 우선순위 상위 3~5건만 feature-details를 작성하고 나머지를 명시적 범위 밖으로 선언해 close, 또는 (b) 하네스 자체 워크스페이스는 상세 없이 카탈로그만 운영하기로 확정하고 `detailId`를 제거해 close. 어느 쪽이든 owner=product 판단 필요. 방치 자체가 비용(허브 빈 상세 + draft 11건 누적).

### D-4. `.specify/` 벤더 사본을 생성물로 전환할 것인가 (1-2)
`git rm --cached` 시 신규 clone이 `place-speckit-assets.sh` 실행 전까지 speckit 템플릿 없이 시작한다. 부트스트랩 순서와 `speckit-drift-check.mjs` 전제를 확인한 뒤 결정. 리뷰 노이즈 절감(66KB, 벤더 업데이트 diff 절반) vs 초기 부트스트랩 취약성의 트레이드오프.

### D-5. `docs/superpowers/` 이력 문서 처리 방향 (1-1)
`git rm`으로 삭제(git history에 보존, specs/010이 정본을 대체) vs `docs/audits/`로 이동(project-owned 분류로 다운스트림 배포만 차단). 후자를 택하면 `data/feature-definitions.json`의 3개 인용을 새 경로로 갱신하면 되고, 전자를 택하면 인용을 specs/010으로 대체해야 한다.

### D-6. 시스템 temp 누적분 5.3GB 일괄 삭제 승인 (1-6)
파괴적 작업이므로 명시 승인 필요. 삭제 대상은 `$TMPDIR/codi-*` 78,230개.

---

## 4) 전체 건강 요약

이 저장소는 **패키징·배포 메커니즘 자체는 정교하지만, 그 메커니즘을 서술하는 문서와 그것을 지키는 테스트가 코드 변화 속도를 못 따라가고 있다.** 검증된 34건 중 가장 비싼 부류는 "링크·ignore·prune 세 목록이 병렬 하드코딩돼 한쪽만 갱신되는" 드리프트로, `.harness/docs/**` 13개 가이드가 lock 전환 시 복원 경로 없이 영구 소실되는 H-1이 그 대표 사례다. 이것이 잡히지 않은 이유가 H-7 — 드리프트 가드 테스트가 basename 부분문자열 단방향 대조라 링크 대상을 실제로 삭제해도 통과한다는 점이 시뮬레이션으로 입증됐고, 소스 주석은 그 가드가 "소스 대조로 고정"한다고 실제보다 강하게 선언해 다음 편집자를 안심시킨다. 따라서 H-1과 H-7은 반드시 한 묶음으로 처리해야 한다.

문서 계층은 v1.3.x 변화를 대체로 반영하지 못했다. `update-policy.md`의 gitignore 절은 사실 오류 3건을 담고 있고, init-project 잔재 정리를 4개 문서가 낡은 `--reset-git` 전용 동작으로 설명하면서 5경로 하드코딩 `rm -rf` 예시까지 제시해 **문서를 따르면 실제로 잔재 3건이 첫 커밋에 들어간다.** `project-owned.mjs` 주석이 examples/ prune 정책을 정면 부정하는 것도 같은 부류로, 커밋 92fa706이 "두 개념이 섞인 것이 결함의 뿌리"라고 지목하고도 그 뿌리 주석은 고치지 않은 결과다. 이 세 건은 모두 문서 편집만으로 해결되고 테스트를 깨지 않아 비용 대비 효과가 가장 높다.

가장 시급한 것은 코드가 아니라 인프라다 — **v1.3.1은 CHANGELOG·specs상 '출하 완료'로 읽히지만 실제로는 GitHub Actions 결제 실패로 태그조차 발행되지 않았고, 그 수정 3건은 어떤 다운스트림에도 도달하지 않았다.** 결제가 풀릴 때까지 이후 모든 릴리스가 동일하게 조용히 누락되므로 D-1이 다른 모든 항목에 선행한다. 테스트 위생 쪽에서는 픽스처 헬퍼의 임시 디렉터리 미정리로 개발자 머신에 78,230개/5.3GB가 누적된 상태이며, 이 누수와 gpgsign 미격리가 모두 "두 헬퍼가 갈라진 결과 한쪽에만 적용된" 동일 원인이라 `fixture-base.mjs` 추출 한 번으로 함께 해소된다. 전반적으로 **구조적 결함은 적고 동기화·서술 부채가 지배적**이라, 위 항목 대부분은 단일 릴리스 사이클 안에서 정리 가능하다.
