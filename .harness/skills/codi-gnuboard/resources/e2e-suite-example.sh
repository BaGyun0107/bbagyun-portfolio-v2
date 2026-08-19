#!/bin/sh
# PHP 몰 e2e 스위트 예시 (codi-gnuboard resources).
# 게이트 태스크(e2e / e2e:changed)의 canonical 소유는 codi-e2e 다 —
# 이 파일은 그 게이트에 "꽂는" 몰 스위트의 패턴 예시일 뿐이다.
# 사용법: tools/e2e/ 등으로 복사해 컨테이너명·URL·검증을 몰에 맞게 채운다.

WEB_CONTAINER="gnuboard-local-web"
BASE_URL="http://127.0.0.1:38080"

# mise 는 정리된 PATH 로 태스크를 돌려 docker 가 안 잡힐 수 있다.
# 절대경로를 우선 쓰고, 없으면 PATH 에서 찾는다(환경 차이 흡수).
DOCKER_BIN="$(command -v docker || echo /usr/local/bin/docker)"

if [ ! -x "$DOCKER_BIN" ]; then
  echo "[e2e] docker unavailable — skip (no evidence stamped)"
  exit 0
fi

if [ -z "$("$DOCKER_BIN" ps --filter "name=$WEB_CONTAINER" -q 2>/dev/null)" ]; then
  echo "[e2e] $WEB_CONTAINER not running — skip (no evidence stamped)"
  exit 0
fi

# --- 여기부터 몰별 핵심 흐름 검증을 채운다 (critical flows only) ---
# 예시: 초기 화면이 200 으로 열리고 그누보드 마커가 보이는지.
status=$(curl -s -o /tmp/gnb-e2e-body.html -w '%{http_code}' "$BASE_URL/")
if [ "$status" != "200" ]; then
  echo "[e2e] FAIL: front page returned $status"
  exit 1
fi

echo "[e2e] PASS: front page 200"
exit 0
