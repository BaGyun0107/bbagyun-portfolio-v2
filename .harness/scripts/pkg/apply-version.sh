#!/usr/bin/env sh
# apply-version — materialize + KEEP_COMMITTED 갱신의 단일 진입점 (specs/017 M-1).
# materialize 만 부르면 커밋 파일(런처·AGENTS.md·CLAUDE.md)이 다음 pkg-sync
# 까지 낡은 채 남는다 — 호출부마다 keep-committed 동반 여부가 달랐던 드리프트를
# 여기서 끝낸다. materialize 를 직접 부르는 스크립트는 이 파일뿐이어야 한다
# (tests/apply-version.test.mjs 가 소스 대조로 고정).
# 사용법: apply-version.sh <X.Y.Z>  (다운스트림 레포 루트에서 실행)
set -eu

VERSION="${1:?X.Y.Z 버전이 필요합니다}"
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
CACHE_DIR="${CODI_HARNESS_CACHE_DIR:-$HOME/.codi-harness}"
ROOT_DIR="$(pwd)"

sh "$SCRIPT_DIR/materialize.sh" "$VERSION"

# 패키지 사본을 우선 쓴다 — migrate 의 자기 삭제 폴백 경로에서 $SCRIPT_DIR
# 사본이 이미 지워졌을 수 있다 (리뷰 지적 #2, migrate.sh 의 기존 규약과 동일).
KEEP_SH="$CACHE_DIR/versions/$VERSION/.harness/scripts/pkg/keep-committed.sh"
[ -f "$KEEP_SH" ] || KEEP_SH="$SCRIPT_DIR/keep-committed.sh"
[ ! -f "$KEEP_SH" ] || sh "$KEEP_SH" "$CACHE_DIR/versions/$VERSION" "$ROOT_DIR"
