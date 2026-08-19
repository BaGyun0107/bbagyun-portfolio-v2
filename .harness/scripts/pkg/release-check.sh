#!/usr/bin/env sh
# 릴리스 발행 검증 + annotated tag 생성 (specs/005-harness-packaging US4).
# 사용법: release-check.sh vX.Y.Z  (업스트림 하네스 레포에서 실행)
# push는 하지 않는다 — 배포 트리거는 사람이 통제한다 (work-safety).
# 정본 경로는 v2 머지 시 CI(.github/workflows/release.yml)가 이 스크립트를
# 재사용해 태그·GitHub Release를 발행하는 것이다. 통제 지점은 PR 머지(사람);
# 이 스크립트의 직접 실행은 오프라인/비상용 수동 fallback으로 남는다.
set -eu

TAG="${1:?vX.Y.Z 태그가 필요합니다}"

# 형식 검증은 grep 정규식 하나만 쓴다 — 과거의 case 패턴은 느슨해서
# v1.2.3-rc1 을 통과시켰다 (2026-07-31 감사 1-5, 중복 블록 제거).
if ! printf '%s' "$TAG" | grep -Eq '^v[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "태그는 vX.Y.Z 형식이어야 합니다: $TAG" >&2
  exit 2
fi

if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null 2>&1; then
  echo "태그 $TAG 이(가) 이미 존재합니다. 새 버전 번호를 사용하세요." >&2
  exit 1
fi

if [ ! -f CHANGELOG.md ] || ! grep -q "^## $TAG" CHANGELOG.md; then
  echo "CHANGELOG.md에 '## $TAG' 절이 없습니다. 변경 내용을 기록한 뒤 재실행하세요." >&2
  exit 1
fi

# shared-manifest 의 source_ref 가 릴리스 브랜치와 다르면 경고한다 (감사 L-11).
# pre-commit 이 마지막 기능 브랜치명을 굳히는 알려진 현상이라 차단하지는
# 않는다 — files 목록 자체의 정합은 doctor 의 drift 검사가 담당한다.
SRC_REF="$(node -e 'console.log(JSON.parse(require("node:fs").readFileSync(".harness/shared-manifest.json","utf8")).source_ref||"")' 2>/dev/null || true)"
CUR_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
if [ -n "$SRC_REF" ] && [ -n "$CUR_BRANCH" ] && [ "$SRC_REF" != "$CUR_BRANCH" ]; then
  echo "경고: shared-manifest source_ref($SRC_REF)가 릴리스 브랜치($CUR_BRANCH)와 다릅니다. files 목록이 최신인지 확인하세요 (./harness manifest)." >&2
fi

git tag -a "$TAG" -m "$TAG"
echo "annotated tag $TAG 생성 완료. 배포하려면 직접 push 하세요: git push origin $TAG"
