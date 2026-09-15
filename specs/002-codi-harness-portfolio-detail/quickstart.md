# Quickstart: Codi Harness 포트폴리오 상세 검증

## Prerequisites

- 저장소 루트에서 실행한다.
- Node.js 24와 pnpm은 mise 구성을 따른다.
- `apps/front` 의존성이 설치되어 있어야 한다.
- 구현 단계에서 `apps/front/mise.toml`, Playwright 구성과 루트 E2E task가 추가된
  이후 E2E 명령을 실행한다.
- 기존 사용자 변경을 임의로 stage하거나 되돌리지 않는다.

## 1. Data Contract Tests

```bash
pnpm --dir apps/front test
```

Expected:

- 8개 작업물 메타데이터와 기존 콘텐츠 품질 검사가 통과한다.
- 하네스 구조화 상세의 지표·스윔레인 참조 무결성이 통과한다.
- 하네스에는 demo가 없고 네 신규 insight slug가 존재한다.
- 허용하지 않은 category/status와 현재/역사 도구 혼입 검사가 실패 사례를 잡는다.
- 공통 섹션 heading 순서와 `available` demo fixture의 새 창 안내·안전한 link 속성이
  통과한다.

## 2. Static Verification

```bash
pnpm --dir apps/front exec tsc --noEmit
pnpm --dir apps/front lint
pnpm --dir apps/front build
```

Expected:

- TypeScript 강제 캐스팅 없이 데이터가 컴파일된다.
- ESLint 오류가 없다.
- `/projects/[slug]`의 8개 정적 경로와 신규 insight 경로가 생성된다.

## 3. App E2E

```bash
mise run //apps/front:e2e
```

Expected critical flows:

1. `/projects/codi-harness-dx-platform` 상단에서 overview와 5개 이상 지표 확인
2. 외부 demo/준비 중 CTA가 없음
3. 두 스윔레인, 실패·복구/중단 label과 순서형 대체 목록 확인
4. 네 신규 insight 링크가 정상 공개 경로로 이동
5. 하네스 외 대표 legacy 작업물에서 기존 Markdown 본문 유지
6. 320/768/1024/1440px에서 페이지 전체 가로 overflow 없음

루트 stamp가 필요한 깨끗한 staged tree에서는 다음을 사용한다.

```bash
mise run e2e:changed
```

현재 저장소에 관련 없는 사용자 변경이 남아 있으면 임의로 모두 stage하지 않는다.
그 경우 앱 전용 E2E의 명령·결과를 `verification.md`에 기록하고 stamp 불가 사유를
잔여 위험으로 남긴다.

## 4. Manual Browser QA

Playwright MCP 또는 같은 브라우저 세션에서 다음을 확인한다.

- 키보드 Tab으로 모든 작업물·인사이트 링크에 접근 가능
- 정적 swimlane step이 불필요한 tab stop이 아님
- normal/failure/recovery가 색상 없이 text/icon/line style로 구분됨
- 모바일에서 swimlane 내부만 가로 스크롤됨
- 외부 링크가 있다면 새 탭 안내와 `noopener noreferrer`가 존재함
- 프로젝트 개요부터 관련 인사이트까지 공통 heading 순서가 유지됨
- 다크 모드에서 텍스트와 흐름 label이 읽힘

## 5. Content Consistency Review

다음 정본을 대조한다.

- `docs/portfolio-interviews/2026-08-20-codi-harness-v2.md`
- `docs/superpowers/specs/2026-08-20-codi-harness-portfolio-detail-design.md`
- `specs/002-codi-harness-portfolio-detail/spec.md`
- 현재 `codi-harness-v2` 정책·workflow·감사 기록

확인할 핵심 값:

- 11개 적용 / 8개 운영 / 팀원 3명
- 5개 호텔 배포 약 15분 → 약 3분
- 서울 `t3.large` 2대 × 730시간 = 월 `$151.84` 컴퓨팅 추정
- GSD/GStack은 역사적 도구, Spec Kit/Superpowers/Playwright MCP는 현재 역할

## 6. Completion Evidence

구현 완료 전 `verification.md`에 아래를 기록한다.

- 실행 명령과 핵심 출력
- 테스트 실패→구현→통과의 TDD 근거
- E2E 흐름과 viewport 결과
- 콘텐츠 근거 대조 결과
- 리뷰 결과와 해결 내역
- `speckit-converge` 결과
- `feature:status:sync` 실행 결과 또는 현재 mise 작업 부재 위험
