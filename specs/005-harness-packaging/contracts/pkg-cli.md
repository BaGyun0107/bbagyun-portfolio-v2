# CLI Contract: 패키지 소비·발행 커맨드

## ./harness pin <X.Y.Z>

- lock을 `{ "version": "X.Y.Z" }`로 갱신하고 즉시 flip.
- 캐시에 없으면 수신 후 flip (오프라인 + 캐시 없음 → exit 1, 트리 불변).
- exit 0 성공 / 1 실패(원인+다음 행동 출력) / 2 사용법(버전 형식 오류).

## ./harness pin --channel latest-minor

- lock을 자동 채널로 되돌린다. 다음 세션 시작부터 자동 반영 재개.

## ./harness update --major

- 채널이 감지한 상위 major로의 전환을 명시 승인. lock이 고정 버전이면
  해당 major 최신으로 갱신 제안 후 적용. exit 코드는 pin과 동일.

## ./harness release <X.Y.Z> (업스트림 전용)

- release-check(태그 형식 + CHANGELOG `## vX.Y.Z` 절 존재) 통과 시에만
  annotated tag 생성. push는 하지 않는다(사람이 수행).
- 검증 실패 → exit 1 + 누락 항목 안내.

## preflight 연계 (./harness claude|codex)

- pending 표시가 있으면 exec 이전에 flip 수행 → 세션은 항상 단일 버전.
- 오프라인/원격 실패 시 조용히 현재 버전 유지 (exit 코드 영향 없음).

## 출력 공통

- 한국어, 실패 시 원인과 "다음에 할 행동" 1줄 포함 (Phase 1 컨벤션).
