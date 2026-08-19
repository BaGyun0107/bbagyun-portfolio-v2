# Research: 프로젝트별 디자인 시스템 지원 구조

**Date**: 2026-07-08
**Method**: deep-research 워크플로우 (105 에이전트, 5개 조사 각도, 주장별
3표 적대적 검증 — 10개 주장 전부 생존, 0 기각). 상세 근거와 출처는 아래
각 결정에 인라인.

## Decision 1: 토큰 저장 = app-local CSS 변수 (Tailwind v4 @theme)

- **Decision**: 토큰을 `apps/front/src/styles/tokens.css`에 CSS 변수로
  저장. `:root`/`.dark` 쌍 + `@theme inline`, shadcn 시맨틱 토큰명 유지.
- **Rationale**: shadcn/Tailwind v4 공식 규약(신뢰도 high — 공식 문서
  원문 검증). Tailwind v4가 테마 값을 런타임 CSS 변수로 방출하도록
  아키텍처를 바꿔 별도 토큰 패키지가 불필요. 실무 60%가 토큰 수동
  동기화 — CSS 변수 직접 관리가 다수파(zeroheight 2026, n=147).
- **Alternatives considered**: `packages/design-tokens` 별도 패키지(단일
  front 앱엔 과함, 다중 앱 시 승격 경로로만 유지), W3C DTCG JSON + Style
  Dictionary(벤더 스스로 "실험"이라 규정, 웹 외 두 번째 소비자 없으면
  오버헤드 — high 신뢰도로 기각).

## Decision 2: 생성 프로세스 = 하네스 네이티브 스킬

- **Decision**: 대화형 생성/수정 프로세스를 shared 스킬
  `codi-design-system`으로 구현. GStack/MCP 비의존.
- **Rationale**: Anthropic 공식 패턴 — "회사 디자인 시스템을 스킬로
  인코딩"을 명시 지지(high). AI-디자인 시스템 통합은 업계 전체가 초기
  단계(프로세스 내장 10%)라 가벼운 스킬이 적정 투자.
- **Alternatives considered**: 디자인 시스템 전용 MCP 서버(Typeform
  사례 존재하나 시기상조 — 정확도 60-70%에 그침), GStack
  design-consultation(외부 의존 + opt-in 정책과 충돌), 규약 문서만(프로세스
  표준화 요구 미달).

## Decision 3: 로딩 방식 = 온디맨드 JIT (사전 로드 금지)

- **Decision**: 디자인 시스템 내용을 상시 컨텍스트(CLAUDE.md, always-on
  규칙)에 넣지 않고, codi-frontend가 UI 작업 시점에 파일을 읽는다.
- **Rationale**: Typeform 실증 — 룰 파일 사전 로드는 컨텍스트 70% 소비 +
  정확도 50-60%(context rot), 온디맨드 전환 후 30-40% 소비 + 60-70%
  정확도(medium, 단일 사례지만 방향성 명확). 하네스의 기존 스킬 JIT
  구조와도 일치.
- **Alternatives considered**: CLAUDE.md/디자인 룰 상시 로드(실증 반증됨).

## Decision 4: 문서 부패 방지 = 문서를 에이전트 입력으로

- **Decision**: `docs/design-system.md`를 codi-frontend의 필독 계약에
  넣고, 수정 모드가 토큰-문서 동기화를 강제한다. 값의 정본은 tokens.css,
  문서는 원칙/근거만 얇게.
- **Rationale**: 92%가 문서를 갖지만 45%만 유지에 만족(zeroheight 2026)
  — "만들고 방치"가 업계 실패 패턴. 문서가 실사용(에이전트 입력) 경로에
  있으면 부패가 즉시 드러난다.
- **Alternatives considered**: Storybook(범위 외 — 유지 비용 대비 효과
  불확실, 리서치에서도 유지율 문제 동일), Figma 연동(디자이너 없는 팀
  전제와 불일치).

## Decision 5: 확장 경로 = shadcn 공식 모노레포 규약

- **Decision**: front 앱이 여러 개가 되면 `shadcn init --monorepo` 공식
  규약(`packages/ui/src/styles/globals.css` 중앙화)으로 승격. 공통 베이스
  도입은 템플릿 기본값 교체로 처리(기존 프로젝트 무영향).
- **Rationale**: shadcn CLI가 모노레포를 1급 지원(high — 공식 문서 +
  Turborepo 가이드 검증). 지금 구조(app-local)에서 마이그레이션 경로가
  공식 경로와 일치하게 됨.
- **Alternatives considered**: 처음부터 packages/ui(현 단일 앱 구조에
  과함 — YAGNI).

## Decision 6: WCAG 대비 계산 = 순수 JS 스크립트

- **Decision**: `resources/contrast-check.mjs` — WCAG relative luminance
  공식을 순수 JS로 구현, OKLCH→sRGB 변환 포함. npm 의존성 추가 없음.
- **Rationale**: 하네스 루트의 의존성 최소화 원칙. 공식은 표준으로
  고정되어 있어 라이브러리가 불필요. node:test 단위 테스트로 검증(TDD).
- **Alternatives considered**: npm 라이브러리(colorjs.io 등 — 의존성
  추가 대비 이득 없음), 에이전트가 암산(재현성/신뢰성 없음 — 게이트는
  결정적이어야 함).

## Resolved Clarifications

Technical Context에 NEEDS CLARIFICATION 항목 없음 — 브레인스토밍(사용자
결정 4건: A안, 프로젝트 독립+유연성, 범위 3요소, app-local 위치)과 위
리서치로 전부 해소.
