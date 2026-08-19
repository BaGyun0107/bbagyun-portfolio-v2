#!/usr/bin/env sh
# materialize — 캐시 버전을 가리키는 트리 구성 (specs/005-harness-packaging R3/R4).
# 사용법: materialize.sh <X.Y.Z>  (다운스트림 레포 루트에서 실행)
# 버전 전환은 .harness/current 심링크 하나의 ln -sfn 교체(원자적)이며,
# 나머지 링크는 current 경유라 재작성이 필요 없다.
set -eu

VERSION="${1:?X.Y.Z 버전이 필요합니다}"
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
CACHE_DIR="${CODI_HARNESS_CACHE_DIR:-$HOME/.codi-harness}"
PKG="$CACHE_DIR/versions/$VERSION"
ROOT_DIR="$(pwd)"

if [ ! -d "$PKG" ]; then
  echo "캐시에 버전 $VERSION 이 없습니다. 먼저 수신(fetch)하세요." >&2
  exit 1
fi

mkdir -p "$ROOT_DIR/.harness" "$ROOT_DIR/.claude/rules" "$ROOT_DIR/.claude/skills"

# 1) current flip — 유일한 원자적 전환 지점
ln -sfn "$PKG" "$ROOT_DIR/.harness/current"

# 리포 내부 링크 값은 상대경로로 계산한다 (specs/015 US4·갭 5). 절대경로는
# 생성 머신의 홈 경로를 박아 clone 한 두 번째 사람에게서 깨진다. 유일한
# 예외는 위의 .harness/current — 대상이 머신 캐시(리포 밖)라 절대를 유지한다.
# GNU realpath --relative-to 는 macOS 에 없어 Node 를 쓴다 (하네스 전제 도구).
relative_target() {
  # $1: 링크 경로, $2: 대상 절대경로. 실패 시 절대경로 폴백(동작 우선).
  rel="$(node -e 'const p=require("node:path");console.log(p.relative(p.dirname(process.argv[1]),process.argv[2]))' "$1" "$2" 2>/dev/null || true)"
  if [ -n "$rel" ]; then printf '%s\n' "$rel"; else printf '%s\n' "$2"; fi
}

# 심링크는 재지정하고, 사용자 실파일/디렉토리는 보존+경고한다 (엣지 케이스 명세).
link_entry() {
  # link 를 먼저 확정하고 그 위치 기준으로 상대 target 을 계산한다 — POSIX sh 는
  # local 이 없어 전역 변수라, 데이터 흐름을 명시해 재배치 사고를 막는다.
  link="$2"
  target="$(relative_target "$link" "$1")"
  if [ -L "$link" ]; then
    ln -sfn "$target" "$link"
  elif [ -d "$link" ] && [ -z "$(ls -A "$link")" ]; then
    # migrate의 git rm 이후 남은 빈 디렉토리 — 링크로 대체 가능
    rmdir "$link"
    ln -s "$target" "$link"
  elif [ -e "$link" ]; then
    echo "경고: $link 이(가) 심링크가 아닌 실파일이라 보존합니다. 패키지 버전이 반영되지 않습니다." >&2
  else
    ln -s "$target" "$link"
  fi
}

# 2) 공유 룰 — 문서화된 "하위 디렉토리 심링크" 형태 (프로젝트 룰은 실파일 공존)
link_entry "$ROOT_DIR/.harness/current/.claude/rules" "$ROOT_DIR/.claude/rules/shared"

# 3) 스킬 트리 — 아래 4)의 entry 루프가 .harness/skills → current 링크를
# 만든 뒤 skills-link.sh 에 위임한다 (해당 위치 참조). 여기서 직접 링크하면
# .agents/skills 트리·skills-local 병합·이름 충돌 검사 3종이 빠진다
# (2026-08-03 다운스트림 실측 — lock 레포에서 두 트리가 조용히 갈렸다).

# 4) 공유 인프라 링크 (specs/006 US1) — lock 모드에서 제거되는 커밋 파일을
# 패키지 링크로 보충한다. 런처·훅·정책 경로가 기존 그대로 동작해야 한다.
# (.harness/config 는 project-profile.yaml 이 프로젝트 소유라 파일 단위로만.)
# docs 는 온보딩 안내(init-project)와 허브 스캔(build-hub MD_DIRS)의 실사용
# 경로다 — 빠지면 lock 전환에서 가이드 13개가 복원 경로 없이 소실된다
# (2026-07-31 감사 H-1, CONTRIBUTING.md 소실과 동일 부류).
for entry in hooks policies imported-rules prompt-style vendor skills docs \
  workflow.md manifest.json lock.json shared-manifest.json; do
  if [ -e "$PKG/.harness/$entry" ]; then
    link_entry "$ROOT_DIR/.harness/current/.harness/$entry" "$ROOT_DIR/.harness/$entry"
  fi
done

# 스킬 트리 위임 (위 3) 참조): .harness/skills 가 current 경유 링크가 된
# 직후에 돌린다. 두 트리(.claude/.agents)의 링크값은 .harness/skills/<name>
# 형태라 결국 lock 경로로 해석되고, 버전 flip 시 재작성도 필요 없다.
# 패키지 사본을 우선 쓰고(materialize 와 같은 버전 보장), 루트 재지정이
# 없는 구버전 캐시면 레포 사본으로 폴백한다.
SKILLS_LINK="$PKG/.harness/scripts/setup/skills-link.sh"
[ -f "$SKILLS_LINK" ] || SKILLS_LINK="$SCRIPT_DIR/../setup/skills-link.sh"
if [ -f "$SKILLS_LINK" ]; then
  HARNESS_ROOT_DIR="$ROOT_DIR" sh "$SKILLS_LINK"
fi

# scripts는 하위 디렉터리 단위로 링크한다. 통째로 링크하면 KEEP_COMMITTED
# 스크립트(.harness/scripts/checks/... 등)가 심링크 아래 갇혀 git이
# "beyond a symbolic link"로 커밋 자체를 거부한다 — CI가 그 파일을 못 받아
# exit 127로 깨진다 (2026-07-29 codi-hansi 실측).
# 구버전이 만든 통짜 심링크가 남아 있으면 먼저 걷어낸다.
if [ -L "$ROOT_DIR/.harness/scripts" ]; then
  rm -f "$ROOT_DIR/.harness/scripts"
fi
if [ -d "$PKG/.harness/scripts" ]; then
  mkdir -p "$ROOT_DIR/.harness/scripts"
  # KEEP_COMMITTED 파일이 사는 하위 디렉터리는 실디렉터리로 남긴다.
  # 경로는 env 로 넘긴다 — argv[1] 로 넘기면 migrate-plan 의 isMain 가드가
  # 오판해 CLI main 이 실행된다 (keep-committed.sh 의 동일 수정 참조).
  KEEP_SUBS="$(HARNESS_PLAN_MJS="$PKG/.harness/scripts/pkg/migrate-plan.mjs" node -e '
    import(process.env.HARNESS_PLAN_MJS)
      .then((m) => {
        const subs = new Set();
        for (const f of m.KEEP_COMMITTED || []) {
          const parts = f.split("/");
          if (parts[0] === ".harness" && parts[1] === "scripts" && parts.length > 3) {
            subs.add(parts[2]);
          }
        }
        console.log([...subs].join(" "));
      })
      .catch(() => process.exit(0));
  ' 2>/dev/null || true)"
  # 패키지에서 목록을 못 읽어도(구버전·최소 픽스처) CI가 쓰는 하위는
  # 실디렉터리로 유지한다 — 링크로 덮으면 KEEP_COMMITTED가 무력화된다.
  [ -n "$KEEP_SUBS" ] || KEEP_SUBS="checks deploy audit"

  for sub in "$PKG/.harness/scripts"/*/; do
    [ -d "$sub" ] || continue
    name="$(basename "$sub")"
    keep=0
    for k in $KEEP_SUBS; do
      [ "$k" != "$name" ] || keep=1
    done
    if [ "$keep" -eq 1 ]; then
      # 실디렉터리로 만들고 패키지 파일을 채운다. 링크를 먼저 걷어내지
      # 않으면 cp가 자기 자신을 복사해 "are the same file"로 실패한다.
      dest_sub="$ROOT_DIR/.harness/scripts/$name"
      [ ! -L "$dest_sub" ] || rm -f "$dest_sub"
      mkdir -p "$dest_sub"
      for src_file in "$sub"*; do
        [ -f "$src_file" ] || continue
        dest_file="$dest_sub/$(basename "$src_file")"
        # 목적지가 소스와 같은 실체면(구조 전환 전 잔여 링크) 건너뛴다.
        [ ! -L "$dest_file" ] || rm -f "$dest_file"
        cp "$src_file" "$dest_file" 2>/dev/null || true
      done
    else
      link_entry "$ROOT_DIR/.harness/current/.harness/scripts/$name" \
        "$ROOT_DIR/.harness/scripts/$name"
    fi
  done
fi
# config는 project-profile.yaml 등 프로젝트 소유 파일과 혼재 — 패키지의
# 파일을 개별 링크하되 프로젝트 소유 이름은 건너뛴다.
mkdir -p "$ROOT_DIR/.harness/config" "$ROOT_DIR/.codex"
if [ -d "$PKG/.harness/config" ]; then
  for cfg in "$PKG/.harness/config"/*; do
    [ -e "$cfg" ] || continue
    name="$(basename "$cfg")"
    case "$name" in
      project-profile.yaml|skill-triggers.local.json) continue ;;
    esac
    link_entry "$ROOT_DIR/.harness/current/.harness/config/$name" \
      "$ROOT_DIR/.harness/config/$name"
  done
fi
# CONTRIBUTING.md 는 manifest 공유 파일이라 migrate가 git rm 으로 지우는데
# 링크 대상에서 빠져 있어 영구 소실됐다(context-check 실패). ARCHITECTURE.md
# 와 같은 취급으로 되돌린다 (2026-07-29 다운스트림 3곳 실측).
# docs/ 하위 3개 가이드도 같은 부류다 — CONTRIBUTING:244 가
# planning-hub-handoff 를 링크해 없으면 항상 깨진다 (2026-07-31 감사 M-4).
mkdir -p "$ROOT_DIR/docs"
for entry in .claude/settings.json ARCHITECTURE.md CONTRIBUTING.md lint-staged.config.mjs \
  docs/harness-overview.md docs/planning-hub-handoff.md docs/feature-definition-planning-hub-guide.md; do
  if [ -e "$PKG/$entry" ]; then
    link_entry "$ROOT_DIR/.harness/current/$entry" "$ROOT_DIR/$entry"
  fi
done
for entry in hooks.json rules config.example.toml; do
  if [ -e "$PKG/.codex/$entry" ]; then
    link_entry "$ROOT_DIR/.harness/current/.codex/$entry" "$ROOT_DIR/.codex/$entry"
  fi
done

# pkg-gc가 "참조 중인 버전"을 판단할 수 있도록 소비 레포를 머신 레지스트리에
# 등록한다 (idempotent append — pkg-gc.sh가 읽고, 사라진 경로는 gc가 정리).
REPOS_FILE="$CACHE_DIR/repos"
if ! grep -Fxq -- "$ROOT_DIR" "$REPOS_FILE" 2>/dev/null; then
  printf '%s\n' "$ROOT_DIR" >> "$REPOS_FILE"
fi

echo "materialize 완료: 버전 $VERSION (.harness/current 기준)"
