# Verification: Codi Harness 포트폴리오 상세 개선

## 2026-08-20 — Setup 및 기반 데이터 계약

### TDD 기록

- `feature-detail-quality.test.ts` 최초 실행: `./feature-details` 모듈이 없어 suite 실패.
- 타입과 빈 레지스트리 생성 후 재실행: 5개 중 4개가 검증 규칙 미구현으로 기대대로 실패.
- 검증기 구현 후 재실행: 5개 테스트 통과.

### 검증 결과

| 명령 | 결과 | 비고 |
| --- | --- | --- |
| `mise tasks ls --all` | 통과 | `e2e`, `e2e:changed`, `//apps/front:e2e` 확인 |
| `pnpm --dir apps/front exec playwright test --list --pass-with-no-tests` | 통과 | 설정 로드, 아직 E2E spec 없음 |
| `pnpm --dir apps/front test` | 통과 | 2 files, 9 tests |
| `pnpm --dir apps/front exec tsc --noEmit` | 통과 | 의존성 설치 복구 후 재검증 |
| 대상 파일 `git diff --check` | 통과 | 공백 오류 없음 |

### 환경 메모

- Playwright 의존성 반영 후 로컬 `node_modules`를 잠금 파일 기준으로 설치했다.
- Vitest는 기존 CommonJS 파일에서 ESM 구문을 읽는 Vite native config loader 경고를
  출력하지만 테스트 결과에는 영향을 주지 않았다.

## 2026-08-20 — US1 가치·성과 및 US2 스윔레인

### TDD 기록

- 하네스 상세·현재 도구 테스트 추가 후: 상세 레지스트리 `null`, 기존 tech stack 불일치로 2건 실패.
- 구성 요소 stub 추가 후: 10개 heading과 available demo 링크 속성 2건 실패.
- E2E 최초 유효 실행: 구조화 `프로젝트 개요` heading 부재로 1건 실패, demo 부재 시나리오는 통과.
- 스윔레인 데이터 테스트 추가 후: 스윔레인 0개로 1건 실패.
- 스윔레인 E2E 추가 후: `설계·개발·검증` article 부재로 1건 실패.

### 검증 결과

| 명령 | 결과 | 비고 |
| --- | --- | --- |
| 구조화 데이터·렌더링 대상 Vitest | 통과 | 2 files, 12 tests |
| `pnpm --dir apps/front exec tsc --noEmit` | 통과 | 구조화 UI와 스윔레인 타입 확인 |
| 하네스 대상 Playwright | 통과 | 7 tests, US1 2개 + US2/viewport 5개 |

### 관찰

- 하네스에는 demo 필드와 demo/준비 중 CTA가 없다.
- 두 스윔레인은 정상·실패·복구를 아이콘, 선 모양과 텍스트 label로 함께 표시한다.
- 넓은 시각 영역은 내부 `overflow-x-auto`를 사용하며 320/768/1024/1440px에서
  document 전체 가로 넘침이 1px 이하로 확인됐다.

## 2026-08-20 — US3 현재/역사, US4 인사이트, US5 호환성

### TDD 및 호환성 기록

- US3 데이터 테스트: 현재/발전 heading과 런타임 계층 표기가 없어 1건 실패 후 통과.
- US3 E2E: `현재 구조` heading 부재로 1건 실패 후 통과.
- US4 데이터 테스트: 신규 4개 slug 부재와 월 20만 원 충돌로 2건 실패 후 통과.
- 신규 인사이트 작성 중 Markdown 백틱 escape 오류를 발견해 일반 텍스트 표기로 수정 후
  TypeScript와 전체 테스트를 재검증했다.
- US5는 US1에서 이미 공통 fallback을 구현한 상태라 추가한 characterization test가 첫 실행부터
  통과했다. 별도 동작을 새로 추가하지 않고 7개 레거시 본문 보존 계약을 명시했다.

### 검증 결과

| 명령 | 결과 | 비고 |
| --- | --- | --- |
| `pnpm --dir apps/front test` | 통과 | 3 files, 20 tests |
| `pnpm --dir apps/front exec tsc --noEmit` | 통과 | 신규 인사이트·fallback 타입 확인 |
| 하네스 전체 Playwright spec | 통과 | 10 tests, 4 insights + 8 project paths 포함 |
| `pnpm --dir apps/front run build` | 통과 | 42 static pages, 8 project paths와 신규 insight paths 생성 |

### 빌드 환경 메모

- 최초 sandbox build는 Google Fonts 네트워크 차단으로 실패했다.
- 네트워크 허용 재실행에서 동일 코드가 정상 compile, TypeScript 검사와 static generation을
  모두 통과했다.
- Next.js는 루트 `package-lock.json`과 앱 `pnpm-lock.yaml`을 함께 감지해 workspace root 추론
  경고를 출력했다. 이 기능 변경과 무관한 기존 저장소 구조이며 build 결과에는 영향이 없었다.

## 2026-08-20 — 리뷰 보강 및 최종 검증

### 리뷰 보강 TDD 기록

- 코드 리뷰에서 구조화 상세 필수 필드 검증, 내부 링크의 같은 탭 이동, 스윔레인 키보드
  탐색, 빈 관련 인사이트 섹션, `reported` 지표 라벨의 Important 항목 5개를 확인했다.
- 먼저 음성 계약과 렌더링 회귀 테스트를 추가해 22개 중 7개가 기대한 이유로 실패하는
  RED 상태를 확인했다.
- 검증기와 프로젝트 상세 전용 Markdown 렌더러를 보강하고 스크롤 영역 접근성·조건부
  섹션·지표 라벨을 수정한 뒤 대상 테스트 22개가 모두 통과했다.
- 재리뷰에서 기존 Important 5개가 모두 해소됐고 신규 Critical/Important는 0개였다.

### T038 전체 명령 결과

| 명령 | 결과 | 비고 |
| --- | --- | --- |
| `pnpm --dir apps/front exec tsc --noEmit` | 통과 | 최종 구조화 데이터와 UI 타입 확인 |
| `pnpm --dir apps/front test` | 통과 | 3 files, 26 tests |
| `pnpm --dir apps/front run lint` | 실패 | 저장소 전역 2,096건: 2,078 errors, 18 warnings. 기존 파일 전반에 새 Prettier 규칙이 적용된 기준선 불일치가 대부분이며 사용자 변경을 대량 포맷하지 않음 |
| 기능 신규 파일 대상 ESLint | 통과 | Playwright/Vitest 설정, E2E, 프로젝트 구성 요소, 상세 데이터·계약 테스트 전체 |
| 수정된 legacy 파일 대상 ESLint (`prettier/prettier: off`) | 통과 | 페이지 조합과 portfolio 기존 데이터 파일의 비포맷 규칙 확인 |
| `pnpm --dir apps/front run build` | 통과 | 42 static pages, 8 project paths 및 신규 insight paths 생성 |
| `mise run //apps/front:e2e` | 통과 | Playwright 1.62.1, 14 tests |
| `git diff --check` | 통과 | 작업 트리 공백 오류 없음 |

전체 lint 실패는 이 기능에서 추가한 파일에는 재현되지 않으며, 기존 사용자 변경인
`eslint.config.mjs`의 Prettier 강제와 저장소 기존 포맷의 차이에서 발생한다. 관련 없는
파일 2천여 건을 자동 수정하면 사용자 작업을 침범하므로 기능 범위 검증 통과와 저장소
기준선 잔여 상태를 분리했다.

### T039 브라우저·접근성 관찰

- 320/768/1024/1440px 모두 document 전체 가로 overflow가 1px 이하였다.
- 10개 공통 `h2` 제목이 승인된 읽기 순서와 정확히 일치했다.
- 내부 인사이트 링크는 키보드 Enter로 같은 탭에서 이동하고 `target`을 만들지 않았다.
- AWS 외부 근거는 접근 가능한 `(새 창에서 열림)` 안내, `target="_blank"`,
  `rel="noopener noreferrer"`를 제공했다.
- 320px에서 이름 있는 스윔레인 `region`에 초점을 두고 ArrowRight를 누르면 내부
  `scrollLeft`가 증가했으며 정적 step에는 `tabindex`가 없었다.
- 다크 모드에서 개요, 스윔레인과 흐름 label이 표시되고 전경/배경색이 구분됐다.
- 현재 세션에는 별도 Playwright MCP connector가 노출되지 않아 동일한 고정 버전의
  Playwright 자동화 suite를 직접 실행해 관찰을 기록했다.

### T040 공개 주장 정합성

- 현재 핵심 도구는 Spec Kit, Superpowers, Playwright MCP, Codi skills,
  GitHub Actions, Infisical 여섯 개로 일치한다.
- GSD와 GStack은 현재 스택이 아니라 발전 기록에서만 교체 이유와 함께 설명한다.
- 공개 매핑 콘텐츠에는 월 20만/40만 원 주장이 없고 Jenkins 비용은 `$151.84/월`,
  2026-08-20 기준 서울 `t3.large` 2대·730시간의 컴퓨팅 추정으로 통일했다.
- 과거 실제 청구액과 컴퓨팅 외 비용이 아니라는 caveat와 AWS 공개 가격 링크를 함께
  제공한다.
- 네 구현 주제는 각기 독립 insight slug로 연결되며 하네스 외 7개 작업물은 기존 본문과
  경로를 유지한다.

### T041 수렴 판정

`speckit-converge` 기준으로 FR 21개, SC 12개, 인수 시나리오 16개, 주요 계획 결정
8개와 헌법 원칙 5개를 확인했다. missing/partial/contradicts/unrequested finding은 모두
0개이며 `tasks.md`에 별도 Convergence phase를 추가하지 않았다.

**결과**: ✅ Converged — 구현은 명세, 계획과 작업 범위를 충족한다.

### T042 상태 동기화

`mise run feature:status:sync`를 최종 재시도했으나 루트에 해당 task가 없어 실행되지
않았다. `--apply`도 사용할 수 없으므로 `ROADMAP.md`의 기능 상태를 완료로 수동 반영하고
7개 후속 인터뷰 순서를 유지했다.

### 잔여 상태

- 저장소 전역 lint 기준선은 별도 포맷 정비 작업이 필요하다. 기능 신규 파일과 수정된
  실행 로직의 비포맷 ESLint는 통과했다.
- Playwright 실행 산출물은 작업 트리에 남기지 않고
  `/private/tmp/bbagyun-portfolio-v2-playwright-results-final-20260820`으로 이동했다.
- Next.js의 다중 lockfile/workspace root 및 dev cross-origin 경고는 기존 구성 경고로
  남아 있으며 build와 E2E 결과에는 영향을 주지 않았다.
