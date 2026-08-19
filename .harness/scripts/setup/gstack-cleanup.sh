#!/usr/bin/env sh
# 전역 GStack 잔재 정리 (018 후속, 팀원 머신용).
# 사용: ./harness gstack-cleanup            # check — 대상 나열만
#       ./harness gstack-cleanup --apply    # 삭제 실행
#       ./harness gstack-cleanup --quiet    # 잔존 여부만 종료 코드로 (doctor 연동)
# 안전 원칙: 로스터 이름이 같아도 gstack 소유 증거(중앙 디렉터리로 향하는
# 심링크 또는 SKILL.md의 gstack 마커)가 없으면 절대 지우지 않는다.
set -eu

CLAUDE_SKILLS="${GSTACK_CLEANUP_CLAUDE_SKILLS:-${HOME:?HOME 값이 필요합니다}/.claude/skills}"
CODEX_SKILLS="${GSTACK_CLEANUP_CODEX_SKILLS:-$HOME/.codex/skills}"
GSTACK_HOME_DIR="${GSTACK_CLEANUP_HOME:-$HOME/.gstack}"
CLAUDE_SETTINGS="${GSTACK_CLEANUP_CLAUDE_SETTINGS:-$HOME/.claude/settings.json}"

MODE="check"
case "${1:-}" in
  --apply) MODE="apply" ;;
  --quiet) MODE="quiet" ;;
  "") ;;
  *) echo "알 수 없는 인자입니다: $1 (--apply | --quiet)" >&2; exit 2 ;;
esac

# 2026-08-06 제거 시점의 gstack 스위트 로스터 (설치본 전수 확인 결과)
ROSTER="_gstack-command autoplan benchmark benchmark-models browse canary careful
codex connect-chrome context-restore context-save cso design-consultation
design-html design-review design-shotgun devex-review diagram document-generate
document-release freeze gstack gstack-upgrade guard health investigate
ios-clean ios-design-review ios-fix ios-qa ios-sync land-and-deploy
landing-report learn make-pdf office-hours open-gstack-browser pair-agent
plan-ceo-review plan-design-review plan-devex-review plan-eng-review plan-tune
qa qa-only retro review scrape setup-browser-cookies setup-deploy setup-gbrain
ship skillify spec sync-gbrain unfreeze"

is_gstack_owned() {
  dir="$1"; name="$2"
  case "$name" in gstack|gstack-*) return 0 ;; esac
  # 중앙 디렉터리(*/skills/gstack/*)로 향하는 심링크가 있으면 gstack 설치본
  for link in "$dir"/* "$dir"/.*; do
    [ -L "$link" ] || continue
    case "$(readlink "$link" 2>/dev/null || true)" in
      *skills/gstack/*) return 0 ;;
    esac
  done
  if [ -f "$dir/SKILL.md" ] && grep -qi "gstack" "$dir/SKILL.md" 2>/dev/null; then
    return 0
  fi
  return 1
}

TARGETS=""
SKIPPED=""

if [ -d "$CLAUDE_SKILLS" ]; then
  for name in $ROSTER; do
    dir="$CLAUDE_SKILLS/$name"
    [ -e "$dir" ] || continue
    if is_gstack_owned "$dir" "$name"; then
      TARGETS="$TARGETS $dir"
    else
      SKIPPED="$SKIPPED $dir"
    fi
  done
fi

if [ -d "$CODEX_SKILLS" ]; then
  for dir in "$CODEX_SKILLS"/gstack*; do
    [ -e "$dir" ] || continue
    TARGETS="$TARGETS $dir"
  done
fi

if [ -d "$GSTACK_HOME_DIR" ]; then
  TARGETS="$TARGETS $GSTACK_HOME_DIR"
fi

# 사용자 설정의 고아 훅 잔재: 디렉터리를 지워도 settings.json 의 훅이
# 삭제된 gstack 바이너리를 계속 부르면 모든 프로젝트의 세션이 깨진다
# (2026-08-07 실측). JSON 자동 편집은 하지 않는다 — 감지·안내만.
SETTINGS_HITS=""
if [ -f "$CLAUDE_SETTINGS" ] && grep -q "skills/gstack" "$CLAUDE_SETTINGS" 2>/dev/null; then
  SETTINGS_HITS="$CLAUDE_SETTINGS"
fi

if [ "$MODE" = "quiet" ]; then
  [ -z "$TARGETS" ] && [ -z "$SETTINGS_HITS" ] && exit 0
  exit 1
fi

# 설정 훅 잔재 안내 (check/apply 공통 — 자동 편집 없음, 수동 제거 안내)
print_settings_hits() {
  [ -n "$SETTINGS_HITS" ] || return 0
  echo "사용자 설정에 gstack 훅 잔재가 있습니다 (자동 편집하지 않음):"
  for f in $SETTINGS_HITS; do
    echo "  - $f"
    grep -n "skills/gstack" "$f" 2>/dev/null | sed 's/^/      /' | head -5
  done
  echo "  위 파일에서 해당 훅 항목을 수동으로 제거하세요 (hooks.* 의 command 항목)."
}

if [ -z "$TARGETS" ]; then
  if [ -z "$SETTINGS_HITS" ]; then
    echo "전역 GStack 잔재 없음 — 정리 완료 상태입니다."
  else
    print_settings_hits
  fi
  [ -n "$SKIPPED" ] && {
    echo "참고: gstack 소유 증거가 없어 보존한 동명 스킬:"
    for s in $SKIPPED; do echo "  - $s"; done
  }
  exit 0
fi

echo "GStack 잔재 삭제 대상:"
for t in $TARGETS; do echo "  - $t"; done
print_settings_hits
if [ -n "$SKIPPED" ]; then
  echo "보존 (gstack 소유 증거 없음 — 직접 확인 필요):"
  for s in $SKIPPED; do echo "  - $s"; done
fi

if [ "$MODE" = "check" ]; then
  echo ""
  echo "삭제하려면: ./harness gstack-cleanup --apply"
  echo "주의: ~/.gstack 의 learnings/기록도 함께 삭제됩니다 (미복원)."
  echo "재설치 절차: .harness/docs/gstack-rollback.md"
  exit 0
fi

for t in $TARGETS; do
  rm -rf "$t"
done
echo ""
echo "삭제 완료: $(echo "$TARGETS" | wc -w | tr -d ' ')개 경로."
if [ -n "$SETTINGS_HITS" ]; then
  echo "남은 작업: 사용자 설정 훅 잔재는 자동 편집하지 않습니다."
  print_settings_hits
fi
echo "확인: ./harness doctor (GStack 잔재 경고가 사라져야 정상)"
