# Claude Code 포트폴리오 작업 인계

- 작성일: 2026-08-21
- 인계 대상: Claude Code에서 이어서 진행할 포트폴리오 작업물별 인터뷰·설계·구현
- 현재 브랜치: `chore/cleanup-downstream-harness`
- 현재 기준 작업물: `codi-harness-dx-platform`
- 현재 상태: 하네스 작업물 상세·연결형 스윔레인·콘텐츠 통합 구현 및 수렴 완료
- 다음 목표: 하네스 외 작업물 7개를 한 번에 하나씩 인터뷰하고 같은 품질 기준으로 완결

> 이 문서는 2026-08-20에 작성된 초기 handoff보다 최신이다. 특히 Jenkins 비용, 현재 사용 도구,
> 인사이트 분리 방향과 구현 상태는 이 문서와 `specs/002~004`를 기준으로 판단한다. 이전 handoff의
> `월 40만 원`, `GSD/GStack이 현재 도구`, `네 개의 독립 인사이트 추가 후보` 같은 내용은 현재 상태가 아니다.

## 1. 사용자가 최종적으로 원하는 진행 방식

하네스 외 작업물을 일괄 변환하지 않는다. 작업물 하나를 선택한 뒤 다음 순서를 끝까지 완료하고,
그 다음 작업물로 이동한다.

1. 기존 포트폴리오 본문과 확인 가능한 소스를 읽는다.
2. 사용자와 내용 보강 인터뷰를 진행한다.
3. 질문은 한 번에 하나씩 하고, 답변을 durable interview 문서에 기록한다.
4. 문제·역할·설계 판단·검증 결과와 공개 가능한 범위를 확정한다.
5. 데모 제공 여부와 표현 방식을 별도로 논의한다.
6. 필요하면 스윔레인의 lane, 정상 흐름, 실패·복구 흐름을 인터뷰로 확정한다.
7. 사용자 승인을 받은 뒤 Spec Kit 명세·계획·tasks를 작성한다.
8. TDD로 구현하고 코드·콘텐츠 리뷰, 브라우저 검증과 `speckit-converge`까지 완료한다.
9. 해당 작업물이 완결된 뒤에만 다음 작업물을 시작한다.

하네스와 다른 작업물의 기본 정보 구조는 크게 다르지 않다. 가장 큰 차이는 공개 가능한 실제 데모가
존재할 수 있다는 점이다. 데모가 없다고 해서 가짜 시뮬레이터나 준비 중 CTA를 만들지 않는다.

## 2. 사용자와 합의한 콘텐츠 원칙

### 작업물 상세이 먼저 구현 실체를 전달해야 한다

면접관이 관련 인사이트 링크를 열지 않아도 다음 내용을 이해할 수 있어야 한다.

- 어떤 문제를 해결했는가
- 사용자의 실제 책임 범위는 무엇이었는가
- 무엇을 구현했는가
- 중요한 설계 선택과 기각한 대안은 무엇이었는가
- 결과를 어떤 근거로 검증했는가
- 현재 운영 기능과 실험 단계는 어떻게 다른가

도구 이름을 많이 나열하는 것보다 구현한 시스템과 판단이 먼저 남아야 한다. 모든 상세 내용을 작업물
본문에 넣을 필요는 없지만, 핵심 구현까지 인사이트로 밀어내면 안 된다.

### 관련 인사이트는 깊이를 담당한다

작업물 본문에는 대표 설계와 결과를 남기고, 시간 순서의 발전 과정·상세 트레이드오프·운영 회고처럼
더 긴 설명은 대표 인사이트로 분리한다. 작업물 본문에서 해당 인사이트를 직접 연결한다.

짧고 중복되는 글 여러 개보다, 하나의 인과가 이어지는 깊이 있는 글을 우선한다. 하네스에서는 짧은 글
4개를 제거하고 대표 발전 서사 1개로 통합했다.

### 증거는 측정·관찰·산정을 구분한다

- `measured`: 실행 화면, 로그 또는 재현 가능한 측정으로 확인한 결과
- `reported`: 현재까지 운영에서 관찰하거나 사용자 인터뷰로 보고된 범위
- `estimated`: 공개 가격이나 명시한 가정으로 계산한 추정치

추정값에는 제외 범위와 가정을 적는다. 현재까지 재발하지 않았다는 관찰을 미래에도 발생하지 않는다는
보장으로 표현하지 않는다. 존재하지 않는 성공률, 성능 수치, 데모, 운영 범위를 만들지 않는다.

### 선택 정보는 없으면 생략한다

- 공개 가능한 데모 URL이 있을 때만 데모 CTA를 표시한다.
- URL을 실제로 열어 검증하기 전에는 데이터에 추가하지 않는다.
- 로그인, 샘플 계정, 기능 제한이 있으면 접근 안내를 함께 기록한다.
- 데모가 없으면 빈 버튼, disabled 버튼, `준비 중` 문구를 만들지 않는다.
- 스윔레인, 예외 설명, 근거 링크도 실제 정보가 있을 때만 제공한다.

## 3. 공통 작업물 상세 구조

구조화 상세가 있는 작업물은 다음 10개 `h2` 읽기 순서를 공유한다.

1. 프로젝트 개요
2. 나의 역할과 책임 범위
3. 핵심 결과 요약
4. 문제 상황과 제약 조건
5. 대안 검토와 선택
6. 시스템 흐름
7. 핵심 설계와 구현
8. 결과와 검증 근거
9. 회고와 다음 개선
10. 관련 인사이트

데이터의 주요 위치는 다음과 같다.

- 작업물 기본 정보: `apps/front/src/data/portfolio/features.ts`
- 구조화 상세 registry: `apps/front/src/data/portfolio/feature-details/`
- 구조화 상세 타입: `apps/front/src/data/portfolio/types/feature-detail.dto.ts`
- 인사이트 registry: `apps/front/src/data/portfolio/insights.ts`
- 상세 렌더러: `apps/front/src/components/projects/`
- 프로젝트 route: `apps/front/src/app/(public)/projects/[slug]/page.tsx`
- 인사이트 route: `apps/front/src/app/(public)/insights/[slug]/page.tsx`

현재 구조화 상세를 가진 작업물은 하네스 하나다. 다른 7개는 기존 `Feature.content` 장문을 유지한다.
새 작업물을 이전할 때 해당 작업물의 기존 본문을 인터뷰 fixture로 먼저 고정한 뒤, 승인된 구조화 상세로
교체해야 한다.

## 4. 지금까지 완료한 구현 이력

### Feature 002 — 하네스 포트폴리오 상세 개선

경로: `specs/002-codi-harness-portfolio-detail/`

완료 내용:

- 하네스 전용 구조화 상세 DTO와 registry 도입
- 공통 10개 섹션의 읽기 순서 도입
- 근거 종류가 구분된 결과 지표 도입
- 검증된 데모가 없으면 CTA를 생략하는 계약 도입
- 하네스 작업물에 두 개의 시스템 흐름과 관련 인사이트 연결

### Feature 003 — 연결형 스윔레인 재설계

경로: `specs/003-connected-swimlane-redesign/`

사용자가 기존 카드형 흐름의 `연결과 분기`, `제한` 같은 표현을 이해하기 어렵다고 피드백했다. 사용자가
제공한 예시 이미지처럼 전체 흐름을 한눈에 이해할 수 있는 연결형 스윔레인을 원했다.

완료 내용:

- 외부 diagram 라이브러리 없이 데이터 기반 SVG 스윔레인 구현
- `설계·개발·검증`, `CI/CD·시크릿·배포` 두 흐름 구현
- lane, step, normal edge, exception edge와 예외 설명을 타입으로 관리
- process·decision·start·end·stop 도형을 의미에 맞게 구분
- 정상선은 실선, 예외선은 점선과 텍스트 label로 구분
- visible 전체 흐름 설명을 SVG 접근성 설명과 연결
- 모바일에서는 페이지 전체가 아니라 diagram region만 가로 스크롤
- 각 diagram region은 키보드 한 번의 tab stop으로 진입하고 `ArrowRight`로 탐색
- 320/768/1024/1440px overflow와 light/dark 명암 대비 검증

설계 흐름의 핵심 단계는 요청·맥락 전달 → 문제 정의 → 명세·계획 → 승인 → 테스트·구현 → 리뷰·검증이다.
리뷰·검증은 decision이고, 통과하면 별도 완료 end node로 간다. 모호한 요구, 미승인, 검증 실패는 각각
이전 단계로 돌아가는 예외 경로를 갖는다.

배포 흐름은 변경 감지 → 품질 검사 → 환경·대상 결정 → 시크릿 조회 → 병렬 배포 → 결과 확인이다.
품질 실패와 시크릿 불일치는 배포 중단으로 가고, 원인을 수정한 뒤 처음부터 다시 실행한다.

### Feature 004 — 하네스 콘텐츠 보강 및 인사이트 통합

경로: `specs/004-codi-harness-content-consolidation/`

사용자와 이전 버전·현재 버전을 비교한 결과, 스윔레인은 유지하되 작업물 본문의 구현 실체가 너무 많이
인사이트로 빠졌다는 문제를 확인했다.

하네스 작업물 본문에 복원한 네 대표 설계:

1. `./harness`와 `doctor`
2. `harness.lock`과 소유권 경계
3. 공통 정책과 런타임 어댑터
4. 변경 범위 기반 배포와 Infisical 경계

추가로 반영한 사실:

- GSD → Spec Kit: 문서 양식을 직접 통제하고 작성 과정에 사용자 의견을 더 많이 반영하기 위한 전환
- GStack → Playwright MCP: 약 5주간 사용량을 확인했을 때 browse 외 활용이 크지 않았기 때문에 전환
- Jenkins 비용: 과거 청구액을 기억에 의존하지 않고 2026-08-20 AWS 서울 리전 Linux On-Demand
  `t3.large` 2대 × 월 730시간의 공개 가격으로 월 `$151.84` 컴퓨팅 비용을 산정
- 비용 산정에서 스토리지·네트워크·세금 제외
- 멀티 세션: 모든 프로젝트의 운영 기능이 아니라 PHP/Gnuboard 데이터베이스 마이그레이션에서 수행한
  약 2주의 운영 확장 실험
- 5개 호텔 배포 약 15분 → 약 3분은 실행 화면 기준 측정
- 환경 혼입 동일 유형 문제 미발생은 현재까지의 운영 관찰이며 미래 무결점 보장이 아님

짧았던 다음 인사이트 4개는 registry와 공개 route에서 제거했다.

- `harness-lock-and-project-ownership-boundary`
- `harness-cli-and-doctor-productization`
- `claude-codex-policy-parity-and-regression-testing`
- `multi-session-testbed-and-context-lifecycle`

대표 인사이트 `codi-harness-dx-platform-design` 하나를 다음 8개 구간의 `9 min` 발전 서사로 확장했다.

1. Jenkins 제거가 출발점이었다
2. v1: 복사는 설치를 쉽게 했지만 업데이트를 어렵게 했다
3. harness.lock: 재사용성을 안전한 변경 전파로 다시 정의하다
4. ./harness와 doctor: 체크리스트를 내부 제품으로 만들다
5. AI 작업 규칙: 문서를 복사하는 것에서 행동을 검증하는 것으로
6. 멀티 세션: 규칙 통일에서 실행 환경 격리로 확장하다
7. 결과: 하네스가 관리하는 것은 파일이 아니라 반복 가능한 작업 방식이다
8. 회고

제거한 네 route는 redirect 없이 HTTP 404를 반환한다. 이를 위해 insight route에 registry 기반
`generateStaticParams()`와 함께 `dynamicParams = false`를 적용했다.

작업물 본문의 canonical link와 자동 관련 인사이트가 중복되던 문제는 project route에서 구조화
`implementation`이 직접 연결한 insight를 자동 related 목록에서 제외하는 방식으로 해결했다.

유지한 하네스 인프라 인사이트:

- `jenkins-retirement-and-github-actions-migration`
- `infisical-centralized-secrets-and-spof-defense`
- `cloudflare-tunnel-zero-trust-cicd-and-troubleshooting`

## 5. 하네스 현재 공개 계약

- 적용 프로젝트: 11개
- 실제 운영 프로젝트: 8개
- 사용자: 팀원 3명
- Jenkins 컴퓨팅 추정: `$151.84/월`
- 5개 호텔 배포: 약 15분 → 약 3분
- 공개 데모: 없음
- 데모 CTA: 없음
- 스윔레인: 2개
- 결과 지표: 6개
- 작업물 본문 내 canonical 대표 인사이트 link: 정확히 1개
- 제거된 인사이트 link: 0개
- 하네스 관련 공개 인사이트: canonical 1개 + 유지 인프라 3개

이 계약은 새 작업물을 수정할 때 손상시키면 안 된다.

## 6. 검증 및 리뷰 상태

Feature 004의 `tasks.md`에는 unchecked task가 없다.

최종 검증:

- TypeScript: exit 0
- Vitest: 4 files, 73 tests passed
- 변경 범위 ESLint: exit 0
- Next.js production build: exit 0, 38개 static page 생성
- fresh Webpack server E2E: 16/16 passed
- `git diff --check`: exit 0
- 코드·콘텐츠 리뷰: Critical 0, Important 0, Minor 0
- `speckit-converge`: `✅ Converged`

알려진 저장소 상태:

- 전체 `pnpm --dir apps/front run lint`는 저장소 전반의 기존 Prettier·import-order 기준선 때문에
  2,086 problems로 실패한다. unrelated 파일을 mass-format하지 않는다.
- 장기 실행 중이던 shared 1104 dev server는 route config를 hot-reload하지 않아 제거 route를 200으로
  응답했다. 같은 현재 소스를 fresh Webpack 1114 서버에서 실행했을 때 전체 16/16과 제거 route 404를
  확인했다. source defect와 stale process를 구분한다.
- `mise run feature:status:sync` task는 현재 저장소에 존재하지 않는다. `ROADMAP.md`와 각 feature의
  `tasks.md`를 수동 상태 정본으로 사용한다.

상세 증거는 `specs/004-codi-harness-content-consolidation/verification.md`에 있다.

## 7. 다음 작업물 순서

`ROADMAP.md`의 다음 인터뷰 순서는 다음과 같다.

1. 골프 예약 시스템 구축 — `the-siena-golf-reservation`
2. 한마음과학원 통합 교육 플랫폼 — `hanmaum-science-institute`
3. 블랙스톤 벨포레 리조트 시스템 — `blackstone-belleforet-resort`
4. 통합 SSO 서버 — `integrated-sso-server`
5. 하이패스 B2B 플랫폼 — `hipass-b2b-platform`
6. 호텔 예약 시스템 플랫폼화 및 구조 고도화 — `hotel-reservation-platform`
7. 통합 예약 플랫폼 — `integrated-reservation-platform`

첫 재개 대상은 골프 예약 시스템이다. 사용자가 다른 작업물을 명시적으로 우선 지정하면 그 선택을 따른다.

## 8. 작업물 하나를 진행하는 권장 인터뷰 흐름

질문을 한꺼번에 던지지 말고, 답변에 따라 다음 질문을 조정한다.

### 1단계: 범위와 사용자 가치

- 작업 기간과 공개할 시점 범위는 어디까지인가?
- 실제 사용자와 비즈니스 문제는 무엇이었는가?
- 이 작업물에서 본인이 직접 책임진 영역은 무엇인가?

### 2단계: 문제와 제약

- 시작 당시 가장 큰 장애와 반복 비용은 무엇이었는가?
- 레거시, 일정, 외부 API, 데이터, 보안, 운영 제약은 무엇이었는가?
- 공개하면 안 되는 고객·보안·계약 정보는 무엇인가?

### 3단계: 설계와 대안

- 가장 중요한 설계 결정 3~5개는 무엇인가?
- 각 결정에서 비교한 대안과 선택 이유는 무엇인가?
- 실패하거나 되돌린 접근은 무엇인가?
- 구현 결과를 어떤 테스트, 로그, 운영 관찰로 검증했는가?

### 4단계: 결과와 증거

- 수치로 공개할 수 있는 측정 결과가 있는가?
- 측정이 아니라 운영 관찰 또는 인터뷰 보고인 결과는 무엇인가?
- 비용 추정이 필요하다면 스펙, 리전, 시간과 제외 범위는 무엇인가?
- 현재 운영 기능과 실험·PoC 단계는 무엇인가?

### 5단계: 데모

- 공개 가능한 운영 URL 또는 별도 데모 URL이 있는가?
- 로그인 없이 접근 가능한가?
- 샘플 계정, 샘플 데이터 또는 기능 제한 안내가 필요한가?
- 고객 데이터나 관리자 기능이 노출되지 않는가?
- URL을 브라우저로 직접 검증했는가?

데모가 없다면 다음으로 넘어간다. 스윔레인은 데모의 대체물이 아니라 시스템 책임과 흐름을 설명하는
독립적인 표현이다.

### 6단계: 스윔레인

- 이 작업물의 주요 주체는 누구인가?
- 정상 시작점과 완료 지점은 무엇인가?
- 승인·검증·결제·동기화 같은 decision은 어디에 있는가?
- 실패 시 중단되는가, 이전 단계로 돌아가는가, 재시도하는가?
- 예외 흐름을 보지 못해도 이해할 수 있는 한 문장 설명은 무엇인가?

### 7단계: 인사이트 분리

- 작업물 본문에 반드시 남겨야 할 대표 구현은 무엇인가?
- 시간 순서의 발전 과정이나 상세 트레이드오프로 별도 확장할 주제가 있는가?
- 기존 인사이트와 중복되는가?
- 짧은 글 여러 개보다 하나의 깊이 있는 글로 합치는 편이 나은가?

## 9. 작업물별 Spec Kit·구현 절차

새 작업물은 별도의 `specs/<NNN-feature>/`로 진행한다.

1. 저장소 `AGENTS.md`, `.harness/config/project-profile.yaml`, 항상 적용되는 local rule을 읽는다.
2. `specs/*/tasks.md`에 미완료 feature가 있는지 확인한다.
3. 해당 작업물의 기존 `Feature.content`와 연결 인사이트·route를 읽는다.
4. `docs/portfolio-interviews/`에 새 인터뷰 파일을 만들고 질문·답변·확정 문구를 기록한다.
5. Brainstorming에서 본문·데모·스윔레인·인사이트 범위를 합의한다.
6. `speckit-specify` 후 clarify 필요 여부를 보고하고 사용자 handoff에서 멈춘다.
7. 사용자가 명시적으로 `codi-auto-loop start`라고 한 뒤 plan → tasks → analyze를 진행한다.
8. 승인된 tasks를 TDD로 구현한다. 구현 단계에서는 commit·stage하지 않는다.
9. 데이터·SSR·브라우저 테스트에서 RED 이유와 GREEN 결과를 `verification.md`에 기록한다.
10. 코드 품질 리뷰와 spec 리뷰의 Critical·Important를 해결한다.
11. TypeScript → unit/integration → lint → build → fresh E2E → diff check 순서로 검증한다.
12. `speckit-converge`가 `✅ Converged`가 될 때까지 차이를 해결한다.
13. `ROADMAP.md`를 갱신한다. status sync task가 계속 없다면 미지원 결과를 정직하게 기록한다.

## 10. 회귀 테스트에서 반드시 보존할 범위

하나의 작업물을 구조화 상세로 이전할 때 다음 항목을 자동화한다.

- 전체 작업물 8개 route가 계속 성공하는가?
- 아직 이전하지 않은 legacy 작업물의 본문이 손실되지 않았는가?
- 이미 이전한 작업물의 구조화 상세·스윔레인·지표·demo 계약이 유지되는가?
- 제거한 인사이트 slug가 다시 registry나 관련 링크에 나타나지 않는가?
- 유지하기로 한 인사이트의 title·대표 문장·본문 길이가 보존되는가?
- project route의 canonical link가 중복되지 않는가?
- 외부 링크는 `_blank`와 `noopener noreferrer`, 접근 가능한 새 창 label을 제공하는가?
- 320/768/1024/1440px에서 문서 전체 overflow가 없는가?
- 모바일 diagram은 region 내부만 가로 스크롤되고 키보드로 탐색 가능한가?
- 데모가 없는 작업물에 빈 CTA가 생기지 않는가?

작업물이 하나씩 구조화 상세로 이전되면 `구조화 상세은 하네스 하나뿐` 같은 기존 테스트 문구와 exact
fixture를 새 상태에 맞게 원자적으로 갱신해야 한다. 단순히 기존 assertion을 삭제하지 말고, 이전된 작업물과
남은 legacy 작업물의 정확한 목록을 새 계약으로 고정한다.

## 11. 작업 트리와 안전 주의사항

- 현재 작업 트리는 다수의 미커밋·미추적 변경을 포함한다.
- Feature 002~004의 구현도 이 shared worktree에 포함돼 있으므로 `git reset --hard`, broad restore,
  checkout 덮어쓰기 또는 unrelated mass-format을 하면 안 된다.
- 기존 사용자 변경과 새 작업을 구분하고, 수정 대상 파일의 현재 diff를 먼저 확인한다.
- 앱 구현 중에는 commit 또는 stage하지 않는다.
- Claude Code에서도 현재 branch와 in-flight feature를 먼저 확인한다.
- shared dev server가 오래 실행 중이면 route config 변경을 신뢰하지 말고 fresh server로 검증한다.
- 테스트 결과와 stale process, 기존 lint baseline을 섞어서 전체 GREEN이라고 쓰지 않는다.

## 12. Claude Code 재개 체크리스트

새 세션에서 다음 순서로 시작한다.

1. `AGENTS.md`와 하네스 policy를 읽는다.
2. `git status --short`로 shared dirty worktree를 확인한다.
3. `ROADMAP.md`와 모든 `specs/*/tasks.md`의 unchecked task를 확인한다.
4. 이 handoff와 `specs/002`, `specs/003`, `specs/004`의 summary·tasks·verification을 읽는다.
5. 골프 예약 시스템의 기존 본문과 관련 인사이트를 읽는다.
6. 사용자에게 첫 인터뷰 질문 하나만 한다.
7. 답변을 인터뷰 문서에 기록하고 다음 질문을 이어간다.
8. 인터뷰가 끝날 때까지 구현하지 않는다.
9. 본문·데모·스윔레인·인사이트 방향을 사용자에게 요약하고 명시적 승인을 받는다.
10. 승인 후 Spec Kit flow를 시작한다.

권장 첫 질문:

> 골프 예약 시스템 작업물에서 포트폴리오에 가장 먼저 전달하고 싶은 핵심 문제와, 본인이 직접 책임진
> 범위는 무엇인가요?

데모 URL부터 묻기보다 작업물의 문제와 책임 범위를 먼저 확정한다. 데모는 구현 실체와 공개 범위를
이해한 뒤 별도 단계에서 확인한다.
