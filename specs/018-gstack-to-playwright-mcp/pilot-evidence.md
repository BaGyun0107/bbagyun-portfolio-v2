# PHP 파일럿 증적 (US2) — 2026-08-06

## 환경

- 대상: php/gnuboard5.6.32 모노레포의 hf 앱 (SCM_WITHCARE)
- 기동: 사용자 기존 리허설 스택 재사용 —
  `tools/db-consolidation/rehearsal`의 compose로 `codi-rehearsal-web-hf`
  (php:7.4-apache, 포트 38081) + `codi-rehearsal-db`(mysql:5.7)
- 사전 조치: web-hf/web 컨테이너의 dbconfig 오버레이 파일 마운트가 stale
  상태(레포 원본 dbconfig의 host `localhost`가 보임)여서
  `docker compose ... up -d --force-recreate web-hf` / `web`으로 재생성 →
  host `db` 정상 반영. (원인: 단일 파일 bind mount는 호스트에서 파일이
  교체되면 이전 inode를 계속 바라봄)

## MCP QA 흐름 (스크립트: scratchpad/g5-rehearsal-pilot.mjs)

Playwright MCP `@playwright/mcp@0.0.79`를 stdio로 구동해 도구 호출만으로
다음 흐름을 재현:

1. `browser_navigate` → `http://127.0.0.1:38081/bbs/login.php`
   (타이틀: "로그인 | SCM_WITHCARE")
2. 스냅샷에서 ref 추출(e17=아이디, e19=비밀번호) 후 `browser_fill_form`
   으로 더미 계정 입력
3. `browser_take_screenshot` → `login-filled.png` (입력 상태 확인)
4. `browser_click`(로그인) → `login_check.php`로 이동, 앱의 실제 실패
   alert("가입된 회원아이디가 아니거나 비밀번호가 틀립니다...") 발생
5. `browser_handle_dialog`(accept) → 로그인 페이지 복귀 확인,
   `login-result.png` 저장

결과: **성공** — PHP(gnuboard) 앱에서 페이지 이동·폼 입력·제출·다이얼로그
처리·스크린샷까지 gstack browse와 동등한 QA 흐름이 MCP로 동작함 (SC-002).

주의점 2건(운영 메모): 스냅샷이 큰 페이지는 본문이 yml 파일로 저장되므로
파일을 읽어야 하고, 도구 파라미터는 ref가 아니라 `target`이다. 스크린샷
저장 경로는 서버 프로세스 cwd 기준이므로 `--output-dir`과 cwd를 함께
지정해야 한다.

## T016: 다운스트림 CLAUDE.md 확인 (2026-08-06 전수 grep)

- gstack이 주입한 `## Skill routing` 절: **0곳** (정리 대상 없음)
- 하네스 배포본 경유 GStack 언급이 있는 CLAUDE.md: belleforet_front,
  codi-gtn, codi-hipass-delivery, codi-planning-hub, codi-atlas,
  php/gnuboard5.6.32, php/gnuboard5.6.26, php/hecto, codi-STICKY-v1 (9곳)
  → US3 업스트림 정리 머지 후 각 프로젝트 `./harness update`로 전파 해소.
  별도 수작업 불필요.

## 부수 발견

- 리허설 스택의 web/web-hf 컨테이너가 stale dbconfig 마운트로 DB 연결이
  깨져 있었음 → 본 파일럿 과정에서 재생성으로 복구됨 (hf: 38081 정상,
  bzmall: 38080 메인 200 응답이나 본문 0바이트 — 앱 게이트 로직으로 보이며
  db-consolidation 리허설 쪽에서 확인 권장).
- hf 앱 루트(`/`)는 비로그인 시 `h_SSO`/start로 보내는 SSO 게이트 구조 —
  로컬 QA 진입점은 `/bbs/login.php`가 적합.

## T032/T033: 전역 삭제 실행·검증 (2026-08-06, 사용자 명시 승인)

- 삭제 완료: `~/.claude/skills`의 gstack 스위트 56개 디렉터리(전수 로스터
  일치 확인 후), `~/.codex/skills`의 `gstack*` 54개(superpowers 스킬 14개
  보존), `~/.gstack` 19M(사용자 데이터 포함 — clarify 결정대로 백업 없음).
- quickstart V5 검증: 세 경로 모두 잔존 **0건** (SC-005 충족). 주변 포인터
  파일(~/.gstack-artifacts-remote.txt 등)도 부재 확인.
- 롤백 경로: `.harness/docs/gstack-rollback.md` (데이터 미복원 신규 설치).
