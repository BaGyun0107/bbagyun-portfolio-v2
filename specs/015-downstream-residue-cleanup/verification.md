# Verification: 다운스트림 잔재 정리 완결

**Date**: 2026-07-30 | **Branch**: feat/015-downstream-residue-cleanup | **루프 회차**: 1

## 검증 체크리스트

- [x] npm test 전체 green (구현 시점 729/729)
- [x] context-check / rule-check / doctor 통과
- [x] 코드 리뷰 Critical 0 · Important 전부 반영
- [x] v1.3.0 릴리스 발행 (PR #114 머지)
- [x] 6개 레포 롤아웃 잔재 0건 (rollout-record.md)
- [x] 팀원 시나리오 실측 — 인덱스 불변·절대링크 0

## 검증 체인 (quickstart V1)

| 검증 | 명령 | 결과 |
|---|---|---|
| 단위·통합 | `npm test` | **729/729 pass** (신규 테스트 7본 + 갱신 3본 포함) |
| 컨텍스트 | `./harness context-check` | 0 failure, 0 warning |
| 룰 | `./harness rule-check` | ok |
| 종합 | `./harness doctor` | 실패 0, 경고 2 (기존 경고 — 계약상 통과) |
| e2e | 해당 없음 | 도구 체인 — 사용자-facing 앱 플로우 아님 (marker `no`) |

## TDD 증거

각 갭의 회귀 테스트를 구현 전에 작성하고 red 를 확인한 뒤 구현했다:

- 갭 3·4: tests/migrate-plan-residue.test.mjs — red 확인(export 부재) → T005 green
- 갭 2: tests/upstream-project-state.test.mjs, tests/normalize-root-package.test.mjs — red → T006·T007 green
- US1: tests/prune-downstream-project-state.test.mjs — red(2건) → T009·T010 green, 3회차 고정점·집계 일치 검증 포함
- 갭 6: tests/member-flow-index-immutable.test.mjs — red(reclaim 자동 회수 재현) → T013 green
- 갭 1: tests/pkg-sync-gitignore.test.mjs — red → T017·T018 green
- 갭 5: tests/materialize-relative-links.test.mjs — red(절대경로 3건 검출) → T020·T021 green

## 코드 리뷰 (superpowers 리뷰어 서브에이전트)

- 평가: **With fixes** — Critical 0, Important 3, Minor 5
- Important 반영: ① materialize link_entry 데이터 흐름 명시(할당 순서),
  ② bootstrap-summary 의 legacy `reclaimed` 출력 제거(파서는 하위 호환 유지),
  ③ reclaim-shared 헤더에 PKG_ROOT 의미 변화 명시
- Minor 반영: ls-files 중복 제거, --help 5분류 갱신, 정규화 실패 시 집계
  미증가, dangling $schema 제거, 수렴 테스트 3회차+집계 일치로 강화
- 미반영(기록): 공백 경로 픽스처(리뷰어 판정 low — 셸 인용은 검증됨),
  `git ls-files` 개행 파일명 — 레포 컨벤션상 비발생, 후속 과제로 남김
- 리뷰어 실측 검증 항목: 분류 5종의 상호 배타성, set -eu 가드, 디렉터리-링크
  `git rm -r --cached` 동작, walkFiles 심링크 안전성, POSIX suffix 확장

## 사실 정정 (구현 중 발견)

- research R5 의 "reclaim 자동 회수 미릴리스" 전제는 오류 — v1.2.1 에 릴리스됨
  (`git ls-tree v1.2.1`). CHANGELOG v1.3.0 에 **동작 변경**으로 명시했다.
- doctor 실패 1건은 신규 normalize-root-package.mjs 의 실행 비트 누락이 원인
  이었다 (chmod +x 로 해결).

## 롤아웃 완료 (2026-07-30 추가)

- T023: PR #114 머지로 v1.3.0 태그·릴리스 발행 확인
- T024: 6개 레포 전부 잔재 0건, 정리 커밋·PR 생성 (사용자 A~D 일괄 승인)
- T025: 팀원 시나리오 실측 — 인덱스 불변·수정 0·절대링크 0
- 상세 표·한계·후속(v1.3.1 후보 3건): rollout-record.md 참조
