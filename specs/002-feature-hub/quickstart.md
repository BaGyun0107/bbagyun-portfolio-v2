# Quickstart / 검증 가이드: 기능 허브 + 기능정의 상태 flow

구현이 끝난 뒤 이 순서로 기능이 실제 동작함을 증명한다. 상세 필드/전이는
[data-model.md](./data-model.md), 커맨드 계약은 [contracts/cli.md](./contracts/cli.md) 참조.

## 사전 조건

- 저장소 루트에서 실행. `mise`와 Node.js가 준비된 상태(하네스 기본).
- 브라우저(Chrome 권장).

## 시나리오 1 — 상태 데이터 없이 허브 생성 (US1, SC-001)

```sh
# registry.json 없고 status.yaml 없어도:
mise run docs:build
```

기대: exit 0, `docs/index.html` 생성. 브라우저로 열면(`file://`) 역할별 카드 4개와 MD 문서
색인이 보이고, 네트워크 차단 상태에서도 정상 렌더된다. 대시보드 섹션은 비어 있거나 생략.

## 시나리오 2 — 문서 색인 검색 (US1, SC-002)

`docs/index.html`을 브라우저로 열고 색인 섹션 검색창에 문서 제목 일부를 입력 → 일치 문서만
실시간 필터링되는지 확인.

## 시나리오 3 — 상태 전이 flow (US2, SC-003/SC-004)

```sh
# 이 기능 자신(002-feature-hub)의 status.yaml로 검증
mise run feature:status 002-feature-hub in-progress
mise run feature:status 002-feature-hub in-review
mise run feature:status 002-feature-hub done
```

기대: 각 단계가 `specs/002-feature-hub/status.yaml`의 `status`와 `history`를 갱신.

```sh
# 정의 안 된 점프는 거부
mise run feature:status 002-feature-hub planned   # done에서 planned로 역행 → 경고
mise run feature:status 999-nope in-progress       # 없는 id → exit 1
```

## 시나리오 4 — 자동 힌트 (US2, FR-010)

`002-feature-hub/tasks.md`의 모든 항목을 `[x]`로 두고 status를 `in-progress`로 둔 뒤:

```sh
mise run docs:build
```

기대: stdout에 "in-review로 전이 제안" 힌트 출력. **status.yaml은 자동 변경되지 않음**.

## 시나리오 5 — registry 유무 무관 수렴 (US3, SC-005/SC-006)

```sh
# (a) registry에 spec 없는 기능을 넣고 빌드 → planned로 표시
mise run docs:build
# (b) registry.json 삭제 후 빌드 → 실패 없이 spec만으로 대시보드 채움
rm registry.json && mise run docs:build
```

기대: (b)도 exit 0. 같은 기능을 registry-먼저/spec-먼저로 만들면 최종 대시보드 표시 동일.

## 시나리오 6 — 단위 테스트 (SC-007)

```sh
npm test    # node --test tests/*.test.mjs
```

기대: `feature-hub-scan-md`, `feature-hub-merge-registry`, `feature-hub-transition`
테스트 전부 통과.

## 통합 검증 (verify 스킬)

실제 `mise run docs:build` 실행 후 생성된 `docs/index.html`을 브라우저로 열어 3섹션
(역할카드/색인/대시보드)이 렌더되는지 눈으로 확인한다.
