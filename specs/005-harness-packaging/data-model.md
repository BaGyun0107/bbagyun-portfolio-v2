# Data Model: 하네스 패키지화 (Phase 2)

## harness.lock (커밋, 루트)

- **형식**: JSON, 두 형태 중 하나 (동시 지정은 오류):
  - `{ "schema_version": 1, "channel": "latest-minor" }`
  - `{ "schema_version": 1, "version": "1.4.0" }`
- **검증 규칙**: channel은 `latest-minor`만 허용(향후 확장 여지),
  version은 semver `X.Y.Z`. 둘 다 없거나 둘 다 있으면 resolve가 거부.
- **소유**: 프로젝트(커밋됨). `harness pin`이 갱신하는 유일한 파일.

## 버전 캐시 (머신 글로벌, 파생)

- **경로**: `$CODI_HARNESS_CACHE_DIR` (기본 `~/.codi-harness`)
  - `versions/<X.Y.Z>/` — 불변. 존재 = 수신 완료 (partial→mv 확정)
  - `versions/<X.Y.Z>.partial/` — 수신 중 임시 (재시도 시 삭제 가능)
  - `fetch.lock/` — mkdir 기반 동시성 잠금
  - `pending/<repo-hash>` — 백그라운드 수신 완료·flip 대기 표시 (R5)
- **상태 전이**: 없음(불변 디렉토리). 삭제 시 재수신으로 복구.

## .harness/current (레포 로컬, git-ignore)

- **형식**: `versions/<ver>`를 가리키는 심링크 — 레포가 "지금 쓰는 버전"의
  유일한 간접 지점. `ln -sfn` 교체가 곧 버전 전환(원자적).
- materialize 대상(.claude/rules 등)은 전부 `.harness/current/...` 를
  가리키는 고정 심링크라 전환 시 재작성이 필요 없다.

## CHANGELOG.md (업스트림, 커밋)

- **형식**: 버전별 절 `## vX.Y.Z` — release-check가 태그와 짝 검증.
