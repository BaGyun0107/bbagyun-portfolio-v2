# CLI Contract: ./harness migrate

## 호출

```sh
./harness migrate [--dry-run] [--fresh]
```

- `--dry-run`: 변경 0건. 제거될 파일 목록 + 생성될 파일(lock 등)만 출력.
- `--fresh`: init-project 전용 내부 모드 — 신규 생성 직후라 확인 안내를
  생략하고 pruning만 수행. 사용자 문서에는 노출하지 않는다.

## 종료 코드

| 코드 | 의미 |
|------|------|
| 0 | 전환 완료(또는 dry-run/이미 전환됨·멱등) |
| 1 | 중단 — dirty 워킹트리, 오프라인, 검증 실패 (원인+다음 행동 출력) |
| 2 | 사용법 오류 또는 업스트림 하네스 레포에서 실행 |

## 순서 (실패 지점 이전 상태 보존)

1. 업스트림 레포 감지 → 거부 (exit 2)
2. 이미 lock 모드(harness.lock + .harness/current 존재)면 멱등 종료
3. git-dirty 검사 → dirty 목록 출력 후 중단 (exit 1)
4. harness.lock 생성(채널 latest-minor) → pkg-sync(수신+materialize).
   오프라인이면 lock을 되돌리고 중단 (exit 1)
5. 제거 목록 계산(migrate-plan.mjs) → `git rm` 수준의 추적 삭제 실행
6. doctor 검증 → 실패 시 원인 출력 (변경은 남긴 채 exit 1 — diff가 곧
   리뷰 대상이므로)
7. 요약: 제거 N건, 생성 목록, "diff 리뷰 후 커밋" + "되돌리기:
   git restore --staged --worktree ." 안내

## 출력 공통

- 한국어, 실패 시 원인과 다음 행동 1줄 (Phase 1/2 컨벤션).
