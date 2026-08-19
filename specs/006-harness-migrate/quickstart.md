# Quickstart Validation: 기존 다운스트림 migrate (Phase 3)

계약: [contracts/migrate-cli.md](./contracts/migrate-cli.md) ·
결정: [research.md](./research.md)

모든 시나리오는 복사본 커밋형 가짜 다운스트림(005 픽스처 확장) +
`CODI_HARNESS_CACHE_DIR` 격리로 실행한다.

## 시나리오 1 — dry-run (US1)

기대: 제거 예정 공유 파일 목록 + 생성 예정(lock) 출력, 워킹트리 변경 0건,
exit 0.

## 시나리오 2 — 전환 (US1)

기대: lock 생성 + 공유 파일 제거 + `.harness/current` 트리 구성. 프로젝트
소유물(specs/, skills-local/, project-profile.yaml) 무변경(SC-003).
재실행 시 "이미 전환됨" 멱등(exit 0).

## 시나리오 3 — 보호 장치 (US1 엣지)

기대: dirty 워킹트리 → 목록 + 중단 exit 1. 업스트림 레포 → 거부 exit 2.
오프라인 → lock 미생성 상태로 중단 exit 1.

## 시나리오 4 — 룰 단일 출처 (US2, SC-004)

기대: 전환 후 동일 공유 룰이 복사본과 shared 링크 양쪽에 존재하지 않음.
init-project `--fresh` 경로도 동일.

## 시나리오 5 — 구 동기화 가드 (US3)

기대: lock 모드 레포에서 update 적용·prune·restore 실행 → 변경 0건 + pkg
흐름 안내. lock 없는 레포 → 기존 동작.

## 시나리오 6 — 실전 리허설 (릴리스 후, 사용자 동반)

실제 다운스트림 1곳에서 dry-run → 리뷰 → 전환 → 팀원 pull 후 bootstrap
확인. 결과를 verification.md에 기록.
