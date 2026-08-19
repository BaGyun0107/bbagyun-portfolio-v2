# Changelog

하네스 패키지 릴리스 기록. 새 버전 절(`## vX.Y.Z`)을 포함한 PR이 v2에
머지되면 CI(release.yml)가 태그와 GitHub Release를 자동 발행한다 —
머지가 곧 릴리스 승인이다. 절이 없는 머지는 릴리스가 아니다(배칭).
`./harness release vX.Y.Z` 는 수동 fallback으로 남는다 (specs/005).
major는 breaking 변경 전용이다.

## v1.6.3

패치 릴리스 (2026-08-13). apps/** 일괄 편집 비차단 경고.

- **일괄 in-place 편집 비차단 경고** (#138): `sed -i`·`perl -i`·
  `awk -i inplace`(xargs·`find -exec` 경유 포함)가 `apps/**`를 겨냥하면
  guardrails 훅이 비차단 경고를 낸다. 근거: 그누보드 파일럿 실측
  (2026-08-13) — 일괄 스크립트 편집이 lint를 통과한 채 앱 코드를 5회
  조용히 파손(정규식 다중행 파손·짝 삽입 누락·함수 경계 미인식),
  문서 규칙만으로는 재발을 못 막았다. 정당한 사용이 있어 차단하지
  않으며, Codex는 경고 미포팅(파일럿 범위: 차단만)이 수용된 비대칭.
  회귀 배터리 12건 동봉.

## v1.6.2

패치 릴리스 (2026-08-07). 사용자 설정 gstack 훅 잔재 감지.

- **gstack-cleanup·doctor의 설정 훅 잔재 감지**: gstack 디렉터리를
  지워도 사용자 `~/.claude/settings.json`의 훅이 삭제된 gstack
  바이너리를 계속 참조하면 모든 프로젝트의 세션이 깨진다(2026-08-07
  실측 — SessionStart·AskUserQuestion 훅 3건). `gstack-cleanup`이 해당
  참조를 감지해 위치·줄까지 안내하고(`--quiet` 종료 코드에 포함 →
  doctor 경고 연동), JSON 자동 편집은 하지 않고 수동 제거를 안내한다.

## v1.6.1

패치 릴리스 (2026-08-07). 대형 레포 ENOBUFS 수정.

- **git exec 버퍼 한도 수정**: `migrate-plan.mjs`·`prune-downstream.mjs`·
  `generate-manifest.mjs`의 git 호출이 Node 기본 maxBuffer(1MB)를 그대로
  써서, 추적 파일이 많은 다운스트림(gnuboard 파일럿 실측 `git ls-files`
  1.4MB)에서 `spawnSync git ENOBUFS`로 migrate/prune이 죽던 문제.
  maxBuffer 64MB로 상향 + >1MB 픽스처 회귀 테스트 추가.

## v1.6.0

마이너 릴리스 (2026-08-07). 프로젝트 소유 규칙 경로 + 그누보드5 PHP
쇼핑몰 지원.

- **프로젝트 소유 규칙 경로(rules-local) 신설** (#132, specs/020):
  다운스트림 팀 규칙의 보장 경로 `.harness/rules-local/*.md` 신설 —
  project-owned 4중 등재, `./harness skills-link`가
  `.claude/rules/local/`로 상대경로 심링크(Claude 상시 로드), Codex는
  AGENTS.md 로드 문구 + preflight 목록 안내. 업스트림 `local/` 배포
  금지 가드.
- **배포 이력 기반 stale 삭제 제한** (#132, specs/020): update의 stale
  정리가 이전 로컬 shared-manifest에 실재했던 파일만 삭제한다. 배포
  이력 없는 파일은 보존 + rules-local 이전 안내, manifest 부재 시 삭제
  전체 생략(fail-safe). doctor에 다운스트림 한정 이전 힌트.
  2026-08-07 다운스트림 오삭제 사고(45건, gnuboard 830건과 동일 형태)
  재발 방지 완결.
- **그누보드5 PHP 쇼핑몰 지원** (#133, specs/021): `php-monolith`
  프로필 모드(레지스트리·가드·인젝터가 Node 앱 표면 전제를 차단, 몰
  코드는 `apps/<mall>/`)와 `codi-gnuboard` 공유 스킬 신설 —
  그누보드/영카트 5.6.32 구조 안내, 서버 상주 코드 git 온보딩(몰당
  1레포, `data/`·덤프·시크릿 제외), 로컬 Docker 환경 템플릿(php 7.4 +
  MySQL 5.7, 파일럿 실측 함정 대응 포함), PHP 몰 e2e 스위트 예시(게이트
  소유는 codi-e2e 유지). `.php` 감지 path-scoped Claude 룰 +
  Codex 미러(`php-monolith.rules`)로 양 런타임 라우팅 패리티.

## v1.5.0

마이너 릴리스 (2026-08-07). GStack 전면 제거·Playwright MCP 대체 + 최초
설정 단순화 + 업스트림 워크플로 가드.

- **GStack 전면 제거 + Playwright MCP 대체** (#128, #129): 2026-08-06 스킬
  사용 재측정 근거 + 사용자 결정. Playwright MCP를 양 런타임 사용자 레벨
  등록(`@playwright/mcp@0.0.79` 핀, 단일 소스:
  `mcp-registration-check.mjs`)하고 install/preflight/doctor에 패리티
  점검을 통합. gstack 잔존 검출 회귀 테스트, 재설치 절차는
  `.harness/docs/gstack-rollback.md`. PHP(gnuboard) 리허설 스택에서 폼
  조작·다이얼로그 처리까지 파일럿 검증.
- **최초 설정 단순화** (#130): init-project 스킬 질문 계약에 git 히스토리
  재시작(`--reset-git`, 기본 예) 추가 + 정본 CLI 단일성 계약 테스트.
  `./harness new-project <dir>` 스켈레톤 시작점(런처+harness.lock+씨앗)
  신설 — bootstrap 자가 부트스트랩으로 doctor 도달, init-project는 스켈레톤
  출발 시 히스토리/잔재 정리를 생략. bootstrap의 Chromium 설치 자동화.
- **다운스트림 `tools/` 보호** (2026-08-07 gnuboard 사고 후속): 구버전
  update.sh(다운스트림 고유 파일 보호 도입 전)가 이관 도구 830개를 구버전
  공유 파일로 오판·삭제한 사고의 재발 방지. `tools/`를 project-owned로
  4중 정합(Node 분류기·셸 fallback·정책·테스트) 등재하고, 사고 형태(어떤
  보호 목록에도 없는 루트 디렉터리)를 update 적용 회귀 테스트에 핀 고정 —
  삭제는 이전 로컬 shared-manifest에 실재한 파일로만 제한된다는 계약 검증.
- **전역 잔재 정리 명령**: `./harness gstack-cleanup` 신설 (기본 check,
  `--apply` 삭제, `--quiet`는 doctor 연동용 종료 코드). 이름이 같아도
  gstack 소유 증거(중앙 심링크/마커) 없는 스킬은 보존. doctor가 잔재를
  감지하면 비차단 경고로 정리를 안내 — 팀원 머신 전파는 이 경고가 담당.
- **업스트림 워크플로 가드**: 하네스 레포에서는 release.yml 외 워크플로를
  실행하지 않는다 — 공유 워크플로(pipeline, dependency-security-pr)는 잡
  단위 repository 가드(다운스트림 동작 불변), harness-ci는 수동
  실행(workflow_dispatch) 전용으로 전환하고 v2 PR 검증은 로컬 품질 게이트
  4종이 대신한다.

## v1.4.1

패치 릴리스 (2026-08-06). Actions 분 절감 마무리 + Claude 5 세대
프롬프팅·컨텍스트 가이드 반영.

- **스케줄 주 2회 축소** (#125): pipeline.yml 의 매일 새벽 스케줄을
  월·금 02:30 KST(`30 17 * * 0,4` UTC)로 축소. 스케줄 런은
  dependency-security 만 실행한다.
- **캐시 게이트 잡 통합** (#125): dependency-security.yml 의
  dependency-full-scan-cache 잡을 osv-full 선행 스텝으로 통합 —
  잡 단위 분 올림 과금을 실행마다 1분씩 절감.
- **Claude 5 세대 가이드 반영** (#126): karpathy.md 산출물 길이 보정,
  agent-routing.md Subagent Economy 절(검증용 서브에이전트 금지),
  codi-rule-authoring Claude 5-Era Authoring Notes(리뷰 룰 커버리지
  우선·목표 중심 서술·지침 중복 금지), context-engineering.md
  발견 가능 사실 배제 원칙.

## v1.4.0

마이너 릴리스 (2026-08-04). GitHub Actions 트리거·비용 최적화 (free 플랜
분 한도 대응) + 하네스 자체 CI 신설.

- **PR 트리거 CI 제거**: pipeline.yml 의 `pull_request`/`merge_group`
  트리거 제거 — 머지 후 push 검증이 배포 게이트라 PR CI 는 이중 실행.
  의존성 변경 PR 은 dependency-security-pr.yml 이 계속 담당한다
  (Renovate automerge 필수 체크 + OSV 사전 게이트 유지).
- **머지 후 CI 실패 Slack 알림**: PR CI 제거로 push 검증이 첫 실패
  신호가 되므로, ci-node 실패 시 배포가 조용히 스킵되지 않도록
  pipeline.yml 에 notify-ci-failure 잡 추가.
- **스케줄에서 ci-node 제외**: 새벽 스케줄(KST 02:30)의 목적은 신규
  취약점 탐지 — 코드 불변인데 매일 전체 검증을 재실행하던 낭비 제거.
- **ci-node 검증 스코프 apps 기본값**: 루트 package.json 은 하네스
  도구 전용이라 기본 검증 범위에서 제외 (`CI_NODE_VERIFY_SCOPE` repo
  var 로 재정의 가능).
- **하네스 자체 CI 신설**: v2 대상 PR 에서 npm test + actionlint +
  planning:check 를 도는 harness-ci.yml (업스트림 전용, 다운스트림은
  prune 목록으로 정리).
- **Infisical CLI 주 단위 바이너리 캐시**: setup-infisical 컴포지트
  액션 신설 — 배포/알림 잡 6곳의 apt 설치를 캐시 히트 시 스킵.
- **Docker 배포 GHA 레이어 캐시**: buildx 만 세팅하고 캐시 없이
  `docker build` 하던 것을 docker/build-push-action + type=gha
  캐시로 교체 (backend/frontend 각각 env 별 scope 분리).
- **기타**: detect-deploy-targets 전체 클론 제거(depth 2 + 기준 커밋
  개별 fetch), release.yml concurrency/timeout 추가, ci-node.yml 내부
  중첩 concurrency 제거.
- **PM2 서버 실행 ENV 판정 수정** (codi-account 역반영): deploy 스크립트
  인자 ENV 가 브랜치명만 보고 `inputs.environment` 를 무시해, dispatch 로
  브랜치와 다른 환경 배포 시 시크릿/env 파일과 서버 기동 모드가 갈라지던
  문제 — main 단일 브랜치 레포는 development 배포가 불가능했다.
  입력 우선으로 통일 (backend/frontend PM2 2곳).

## v1.3.4

패치 릴리스 (2026-08-04). 다운스트림 CI `npm ci` EUSAGE 실패 수정.

- **ci-node-verify 설치 격리 수정**: `install_package()` 가
  `npm --prefix` / `pnpm --dir` 로 설치를 실행해 cwd 가 리포 루트에
  남았고, 루트 검증이 먼저 만든 루트 node_modules/lockfile 컨텍스트가
  앱 검증에 섞여 다운스트림 npm 모노레포에서 `npm ci` 가 루트 전이
  의존성을 요구하며 EUSAGE 로 실패했다. 설치를 대상 디렉터리로
  `cd` 해서 실행하도록 수정 (`maybe_prisma_generate` 와 동일 규칙).
- **lockfile 탐지 경계 수정**: npm 은 대상 디렉터리 자신의
  package-lock.json/npm-shrinkwrap.json 만 `npm ci` 근거로 인정한다 —
  상위(루트) lockfile 을 find_up 으로 잡아 ci 로 승격하던 동작 제거.
  pnpm 은 자기 lockfile 또는 pnpm workspace 루트의 lockfile 만
  frozen-lockfile 근거로 인정한다 (monorepo-packages 정책 정합).
- **회귀 테스트**: tests/ci-node-verify.test.mjs — npm/pnpm 스텁으로
  설치 호출의 cwd·인자 계약을 고정 (다운스트림 재현 픽스처 포함 4건).

## v1.3.3

패치 릴리스 (2026-08-03). 감사 후속 웨이브 2차 — 소유자 결정 집행과 M/L
잔여분 (specs/017-audit-wave2, 결정: 2026-08-03).

- **결정 집행**: specs/010 종결(T098 사용성 검증 요구 철회 — 기능 존속 미정,
  검증 수행 주장 아님), DEC-HARNESS-DETAIL-BACKFILL resolved(카탈로그-only
  확정 — detailId 제거, 상세-누락 경고는 명시 선언 시로 한정, 동작 변경),
  설계 초안 git rm + docs/superpowers·docs/prompts·CHANGELOG.md·
  harness.lock.example 를 project-owned 로(배포 제외).
- **갱신 체인 단일화** (M-1): apply-version.sh 가 materialize+KEEP_COMMITTED 를
  묶는 단일 진입점 — 호출부 5곳 교체. **실버그 수정**: node -e argv 전달로
  migrate-plan isMain 이 오판해 keep-committed 목록이 공백이 되던 조용한
  무동작을 env 전달로 해소.
- **manifest 고아 해소** (M-4): 고아 0건 회귀 테스트 + docs 가이드 3건
  (harness-overview·planning-hub-handoff·feature-definition-planning-hub-guide)
  링크·ignore·stale 등재 — 다운스트림 CONTRIBUTING 링크 복구.
- **정확화**: update --check 문구 실동작화(M-2), init-project fallback 제거·
  명시 실패(M-3), copy 모드 은퇴 예고 문서화(L-7/L-8), doctor 모드 보고
  안내(L-14), lock.example repo 필드(L-13), release-check source_ref 경고(L-11).
- **테스트 견고화**: real:true 통합 경로(M-11), 스킬 실디렉터리 경계(M-12),
  카탈로그 카운트 유도 불변식(M-13), 행위 검증 전환(M-14), prune·init-project
  테스트 분할·픽스처 통일(M-15/16), project-owned 테이블화 + 셸 fallback
  공용화·기계 대조(L-1), 픽스처 공유 가속(L-15).
- **잔여분 정리**: AI-read 파일 한국어 산문 영어 이전 + AGENTS.md 열거
  보완(M-7), 팀원/소유자 표면 경계를 ARCHITECTURE·update-policy 에
  명시(M-9 잔여).

## v1.3.2

패치 릴리스 (2026-07-31). 2026-07-31 전수 감사(검증 34건,
docs/audits/2026-07-31-full-harness-audit.md)의 1차 수정 —
소유자 결정 불요 항목 19건 (specs/016-audit-remediation).

주의: v1.3.1 태그는 Actions 결제 실패로 미발행 상태였다(감사 H-5/D-1).
결제 해소 후 v1.3.1 재발행 → 본 버전 발행 순서를 지킨다.

- **lock 전환 시 .harness/docs 소실 방지** (H-1): materialize 링크 루프·
  lockModeEntries·stale-workcopy 목록에 `.harness/docs` 동반 등재.
- **드리프트 가드 실효화** (H-7): basename 부분문자열 단방향 가드를
  materialize 실행 기반 정확 일치 양방향 대조로 교체 + 픽스처 완전성 가드.
- **ROADMAP.md 바이트 판정** (M-5, 동작 변경): prune-downstream 의 ROADMAP
  삭제는 패키지 사본과 바이트 일치할 때만 수행. 기준 부재 시 보존.
- **표면 실재화** (1-3·1-4·1-5·M-6): 리허설 스크립트 tests/ 이동(배포 제외,
  `mise run init-rehearse`), 스킬 카탈로그 유령 5건 제거·실재 7건 등재,
  release-check 중복 검증 제거, CI planning-check 조용한 스킵에 경고.
- **문서 정정** (H-2·H-3·H-4·M-8·M-9·M-10·M-21·L-5): update-policy gitignore
  절, project-owned examples 주석, init 정리 서술 4개 문서(하드코딩 rm -rf
  예시 제거), CONTRIBUTING migrate 절 포인터화, README bootstrap 자기모순,
  restore-harness 죽은 안내, skill-usage 헤더 경로.
- **테스트 위생** (H-6·M-17·L-9): fixture-base 공통 기반 추출 — temp
  무누수(레지스트리 + 종료 정리, KEEP_TMP=1 우회)·전역 git 설정 격리.
- ROADMAP 에 015/016 행과 "예정 작업" 절 추가 (M-18·M-20).

## v1.3.1

패치 릴리스 (2026-07-31). v1.3.0 롤아웃 실측에서 확인된 한계 3건을 닫는다
(specs/015 rollout-record.md 후속 1~3).

- **README 제목-마커 판정**: 구버전 사본은 현행 패키지와 바이트가 달라
  미판정됐다 (6/6 레포 실측). 제목 줄 `# Codi Harness v2` 를 하네스 마커로
  판정해 stub-readme 대상에 넣는다 — 프로젝트가 이어받은 README 는 제목부터
  바뀌므로 오탐이 없다.
- **stale-workcopy 부류 신설**: materialize 링크 자리를 막는 실사본
  (`.harness/vendor` 실디렉터리 등 — 3개 레포 실측)은 비추적이라 어느
  분류에도 안 잡혀 "실파일 보존" 경고로 영구 잔존했다. 해당 경로는 정책상
  upstream 소유라 실사본을 정리 대상으로 보고·삭제한다 (lock 모드 전용,
  materialize 목록과 드리프트 가드 테스트로 동기).
- **`.specify` 벤더 경로 gitignore 등재**: install 이 매 머신 재배치하는
  `templates/scripts/workflows` 3경로를 lockModeEntries 에 `real:true`
  플래그(실디렉터리 등재 허용 — 신규)로 넣는다. `?? .specify/` 상시 노출
  해소. `memory/`(constitution)·`feature.json` 등 프로젝트 상태는 커밋
  가능하게 남긴다.
- 015 기능을 허브 정본 데이터(feature-definitions/relations)에 등재.

## v1.3.0

다운스트림 잔재 정리 완결 (2026-07-30, specs/015-downstream-residue-cleanup).
반복 수정 5회의 구조적 원인 6개를 닫는다. 상세 분류·계약은 spec 디렉터리 참조.

- **동작 변경 — pkg-sync 잔재 자동 회수(v1.2.1) 은퇴**: pkg-sync/bootstrap 은
  팀원 표면이라 git 인덱스를 바꾸지 않는다. 잔재는 분류별 보고 + 요약의
  `residue N` 라인으로 안내하고, 실제 정리는 소유자 명령
  `./harness prune-downstream --apply` 가 담당한다. reclaim-shared.sh 는 보고
  전용 wrapper 로 남고 다음 major 에서 제거 예정.
- **prune-downstream 확장**: 잔재를 5분류(shared-tracked / consumer-link /
  upstream-state / upstream-copy / harness-selfstate)로 보고·정리한다. flow 2
  전환 레포에도 init-project 와 동등한 정리가 생겼다 — 하네스 `.specify` 상태
  리셋, 하네스 README 스텁 교체, package.json 정규화(공용
  normalize-root-package.mjs), 하네스 package-lock 삭제, docs/audits 사본
  삭제(이름+내용 일치만). `--count` 머신 인터페이스 추가.
- **lock 모드 gitignore 자동 최신화**: pkg-sync 가 materialize 직후
  ensure-gitignore 를 매번 실행한다 (기존에는 lock 레포에 갱신 경로가 없어
  스키마 링크 9개가 6/6 레포에 커밋됐다). entries 에
  `.claude/skills`·`.agents/skills` 추가, 문자열 entries 허용.
- **상대경로 심링크**: materialize/skills-link 가 만드는 리포 내부 링크는 전부
  상대경로다 (`.harness/current` 만 절대 — 머신 캐시 대상). 절대 링크가 남은
  레포는 재실행 시 자동 수렴한다. 커밋된 링크가 다른 머신에서 깨지던 결함의
  심층 방어.
- **회수 판정 확장**: 디렉터리 자체가 링크로 추적된 경우(`.harness/vendor`)와
  소비 측 스킬 링크(`.claude/skills/*` 등) 추적분을 포착한다
  (CONSUMER_LINK_ROOTS/PATHS 단일 출처).

## v1.2.2

패치 릴리스 (2026-07-30). v1.2.1 이 놓친 clone 잔재 두 종류를 정리 대상에
넣는다 — 정리 목록에 열거되지 않은 경로는 아무리 명백한 하네스 자산이어도
다운스트림에 영구히 남는다.

- **`examples/` 통째 정리**: `update-policy` 가
  *"harness demo workspace — never propagated downstream"* 이라고 명시하는데도
  clone 으로 딸려와 그대로 남아 있었다 (codi-account 실측). project-owned
  분류는 "하네스가 덮어쓰지 않는다" 는 뜻이지 "clone 에 안 딸려온다" 가
  아니라는 점이 이 결함의 뿌리다.
- **`data/` 선별 정리**: 기능 카탈로그·사이트맵의 소스라 파일 이름이 upstream
  과 같은 채로 프로젝트 데이터가 들어간다. 이름으로 판정하면 그 데이터가
  날아가므로 두 단계로 본다 — (1) 내용이 upstream 과 바이트 단위로 같으면
  손대지 않은 사본, (2) 다르더라도 JSON 배열의 항목 `id` 가 **전부** upstream
  spec 에 대응하면 구버전 사본이다. codi-account 는 013 까지, 패키지는 014
  까지라 바이트가 갈렸는데 (2) 가 이를 잡는다. 프로젝트 항목이 하나라도
  섞이면 남긴다. 배열이 아니거나 `id` 가 없는 파일(`feature-relations.json`
  등)은 판정하지 않고 남긴다 — 모르면 남기는 쪽이 기본값이다.

**기존 다운스트림 적용**: `./harness bootstrap` 후
`./harness prune-downstream` 으로 목록 확인 → `--apply`.

## v1.2.1

패치 릴리스 (2026-07-30). 새 프로젝트가 하네스의 `specs/` 를 안고 시작하던
결함을 닫는다 — 자기 첫 기능인데 `speckit-specify` 가 011 부터 번호를 매기는
상태였다 (codi-account 실측: specs 10건 전부 하네스 것, 자체 spec 0건).

- **`init-project` 가 `--reset-git` 없이도 정리한다(핵심)**:
  `prune_upstream_project_state` 호출이 `--reset-git` 분기 **안**에 있었다.
  하네스 clone 으로 새 프로젝트를 만들면 옵션과 무관하게 upstream 의
  `specs/`·`ROADMAP.md`·`tests/` 가 딸려오는데, 옵션 없이 만든 프로젝트는
  정리를 건너뛰었다. 호출을 분기 밖으로 옮겼다.
- **`specs/`·`tests/` 선별 정리**: v1.2.0 은 자체 spec 파괴를 우려해 `specs/`
  를 prune 대상에서 통째로 뺐다. 실측이 그 전제를 반박했다 — 확인한
  다운스트림은 모두 하네스 사본뿐이었고, 남기는 쪽이 번호 오염이라는 실제
  피해를 만들었다. 반대로 `tests/` 는 경로 이름만 보고 **통째로** 지우고
  있었는데, 앱 레포가 자체 테스트를 두는 가장 흔한 위치라 더 위험했다.
  이제 두 디렉터리 모두 패키지에 실린 upstream 사본을 기준으로 **이름이
  일치하는 항목만** 지운다. 자체 항목은 이름이 달라 남는다(같은 `001`
  번호여도 `001-design-system-support` 는 잡히고 `001-account-login` 은
  보존; `harness-cli.test.mjs` 는 잡히고 `my-app.test.mjs` 는 보존). 판정
  기준이 패키지라 버전과 함께 자동 갱신되며 별도 목록 관리가 없다.
  copy 모드는 판정 기준(`.harness/current`)이 없어 정리하지 않는다 — 레포
  자신이 사본을 갖고 있어 기준으로 쓸 수 없다. lock 전환 후 정리하면 된다.

**기존 다운스트림 적용**: `./harness bootstrap` 후
`./harness prune-downstream` 으로 목록을 먼저 확인하고 `--apply`. 이제 삭제
대상이 항목 단위로 열거되므로, 자체 파일이 섞여 있지 않은지 목록에서 바로
확인할 수 있다.

## v1.2.0

마이너 릴리스 (2026-07-30). 팀원이 알아야 할 하네스 명령을
`./harness bootstrap` 하나로 좁히고, copy 모드 은퇴의 첫 단계를 넣는다.
breaking 변경은 없다 — 도움말에서 빠진 명령도 전부 그대로 동작한다.

- **도움말 분할(핵심)**: `./harness help` 가 일상 명령 4개
  (`bootstrap`/`doctor`/`codex`/`claude`)만 싣는다. 나머지 23개는
  `./harness help --all` 에서 그룹 4개(일상/점검/패키지 관리/레포 운영)로
  본다. 24개 평면 나열이 그 자체로 "무엇을 쳐야 하나" 라는 판단을 만들고
  있었다. 숨김이지 제거가 아니므로 기존 스크립트·문서 링크는 그대로 돈다.
  `--all` 누락은 런처 `case` 분기를 파싱해 대조하는 자기검증 테스트가 잡는다.
- **준비 결과 요약**: `bootstrap` 이 7단계 뒤에 버전 전/후, 정리된 잔재 건수,
  조치 필요 항목을 요약한다. 갱신 공지를 보고 실행한 사람이 "반영됐나" 를
  알 수 있어 불필요한 재실행이 준다. 요약 생성이 실패해도 `bootstrap` 은
  실패하지 않는다 — 보고 기능이 준비 자체를 막으면 안 된다.
- **copy 은퇴 예고**: copy 모드에서 `./harness update --apply-harness` 를
  실행하면 은퇴 예고와 `./harness migrate` 안내가 뜬다. 갱신은 정상
  완료된다. lock 모드는 update 가 이미 조기 종료하므로 별도 분기 없이
  제외된다. **경로 제거는 아직 하지 않는다** — 미전환 레포가 남은 상태에서
  지우면 그 레포가 갱신 수단을 잃는다.
- **배포 모드 보고**: `doctor` 가 lock/copy 를 한 줄 보고한다. copy 도 아직
  지원 상태라 둘 다 `ok` 이며 fail/warn 집계를 바꾸지 않는다.
- **전환 후 승격 파일 회수**: `migrate` 는 실행 시점 manifest 만 보므로,
  이후 버전에서 공유로 선언된 파일은 커밋에 남고 materialize 가 그 자리를
  심링크로 덮어 `git status` 가 영구히 `M` 이 됐다. migrate 는 전환된 레포를
  거부하고 pkg-sync 에는 회수 로직이 없어 정리 경로가 아예 없었다
  (codi-hansi 실측: config 스키마 9건). `pkg-sync` 가 마지막에
  `git rm --cached` 로 인덱스만 정리한다 — 워킹트리 심링크와 커밋 시점은
  사용자 몫이다. 같은 결함의 반쪽인 gitignore 미등재 9건도 함께 닫았다.
- **`prune-downstream` 두 가지 수정**: (1) lock 모드에서 스크립트가 버전
  캐시에 있고 그 캐시가 하네스 clone 이라, ROOT 를 파일 위치로 잡으면 어느
  다운스트림에서 실행해도 "upstream 입니다" 로 거부됐다. cwd 의 git 최상위를
  우선한다. (2) "정리는 migrate 가 담당한다" 는 lock 가드를 걷어냈다 — 그
  전제가 거짓이라 lock 레포에는 정리 경로가 없었다(codi-crawling: 하네스
  테스트 90개 잔존). 동시에 `specs/`·`.specify/` 를 자동 삭제 대상에서 뺐다.
  레포마다 내용이 달라(codi-hansi 는 하네스 사본뿐, codi-crawling 은 없음)
  자동 판정이 불가능하고, 잘못 지우면 복구 불가능한 데이터 손실이다.

**다운스트림 적용**: `./harness bootstrap` 1회. lock 레포는 새 버전을 받아
바뀐 도움말과 요약을 쓰게 된다. copy 레포는 은퇴 예고를 보게 되며, 전환은
`./harness migrate` → `git push` 다.

## v1.1.4

패치 릴리스 (2026-07-29). v1.1.3의 KEEP_COMMITTED가 실제로는 커밋될 수
없던 결함을 닫는다 — CI가 계속 exit 127로 깨졌다.

- **scripts 통짜 심링크 해제(핵심)**: materialize가 `.harness/scripts` 를
  통째로 링크해서, 그 아래 KEEP_COMMITTED 파일을 git이
  `beyond a symbolic link` 로 **거부**했다. gitignore를 아무리 고쳐도
  커밋 자체가 불가능한 상태였다. 이제 scripts는 하위 디렉터리 단위로
  링크하고, KEEP_COMMITTED가 사는 `checks`/`deploy`/`audit` 는
  실디렉터리로 유지한다. 구버전이 만든 통짜 링크는 자동으로 걷어낸다.
- **gitignore 정책 정정**: `lockModeEntries` 의 `.harness/scripts` 통짜
  무시를 제거하고, 링크로 제공되는 하위만 개별 등재했다. CI 스크립트가
  사는 디렉터리는 `dir/*` 무시 + `!dir/keep.sh` 예외 쌍으로 열되 나머지
  파일은 계속 무시한다(정확히 4개만 커밋된다). 구버전이 남긴 통짜 규칙은
  `lock-scripts` managed block 의 `neutralize` 가 주석 처리한다 — git은
  디렉터리가 무시되면 하위 부정 패턴을 재검토하지 않기 때문에, 예외만
  추가하는 방식으로는 해결되지 않는다.
- **keep-committed 상위 심링크 검사**: 목적지 파일만 보고 상위 디렉터리가
  링크인 경우를 놓쳐 `cp: are the same file` 이 조용히 발생했다. 조상
  경로 전체를 검사해 건너뛴다.
- **CONTRIBUTING.md 영구 소실 수정**: manifest 공유 파일이라 migrate가
  `git rm` 으로 지우는데 materialize 링크 대상에서 빠져 있어 복구되지
  않았다(다운스트림 3곳 모두 소실, context-check 실패). `ARCHITECTURE.md`
  와 같은 취급으로 되돌렸다.
- **context-check의 lock 모드 오탐 수정**: 공유 룰은
  `.claude/rules/shared/` 아래 링크로 제공되고 Claude Code 는 해당
  디렉터리를 재귀 탐색하므로 정상 로드되는데, 체크가 고정 경로만 보고
  "missing" 으로 실패했다. shared 경유 폴백을 추가했다.
- 회귀 테스트 5건 추가(구버전 링크 상태에서의 구조 복구, KEEP_COMMITTED가
  심링크 아래 갇히지 않음, gitignore 계약, 공유 루트 문서 링크). codi-hansi
  실환경에서 4개 스크립트만 정확히 스테이징되고 doctor 실패 0인 것을
  확인했다.

## v1.1.3

패치 릴리스 (2026-07-29). lock 모드 CI를 인증·복원 스텝 없이 동작하게
바꾸고, 진단을 가리던 조용한 실패를 제거한다.

- **CI 스크립트를 KEEP_COMMITTED 로 전환**: lock 모드에서 `.harness/**` 는
  git 비추적이라 `actions/checkout` 직후 존재하지 않아 CI가 깨졌다.
  v1.1.2는 복원 액션으로 풀었지만, 업스트림이 private이면 CI 러너에 접근
  권한이 없어(checkout의 `GITHUB_TOKEN` 은 현재 저장소 전용) 결국 토큰
  인프라가 필요했다 — 다운스트림 10여 곳에 시크릿 등록과 만료 관리가
  따라붙는다. CI가 실제로 쓰는 스크립트는 4개(820줄)뿐이고 모두 Node
  내장 모듈만 쓰는 자기완결 파일이라, 런처·`AGENTS.md` 와 같은
  `KEEP_COMMITTED` 취급으로 바꿨다. 워크플로우는 기존 호출을 그대로 두면
  되고 복원 스텝·캐시·토큰이 전부 사라진다.
  `.github/actions/restore-harness` 는 제거했다.
- **KEEP_COMMITTED 갱신 누락 수정**: 목록이 `migrate.sh` 에만 하드코딩돼
  있어 `pkg-sync`(정기 갱신 경로)는 이 파일들을 갱신하지 않았다 — 버전을
  올려도 런처가 낡은 채로 남는 기존 갭이다. 목록의 단일 출처를
  `migrate-plan.mjs` 로 두고 두 경로가 `keep-committed.sh` 를 공유한다.
- **조용한 실패 제거**: 런처 부트스트랩과 `pkg-sync` 가 `ls-remote` 의
  stderr를 `2>/dev/null` 로 버려, 접근 차단이 "버전 태그를 찾지
  못했습니다" 로 오인됐다. 이제 git의 실제 원인을 그대로 출력한다.
- 회귀 테스트 3건 추가(CI 호출 스크립트의 KEEP_COMMITTED 등재, 단일 출처
  공유, 제거 대상 제외).

## v1.1.2

패치 릴리스 (2026-07-29). lock 모드 전환의 남은 두 갭 — CI 회귀와
vendor 잔재 — 을 닫는다.

- **lock 모드 CI 복구(중요)**: `.harness/**` 가 git 비추적이라 CI의
  `actions/checkout` 직후에는 존재하지 않아, `.harness/scripts/...` 를
  직접 호출하던 워크플로우가 전부 `No such file or directory` 로 깨졌다.
  `.github/actions/restore-harness` composite 액션을 신설하고 스크립트
  호출이 있는 워크플로우 5개(ci-node, dependency-security,
  deploy-frontend-vercel/pm2, deploy-backend-pm2)에 적용했다. `pkg-sync`
  는 도구 설치 없이 파일 배치만 하며(shallow clone 약 2초), 액션이
  `~/.codi-harness` 를 `actions/cache` 로 재사용하므로 반복 실행은
  사실상 0초다. copy 모드에서는 no-op.
  `.github/**` 는 project-owned라 `./harness update` 로 전파되지 않는다 —
  전환 이전에 만들어진 레포는 액션 디렉토리와 스텝을 1회 수동 반영해야
  한다(packaging-guide에 절차 명시).
- **잔재 정리가 자기 삭제 후 조용히 실패하던 문제**: v1.1.1의 잔재 정리
  블록이 레포 사본 경로(`$SCRIPT_DIR`)로 `migrate-plan.mjs` 를 실행했는데,
  바로 앞의 `git rm` 이 그 사본(`.harness/scripts/**`)을 지운 뒤라
  `2>/dev/null` 뒤로 조용히 실패해 vendor 잔재가 그대로 남았다(codi-crew
  실측). 하단 단계와 동일하게 캐시 패키지 스크립트를 우선 사용한다.
- 회귀 테스트 3건 추가(자기 삭제 경로의 잔재 정리, CI 복원 스텝 존재,
  액션 계약). 각 수정은 돌연변이 테스트로 검증했다.

## v1.1.1

패치 릴리스 (2026-07-29). lock 모드 전환 경로의 결함 3건 — 특히 공유
버전 캐시를 파괴하던 버그를 포함하므로 lock 모드 사용자는 즉시 갱신할 것.

- **캐시 파괴 수정(중요)**: `migrate --fresh`의 디스크 기반 `rm -f`가
  심링크를 따라가 `~/.codi-harness/versions/<v>` 원본을 지웠다. lock 모드
  레포에서는 공유 경로가 캐시 심링크이고, 캐시는 머신의 모든 프로젝트가
  공유하므로 한 번의 재실행이 다른 레포까지 동시에 망가뜨렸다(자기 실행
  원본까지 삭제돼 중단). 삭제 후보에서 조상 경로 중 하나라도 심링크면
  건너뛴다 — 직속 부모만 검사하면 `.harness/scripts/pkg/**` 같은 링크
  하위 실디렉토리를 놓친다.
- **gitignore된 공유 복사본 정리**: 다운스트림이 공유 경로를(예:
  `.harness/vendor`) `.gitignore`에 올려 둔 경우 복사본이 untracked라
  `git rm`이 지우지 못하고, 남은 실디렉토리가 링크 자리를 막아 "실파일
  보존" 경고와 함께 혼합 상태가 됐다. manifest가 공유로 선언한 경로에
  한해 잔재를 정리한다(프로젝트 소유 경로는 기존 분류가 계속 보호).
- **ensure-gitignore 순서 방어**: lock 생성 후 migrate 완료 전에 이
  스크립트가 돌면(그 사이의 `./harness update` 등) 아직 실파일인 공유
  경로가 미리 ignore되어 위 문제를 유발했다. 심링크가 된 경로만 lock
  항목으로 등재한다.
- 회귀 테스트 3건 추가(캐시 보존은 중첩 경로까지 검증).

## v1.1.0

마이너 릴리스 (2026-07-29).

- `codi-auto-loop` 공유 스킬 신설: clarify 이후 구간을 감독형 자동 루프로
  실행 — plan → tasks → analyze → tasks.md 검토 게이트(필수 정지) →
  implement → 검증 체인 → 리뷰 서브에이전트 → converge 반복. 중단 조건
  (동일 실패 3회, 스펙 요구사항 변경, 스킬 자체 게이트, 가드레일 승인)과
  notify-decision 규칙 준수. 외부 스킬은 이름·계약으로만 참조 (#104)
- Spec Kit v0.12.7 → v0.14.2 벤더 업그레이드: constitution 스킬 Scope
  Guard, plan Phase 1 종료, 스크립트 파서 fallback 강화 (#104)
- constitution 활성화: 하네스 헌법 v1.0.0 작성으로 speckit-plan/analyze의
  Constitution Check 게이트가 실제 기준을 가짐. doctor에 상태 기반
  플레이스홀더 점검 신설(기존/신규 다운스트림 동일 경로 수렴),
  init-project에 첫 기능 전 실행 단계 명시 (#104)
- dev-role 쓰기 가드 + API 계약-우선 정책 도입, cmux/tmux 팀 모드 제거
  (#103)
- speckit 이름 통일: 라이브 표면의 `speckit.*` 논리명을 실제 설치
  스킬명 `speckit-*`로 전면 교체, 재유입 차단 회귀 스위프 테스트 추가.
  역사 기록(docs/audits, 완료 specs)은 불변 (specs/013)
- 엔트리포인트 단일화: CLAUDE.md를 bare `@AGENTS.md` import + Claude 전용
  델타(32줄)로 재편 — Claude가 AGENTS.md 공통 본문을 실제로 로드하지
  않던 결함 수정, context-check가 bare import를 상시 검증 (specs/013)

## v1.0.6

패치 릴리스 (2026-07-22).

- lock 모드에서 `docs:build`/`planning:check`가 조용히 no-op 하던 결함 수정:
  직접 실행 가드가 `import.meta.url === \`file://${process.argv[1]}\`` 형태라
  `.harness/scripts`가 버전 캐시 심링크인 lock 모드에서 항상 false가 됐다
  (import.meta.url은 realpath, argv[1]은 심링크 경로). 출력도 오류도 없이
  exit 0이라 검증이 통과한 것처럼 보이는 위험한 실패였다. 심링크 안전한
  공용 헬퍼 `lib/is-main.mjs`로 교체 — build-hub, planning-check,
  planning-sync, planning-watch, Stop 훅 `docs-build-on-stop` 5곳.
  심링크 환경 회귀 테스트 추가.

## v1.0.5

패치 릴리스 (2026-07-20).

- pkg-sync가 이미 최신 버전이어도 materialize를 재실행(멱등)한다:
  링크 드리프트 복구 + 소비 레포의 pkg-gc 레지스트리 등록. 이전에는
  최신 상태의 레포가 등록되지 않아 pkg-gc fail-safe 안내(pkg-sync 실행)
  가 그 경우에 통하지 않았다.

## v1.0.4

패치 릴리스 (2026-07-20).

- `./harness pkg-gc` 신설: 버전 캐시(`~/.codi-harness/versions`)에서 어떤
  레포도 참조하지 않는 구버전을 제거한다(--dry-run 지원). materialize가
  소비 레포를 `$CACHE_DIR/repos` 레지스트리에 등록하고, gc는 각 레포의
  current·pending 버전과 최신 버전을 보존한다. 레지스트리가 비어 있으면
  아무것도 지우지 않는다(fail-safe).
- packaging-guide 보강: copy→lock 전환 절차에 `update`(도구 현행화)+커밋
  선행 단계 명시, 버전 캐시 축적·정리 정책과 pkg-gc 명령 등재.

## v1.0.3

패치 릴리스 (2026-07-18).

- 시나리오 A(신규 생성) 온보딩 갭 2건: install이 `mise trust`를 선행해
  새 경로에서 mise 설정 미신뢰로 중단되던 문제 해소, init-project의
  Step 5 순서를 lock → `migrate --fresh` → install로 재배치 —
  install(pkg-sync materialize)이 복사본 제거보다 먼저 돌면 migrate가
  전환 완료로 오판해 복사본이 링크를 가리는 혼합 상태가 됐다.
  `--fresh`는 lock/current가 이미 있어도 끝까지 진행해 잔존 복사본을
  정리한다(빈 실디렉토리 정리 포함, 회귀 테스트 2건).

## v1.0.2

패치 릴리스 (2026-07-18).

- migrate 자기 삭제 결함 수정: `./harness migrate`(레포 자신의 스크립트
  사본 실행)가 git rm으로 자기 디렉토리를 지운 뒤 materialize를 찾지 못해
  중단되던 문제. 이후 단계(materialize·ensure-gitignore)를 캐시 패키지
  스크립트로 위임한다(패키지에 없으면 기존 경로 폴백, 회귀 테스트 포함).
- lock 모드 잔여 갭 3건: materialize가 `lint-staged.config.mjs`를 링크하고
  gitignore lock 항목에 등재(pre-commit 동작 보장), install이
  `.agents/results`를 생성, prune-stale/doctor drift 검사가 lock 모드
  materialize 심링크를 오탐하지 않음.
- 문서 정합: README 프로필 표에 planning-only, shared-manifest 제외 목록
  현행화, packaging-guide 자가 부트스트랩 단계, update 문서의 다운스트림
  고유 파일 보호 서술 반영.

## v1.0.1

패치 릴리스 (2026-07-18).

- lock 모드 fresh clone 자가 부트스트랩: 전환된 레포를 새로 clone하면 공유
  스크립트가 아직 materialize 되지 않아 `./harness install`/`bootstrap`이
  시작조차 못 하던 갭 수정. 런처가 harness.lock만으로 패키지를 1회 수신·
  materialize한 뒤 정식 pkg-sync에 위임한다(멱등, 회귀 테스트 포함).

## v1.0.0

첫 정식 릴리스 (2026-07-18). lock 모드(`harness.lock` + `./harness migrate`)의
소비 대상이 되는 최초 버전이다.

- 조직도 가독성: 사이트맵 가로 조직도의 최대 확대 배율을 화면 픽셀 기준
  동적 계산으로 전환(넓은 차트도 글자 실크기까지 확대 가능), 확대 스텝을
  곱셈식(×1.25)으로 변경, 커서 중심 마우스 휠 확대 추가.
- `planning-only` 프로필 정식 지원: profile CLI(list/set/check)·
  init-project 선택지·`project-profile-guard` 훅(양쪽 앱 표면 차단)·
  manifest `supported_modes`·정책 문서 반영. planning-hub류 다운스트림이
  정식 `./harness update` 경로를 쓸 수 있다.
- `examples/**`를 project-owned로 분류: 하네스 데모 워크스페이스는 더 이상
  다운스트림에 전파되지 않는다(3경로 정합: Node 분류기·셸 fallback·정책·
  테스트).
- 온보딩 갭 수정: `./harness install`(→ bootstrap 6단계)이 루트 npm 의존성을
  설치한다(node_modules 없을 때 `npm ci`). 이전에는 husky `prepare`가 실행되지
  않아 새 클론에서 pre-commit 훅이 조용히 비활성이었다. doctor가 미설치를
  경고한다.
- Codex 프로필 패리티: Codex PreToolUse 어댑터가 guardrails에 이어
  `project-profile-guard`도 실행 — planning-only 등 프로필별 앱 표면 차단이
  두 런타임에서 동일하게 동작(회귀 테스트 포함).
- `projects/**`·`registry.json`을 project-owned로 분류(3경로 정합):
  planning-only 저장소의 프로젝트별 planning source와 루트 기능 시드는
  다운스트림 데이터다.
- update 삭제 범위 수정(다운스트림 데이터 보호): diff 기반 "upstream에서
  삭제된 shared 파일 제거"가 업스트림이 배포한 적 없는 다운스트림 고유
  경로까지 지우던 문제를 수정. 제거는 적용 전 로컬 shared-manifest에 있던
  파일로만 제한하고, 목록 밖 경로는 "다운스트림 고유 파일 보호(제거 생략)"
  로 보고한다(manifest를 못 읽으면 제거 전체 생략 fail-safe). 하네스 소유
  트리의 stale 정리는 기존 manifest 기반 흐름이 계속 담당한다.
- Planning Hub 재설계(specs/010): 문서 허브(`docs/index.html`)와
  Planning Hub(`docs/planning.html`) 페이지 셋 분리, 워크스페이스 모델
  (planningSource/deliverySource), planning manifest·lock·evidence 동기화,
  `planning:sync`/`planning:check`/`planning:pull` 태스크, Community Demo
  워크스페이스. planning 전체 경로는 demo 전용이 아니라 카탈로그 존재로
  판정(`hasPlanningCatalog`).
- 정의-후행 경량 경로(specs/011): 카탈로그에 없는 기능의 work item을
  버리지 않고 미등록 묶음으로 투영, `mise run feature:stub` draft 등록,
  status.yaml `featureId` 역방향 연결(planning 관계 우선 + 충돌 진단),
  spec 디렉터리형 deliverySource의 spec-scan 보충 투영, Stop 훅
  `[workitem-reminder]` 비차단 안내(Claude/Codex 공용).
- 하네스 카탈로그 전환 + legacy 잔재 제거(specs/012): 워크스페이스
  health를 원본 가용성(invalid)과 계획 품질(advisory)로 분리, 하네스
  자신의 카탈로그(`data/feature-definitions.json`, spec ID 재사용) 도입,
  구 단일 허브 렌더러(render-hub.mjs)·미사용 golden·설계 초안 16파일
  제거(참조 0 확인·생성물 해시 불변), legacy 21필드 행을 신규 작성
  계약에서 은퇴(입력은 fail-open 수용 + 변환 안내 힌트).
- 새 명령·설정: `planning:publish`(planningSource 컴파일→manifest 원자
  게시, 단일 저장소는 publish→pull 왕복), `feature:workitem`(explicit
  작업 기록, done 생성 금지), workspace `actorClasses`(actor-surface 힌트
  어휘 확장), `feature:seed-check`에 ID 일치 검색 추가.
- 추적성 정비: registry가 needs.json과 spec 검증 기록을 소스로 수용,
  coverage가 typed satisfied-by/specified-by를 소비(누락 작업함 critical
  오탐 14건·표현 갭 24건 해소), actor-surface 불일치·열린 결정·미등록
  기능 비차단 힌트, 빈 화면 노드 카운트를 appears-on 커버 기준으로
  정밀화.
- 스킬·정책 정비: 기능정의 스킬 3종의 모순 5건 통일(신규 진입점 라우팅,
  spec/work item 두 상태 축 구분, 화면 없는 기능 규칙, 사이트맵 경로,
  걸침 기능 분할 규칙), surface 단위 사이트맵 확인 절차, 비강제 운영
  결정과 강제 전환 기준을 quality-gates.md에 명문화.
- Community Demo 실사용 수준 보강: 18 기능·7 요구·4 흐름, 운영(admin)
  기능·R1/R2 릴리스·done/보류/차단 카드 스펙트럼, 다운스트림 spec 연결.
- 기능정의서 3-스킬 체계: 신규 작성 입구 `codi-feature-definition-authoring`
  스킬 추가(사이트맵→카탈로그→11그룹 상세→검증), normalizer 출력 계약을
  Planning Hub 카탈로그/상세 2층으로 현행화, `codi-feature-hub`에
  FeatureWorkItem 기록 계약 명문화. 레거시 기능정의서 스캐너가 신형 카탈로그
  항목을 자동 투영하도록 보완.
- 문서 현행화: `.harness/docs/packaging-guide.md`(lock 모드 사용자 가이드)
  신설, `update-policy.md`에 두 배포 모드 정의 추가,
  `feature-hub-guide.md` 전면 재작성(여섯 보기 + 파일 계약 + 동기화 규약),
  harness-overview §10 재작성, README/skills-guide 스킬 표·링크 정합화,
  `./harness release`를 help와 README 명령 표에 등재.
- 기능정의서 사이트맵 보드: 기능정의서 탭 기본 화면을 요약 바 + 화면
  트리 + 화면별 기능 카드로 재구성. 기존 8컬럼 표는 "표로 보기" 토글
  보조 뷰로 유지 (specs/007-sitemap-board).
- 사이트맵 선행 플로우: `data/sitemap.json`(사람 소유) +
  `.harness/config/sitemap-schema.json`. normalizer 스킬에 사이트맵
  선행 Step 0 추가. 사이트맵 부재/위반 시 파생 모드로 fail-open,
  `docs:build`가 미배치/빈 노드 비차단 힌트 출력.
- 연결형 기능 허브 v2: 기능정의서에 관계도·사이트맵·표·사용자 흐름
  4개 보기를 추가하고 동일한 검색·Phase·검토·화면 선택 상태를 공유.
- 사람 소유 선택 원본 `data/feature-relations.json`과
  `data/user-flows.json` 계약 및 fail-open 스캐너 추가. broken, duplicate,
  orphan, cycle을 비차단 health와 build 힌트로 제공.
- Spec Kit 상세에서 사용자 시나리오, 인수 조건, edge case, 기능 요구사항,
  성공 기준을 파생해 기능정의 상세와 연결. 명시적 `specified-by`와
  `appears-on` 관계가 ID·Area fallback보다 우선.
- 기능 현황에 다음 작업, 최근 전이, 열린 결정, 검증 범위를 표시하고
  task·verification 100%와 열린 결정 0건을 모두 충족한 경우에만
  `in-review → done`을 제안.

## v1.0.0

- 패키지화 첫 릴리스 준비: lock 기반 소비(fetch/materialize/pin/update)
  와 릴리스 검증 도입 (specs/005-harness-packaging).
- 원클릭 온보딩 부트스트랩 `./harness bootstrap` (specs/004-onboarding-bootstrap).
