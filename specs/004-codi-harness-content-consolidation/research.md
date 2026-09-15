# Research: Codi Harness 콘텐츠 보강 및 인사이트 통합

## Decision 1: 기존 구조화 상세와 공통 렌더러 재사용

**Decision**: 하네스 본문은 `feature-details/codi-harness-dx-platform.ts`의 구조화 필드를 보강하고, 기존 `ProjectDetailContent`와 Markdown 렌더러를 그대로 사용한다.

**Rationale**: 현재 공통 10개 제목, 연결형 스윔레인, 지표, 관련 인사이트가 이미 데이터 주도로 렌더링되고 검증된다. 새 페이지나 컴포넌트는 콘텐츠 변경을 불필요한 UI 계약 변경으로 확대한다.

**Alternatives considered**: 전용 하네스 페이지, 별도 장문 컴포넌트, `features.ts.content` 복원. 모두 공통 읽기 순서 또는 단일 정본을 깨뜨리므로 제외한다.

## Decision 2: 작업물 상세와 대표 인사이트의 역할 분리

**Decision**: 작업물 상세는 약 5~7분 안에 문제·책임·대표 설계 결정 네 개·결과를 이해시키고, 대표 인사이트는 9분 분량의 발전 과정과 설계 인과를 설명한다.

**Rationale**: 면접관이 링크를 열지 않아도 “무엇을 구현했는지”를 알아야 하지만, 모든 역사와 세부 판단을 상세 본문에 넣으면 스윔레인과 결과를 압도한다.

**Alternatives considered**: 모든 내용을 작업물 상세에 합치기, 네 짧은 글 유지. 전자는 본문 과밀, 후자는 클릭 비용과 서사 분산을 만들기 때문에 제외한다.

## Decision 3: 기존 대표 slug 유지, 네 짧은 경로는 404

**Decision**: `codi-harness-dx-platform-design`을 대표 인사이트의 정식 경로로 유지하고 네 짧은 insight 객체를 제거한다. redirect와 tombstone UI는 만들지 않는다.

**Rationale**: 대표 경로는 이미 종합 글의 의미를 가지며, 제거 경로를 redirect하면 통합 완료 후에도 오래된 정보 구조를 공개 계약으로 유지하게 된다. 데이터 제거 뒤 page 렌더 중 `notFound()`만 호출하면 Next.js streaming 응답이 404 UI와 `noindex`를 포함하면서도 HTTP 200을 반환할 수 있다. Insight는 저장소의 정적 registry가 전체 공개 집합이므로 `generateStaticParams()` 밖의 동적 경로를 router 단계에서 거부해 실제 HTTP 404 계약을 보장한다.

**Alternatives considered**: 새 slug 생성, 네 경로를 대표 글로 redirect, 네 글을 archive 처리. 모두 기존 대표 URL의 안정성 또는 승인된 “redirect 없음” 범위와 충돌한다.

## Decision 4: 데이터 타입 확장 없이 중복 필드 제거

**Decision**: 하네스의 `SeedFeature.content` 값만 제거하고 다른 7개 작업물의 legacy `content`는 유지한다. insight 내부 보조 타입의 `legacyContent`와 대표 글의 해당 값은 제거한다.

**Rationale**: `content`는 레거시 작업물의 유효한 본문 소유권이므로 DTO 전체에서 삭제할 수 없다. 반면 `legacyContent`는 대표 insight 한 곳에서만 사용되지 않은 중복으로 존재한다.

**Alternatives considered**: `SeedFeature.content` 타입 전면 제거, 모든 프로젝트 구조화 마이그레이션. 이번 범위를 7개 작업물 재작성으로 확대하므로 제외한다.

## Decision 5: 성숙도와 증거 종류를 문장 안에서 구분

**Decision**: 실제 운영 구조, 실제 적용 결과, 운영 확장 실험을 대표 글에서 명시적으로 구분한다. 배포 시간은 실행 화면 기반 측정, 환경 혼입 재발 없음은 관찰, 월 $151.84는 공개 가격 산정으로 유지한다.

**Rationale**: 포트폴리오가 구현 범위와 운영 성숙도를 과장하지 않으면서도 결과의 근거를 전달해야 한다. 특히 멀티 세션은 약 2주의 제한된 실험이므로 기본 운영 기능처럼 서술하면 안 된다.

**Alternatives considered**: 하나의 “성과” 목록으로 합치기, 멀티 세션을 다음 기능에서 제외. 전자는 근거 범위를 흐리고, 후자는 하네스 발전 방향을 설명할 중요한 판단을 잃는다.

## Decision 6: 데이터·SSR·E2E 3계층 TDD

**Decision**: 정본과 정확한 콘텐츠 구조는 Vitest 데이터 계약, 공개 HTML은 서버 렌더링 테스트, 실제 navigation·404·반응형·키보드는 Playwright로 검증한다.

**Rationale**: 문자열 검사만으로는 route 응답과 실제 링크 동작을 증명할 수 없고, E2E만으로는 숨은 중복 필드를 안정적으로 잡기 어렵다. 각 계층이 가장 잘 관찰할 수 있는 계약을 맡는다.

**Alternatives considered**: snapshot 중심 검증, E2E만 추가. 변경 이유가 불명확한 대형 diff 또는 내부 데이터 회귀 미탐지를 만들기 때문에 제외한다.
