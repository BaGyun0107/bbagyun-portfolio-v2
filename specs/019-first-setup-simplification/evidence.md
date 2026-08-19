# Evidence: 019 최초 프로젝트 설정 단순화

## V1/T007 — 대화형 초기화 경로 (2026-08-06)

- 스킬 계약 테스트 `tests/init-project-skill-contract.test.mjs`:
  RED(질문·표준 호출 부재 2건 실패) → SKILL.md/flow.md 수정 후 GREEN.
- 샌드박스 리허설 `mise run init-rehearse`(mock gh/git 기반, 3케이스):
  "init-project flow tests passed". 스킬이 호출하는 정본 CLI 경로가 신규/
  임포트/와이어링 케이스에서 동작함을 확인.
- 부수 수정: 리허설 기대 문자열 1건이 #125(캐시 게이트 잡 통합) 이후 구명칭
  ("Dependency full scan cache")으로 남아 있어 "Restore successful full
  scan cache"로 갱신 (019와 무관한 기존 드리프트).
- 참고: 샌드박스가 materialize한 태그 릴리스(v1.4.1)는 018 이전이라 이전
  도구 setup 로그가 보인다 — 다음 릴리스 태그부터 018 반영.

## V2/T008~T010 — 스킬·CLI 단일 정본 (2026-08-06)

- 계약 검사 확장: SKILL.md·flow.md에 직접 git 히스토리 조작(`git init`,
  `--orphan`, `rm -rf .git`) 부재 검사 추가 → 3/3 GREEN, 위반 0건(T009
  조치 불필요).
- SC-003 판정: 스킬은 정본 CLI(`./harness init-project`) 호출 외의 실행
  경로가 없음이 계약 테스트로 보장되므로, 동일 답변 → 동일 CLI 호출 →
  동일 결과 트리가 구조적으로 성립. 실행 증거는 리허설 3케이스(V1)와 동일
  트리 검증을 공유.

## V3·V4/T011~T017 — 스켈레톤 시작점 (2026-08-06)

- 구성 테스트 RED(4건: 스크립트 부재) → 구현 → GREEN. 1차 실검증에서
  doctor 실패 4건(project-profile·워크플로 부재 연쇄) 발견 → 스켈레톤
  씨앗에 `.harness/config/project-profile.yaml`과 배포/CI 워크플로
  (업스트림 전용 release/harness-ci 제외)를 추가.
- 2차 실검증(scratchpad/pilot-019b): `./harness new-project` →
  `./harness bootstrap` → **doctor 실패 0** (경고 1건은 019 무관 — PATH
  claude 바이너리 중복 안내). 하네스-자체 잔재 0건 (SC-004, SC-005).
- 릴리스 동기화: materialize 버전 1.4.1 = 최신 태그 v1.4.1 (SC-006 —
  발행 단계 없이 lock 채널 해석으로 자동 일치).
- init-project 스켈레톤 출발 판정: harness.lock 존재 + upstream 작업 상태
  (정본 목록) 부재 → 히스토리/잔재 정리 생략 (기존 init-project 테스트
  10/10 GREEN, 계약 갱신 포함).
