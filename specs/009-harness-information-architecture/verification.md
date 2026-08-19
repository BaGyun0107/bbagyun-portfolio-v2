# Verification: 하네스 정보구조·기능 추적성·사용자 흐름 정본화

검증일: 2026-07-16

## 자동 검증

- [x] `node --test tests/feature-hub-canonical-data.test.mjs` — 4개 테스트 통과; sitemap 17개 node, feature 9개, relation 64개, flow 3개 검증.
- [x] `node --test --test-reporter=dot tests/*.test.mjs` — 437개 전체 Node 테스트 통과, exit 0.
- [x] `node .harness/scripts/checks/rule-check.mjs` — `ok: rule lifecycle checks passed`.
- [x] `mise run docs:build` — `docs/index.html` 생성; 문서 114건, 기능 9건, 기능정의 9건. read-only model 확인에서 relation 64개, flow 3개, `broken/duplicate/orphan/flowBroken/flowCycle` 0, 미배치 필수 힌트 0건.

## 자동 검증 메모

- 기존 sitemap/traceability/user-flow fail-open 관련 57개 테스트를 별도로 실행해 모두 통과했다.
- build의 `빈 화면 노드 10개` 안내는 sitemap node를 계층 보존 목적으로 남긴 상태에서 직접 기능 배치가 없는 하위 화면을 알리는 비차단 품질 지표다. feature 미배치, broken, duplicate 또는 orphan은 아니다.
- `mise`가 sandbox 밖 사용자 cache에 쓰지 못한다는 warning은 있었으나 모든 검증 명령은 exit 0으로 완료됐다.

## Convergence

- [x] 1차 대조에서 dependency·verification parity test, inferred review label, 최종 HTML 재생성 gap 3건을 T033~T035로 append하고 해소했다.
- [x] 2차 대조에서 FR 12개, SC 8개, 인수 조건 14개, 계획 결정 8개와 구현·검증을 재확인했다. 추가 gap 0건 — Converged.

상태 동기화: `mise run feature:status:sync --apply`를 두 번 실행해 결정적인
인접 전이 `in-progress → in-review → done`을 적용했다. ambiguous 또는
on-hold 항목은 없었다.

## 브라우저 검증

- [x] relation/tree/table/flow/detail desktop — relation 상태 83건(명시 64 + flow 파생 19), 끊김·중복·고립·미배치 0; flow 3건, 끊김·순환 0; table 9행; 009 detail의 시나리오·인수 조건·FR·SC와 원본 Spec 링크 확인.
- [x] keyboard-only navigation — relation 버튼 focus 후 Enter 활성화, Tab으로 sitemap 버튼 이동 후 Enter 활성화; `aria-pressed`와 view visibility 전환 및 009 detail 선택 상태 유지 확인.
- [x] mobile 375×812 overflow — `innerWidth`, document/body scrollWidth 모두 375, 수평 overflow 0, console error 0.
- [x] source and evidence inspection — 브라우저 주입 model의 explicit relation 64개와 009 evidence 8개 확인; inferred 4개 모두 PM/PL review 상태·승인일 label과 로컬 Spec evidence 경로 보존.
