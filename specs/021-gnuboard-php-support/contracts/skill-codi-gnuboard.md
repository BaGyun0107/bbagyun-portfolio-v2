# Contract: codi-gnuboard 스킬

이 계약은 테스트(`tests/codi-gnuboard-skill-contract.test.mjs`)가
검증한다. 형식 선례: `design-system-skill-contract.test.mjs`.

## 구조 계약

- `.harness/skills/codi-gnuboard/SKILL.md`가 존재하고 frontmatter에
  `name: codi-gnuboard`와 한 줄 `description`(트리거 어휘 포함)이 있다.
- `resources/` 3개 파일이 존재한다:
  `docker-compose.gnuboard.yml`, `gitignore.gnuboard`,
  `e2e-suite-example.sh`.
- `./harness skills-link` 후 `.claude/skills/codi-gnuboard`와
  `.agents/skills/codi-gnuboard` 링크가 생긴다.
- `skill-triggers.json`에 `codi-gnuboard` 항목이 있고 keywords가
  비어 있지 않다.

## SKILL.md 내용 계약 (섹션 존재 수준)

1. 그누보드5 구조 지식 — 5.6.32 기준 디렉터리 지도(`adm/`, `bbs/`,
   `shop/`, `skin/`, `extend/`, `data/`)와 코어 무수정 원칙(`extend/`
   확장), 버전 차이 확인 지점.
2. 깃 온보딩 절차 — SSH 내려받기 → 몰당 1레포 + `apps/<mall>/` 배치 →
   `gitignore.gnuboard` 적용 → 초기 커밋 → 이후 깃 기반 반영(rsync
   예시). 라이브 서버 직접 수정은 가드레일 승인 대상임을 명시.
3. 로컬 도커 환경 — compose 템플릿 사용법, DB 덤프 임포트 절차,
   파일럿 실측 함정 설명(STRICT 모드, 루트 마운트, data/ 볼륨,
   Apple Silicon).
4. e2e 게이트 연결 — 게이트 소유는 codi-e2e임을 명시하고 스위트
   예시를 꽂는 방법만 안내.

## resources 내용 계약

- `docker-compose.gnuboard.yml`: `php:7.4-apache`(mysqli·gd),
  `mysql:5.7` + `platform: linux/amd64` + `--sql-mode=` + healthcheck,
  레포 루트 `/repo` 마운트, `<mall>` 플레이스홀더 주석.
- `gitignore.gnuboard`: `apps/*/data/`, `*.sql`, `.env*` 포함.
- `e2e-suite-example.sh`: docker 절대경로 폴백 → 컨테이너 확인 →
  없으면 skip(0 종료·스탬프 없음) → 있으면 실행.

## 언어 계약

SKILL.md 산문은 영어(AI-read 파일 규칙), resources 내 코드 주석은
한국어(코드 주석 규칙).
