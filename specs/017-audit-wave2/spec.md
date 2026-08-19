# Feature Specification: 감사 후속 웨이브 (2차) — 결정 집행 + 구조·테스트·잔손질

**Feature Branch**: `fix/017-audit-wave2`

**Created**: 2026-08-03

**Status**: Draft

**Input**: 2026-07-31 전수 감사 잔여분. 소유자 결정(2026-08-03): D-2 철회·종결,
D-3 detailId 제거(카탈로그-only 확정), D-4 현상 유지, D-5 초안 삭제, D-6 완료(5GB).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 소유자 결정이 저장소 상태에 반영된다 (Priority: P1)

D-2/D-3/D-5 결정을 집행해 열린 결정 0건·미완 spec 예외 0건 상태로 만든다.

**Acceptance Scenarios**:

1. **Given** specs/010, **When** 소유자 철회 결정 반영, **Then** T098/T101 이 철회
   주석과 함께 닫히고 status 가 done 으로 전이되며 in-flight 예외가 사라진다.
2. **Given** DEC-HARNESS-DETAIL-BACKFILL, **When** 카탈로그-only 확정, **Then**
   결정이 resolved 가 되고 detailId 가 제거되며, 상세-누락 경고는 detailId 를
   명시 선언한 기능에만 발생한다.
3. **Given** docs/superpowers 설계 초안, **When** 삭제, **Then** 카탈로그 인용
   3건이 specs/010 정본으로 교체되고 다운스트림 배포에서 빠진다.

---

### User Story 2 - 갱신 체인이 단일 진입점으로 움직인다 (Priority: P2)

M-1~M-4: materialize 를 부르는 모든 경로가 keep-committed 를 함께 수행하고,
update --check 문구가 실동작과 일치하며, init fallback 드리프트가 사라지고,
manifest 등재 파일이 전부 (링크 ∪ ignore ∪ 의도적 제외) 안에 들어간다.

**Acceptance Scenarios**:

1. **Given** materialize 호출부 5곳, **When** 소스 대조 테스트, **Then** 전부
   단일 진입점(apply-version)을 경유한다.
2. **Given** shared-manifest 등재 파일, **When** 고아 검사, **Then**
   '제거 대상 ∖ (링크 ∪ ignore)' 가 공집합이고 다운스트림 CONTRIBUTING 의
   문서 링크가 깨지지 않는다.
3. **Given** init-project 의 정리 경로, **When** node 정본을 읽지 못하면,
   **Then** 조용한 fallback 대신 명시 실패한다.

---

### User Story 3 - 테스트가 리팩터에 강해진다 (Priority: P3)

M-11~M-16: real:true 통합 경로·stale-workcopy 실디렉터리 케이스를 커버하고,
하드코딩 카운트·소스 정규식 단언을 유도값·행위 검증으로 바꾸며, 237KB 단일
테스트 파일을 기능 단위로 분할한다.

**Acceptance Scenarios**:

1. **Given** spec 이 하나 추가돼도, **When** 카탈로그 테스트 실행, **Then**
   리터럴 카운트 수정 없이 상호 일치 불변식으로 통과한다.
2. **Given** `.harness/skills` 실디렉터리 잔재, **When** `--apply`, **Then**
   삭제되고 `.harness/skills-local` 은 보존된다.
3. **Given** prune/init 등 기능별 테스트, **When** 분할 후 실행, **Then**
   전체 스위트가 green 이고 총 시간이 악화되지 않는다.

---

### User Story 4 - 낮은 우선순위 마감 (Priority: P4)

LOW 잔여: 공용 셸 fallback 추출(L-1), HARNESS_ROOT 전달(L-2), 앱 스캐폴드
start 안내(L-6), copy 모드 help·문서 은퇴 예고(L-7·L-8), skill-triggers
누락 2건+가드(L-10), source_ref 릴리스 검증(L-11), lock.example 현행화(L-13),
doctor 모드 보고 문서화(L-14), 패키징 픽스처 공유로 테스트 가속(L-15).

### Edge Cases

- detailId 제거 후에도 downstream 프로젝트가 detailId 를 명시 선언하면 기존
  경고 동작이 유지돼야 한다(의미 변경은 "미선언 = 카탈로그-only" 한정).
- docs/superpowers·docs/prompts 를 project-owned 로 옮길 때 3경로 정합성
  (node 분류기 + 셸 fallback 2곳 + 정책 표 + 테스트) 을 함께 갱신한다.
- CHANGELOG.md 를 manifest 에서 제외해도 release-check 게이트(업스트림 전용)는
  영향받지 않아야 한다.
- 테스트 파일 분할은 순수 이동 — 단언 내용 변경 금지(별도 태스크로만).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** (D-2): specs/010 의 T098/T101 은 소유자 철회 기록과 함께 종결되고
  status 는 done, ROADMAP 행이 갱신된다. 철회 사유(기능 존속 자체 미정)를
  verification.md 에 남긴다.
- **FR-002** (D-3): DEC-HARNESS-DETAIL-BACKFILL 은 resolved, feature-definitions
  의 detailId 는 전부 제거, 상세-누락 경고는 detailId 명시 선언 시로 한정된다.
- **FR-003** (D-5): 설계 초안은 git rm, 카탈로그 인용 3건은 specs/010 으로 교체,
  docs/superpowers/·docs/prompts/ 는 project-owned 로 분류돼 배포에서 빠진다.
- **FR-004** (M-1): materialize+keep-committed 는 단일 진입점(apply-version.sh)
  으로 묶이고 5개 호출부가 그것만 부른다. 소스 대조 테스트로 고정한다.
- **FR-005** (M-2): `mise run update`/launcher help 의 update --check 설명은
  실동작(GStack/Superpowers 안내)과 일치하고 하네스 확인은 update-check 를
  가리킨다.
- **FR-006** (M-3): init-project 정리의 하드코딩 fallback 은 제거되고 node 정본
  읽기 실패는 명시 실패한다. 관련 테스트도 정본 경로를 검증한다.
- **FR-007** (M-4): shared-manifest 등재 파일은 전부 (materialize 링크 ∪
  gitignore ∪ 의도적 예외) 에 속하며 회귀 테스트가 이를 고정한다.
  다운스트림 필요 문서(docs/harness-overview.md, docs/planning-hub-handoff.md)
  는 링크·ignore 로 제공되고, 업스트림 전용(CHANGELOG.md,
  harness.lock.example, docs/prompts/**, docs/superpowers/**)은 배포에서 뺀다.
- **FR-008** (M-11): real:true 항목이 pkg-sync 통합 경로에서 검증되고, 구버전
  ensure-gitignore 시나리오가 감지 가능한 동작으로 고정된다.
- **FR-009** (M-12): `.harness/skills` 실디렉터리 삭제와 `.harness/skills-local`
  보존이 `--apply` 회귀로 고정된다.
- **FR-010** (M-13): 카탈로그 카운트 단언은 유도값(상호 일치 + specs 디렉터리
  수)으로 교체된다.
- **FR-011** (M-14): 소스 정규식 단언은 행위 검증으로 교체되거나 완화된다.
- **FR-012** (M-15/16): harness-cli.test.mjs 의 prune-downstream·init-project
  블록은 별도 파일로 분리되고, prune 테스트는 공용 픽스처로 통합된다.
- **FR-013** (L-*): US4 열거 항목이 각각 반영된다.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 열린 결정 0건, 미체크 tasks.md 를 가진 spec 0건 (004 제외 여부는
  실측 후 기록).
- **SC-002**: manifest 고아 검사 테스트가 공집합을 단언하고 green.
- **SC-003**: 다운스트림 픽스처에서 CONTRIBUTING 의 planning-hub-handoff 링크가
  해석 가능하다(링크 존재).
- **SC-004**: spec 디렉터리 1개 추가 시 카탈로그 테스트 수정 필요 리터럴 0개.
- **SC-005**: npm test green + 총 시간 비악화(±10% 이내), doctor 실패 0.
- **SC-006**: materialize 호출부 중 keep-committed 미동반 호출 0곳.

## Assumptions

- D-4(.specify 사본)는 현상 유지 — 이번 범위에서 제외.
- M-15 분할은 prune-downstream·init-project 블록 우선(최대 덩어리), 나머지는
  describe 그룹핑으로 갈음할 수 있다.
- 이 웨이브는 v1.3.3 릴리스로 묶는다.
