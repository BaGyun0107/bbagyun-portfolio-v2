# Phase 0 Research: 호텔 예약 플랫폼 구조화 상세와 연결 인사이트 정정

**Date**: 2026-09-09

2026-09-09 사용자 인터뷰, 현재 포트폴리오 데이터·렌더러·테스트, 읽기 전용으로 확인한 `/Users/codiworks_dev/Desktop/codi-rs-module`의 구현 경계를 바탕으로 아래 결정을 확정했다. Technical Context의 미확정 항목은 없다.

## D-001. 작업물은 기존 구조화 상세 계약으로 이전한다

**Decision**: `hotel-reservation-platform.ts`를 만들고 `FeatureDetailDto`의 역할, 근거 지표, 문제, 제약, 대안, 스윔레인, 구현, 결과, 회고 순서를 사용한다. legacy `content`는 제거한다.

**Rationale**: 이미 이전된 작업물들과 같은 읽기 순서와 검증기를 사용해야 채용 담당자가 책임·판단·결과를 비교할 수 있다.

**Alternatives considered**: legacy Markdown만 정정하는 안은 구조적 비교와 계약 검증이 어려워 기각했다. 전용 페이지도 공통 정보 구조 원칙에 맞지 않아 제외했다.

## D-002. 전면 서사는 두 단계의 진화 과정으로 구성한다

**Decision**: 2024~2025년 조건 분기를 설정으로 옮긴 1차 구조와, 그 구조에 남은 호텔별 배포 브랜치 편차를 해결한 2026년 `core/platform` 리빌딩을 원인과 다음 선택이 이어지는 순서로 설명한다.

**Rationale**: 현재 구조만 먼저 제시하면 왜 설정만으로 충분하지 않았는지 사라지고, 검증 사건을 먼저 제시하면 작업의 핵심이 마이그레이션 사고처럼 보인다.

**Alternatives considered**: 현재 아키텍처 우선 구성과 마이그레이션 검증 우선 구성을 비교했으나 사용자 승인에 따라 진화 서사를 선택했다.

## D-003. 공개 지표는 확인 가능한 세 사실만 사용한다

**Decision**: 운영 적용 플랫폼 `5개`는 사용자 보고값, 기준 소스 `1개`는 코드에서 직접 확인한 측정값, 마이그레이션 발견 시점 `운영 배포 전`은 사용자 보고값으로 표시한다. 모두 `2026-08`을 기준 시점으로 두고, 배포 단위 통합이나 개선율로 확대하지 않는다.

**Rationale**: 구조화 상세은 하나 이상의 highlight를 요구하지만 개발시간·배포시간·버그 감소율·온보딩 속도는 측정하지 않았다. 승인되고 검증 가능한 사실만 카드로 사용한다.

**Alternatives considered**: 1시간 `sessionStorage` 만료를 성과 카드로 올리는 안은 핵심 플랫폼화 서사보다 구현 세부에 가깝고, 파일 수는 변화하는 내부 값이어서 제외했다.

## D-004. 작업물 시각 자료는 개발·검증·배포 흐름 하나만 제공한다

**Decision**: 요구사항을 공통 동작·값 차이·화면 및 로직 차이로 분류하고 `core`·`rsConfig`·`platform`에 배치한 뒤, 플랫폼별 빌드와 계약·동작 검증을 거쳐 호텔별 운영 폴더에 배포하는 흐름을 `ProjectSwimlane`으로 표현한다. 패리티 누락이 발견되면 운영 브랜치 감사와 수동 이식을 거쳐 검증으로 돌아간다.

**Rationale**: 책임 이동과 예외 복구가 세 개 이상의 구성요소에 걸쳐 있어 시각화 가치가 높다. 인사이트의 코드 배치 원칙과 Context 전후 비교는 별도 질문으로 분리한다.

**Alternatives considered**: 아키텍처 정적 구조만 보여주는 안은 마이그레이션 검증과 배포 단위가 사라져 기각했다. NICEPAY 흐름 추가는 화면 역할을 분산하고 별도 인사이트도 만들지 않기로 해 제외했다.

## D-005. 기존 인사이트 시각 계약은 변형을 늘리지 않고 최소 일반화한다

**Decision**: `data-flow`와 `before-after` 변형을 그대로 재사용한다. `data-flow`의 성공·실패·재시도 존재 여부는 개별 콘텐츠가 정하고, 공통 검증은 참조 무결성과 필수 텍스트만 확인한다. `before-after` actor 역할에 source·relay·boundary·consumer를, 관계 범위에 indirect·direct를 추가하고 각 패널에 최소 한 관계를 요구한다.

**Rationale**: 현재 공통 검증은 하이패스 한 사례의 의미를 모든 data-flow와 before-after에 강제한다. 이번 흐름에 가짜 실패·재시도 또는 Room 역할을 넣으면 승인된 판단을 왜곡한다.

**Alternatives considered**: 새 `decision-flow`·`component-flow` 변형을 추가하는 안은 렌더러와 타입 분기를 불필요하게 늘려 제외했다. 기존 역할에 억지로 매핑하는 안은 의미 정확성을 해쳐 기각했다.

## D-006. 하이패스 고유 시각 규칙은 콘텐츠 회귀 테스트로 보존한다

**Decision**: 공통 validator에서 사례 전용 제약을 제거하는 대신 `json-outbox-pattern-for-settlement`에는 성공·실패·재시도 edge가, Socket.io Before/After에는 overbroad·intended 관계가 계속 존재하는지 기존 품질 테스트에 명시한다.

**Rationale**: 공통 모델을 일반화해도 먼저 이전된 공개 자료의 의미와 회귀 보호는 약해지면 안 된다.

**Alternatives considered**: 기존 공통 제약을 유지하고 Feature 010만 validator 예외로 두는 안은 slug 기반 분기를 공통 계층에 넣게 되어 제외했다.

## D-007. 첫 인사이트는 차이의 배치 기준만 다룬다

**Decision**: `config-driven-architecture-react`의 제목과 본문을 승인 문안으로 교체하고, 모든 플랫폼이 같은 동작은 `core`, 값 차이는 `rsConfig`, 화면·로직 차이는 `platform`으로 흐르는 `data-flow`를 제공한다. 모든 edge는 분류 관계를 나타내는 `normal`을 사용한다.

**Rationale**: 인사이트의 질문은 Config 자체가 아니라 Config 이후에도 남는 코드 차이를 어디에 둘 것인가다. 프로젝트 연혁과 역할, Context와 결제 사례는 반복하지 않는다.

**Alternatives considered**: 1차 Config 도입기만 유지하는 안은 현재 교훈을 절반만 설명해 제외했다. 플랫폼 개수 임계값이나 신규 호텔 속도는 근거가 없어 사용하지 않는다.

## D-008. 두 번째 인사이트는 Props 전달 경로의 Before/After만 다룬다

**Decision**: `context-api-encapsulation-and-router-level-isolation`의 제목과 본문을 승인 문안으로 교체한다. Before는 상위 상태 소유자에서 중간 컴포넌트를 거쳐 단계 화면으로 이어진 간접 props 전달, After는 예약 라우터 Provider를 하위 단계가 Hook으로 직접 소비하는 구조를 비교한다.

**Rationale**: 직접 문제는 Props Drilling이며 실제 검토 대안은 Redux뿐이다. Provider Hell, Zustand, 접근 통제, 리렌더링 성능과 예약 순차성은 확인한 문제가 아니거나 구현이 보장하지 않는다.

**Alternatives considered**: 전역 상태 도구 비교표는 검토하지 않은 대안을 끌어들이므로 제외했다. 성능 차트도 측정값이 없어 사용하지 않는다.

## D-009. NICEPAY와 패리티 사건은 별도 인사이트로 만들지 않는다

**Decision**: NICEPAY는 `sessionStorage` 1시간 만료와 예약번호 기반 최종 조회까지 작업물 핵심 구현에 둔다. 마이그레이션 누락은 운영 배포 전 발견, 감사·수동 이식과 회고에 둔다. 두 주제 모두 별도 인사이트를 만들지 않는다.

**Rationale**: 사용자는 이번 연결 인사이트를 코드 경계와 Context 판단 두 건으로 승인했다. 추가 글은 화면 역할을 중복시키고 별도 인터뷰·승인을 요구한다.

**Alternatives considered**: NICEPAY 복귀와 패리티 검증을 각각 독립 글로 만드는 안은 명시적으로 제외됐다.

## D-010. 1104는 개발 기준선, 별도 production 포트는 최종 증거로 사용한다

**Decision**: 사용자가 실행한 1104 dev server는 현재 화면 캡처와 구현 중 빠른 확인에 재사용하되 임의로 종료·재시작하지 않는다. 최종 검증은 build 후 별도 빈 포트의 production server에서 세 공개 경로, 키보드 링크, 320/768/1024/1440px overflow와 시각 요소 겹침을 확인한다. production build 뒤 기존 listener가 사라지는 예외에서는 정확한 stale lock과 포트 상태를 확인하고 사용자 승인 뒤 새 PID로 복구한다.

**Rationale**: 1104는 사용자 소유 dev 상태와 `.next/dev` lock을 갖고 있어 재현 가능한 최종 증거로 삼기 어렵다. 반면 현재 화면 비교에는 이미 준비된 서버가 유용하다.

**Alternatives considered**: 1104에서 최종 E2E까지 수행하는 안은 dev HMR·클라이언트 로딩 상태 영향을 받으므로 제외했다. 두 번째 dev server 실행도 lock 충돌 때문에 사용하지 않는다.

## D-011. 콘텐츠·렌더링·브라우저 검증을 계층별로 분리한다

**Decision**: Vitest에서 구조화 상세 등록, 철회 주장 0건, 인사이트 metadata·visual 계약, 기존 하이패스 visual 회귀를 먼저 RED로 만든다. renderer 테스트는 두 일반화된 시각 의미와 visual 없는 글의 조건부 표시를 확인한다. Playwright는 세 route, 양방향 탐색, 키보드, 반응형 배치와 실제 겹침을 검증한다.

**Rationale**: 정적 문자열 테스트만으로 route와 CSS 배치를 증명할 수 없고, E2E만으로 승인 문구와 금지 주장을 안정적으로 전수 검사하기 어렵다.

**Alternatives considered**: E2E만 추가하는 안과 수동 확인만 남기는 안은 각각 사실 계약과 반복 가능한 회귀 검증이 부족해 제외했다.

## Visual Evidence Inventory

| 공개 기록 | 판정 | 종류 | 답하는 질문 | 비중복 근거 |
| --- | --- | --- | --- | --- |
| `hotel-reservation-platform` | provided | swimlane | 변경을 어디에 배치하고 플랫폼별 빌드·검증·배포하며 누락을 어떻게 되돌려 보완했는가? | 판단부터 검증·배포·복구까지 전체 전달 과정을 설명한다 |
| `config-driven-architecture-react` | provided | data-flow | 공통 동작, 값 차이, 화면·로직 차이는 각각 어디에 두는가? | 개발 연혁이 아니라 코드 배치 기준만 설명한다 |
| `context-api-encapsulation-and-router-level-isolation` | provided | before-after | Props Drilling 전후에 예약 상태의 소유 범위와 전달 경로가 어떻게 달라졌는가? | 플랫폼 코드 경계가 아니라 한 라우터 안의 상태 전달만 비교한다 |

세 시각 자료 모두 승인된 사실만 입력하며 고객 정보, 실제 예약·결제 식별자, 시크릿, 비공개 로그·소스와 내부 감사 수치는 포함하지 않는다.
