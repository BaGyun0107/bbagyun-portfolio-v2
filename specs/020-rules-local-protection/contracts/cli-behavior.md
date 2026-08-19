# CLI Behavior Contracts: rules-local

관측 가능한 CLI 동작 계약. 문구는 예시이며 의미(보존/삭제/경고 채널)가
계약이다.

## C1. skills-link (rules 링크 단계)

- 입력: `.harness/rules-local/*.md` (없으면 디렉터리 지연 생성)
- 출력: `.claude/rules/local/<name>.md` 상대경로 심링크
- 계약: 멱등(2회 실행 결과 동일), 고아 링크 정리, `.md` 외 항목 무시,
  실패 시 nonzero 종료 + 실패 사유 stderr.

## C2. update stale 정리

- distributed-stale(이전 로컬 shared-manifest 실재)만 삭제하고 경로를
  "stale shared 파일 정리" 요약에 나열한다.
- unknown-file은 삭제하지 않고 stderr 비차단 경고로 나열한다. 문구는
  이전 안내를 포함한다: 프로젝트 규칙이면 `.harness/rules-local/`로
  이동하라.
- prior manifest 부재/파싱 실패 시 stale 삭제 0건 + 생략 경고 1건.
- 종료 코드: 위 경고들은 실패가 아니다 (기존 auto/manual 모드 의미 유지).

## C3. doctor 감지

- 하네스 소유 스캔 트리에서 unknown-file을 감지하면 비차단 경고로
  나열하고 이전 안내를 출력한다. 종료 코드는 기존 doctor 규약을 따른다
  (경고는 실패 아님).

## C4. agent-preflight

- `.harness/rules-local/*.md`가 1개 이상 있으면 목록을 1줄 요약으로
  출력한다. 없으면 출력 없음, 종료 코드 불변.

## C5. 업스트림 배포 금지 가드

- 하네스 레포에서 shared-manifest 생성 결과에 `.claude/rules/local/`
  경로가 포함되면 테스트가 실패한다.
