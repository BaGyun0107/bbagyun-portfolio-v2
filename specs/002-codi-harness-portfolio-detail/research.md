# Research: Codi Harness 포트폴리오 상세 개선

## Decision 1: 정적 구조화 레지스트리와 레거시 fallback

**Decision**: `feature-details/<slug>.ts`에 인터뷰가 끝난 작업물의 구조화 상세를 두고,
`feature-details/index.ts`가 slug로 조회한다. 공통 상세 페이지는 상세 데이터가 있으면
새 정보 구조를, 없으면 기존 `FeatureDto.content`를 렌더링한다.

**Rationale**: 현재 데이터는 빌드 타임 TypeScript 상수이며 외부 API가 없다. 한
작업물씩 인터뷰 후 이전한다는 요구를 지키면서도 페이지를 복제하지 않는 가장 작은
변경이다.

**Alternatives considered**:

- 모든 8개 작업물을 한 번에 구조화: 인터뷰되지 않은 사실을 추정하게 되어 기각했다.
- 하네스 전용 상세 라우트: 공통 정보 구조를 재사용하지 못하므로 기각했다.
- CMS/DB 도입: 정적 포트폴리오 범위에 비해 운영 복잡도가 커서 기각했다.

## Decision 2: TypeScript 계약과 순수 검증 함수

**Decision**: 승인된 `FeatureDetailDto`, 지표, 데모, 스윔레인 타입을 추가하고,
레지스트리 로딩 시 중복 ID, lane/step/edge 참조, 실패 결과와 대체 설명을 확인하는
순수 검증 함수를 사용한다. `SeedFeature`는 `FeatureCategory`와 `FeatureStatus`를
직접 사용해 변환 단계의 강제 캐스팅을 제거한다.

**Rationale**: 타입만으로는 스윔레인 교차 참조 무결성을 표현할 수 없지만 새 런타임
검증 의존성은 필요하지 않다. 정적 데이터가 잘못되면 테스트와 빌드 시점에 즉시
실패하도록 할 수 있다.

**Alternatives considered**:

- 타입만 사용: 중복 ID와 참조 오류를 잡지 못해 기각했다.
- Zod 스키마 추가: 이미 의존성은 있지만 교차 참조 검증에는 별도 로직이 필요하고,
  이 범위에서는 순수 검증 함수가 더 직접적이라 선택하지 않았다.
- 렌더링 시 조용히 누락: 사실과 흐름 오류를 숨기므로 기각했다.

## Decision 3: 정적 Server Component 스윔레인

**Decision**: 스윔레인은 별도 그래프 라이브러리 없이 Server Component가 lane,
step과 edge 의미를 정적 HTML/CSS로 렌더링한다. 같은 데이터에서 시각 영역과
`<ol>` 대체 목록을 생성하고, 넓은 영역만 내부 가로 스크롤을 허용한다.

**Rationale**: 이 기능은 조작형 편집기나 실행 시뮬레이터가 아니라 읽기용 흐름
증거다. 클라이언트 상태와 그래프 런타임 없이도 두 흐름의 책임·정상·실패·복구를
표현할 수 있고 정적 생성 및 접근성 요구에 맞는다.

**Alternatives considered**:

- Mermaid/그래프 라이브러리: 번들·접근성·스타일 제어 비용이 커서 기각했다.
- 이미지 한 장: 텍스트 대안과 반응형 읽기 순서를 유지하기 어려워 기각했다.
- 가이드형 시뮬레이터: 공개할 실행 환경과 실제 CLI가 없어 승인 범위에서 제외됐다.

## Decision 4: 기존 UI 토큰과 구성 요소 재사용

**Decision**: `globals.css`의 semantic color 변수와 기존 `Card`, `Badge`, Markdown
렌더러를 사용하고 `components/ui/*`는 수정하지 않는다. 프로젝트 전용 조합은
`components/projects/*`에 둔다. 검증된 데모가 있는 미래 작업물을 위해
`ProjectDemoLink`를 fixture로 검증하되 하네스에는 렌더링하지 않는다. 외부 링크는
새 창 안내와 `noopener noreferrer`를 함께 제공한다.

**Rationale**: 별도 디자인 시스템 문서는 없지만 앱에 Tailwind 4 토큰과 shadcn/Radix
구성 요소가 존재한다. 기존 상세 페이지와 시각 일관성을 유지하는 최소 경계다.

**Alternatives considered**:

- 하네스 전용 하드코딩 색상: 다크 모드와 의미 토큰을 우회하므로 기각했다.
- `components/ui/*` 직접 수정: 공유 primitive를 변경하므로 저장소 규칙상 기각했다.
- 새 디자인 시스템 구축: 이번 콘텐츠 구조 개선 범위를 초과한다.

## Decision 5: Vitest 계약 테스트와 Playwright E2E

**Decision**: 순수 데이터·검증기는 Vitest node 환경에서 테스트하고, 공개 작업물
상세의 렌더링·링크·데모 미표시·레거시 fallback·반응형 overflow는 Playwright E2E로
검증한다. 현재 누락된 루트 mise E2E task와 앱 전용 suite를 공식 harness 절차로
추가한다.

**Rationale**: 데이터 계약과 사용자 흐름을 가장 가까운 계층에서 검증하면서, 실제
페이지에 필요한 접근성과 responsive evidence도 남길 수 있다. 저장소 quality gate가
사용자 흐름 변경에 E2E 증거를 요구한다.

**Alternatives considered**:

- Vitest만 사용: 실제 라우트와 overflow를 증명하지 못해 기각했다.
- 수동 브라우저 확인만 사용: 회귀 가능한 증거가 없어 기각했다.
- 모든 프로젝트별 E2E 추가: 이번 기능의 critical flow보다 범위가 커서 기각했다.

## Decision 6: 현재 도구와 발전 기록을 분리

**Decision**: 하네스의 현재 `techStack`에는 Spec Kit, Superpowers, Playwright MCP,
Codi skills, GitHub Actions와 Infisical만 포함한다. GSD와 GStack은 발전 타임라인 및
전환 이유에서만 언급한다.

**Rationale**: 현재 사용하는 도구와 과거 평가·교체한 도구를 같은 목록에 두면
작업물의 현재성을 오해하게 한다. 인터뷰와 하네스 감사 기록이 전환 근거를 제공한다.

**Alternatives considered**:

- 모든 역사적 도구를 tech stack에 유지: 현재 상태를 왜곡하므로 기각했다.
- 역사적 도구를 완전히 삭제: 전환 판단과 실험 근거가 사라지므로 기각했다.

## Resolved Unknowns

- 런타임: Node.js 24, Next.js 16.1.6, React 19.2.3
- package manager: `apps/front`의 pnpm
- 데이터 원본: 정적 TypeScript 상수
- 테스트: Vitest 4.1.11, Playwright 1.62.1
- 라우팅: App Router 정적 params
- 디자인 토큰: `apps/front/src/app/globals.css`
- 외부 API·DB·인증 변경: 없음
- 미해결 기술 질문: 없음
