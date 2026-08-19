# Verification Record: 021 그누보드5 PHP 쇼핑몰 하네스 지원

진행 중 — 구현 루프에서 증적을 누적 기록하고 완료 시 전 항목 체크한다.
e2e 비대상: 하네스 내부 도구/스킬 변경으로 사용자-facing 앱 플로우 변경
없음, touches-user-flow=no. (compose 템플릿의 실동작 확인은 V4 수동
시나리오로 대체 증적을 남긴다.)

- [x] V1 온보딩 절차 (SC-001) — gitignore 적용 시 data/·*.sql·dbconfig
      미추적 (T007)
- [x] V2 계약 테스트 green (SC-004·SC-005) — 스킬 계약 + 프로필 계약
      테스트 12건 전부 GREEN
- [x] V3 기존 회귀 불변 (SC-004) — npm test 전체 + rule-check +
      context-check + doctor 통과
- [x] V4 다운스트림 수동 시나리오 (SC-002) — compose 템플릿 기동 후
      몰 화면(설치 화면) HTTP 200 렌더 + DB 연결 확인
- [x] V5 인젝터 스모크 (SC-005) — 그누보드 키워드 프롬프트에서
      codi-gnuboard 제안

## 진행 기록

- 2026-08-07 T007 온보딩 검증 PASS: 그누보드 유사 구조(`apps/testmall/`
  + `data/dbconfig.php` + 업로드 + `PRD_dump.sql`)에 gitignore.gnuboard
  적용, `git ls-files | grep -E 'data/|\.sql$|dbconfig'` 0건. 추적 파일은
  `.gitignore`·`common.php`·`adm/index.php`뿐. → V1 근거 확보.
- 2026-08-07 T019 신규 계약 테스트 12건 GREEN (스킬 6 + 프로필 6).
  → V2 근거 확보.
- 2026-08-07 카탈로그 정합: specs/021 추가로 카운트 유도 테스트 RED →
  feature-definitions·feature-relations·status.yaml 등록으로 해소
  (020 세션이 남긴 안내대로 021 몫 등록 완료).
- 2026-08-07 T020 게이트 4종 PASS: npm test 788/788, rule-check ok
  (doctor.sh 등록 + .codex 미러 prefix_rule 보강 후), context-check
  0 failure, doctor 실패 0(경고 2건: claude binary 중복=환경,
  manifest drift=미커밋 상태로 커밋 시 해소). → V3 근거 확보.
- 2026-08-07 T021 인젝터 스모크 PASS: "그누보드 스킨 수정하고 싶어"
  프롬프트 → codi-gnuboard 제안(matched: 그누보드). → V5 근거 확보.
- 2026-08-07 T022 수동 시나리오 PASS: 순정 그누보드 5.6.32 사본을
  `apps/testmall/`에 두고 템플릿 적용(포트 38090/33067 — 파일럿 리허설
  컨테이너와 충돌 회피). 1차 기동에서 403 발견 — Apache 기본 설정이
  `/repo` 접근을 거부(파일럿의 repo-docroot.conf 대응 누락). 템플릿
  command에 `<Directory /repo> Require all granted` conf 생성을 추가해
  해소. 재기동 후 `GET /` → 200 + 그누보드 설치 화면 렌더, 웹
  컨테이너에서 mysqli 연결 OK + `@@sql_mode` 빈 값(비STRICT) 확인.
  임시 환경은 `docker compose down -v`로 정리(파일럿 컨테이너 5종
  무사). → V4 근거 확보.
