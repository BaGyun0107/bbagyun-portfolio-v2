#!/bin/bash
set -euo pipefail

# ── Infisical 배선 스크립트 ──
# 사용법: ./harness wire-infisical <project-name> [--org <org>]
# Infisical 콘솔에서 Project ID와 Machine Identity를 만든 뒤 실행한다.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

DEFAULT_ORG="CODIWORKS-Engineer"

# ── 색상 ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[정보]${NC} $*"; }
warn()  { echo -e "${YELLOW}[경고]${NC} $*"; }
error() { echo -e "${RED}[오류]${NC} $*" >&2; }

usage() {
  cat >&2 <<EOF
사용법: $0 <project-name> [--org <org>]

인자:
  project-name  프로젝트 이름 (예: my-app)

옵션:
  --org         GitHub Organization (기본값: ${DEFAULT_ORG})

필수 환경변수:
  INFISICAL_PROJECT_ID
  INFISICAL_CLIENT_ID
  INFISICAL_CLIENT_SECRET

예시:
  export INFISICAL_PROJECT_ID="<project-id>"
  export INFISICAL_CLIENT_ID="<client-id>"
  export INFISICAL_CLIENT_SECRET="<client-secret>"
  $0 my-app --org ${DEFAULT_ORG}
EOF
}

if [ $# -lt 1 ]; then
  usage
  exit 1
fi

PROJECT_NAME="$1"
shift

ORG="${DEFAULT_ORG}"

while [ $# -gt 0 ]; do
  case "$1" in
    --org)
      ORG="$2"
      shift 2
      ;;
    *)
      error "알 수 없는 옵션: $1"
      usage
      exit 1
      ;;
  esac
done

missing_env=0
for required in INFISICAL_PROJECT_ID INFISICAL_CLIENT_ID INFISICAL_CLIENT_SECRET; do
  if [ -z "${!required:-}" ]; then
    error "${required} 환경변수가 필요합니다."
    missing_env=1
  fi
done

if [ "$missing_env" -ne 0 ]; then
  usage
  exit 1
fi

if ! command -v gh &> /dev/null; then
  error "GitHub CLI (gh) 가 설치되어 있지 않습니다."
  echo "  설치: brew install gh" >&2
  exit 1
fi

if ! gh auth status &> /dev/null; then
  error "GitHub CLI 로그인이 필요합니다."
  echo "  실행: gh auth login" >&2
  exit 1
fi

# ── macOS 호환 sed 함수 ──
replace_in_file() {
  local pattern="$1"
  local file="$2"
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "$pattern" "$file"
  else
    sed -i "$pattern" "$file"
  fi
}

cd "$PROJECT_ROOT"

info "Infisical 배선 시작: codi-${PROJECT_NAME}"

CFG_REPLACED=0
for cfg in apps/*/.infisical.json; do
  if [ -f "$cfg" ]; then
    replace_in_file "s|\"workspaceId\": \"[^\"]*\"|\"workspaceId\": \"${INFISICAL_PROJECT_ID}\"|" "$cfg"
    CFG_REPLACED=$((CFG_REPLACED + 1))
    info "  $cfg workspaceId 치환 완료"
  fi
done

if [ "$CFG_REPLACED" -eq 0 ]; then
  warn "  apps/*/.infisical.json 파일이 없어 workspaceId 치환을 건너뜁니다."
fi

WF_REPLACED=0
for wf in .github/workflows/*.yml; do
  if [ -f "$wf" ] && grep -q "_PROJECT_ID_" "$wf"; then
    replace_in_file "s|_PROJECT_ID_|${INFISICAL_PROJECT_ID}|g" "$wf"
    WF_REPLACED=$((WF_REPLACED + 1))
  fi
done

if [ "$WF_REPLACED" -gt 0 ]; then
  info "  워크플로우 ${WF_REPLACED}개 파일의 INFISICAL_PROJECT_ID 치환 완료"
else
  warn "  _PROJECT_ID_ placeholder가 있는 워크플로우 파일이 없습니다."
fi

echo "$INFISICAL_CLIENT_ID" | gh secret set INFISICAL_CLIENT_ID --repo "${ORG}/codi-${PROJECT_NAME}"
echo "$INFISICAL_CLIENT_SECRET" | gh secret set INFISICAL_CLIENT_SECRET --repo "${ORG}/codi-${PROJECT_NAME}"
info "  INFISICAL_CLIENT_ID / INFISICAL_CLIENT_SECRET 등록 완료"

info "Infisical 배선 완료"
