# Quickstart: 감사 발견 일괄 수정 (1차) — 검증 가이드

전제: 저장소 루트, 브랜치 `fix/016-audit-remediation`, mise 준비 완료.

## V1. 드리프트 가드 실효성 (SC-001, SC-002)

```sh
node --test tests/prune-downstream-project-state.test.mjs tests/materialize-relative-links.test.mjs
```

- 기대: green. 이후 시뮬레이션 — materialize.sh 링크 루프에서 `docs` 를 임시 제거하고
  같은 테스트 실행 → 드리프트 가드 1건 이상 실패 확인 → 원복.
  (반대 방향: STALE_WORKCOPY_PATHS 에서 한 항목 제거 → 역시 실패해야 함.)

## V2. ROADMAP 보존 (SC-003)

```sh
node --test tests/prune-downstream-project-state.test.mjs
```

- 기대: "수정된 ROADMAP 보존 / 패키지 사본과 동일한 ROADMAP 삭제" 두 케이스 green.

## V3. temp 무누수·gpgsign 격리 (SC-004)

```sh
ls "${TMPDIR:-/tmp}" | grep -c 'codi-' ; npm test ; ls "${TMPDIR:-/tmp}" | grep -c 'codi-'
```

- 기대: 전후 카운트 동일(순증가 0). gpgsign 격리는
  `tests/helpers/fixture-base` 사용 테스트가 `GIT_CONFIG_GLOBAL=/dev/null` 환경으로
  실행됨을 코드로 확인(전역 서명 머신 재현은 회귀 테스트가 대체).

## V4. 낡은 서술 0건 (SC-005)

```sh
grep -rn 'restore-harness' harness .harness/scripts/pkg/pkg-sync.sh || echo OK
grep -n 'currently empty' .harness/policies/update-policy.md || echo OK
grep -n 'reclaim-shared' .harness/scripts/setup/bootstrap.sh || echo OK
grep -n '\.planning' docs/audits/tools/skill-usage.mjs || echo OK
```

- 기대: 전부 OK (또는 정정된 문맥의 의도적 언급만).

## V5. 표면 실재화 + 전체 green (SC-006, SC-007)

```sh
grep -c 'test-init-project-flows' .harness/shared-manifest.json || echo OK
npm test
./harness doctor
```

- 기대: shared-manifest 에 리허설 스크립트 0건, npm test / doctor green.
- 스킬 카탈로그: `tests/harness-cli.test.mjs` 의 카탈로그 문서화 테스트 green 이
  유령 0건·문서화 누락 0건을 함께 보증.
