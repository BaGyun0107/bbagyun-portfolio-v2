# Implementation Plan: 감사 후속 웨이브 (2차)

**Branch**: `fix/017-audit-wave2` | **Date**: 2026-08-03 | **Spec**: [spec.md](spec.md)

**Input**: spec.md + 감사 보고서(docs/audits/2026-07-31-full-harness-audit.md,
M-1~M-4·M-11~M-16·L-* 절) + 소유자 결정 5건(2026-08-03).

## Summary

결정 집행(US1) → 갱신 체인 단일화·manifest 고아 해소(US2) → 테스트
견고화·분할(US3) → LOW 마감(US4). TDD — 동작 변경은 회귀 선행. D-6 은 이미
집행(83,735개/약 5GB, 머신 로컬이라 레포 변경 없음).

## Technical Context

016 과 동일: Node 24 + POSIX sh, `node --test`, 다운스트림 하위 호환 유지,
오삭제보다 잔재. 신규 파일: `.harness/scripts/pkg/apply-version.sh`,
`.harness/scripts/setup/project-owned-fallback.sh`(L-1),
tests/prune-downstream-cli.test.mjs·tests/init-project.test.mjs(분할).

## 접근 결정 (research 겸용)

- **R1 (D-2)**: T098/T101 은 삭제하지 않고 체크 + "2026-08-03 소유자 철회
  (감사 D-2 — 기능 존속 미정)" 주석. verification.md 에 결정 기록 절 추가 후
  `feature:status:sync --apply` 로 done 전이. SC-001 원문은 역사적 기록으로
  보존한다.
- **R2 (D-3)**: scan-feature-details.mjs 의 경고 조건을
  `nonEmpty(feature.detailId)` 일 때로 한정(미선언 = 카탈로그-only 운영).
  decisions.json 은 status resolved + resolvedAt + resolution 문구.
  detailId 16건 제거. canonical-data 테스트의 경고·결정 단언은 반대 방향
  (경고 0건, resolved)으로 교체.
- **R3 (D-5 + M-4 부분)**: project-owned.mjs 에 `docs/superpowers/`·
  `docs/prompts/` + `CHANGELOG.md` + `harness.lock.example` 추가 → 3경로
  정합성: update.sh·update-check.sh 셸 fallback, update-policy.md 표,
  기존 동등성 테스트 함께 갱신 ([[project-owned-three-path-parity]] 메모).
  이후 `./harness manifest` 재생성으로 배포 제외가 자동 반영된다.
- **R4 (M-4 링크 측)**: docs/harness-overview.md·docs/planning-hub-handoff.md
  를 materialize 루트 링크 루프 + lockModeEntries + STALE_WORKCOPY_PATHS 에
  추가(CONTRIBUTING.md 와 동급). 016 드리프트 가드가 정확 일치라 세 목록과
  가드 픽스처를 함께 갱신해야 green — 그것이 의도된 마찰이다.
  고아 회귀 테스트: manifest 파일 각각에 대해 (링크 집합 ∪ ignore 패턴 ∪
  KEEP_COMMITTED ∪ 명시 예외) 소속을 단언.
- **R5 (M-1)**: apply-version.sh = fetch 검증 없이 "materialize + keep-committed"
  만 순서 보장. pkg-sync.sh·migrate.sh·pkg-apply-pending.sh·pin.sh·
  pkg-update-major.sh 가 이것을 호출. 소스 대조 테스트: materialize.sh 직접
  호출이 apply-version.sh 밖에 없어야 한다.
- **R6 (M-3)**: fallback 배열 제거, node import 실패 시 echo+return 1.
  harness-cli 의 관련 테스트는 PROJECT_ROOT 를 실제 레포로 잡아 정본 경로를
  타게 수정.
- **R7 (M-13)**: features/serviceDefinition/traceability entities 상호 일치 +
  `readdirSync('specs')` 유도 개수 + 링크 카운트는 타입별 '기능 수 유도식'
  (satisfied/specified/verified == features, appears-on == placements 합,
  depends-on == depends_on 합)으로 교체.
- **R8 (M-15/16)**: harness-cli 에서 prune-downstream 블록(5634~)과
  init-project 블록을 각각 tests/prune-downstream-cli.test.mjs·
  tests/init-project.test.mjs 로 순수 이동. 공용 헬퍼(runNode 등)는
  tests/helpers/cli-fixture.mjs 로 추출. 인라인 잔재 픽스처는
  downstream-fixture 조합으로 재작성(M-16).
- **R9 (L-15)**: makeFakeUpstream 읽기 전용 공유는 모듈 스코프 lazy 1회 생성
  (파일 단위 프로세스라 안전). pkg-pin-update 는 태그 push 로 상태를 바꾸므로
  전용 인스턴스 유지.

## Constitution Check

파괴적 작업 없음(D-6 은 기집행·승인됨). 인덱스 변경은 업스트림 자신의 커밋뿐.
TDD 적용. AI-read 파일 영어 산문 규칙 준수(M-7 자체는 여전히 범위 밖 —
docs/audits backlog 유지).

## Complexity Tracking

위반 없음.
