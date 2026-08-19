# Research: 그누보드5 PHP 쇼핑몰 하네스 지원

**Date**: 2026-08-07 | **Plan**: [plan.md](plan.md)

Technical Context에 NEEDS CLARIFICATION은 없다. 아래는 설계 확정을
위한 조사 결과다. 근거 자료는 파일럿 레포
(`/Users/codiworks_dev/Desktop/php/gnuboard5.6.32`)의 실전 검증 산출물:
`tools/db-consolidation/rehearsal/docker-compose.yml`, 루트 `mise.toml`
e2e 게이트, `apps/gnu-og`(그누보드 5.6.32 순정 원본).

## D1. php-monolith 모드의 스키마 표현

- **Decision**: `apps.front`·`apps.back` 블록은 유지하되 둘 다
  `enabled: false`로 렌더하고, `rules.php-monolith`에
  `forbidden_paths: [apps/front/**, apps/back/**]`와
  `owner_skill: codi-gnuboard`, 몰 코드는 `apps/<mall>/`(front·back
  이외의 apps 하위)이라는 notes를 둔다.
- **Rationale**: `profile.mjs`의 `checkProfile()`과 다수 소비자가
  front/back 블록 존재를 전제한다. 블록을 없애는 스키마 변경은 기존 5개
  모드 소비 코드 전부에 회귀 위험을 만들지만, disabled 표현은
  `planning-only`가 이미 쓰는 검증된 형태다.
- **Alternatives considered**: (a) `apps.mall` 신규 블록 추가 — 스키마
  소비자 전체 수정 필요, 회귀 범위가 커져 기각. (b) 몰 경로를 모드에
  하드코딩 — 몰 이름은 프로젝트마다 달라 불가.

## D2. 가드 동작 (project-profile-guard.mjs)

- **Decision**: `php-monolith`에서 `apps/front`·`apps/back` 대상 툴
  입력을 차단하고, 차단 메시지는 "PHP 몰 프로필이므로 Node 앱 표면이
  비활성; 몰 코드는 apps/<mall>/, 라우팅은 codi-gnuboard"로 안내한다.
  `planning-only` 분기와 같은 지점에 조건 추가.
- **Rationale**: 오진(스캐폴드 습관으로 apps/front 생성)을 결정적으로
  막는 것이 모드의 존재 이유. 단일 구현을 Codex 어댑터가 공유하므로
  패리티 자동 확보.
- **Alternatives considered**: 비차단 경고만 — "세션마다 Node 전제
  오진" 문제를 확실히 못 막아 기각.

## D3. 스킬 인젝터 모드 스킵

- **Decision**: `php-monolith`에서 `codi-backend`·`codi-frontend` 제안을
  스킵한다(기존 모드별 스킵 목록에 추가). `codi-gnuboard` 키워드:
  `그누보드`, `gnuboard`, `영카트`, `youngcart`, `php`, `쇼핑몰 온보딩`,
  `몰 온보딩`, `.php`.
- **Rationale**: 인젝터는 이미 모드 인지 스킵 로직을 갖고 있어 1줄
  확장. 키워드는 파일럿에서 실제 요청에 등장한 어휘 기준.
- **Alternatives considered**: `쇼핑몰` 단독 키워드 — Node 커머스
  프로젝트와 충돌 위험이 있어 복합어만 채택.

## D4. 도커 compose 템플릿 (파일럿 검증 사항의 일반화)

- **Decision**: `resources/docker-compose.gnuboard.yml` 템플릿에 다음을
  포함한다. 웹: `php:7.4-apache` + `mysqli`·`gd` 확장(inline
  Dockerfile), 레포 루트를 `/repo`로 마운트하고 DocumentRoot를
  `/repo/apps/<mall>`로 지정, `data/`는 네임드 볼륨 + `dbconfig.php`
  read-only 오버라이드 마운트. DB: `mysql:5.7`,
  `platform: linux/amd64`, `--sql-mode=`(비STRICT), utf8 charset,
  healthcheck 후 웹 기동.
- **Rationale**: 전부 파일럿에서 실측으로 도달한 형태다 — 레포 루트
  마운트는 심볼릭 링크(`../../..` 상대 경로)가 컨테이너 안에서도
  유효하게 하고(부분 마운트 시 403), `--sql-mode=`는 그누보드 5.6의
  `0000-00-00` datetime과 MySQL 5.7 STRICT 충돌(err 1292)을 막고,
  `platform` 지정은 Apple Silicon에서 mysql:5.7 이미지 부재를
  해결한다.
- **Alternatives considered**: (a) PHP 8.x 이미지 — 그누보드 5.6.32는
  PHP 7.x 대상, 순정 코드가 8.x에서 deprecated 경고/오류를 내므로
  기각. (b) MySQL 8.x — 파일럿 미검증 + 인증 플러그인 차이로 기각.
  (c) MariaDB — 서버 실환경(MySQL 계열) 재현성 우선으로 보류.

## D5. 온보딩 제외 목록 (gitignore 템플릿)

- **Decision**: `resources/gitignore.gnuboard`에 최소 세트:
  `apps/*/data/`(업로드·캐시·세션·`dbconfig.php` 포함 디렉터리),
  `*.sql`(운영 덤프; 스키마 파일이 필요하면 명시 경로로 예외),
  `.env*`, OS 잡파일. 온보딩 절차 문서에서 "덤프·설정은 깃 밖,
  전달은 별도 채널"을 명시.
- **Rationale**: 그누보드는 시크릿(`dbconfig.php`)이 `data/` 안에 있어
  `data/` 제외가 시크릿 제외를 겸한다. 파일럿도 PRD 덤프를 추적
  제외로 운용 중.
- **Alternatives considered**: `data/` 일부 추적(스킨 관련) — 시크릿
  혼입 리스크가 이득보다 커 기각.

## D6. e2e 스위트 예시의 형태

- **Decision**: `resources/e2e-suite-example.sh`는 파일럿 mise 게이트의
  패턴을 일반화한다: docker 절대경로 폴백(`command -v docker ||
  /usr/local/bin/docker`) → 대상 컨테이너 `docker ps` 확인 → 없으면
  "건너뜀" 메시지 후 0 종료(증적 스탬프 없음) → 있으면 스위트 실행.
  게이트 태스크(`e2e`/`e2e:changed`) 본체는 `codi-e2e` 소유 유지
  (clarify Q4).
- **Rationale**: mise가 정리된 PATH로 태스크를 돌려 docker가 안 잡히는
  실측 함정까지 포함한 검증된 형태.
- **Alternatives considered**: Playwright 기반 예시 — PHP 몰의 실제
  검증은 curl/HTTP 수준 스모크가 먼저이고, 브라우저 QA는 Playwright
  MCP 경로가 이미 있어 중복이라 기각.

## D7. path-scoped 룰과 Codex 보상

- **Decision**: `.claude/rules/php-monolith.md`는 frontmatter
  `paths: ["**/*.php"]`로 스코프하고 내용은 "codi-gnuboard 로드, 몰
  코드는 apps/<mall>, Node 전제 금지" 포인터만 담아 얇게 유지한다.
  Codex는 path-scoping이 없으므로 `.codex/rules/php-monolith.rules`
  (기존 prefix 룰 형식)와 정책 문서로 보상한다.
- **Rationale**: `monorepo-packages.md`가 확립한 선례(2026-07-06)와
  동일 구조 — Claude는 path-scoped, Codex는 상시 텍스트 + 결정적
  가드(여기서는 profile-guard 공유)로 패리티.
- **Alternatives considered**: 상시 로드 룰 — PHP 프로젝트가 아닌
  다운스트림 전부에 토큰 비용을 물려 기각.

## D8. 그누보드 5.6.32 구조 지식의 출처와 범위

- **Decision**: SKILL.md의 구조 지식은 `apps/gnu-og` 순정 원본 기준으로
  작성한다: 루트 진입(`common.php`·`_common.php`), `adm/`(관리자),
  `bbs/`(게시판 흐름), `shop/`(영카트), `skin/`·`theme/`(표현),
  `extend/`(코어 무수정 확장 지점), `data/`(런타임 산출물, 깃 제외),
  `lib/`(라이브러리). 버전 차이 확인 지점(스킨 경로, shop 유무)을
  체크리스트로 동반.
- **Rationale**: 사용자 지정 원본. 코어 무수정 원칙(`extend/` 활용)은
  그누보드 커뮤니티 표준 관행이자 파일럿의 승격 파이프라인 전제와도
  일치.
- **Alternatives considered**: 없음(원본 지정됨).
