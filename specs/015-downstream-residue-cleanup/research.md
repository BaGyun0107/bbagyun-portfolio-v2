# Research: 다운스트림 잔재 정리 완결

**Date**: 2026-07-30 | **Input**: 2026-07-30 6개 레포 전수 감사 (대화 실측)

## R1. 상대경로 링크 계산 방법

- **Decision**: sh 스크립트에서 Node 한 줄 호출(`node -p "path.relative(...)"`
  형태의 헬퍼 함수)로 링크 디렉터리 기준 상대경로를 계산한다. materialize.sh의
  `link_entry`와 skills-link.sh의 링크 생성부가 공유하는 `relative_target()`
  헬퍼를 각 스크립트에 둔다.
- **Rationale**: `realpath --relative-to`는 GNU 전용이라 macOS(BSD)에 없다.
  하네스는 이미 Node 24를 전제하고 materialize.sh가 `node -e`를 쓰는 선례가
  있다. 순수 sh 구현은 `..` 세그먼트 계산이 오류 유발적이다.
- **Alternatives considered**: GNU coreutils 의존(리젝: macOS 미지원),
  python(리젝: 하네스 전제 도구 아님), 순수 sh(리젝: 유지보수 위험).

## R2. 어떤 링크를 상대경로로 하나 — 예외의 명시

- **Decision**: 링크 대상이 **리포 내부 경로**(`$ROOT_DIR/` 하위, `.harness/current`
  경유 포함)인 링크는 전부 상대경로로 생성한다. 유일한 예외는
  `.harness/current` 자신 — 대상이 머신 캐시(`~/.codi-harness/versions/<v>`)라
  리포 밖이므로 절대경로를 유지하고, gitignore(`lockModeEntries` 기존 등재)로
  비추적을 보장한다.
- **Rationale**: 리포 내부 대상은 상대경로로 표현하면 clone 위치와 무관하게
  유효하다. 캐시 경로는 머신·환경변수(`CODI_HARNESS_CACHE_DIR`) 의존이라
  상대화가 불가능하고, 애초에 커밋 대상이 아니다.
- **Alternatives considered**: current까지 상대화(리젝: 홈 디렉터리 상대 경로는
  리포 위치에 따라 깨짐), 전부 절대 유지 + gitignore만 강화(리젝: 심층 방어
  부족 — gitignore 갱신 실패 시 또 같은 사고).

## R3. lock 모드 gitignore 반영 지점

- **Decision**: pkg-sync.sh에서 materialize 완료 직후
  `ROOT_DIR="$ROOT_DIR" node <pkg>/.harness/scripts/setup/ensure-gitignore.mjs`
  를 호출한다. 실행 원본은 패키지 쪽 스크립트를 우선한다(reclaim-shared.sh와
  같은 패턴).
- **Rationale**: ensure-gitignore.mjs는 ROOT_DIR 환경변수 기반으로 동작하고
  config를 `<ROOT_DIR>/.harness/config/required-gitignore.json`에서 읽는데, 이
  경로는 lock 모드에서 패키지 링크라 항상 현재 버전의 목록이 된다(검증 완료).
  "심링크가 된 뒤 등재" 가드가 이미 있어 materialize 이후 호출이 안전하다.
  update.sh는 lock 모드에서 조기 종료하므로(update.sh:20) pkg-sync가 유일한
  정기 경로다.
- **Alternatives considered**: update.sh 조기 종료 제거(리젝: update는 copy
  모드 전용 표면으로 은퇴 중, specs/014), bootstrap에서 직접 호출(리젝:
  pkg-sync를 거치지 않는 수동 `./harness pkg-sync` 실행이 누락됨).

## R4. 잔재 판정의 단일 출처 확장 방식

- **Decision**: 소비 측 링크 목록을 migrate-plan.mjs에
  `CONSUMER_LINK_ROOTS = ['.claude/skills/', '.agents/skills/']` +
  `CONSUMER_LINK_PATHS = ['.claude/rules/shared', ...materialize link_entry
  대상 목록]`으로 export하고, computeRemovals가 (a) 기존 manifest ∩ tracked,
  (b) SHARED_DIR_ROOTS의 **디렉터리 자체가 추적된 경우**(`f === root 무-슬래시`),
  (c) CONSUMER_LINK_* 하위 추적분을 모두 제거 대상에 포함하도록 확장한다.
  project-state 잔재 판정은 upstream-project-state.mjs에 추가한다.
- **Rationale**: migrate/reclaim/prune-downstream/감사가 같은 함수를 쓰는 기존
  구조(FR-007)를 유지해야 5번째 수정의 재발(경로별 목록 드리프트)을 막는다.
  crew의 `.harness/vendor` 링크는 `startsWith('.harness/vendor/')`에 걸리지
  않는 실측 사례로, (b)가 필요하다.
- **Alternatives considered**: materialize가 생성 링크 목록을 상태 파일로 기록
  (리젝: 상태 파일 자체가 새 드리프트 소스), gitignore 항목을 판정 기준으로
  재사용(리젝: gitignore는 프로젝트 편집 가능이라 판정 정본 부적격).

## R5. 소유자/팀원 플로우 분리 (갭 6)

- **Decision**: 인덱스 변경(git rm --cached)과 파일 삭제는
  `./harness prune-downstream --apply`(소유자 명령)에만 둔다.
  prune-downstream check 모드가 모든 잔재 부류(project-state + 공유 추적분 +
  소비 측 링크)를 분류별로 보고하는 감사 표면이 된다(FR-008).
  pkg-sync는 reclaim-shared의 자동 `git rm --cached`를 **보고 전용**으로
  전환해 호출하고, 잔재 발견 시 bootstrap-summary에 `residue <N>` 라인을
  남긴다 — bootstrap 요약이 "정리 필요, 소유자 절차 안내"를 출력한다.
- **Rationale**: 팀원 bootstrap이 인덱스를 바꾸면 팀원 워킹트리가 dirty가 되어
  "bootstrap 하나로 완결"이 깨진다(US2, FR-006). (정정 2026-07-30 구현 중:
  reclaim-shared 자동 회수는 v1.2.1에 이미 릴리스됨을 확인 — 따라서 이 전환은
  릴리스된 동작의 변경이고, CHANGELOG에 동작 변경으로 명시한다. 자동 회수가
  이미 돈 레포는 그 결과가 곧 소유자 정리의 목표 상태라 되돌릴 필요 없음.)
- **Alternatives considered**: bootstrap에 --owner 플래그(리젝: 표면 증가,
  실수로 팀원이 사용 가능), reclaim 자동 적용 유지(리젝: 팀원 머신 dirty).
- **주의(문서화)**: 잔재가 남은 레포에서 팀원이 bootstrap하면 materialize가
  워킹트리의 추적 링크 값을 재작성해 `git status`에 수정으로 보일 수 있다.
  이는 소유자가 정리 커밋을 push하면 소멸하는 과도기 현상으로, 안내 문구에
  포함한다 (인덱스 불변 원칙과는 별개의 워킹트리 현상).

## R6. .specify 하네스 상태의 잔재 판정

- **Decision**: `.specify/feature.json`의 `feature_directory`가 패키지
  (`.harness/current/specs/`)의 spec 디렉터리 이름과 일치하면 하네스 상태로
  판정하고 정리 대상에 넣는다(파일 삭제 — install이 벤더 자산을 재배치).
  `.specify/memory/constitution.md`는 패키지 원본과 바이트 일치할 때만 삭제
  대상, 다르면 보존한다. 그 외 `.specify` 벤더 자산(templates/scripts/
  workflows)은 패키지 원본과 바이트 일치 시 추적 해제 대상으로 보고한다
  (실파일은 install이 관리하므로 커밋 불필요 — 단 삭제가 아니라 인덱스
  회수만).
- **Rationale**: 6/6 레포의 feature.json이 하네스 spec
  `specs/013-unify-naming-entrypoints`를 가리키는 실측. 판정 기준을 패키지에서
  읽으면 버전과 함께 자동 갱신된다(selectUntouchedCopies와 같은 원리).
  프로젝트 자체 spec을 가리키는 feature.json은 진행 중 체크포인트라 보존.
- **Alternatives considered**: .specify 전체 삭제(리젝: 진행 중 기능
  체크포인트 소실 — prune-downstream이 .specify를 제외해 온 이유),
  .specify 전체 gitignore(리젝: constitution.md 등 커밋 가치가 있는 프로젝트
  상태 존재 — 커밋/비추적 정책 변경은 이 스펙 범위 밖).

## R7. README / package.json / package-lock.json 정규화

- **Decision**: (a) README.md — 패키지 원본과 바이트 일치 시 잔재로 판정,
  `--apply`에서 `# <레포 디렉터리명>` 한 줄 스텁으로 교체. 다르면 보존.
  (b) package.json — init-project의 `normalize_root_scripts` 인라인 로직을
  `normalize-root-package.mjs`로 추출해 양쪽에서 호출. 추가로 `name`이
  `codi-harness-v2`이면 레포 디렉터리명으로 교체. (c) package-lock.json —
  package.json이 정규화 대상이었고 lock이 패키지 원본과 바이트 일치하면 삭제
  (다음 `npm install`이 재생성). 다르면 보존.
- **Rationale**: hansi 실측 — name이 `codi-harness-v2`, `check`에 `npm test`
  잔존(tests/ 부재로 깨진 참조). 바이트 일치 기준은 기존
  selectUntouchedCopies 원칙(오삭제보다 잔재)과 동일.
- **Alternatives considered**: README 삭제(리젝: 레포 첫 화면 공백), README
  템플릿 생성(리젝: 프로젝트 문서는 프로젝트 소유 — 스텁 최소화가 경계 존중).

## R8. docs/audits 하네스 사본 처리

- **Decision**: `docs/audits`를 **이름+내용 일치** 선별 정리 대상으로 추가한다
  (패키지의 `docs/audits/` 항목과 이름이 같고 바이트 일치할 때만 삭제).
  이름은 같은데 내용이 다르면 보존 + 보고. 구현은
  CONTENT_MATCH_PRUNE_DIRS 계열 확장으로 하되, data/처럼 spec-id 판정은
  불필요(감사 문서에는 id 배열이 없음)하므로 바이트 일치만 쓴다.
- **Rationale**: 6/6 레포에 하네스 감사 기록 10개가 project-owned 보호로 영구
  잔존하는 실측. `2026-07-07-planning-retirement.md` 등은 하네스 정책이
  참조하는 문서라 이름 충돌 가능성이 낮지만, 다운스트림이 자체 감사 기록을
  docs/audits에 두는 것이 정책상 권장되므로(guardrails) 이름-만 판정은
  위험하다.
- **Alternatives considered**: 이름 일치만(리젝: 자체 감사 오삭제 위험),
  docs/audits 통째 삭제(리젝: project-owned 계약 위반).

## R9. 롤아웃 절차와 검증 기록

- **Decision**: 순서 — (1) 하네스 릴리스(버전 태그)로 신규 동작을 패키지에
  실음 → (2) 레포별로 `./harness pkg-sync`(신규 버전 수신·gitignore 갱신·
  잔재 보고) → (3) `./harness prune-downstream`(check 검토) → (4) 사용자
  승인 후 `--apply` → (5) 소유자 커밋·push. 레포별 검증 결과(분류별 0건)는
  `specs/015-downstream-residue-cleanup/rollout-record.md`에 기록한다.
- **Rationale**: 기존 다운스트림에 신규 동작이 도달하는 유일한 경로가 릴리스
  태그이므로 릴리스가 선행돼야 한다. 검증 기록은 spec 디렉터리가 durable
  state라는 컨벤션(constitution II)을 따른다.
- **Alternatives considered**: 릴리스 전 로컬 스크립트 직접 실행(리젝: 6개
  레포가 각자 다른 버전 스크립트로 정리되는 드리프트 재발 위험 — 단, 검증
  용도의 dry-run은 허용).
