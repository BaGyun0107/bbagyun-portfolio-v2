# Research: 최초 프로젝트 설정 단순화

Date: 2026-08-06. clarify 1문항(스켈레톤 형태 B) + 아래 조사로 모든 미결
해소.

## R1. 스킬 갭의 실체 (2026-08-06 확인)

- **Decision**: `init-project` SKILL.md Workflow 1단계 필수 질문에 "신규
  프로젝트면 git 히스토리 재시작(`--reset-git`) 적용 — 기본 예"를 추가하고,
  Commands 예시에 신규 경로 표준 호출(`--reset-git` 포함)을 명시한다.
- **Rationale**: 현재 `--reset-git`은 `references/import-mode.md`에만
  등장(전수 grep 1건). 신규 경로에서 에이전트가 스킬만 따라가면 하네스 전체
  히스토리가 새 프로젝트에 남는다.
- **Alternatives considered**: CLI 기본값을 reset으로 뒤집기(기존 스크립트
  사용처의 동작 변경 — 기각), flow.md에만 추가(본문 질문 계약이 정본이어야
  테스트 가능 — 기각).

## R2. 스켈레톤 전달 방식 — 생성 스크립트 (별도 시작점 저장소 없음)

- **Decision**: 스켈레톤은 본 레포의 `new-project-skeleton.sh`(신규,
  `./harness new-project` 하위명령으로 노출)가 빈 디렉터리에 생성한다.
  포함 파일 목록은 스크립트 내 단일 정본으로 커밋. 원격 발행물은 만들지
  않는다.
- **Rationale**: (1) 런처 자가 부트스트랩이 이미 "런처 + `harness.lock`만
  있는 트리"를 지원(packaging-guide §2 — fresh clone에서 lock만으로 첫
  수신·materialize). (2) 별도 시작점 저장소는 교차-repo 발행 토큰이
  필요한데 GitHub Secrets 정책(Infisical 2종만)과 충돌. (3) 생성 스크립트는
  릴리스와 자동 동기화됨 — lock 채널이 bootstrap 시점에 최신 버전을
  해석하므로 "발행물 드리프트"가 구조적으로 없다. FR-004의 "자동 발행"과
  FR-007의 "발행 실패" 우려는 이 설계에서 퇴화적으로 충족된다(발행 단계
  자체가 없고, 정본 목록은 레포와 함께 버전됨) — tasks 리뷰에서 사용자
  확인 대상.
- **Alternatives considered**: GitHub Template Repository(교차-repo 토큰
  필요 + 전체 스냅샷 드리프트 — clarify에서 기각), CI가 스켈레톤 zip을
  GitHub Release 자산으로 첨부(가능한 보완이나 필수 아님 — 백로그).

## R3. 스켈레톤 구성 파일 (정본 목록 초안)

- **Decision**: `harness`(런처), `harness.lock`(channel: latest-minor +
  repo), `mise.toml`(node 24 등 도구 선언), `.gitignore` 씨앗,
  `AGENTS.md`/`CLAUDE.md` 씨앗(다운스트림용 얇은 엔트리), `README.md` 스텁.
  이후 항목은 bootstrap의 pkg-sync materialize가 채운다.
- **Rationale**: 런처 자가 부트스트랩의 최소 요건 + 첫 에이전트 세션이
  바로 동작하기 위한 엔트리포인트. 정확한 최종 목록은 구현 중
  스켈레톤 구성 테스트(RED→GREEN)로 확정.
- **Alternatives considered**: 런처+lock 2파일만(첫 세션에 엔트리포인트
  부재로 에이전트 규칙 미로드 — 기각).

## R4. 신규 흐름에서 init-project의 역할 축소

- **Decision**: 스켈레톤 출발 프로젝트(판정: `harness.lock` 존재 + 하네스
  upstream 시그니처 부재 — 기존 clone 판정 함정 회피)는 init-project에서
  히스토리/잔재 정리 단계를 건너뛰고 repo 생성·권한·Infisical·앱 스캐폴드만
  수행한다.
- **Rationale**: FR-006. origin 기반 판정은 로컬 clone에서 오판 이력이
  있어(메모리: harness-clone-detection-pitfall) 시그니처 파일 기반으로
  판정한다.
- **Alternatives considered**: 항상 정리 단계 실행(스켈레톤에선 no-op이지만
  불필요한 위험 표면 — 기각).

## R5. README 시나리오 A 재구성

- **Decision**: 기본 안내를 두 경로로 재작성 — (1) 신규: `./harness
  new-project <dir>`(또는 curl 원라이너) → `cd` → `./harness bootstrap` →
  에이전트 세션에서 init-project 스킬 대화(앱 스캐폴드·repo·Infisical),
  (2) 보조: 기존 full clone + CLI 플래그(스크립트/CI·구버전 호환).
- **Rationale**: FR-002. 합류자(B 시나리오)와 최초 생성자(A 시나리오)의
  차이가 "스켈레톤 생성 1스텝"으로 줄어든다.
- **Alternatives considered**: 스킬 경로만 안내(CI/무세션 환경 회귀 —
  기각).

## R6. 테스트 전략 (FR-008, TDD 진입점)

- **Decision**: ① `init-project-skill-contract.test.mjs` — SKILL.md 본문에
  신규-경로 질문(히스토리 재시작)과 정본 CLI 호출만 존재함을 검사(RED로
  시작: 현재 질문 부재). ② `new-project-skeleton.test.mjs` — 임시
  디렉터리에 스켈레톤 생성 후 필수 파일 존재·하네스-자체 잔재 0건·런처 실행
  가능성 검사(RED로 시작: 스크립트 부재). 네트워크 수신이 필요한 bootstrap
  전체는 기존 lock 모드 테스트(fixture) 패턴을 재사용해 오프라인로 검증.
- **Rationale**: constitution III. 스킬 문서도 계약 테스트로 회귀를 막는다
  (018의 gstack-residue와 동일 접근).
- **Alternatives considered**: 수동 검증만(재발 방지 없음 — 기각).
