# Codi Harness 포트폴리오 상세 개선 설계

- 작성일: 2026-08-20
- 상태: 사용자 스윔레인 재설계 승인 완료
- 우선 대상: `codi-harness-dx-platform`
- 후속 범위: 나머지 7개 작업물을 동일한 인터뷰·완결 방식으로 순차 이전
- 입력 자료: `docs/portfolio-interviews/2026-08-20-portfolio-content-demo-swimlane-handoff.md`
- 인터뷰 원문: `docs/portfolio-interviews/2026-08-20-codi-harness-v2.md`

> 이 문서는 Superpowers 브레인스토밍 결과다. 구현 계획과 진행 상태의 정본은
> 이후 `speckit-specify`로 생성할 `specs/<NNN-feature>/` 디렉터리다.

### 2026-08-20 스윔레인 재설계

초기 구현의 lane별 단계 카드와 별도 `연결과 분기` 목록은 전체 프로세스가 어떻게
이어지는지 전달하지 못했다. 참고 이미지 검토와 사용자 승인을 거쳐 책임 주체를 세로
lane으로 나누고, 위에서 아래로 이어지는 화살표·의사결정·되돌림을 하나의 연결형 SVG로
표현하는 방향으로 재설계했다. 세부 단계는 두 흐름 모두 핵심 여섯 단계로 압축한다.

## 1. 목표

하네스 작업물 상세 페이지를 문제, 역할, 판단, 결과 중심으로 압축하고,
실제 데모를 제공할 수 없는 부분은 책임 주체 사이의 이동과 되돌림을 한눈에 추적할 수
있는 두 개의 접근 가능한 교차 기능 스윔레인과 검증 근거로 설명한다. 상세 구현은 네
개의 독립 인사이트로 분리한다.

이번 설계는 다음을 함께 달성해야 한다.

1. 하네스 작업물의 현재 도구와 역사적 도구를 시점별로 구분한다.
2. 정량 성과의 측정값, 사용자 보고값, 추정값을 구분한다.
3. 데모가 없어도 개발 운영과 배포 운영의 책임·정상·실패·복구 흐름을 이해할 수 있게 한다.
4. 다음 작업물이 같은 타입과 페이지 템플릿을 재사용할 수 있게 한다.
5. 기존 7개 작업물은 인터뷰 전까지 현재 콘텐츠를 보존한다.

## 2. 범위와 제외 사항

### 포함

- 하네스 작업물 본문 압축과 공통 정보 구조 적용
- 하네스 핵심 결과 요약 추가
- 개발 운영 스윔레인과 배포 운영 스윔레인 추가
- 공통 정책과 Claude Code/Codex 집행 레이어의 소형 구조도 추가
- 데모·스윔레인·지표를 위한 타입 안전한 데이터 계약 추가
- 상세 페이지가 `overview`를 항상 상단에 표시하도록 수정
- `SeedFeature.category`와 `SeedFeature.status` 타입 안전성 개선
- 기존 하네스 연관 인사이트 네 개의 사실·수치 정합성 수정
- 하네스 상세 주제 인사이트 네 개 신규 작성
- 콘텐츠 계약, 타입, 렌더링, 반응형, 접근성 검증

### 제외

- 실제 하네스 CLI 샌드박스 또는 가이드형 시뮬레이터 제작
- 하네스 작업물의 외부 데모 CTA
- 사내 하네스 소스코드 공개
- 나머지 7개 작업물의 인터뷰 없는 구조화 데이터 변환
- 실제 AWS 과거 청구액 복원
- 아직 인터뷰에서 공개 제외로 결정된 개발자 `role` 기능의 성과 서술
- PR 생성, 커밋 또는 배포

## 3. 확정된 사실과 표현 원칙

### 운영 범위

- 하네스 적용 프로젝트: 11개
- 실제 운영 프로젝트: 8개
- 실제 사용 팀원: 3명
- `codi-rs-module` 배포 대상: 5개 호텔
- 기존 Jenkins 순차 배포: 전체 약 15분
- GitHub Actions 전환 후: 전체 약 3분
- 전환 후 동일 유형의 호텔별 환경변수 혼입: 현재까지 미발생

15분과 3분은 GitHub Actions 실행 화면을 기준으로 한 측정값으로 표시한다.
환경변수 혼입은 Jenkins 자체 오류로 단정하지 않고, 배포 대상과 브랜치별
환경변수 책임 경계를 분리한 뒤 동일 유형의 문제가 재발하지 않았다고 표현한다.

### Jenkins 서버 비용

기존 서버는 다음 사양으로 확정한다.

- 운영체제: Rocky Linux
- 수량: 2대
- 각 사양: 2 vCPU, 8 GiB RAM
- 현재 AWS 대응 인스턴스: 서울 리전 `t3.large` Linux On-Demand
- 계산: `$0.104 × 730시간 × 2대 = 월 $151.84`

이 값은 2026-08-20 AWS 공개 가격 기준의 현재 컴퓨팅 추정치다. EBS,
스냅샷, 데이터 전송, 탄력적 IP, 세금과 환율은 포함하지 않는다. 과거 실제
청구액 또는 정확한 원화 절감액으로 표현하지 않는다.

참고:

- [AWS EC2 On-Demand 요금](https://aws.amazon.com/ec2/pricing/on-demand/)
- [AWS Price List API 안내](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/price-changes.html)

### 현재 도구와 역사적 도구

2026-08-20 현재 핵심 도구는 다음과 같다.

- Spec Kit: `spec.md`, `plan.md`, `tasks.md`, 검증 기록과 세션 연속성
- Superpowers: 브레인스토밍, TDD, 디버깅, 리뷰·검증 규율
- Playwright MCP: 브라우저 QA
- Codi 프로젝트 스킬: 실제 스택과 작업 영역에 맞는 실행 지침
- GitHub Actions: 검증과 배포 실행 계층
- Infisical: 환경별 시크릿 원본과 주입 경계

GSD와 GStack은 현재 `techStack`에 넣지 않고 발전 타임라인에서만 다룬다.

- GSD → Spec Kit: 문서 템플릿과 산출물 구조를 프로젝트에 맞게 통제하고,
  clarify와 사용자 검토 게이트를 통해 작성자의 의견을 더 많이 반영하기 위해
  전환했다. 파일럿은 네 개 기준 모두 동등 이상이었고 세션 재개 비용은 개선됐다.
- GStack → Playwright MCP: 2026-06-01부터 2026-07-06까지 약 5주간 사용량을
  측정한 결과 phase gate 역할은 사용되지 않았고 browse/connect-chrome 중심으로만
  사용됐다. 필요한 브라우저 QA 역할만 Playwright MCP로 대체했다.

## 4. 상세 페이지 정보 구조

하네스와 이후 모든 작업물은 가능한 범위에서 다음 순서를 공유한다.

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

정보가 없다는 이유로 데모, ERD, API 계약, 운영 지표를 만들지 않는다. 존재하는
자료만 조건부로 렌더링하고 빈 블록이나 준비 중 UI를 노출하지 않는다.

### 상단 핵심 결과

하네스 작업물 상단에는 다음을 짧게 노출한다.

- 11개 프로젝트 적용, 8개 실제 운영
- 팀원 3명 사용
- `t3.large`급 Jenkins 서버 2대 제거
- 2026-08-20 AWS 서울 리전 기준 월 `$151.84` 컴퓨팅 비용 상당
- 5개 호텔 전체 배포 약 15분에서 약 3분으로 단축
- 전환 후 동일 유형의 호텔별 환경변수 혼입 미발생

각 항목은 `measured`, `reported`, `estimated` 중 하나의 근거 종류와 기준 시점,
근거, 해석 범위를 함께 가진다. 공개 UI에서 일반적인 `제한`이라는 표현은 사용하지
않고 근거 종류에 따라 다음 문구를 사용한다.

- `estimated`: 산정 범위
- `measured`: 측정 범위
- `reported`: 관찰 범위

## 5. 데이터 계약

### 파일 경계

```text
apps/front/src/data/portfolio/
├── features.ts
├── feature-details/
│   ├── index.ts
│   └── codi-harness-dx-platform.ts
└── types/
    ├── feature.dto.ts
    └── feature-detail.dto.ts
```

- `features.ts`: 목록과 상단 공통 메타데이터
- `feature-details/<slug>.ts`: 인터뷰가 끝난 작업물의 구조화된 상세 데이터
- `feature-details/index.ts`: slug와 상세 데이터 연결
- `feature-detail.dto.ts`: 상세, 데모, 지표, 스윔레인 계약

### 핵심 타입

```ts
type FeatureMetricKind = 'measured' | 'reported' | 'estimated';

type FeatureMetric = {
  id: string;
  label: string;
  value: string;
  kind: FeatureMetricKind;
  asOf: string;
  evidence: string;
  caveat?: string;
};

type FeatureDemo = {
  url: string;
  label: string;
  kind: 'production' | 'portfolio';
  note?: string;
  status: 'available' | 'unavailable';
};

type SwimlaneLane = {
  id: string;
  label: string;
};

type SwimlaneStep = {
  id: string;
  laneId: string;
  row: number;
  shape: 'start' | 'process' | 'decision' | 'end' | 'stop';
  label: string;
  description: string;
};

type SwimlanePoint = {
  column: number;
  row: number;
};

type SwimlaneEdge = {
  id: string;
  from: string;
  to: string;
  kind: 'normal' | 'exception';
  outcome: 'continue' | 'recover' | 'stop';
  fromAnchor: 'top' | 'right' | 'bottom' | 'left';
  toAnchor: 'top' | 'right' | 'bottom' | 'left';
  label?: string;
  labelAt?: SwimlanePoint;
  waypoints?: SwimlanePoint[];
};

type SwimlaneException = {
  id: string;
  trigger: string;
  response: string;
  edgeIds: string[];
};

type FeatureSwimlane = {
  id: string;
  title: string;
  purpose: string;
  lanes: SwimlaneLane[];
  steps: SwimlaneStep[];
  edges: SwimlaneEdge[];
  summary: string;
  exceptions: SwimlaneException[];
};

type FeatureDetailDto = {
  role: string;
  highlights: FeatureMetric[];
  problem: string;
  constraints: string;
  alternatives: string;
  swimlanes?: FeatureSwimlane[];
  implementation: string;
  outcomes: string;
  retrospective: string;
  demo?: FeatureDemo;
};
```

`row`와 `shape`는 node의 의미와 세로 진행 순서를 정한다. `laneId`는 가로 위치를
정하고, 복잡한 되돌림 선만 lane/row grid 좌표인 `waypoints`를 선택적으로 사용한다.
정상 진행은 `normal`, 중단과 되돌림은 `exception`으로 단순화한다. 공개 대응 문장은
`exceptions`에서 관리해 내부 edge와 outcome 용어를 그대로 노출하지 않는다.

### 단계적 이전

하네스부터 `FeatureDetailDto`를 사용한다. 아직 인터뷰하지 않은 7개 작업물은 기존
Markdown `content`를 그대로 표시한다. 상세 페이지 템플릿은 하나이며 이전 기간에만
데이터 어댑터가 구조화 상세 또는 기존 Markdown을 선택한다. 모든 작업물 이전이 끝나면
기존 장문 `content` 필드를 제거한다.

`SeedFeature.category`와 `SeedFeature.status`는 각각 `FeatureCategory`,
`FeatureStatus`를 직접 사용한다. 변환 단계의 강제 캐스팅을 제거하고 실제 필요한 상태를
공식 union으로 정규화한다.

## 6. 컴포넌트 구조

```text
ProjectSummary
→ ProjectHighlights
→ ProjectNarrative
→ ProjectSwimlaneSvg
→ ProjectOutcomes
→ RelatedInsights
```

- `ProjectSummary`: `overview`와 기간·팀·상태를 항상 상단에 표시
- `ProjectHighlights`: 지표 값과 근거 종류·기준 시점·산정/측정/관찰 범위 표시
- `ProjectNarrative`: 문제, 제약, 대안, 핵심 구현, 회고 렌더링
- `ProjectSwimlaneSvg`: lane, node, 의사결정 도형과 연결 화살표를 공통 SVG로 렌더링
- `ProjectOutcomes`: 결과와 검증 근거 분리
- `RelatedInsights`: 본문 직접 링크와 featureSlug 기반 관련 카드 제공

`content`가 있으면 `overview`를 숨기는 현재 분기를 제거한다. 데모가 없거나 검증되지
않았으면 CTA를 렌더링하지 않는다.

## 7. 연결형 스윔레인 설계

### 공통 표현 규칙

- 책임 주체는 세로 lane으로 구분한다.
- 시간은 위에서 아래로 흐른다.
- 사각형은 작업, 마름모는 승인·통과 여부, 둥근 도형은 시작·완료를 뜻한다.
- 정상 진행은 진한 실선 화살표, 중단·되돌림은 붉은 점선 화살표로 표시한다.
- 색상만으로 의미를 구분하지 않고 도형, 선 스타일과 문구를 함께 사용한다.
- 모든 의사결정의 나가는 선은 승인·통과·일치·실패 같은 결과 문구를 표시한다.
- 기존 `연결과 분기` 목록은 제거한다.
- 기존 `순서형 대체 설명`은 `전체 흐름 설명`으로 바꾼다.
- 다이어그램 아래에는 정상 단계를 반복하지 않고 `예외 상황과 대응`만 자연어로
  표시한다.

### 스윔레인 1 — 설계·개발·검증

목적: 사용자 요구가 승인된 구현과 검증 기록으로 바뀌는 과정, 그리고 가드가 멈추는
지점을 보여준다.

확정 lane:

- 사용자
- AI 에이전트
- 계획·구현
- 리뷰·검증

정상 흐름:

1. 요청·맥락 전달
2. 문제 정의
3. 명세·계획
4. 승인
5. 테스트·구현
6. 리뷰·검증

`리뷰·검증`은 성공과 실패를 판정하는 마름모이며, 통과선 뒤에 핵심 여섯 단계와 별도인
보조 `완료` 종점을 둔다. 실패선은 `테스트·구현`으로 돌아간다.

예외 상황과 대응:

- 요구가 모호하면 사용자에게 추가 질문한 뒤 문제 정의를 다시 진행한다.
- 계획이 승인되지 않으면 명세와 계획을 보강한 뒤 다시 승인을 요청한다.
- 검증에 실패하면 테스트·구현 단계로 돌아가 수정한 뒤 다시 검증한다.

개발자 `role` 기능은 인터뷰에서 공개 제외로 정했으므로 성과로 표시하지 않는다.
대신 실제 검증된 project profile과 경로 guard를 사용한다.

### 스윔레인 2 — CI/CD·시크릿·배포

목적: 변경이 품질 검증과 환경 주입을 거쳐 허용된 배포 대상으로 전달되는 과정을
보여준다.

확정 lane:

- GitHub 저장소
- GitHub Actions
- Infisical
- 배포 대상

정상 흐름:

1. 변경 감지
2. 품질 검사
3. 환경·대상 결정
4. 시크릿 조회
5. 병렬 배포
6. 결과 확인

예외 상황과 대응:

- 품질 검사에 실패하면 시크릿 조회와 배포를 시작하지 않는다.
- 환경이나 시크릿이 일치하지 않으면 배포를 중단하고 설정을 수정한 뒤 workflow를
  처음부터 다시 실행한다.

`codi-rs-module`의 5개 호텔 변경 매트릭스는 일반 하네스 기본 기능과 구분해 실제
적용 사례 콜아웃으로 표시한다.

### 규칙 계층 구조

세 번째 대형 다이어그램은 만들지 않는다. 핵심 설계 본문 안에 다음 소형 구조도를
배치한다.

```text
공통 정책 (.harness/policies)
  ├─ AGENTS.md → Codex rules · hooks · preflight
  └─ CLAUDE.md → Claude rules · settings · hooks
```

두 런타임은 정책 의미를 공유하고 집행 방식 차이는 어댑터와 별도 회귀 테스트로
관리한다.

## 8. 접근성과 오류 처리

- 데스크톱은 lane, node, 연결선과 의사결정 도형의 공간 관계를 보여준다.
- 모바일은 다이어그램 컨테이너 내부만 가로 스크롤한다.
- 페이지 전체에는 가로 overflow가 없어야 한다.
- 각 다이어그램은 `<figure>`와 제목·설명으로 묶고 SVG의 접근 가능한 이름과 설명을
  제공한다.
- 다이어그램 아래에 `전체 흐름 설명`과 `예외 상황과 대응`을 일반 문장으로 제공한다.
- 정상·실패·복구는 색상, 선 스타일, 도형과 텍스트를 함께 사용한다.
- 정적 node를 불필요한 tab stop으로 만들지 않는다.
- 이름 있는 스크롤 region만 키보드 초점을 받고 화살표 키로 탐색할 수 있어야 한다.
- 존재하지 않는 lane·step 참조, 중복 ID·위치, 빈 흐름 설명과 예외 대응은 데이터 계약
  테스트에서 실패시킨다.
- 실패 edge는 복구 또는 중단 결과를 가져야 한다.
- 시작·완료 node와 연결된 정상 경로가 없으면 게시를 차단한다.
- `demo`가 없으면 CTA를 렌더링하지 않는다.
- 데모는 검증된 URL과 `available` 상태가 함께 있을 때만 노출한다.
- 외부 링크는 새 탭 안내와 `noopener noreferrer`를 사용한다.

## 9. 인사이트 분리

### 신규 인사이트 네 개

1. `harness-lock-and-project-ownership-boundary`
   - `harness.lock` 패키징
   - shared/project-owned 경계
   - 공통 업데이트와 프로젝트 확장 분리
2. `harness-cli-and-doctor-productization`
   - `./harness` CLI
   - 초기화, 검사, 복구 가능한 진단 흐름
3. `claude-codex-policy-parity-and-regression-testing`
   - 공통 정책과 런타임별 집행 레이어
   - 실제 회귀 사례와 transcript replay
4. `multi-session-testbed-and-context-lifecycle`
   - planner–shipper–worker 실험
   - 특정 PHP 마이그레이션 프로젝트의 격리
   - clear/compact 시점이라는 잔여 과제

### 기존 인사이트 정합성 수정

- `codi-harness-dx-platform-design`: 전체 발전 과정의 개요로 압축
- `jenkins-retirement-and-github-actions-migration`: Jenkins 비용과 배포 수치 수정
- `infisical-centralized-secrets-and-spof-defense`: 현재 확인된 책임 경계만 유지
- `cloudflare-tunnel-zero-trust-cicd-and-troubleshooting`: 하네스 본문과 중복 제거

기존 `월 20만 원`, `서버 2대·대당 10만 원`, `.planning/` 현재 사용,
GSD/GStack 현재 핵심 도구 표현은 제거한다.

## 10. 테스트 전략

### 데이터 계약 테스트

- `FeatureDetailDto` 필수 섹션 존재
- 지표의 종류, 기준 시점, 근거와 해석 범위 검증
- lane·step·edge 참조 무결성
- 중복 ID와 node 위치 차단
- 정상·실패·복구 구분
- 시작·완료와 연결된 정상 경로
- 전체 흐름 설명과 예외 대응 존재
- 실패 edge의 복구 또는 중단 결과 존재
- 검증되지 않은 데모 CTA 차단
- category와 status union 밖의 값 차단
- 하네스 `demo` 부재
- 작업물과 관련 인사이트의 비용·도구 시점 충돌 차단

### 렌더링 테스트

- `overview`가 `content`와 관계없이 상단에 표시
- 지표 근거 종류와 기준 시점 표시
- 하네스 외부 데모 CTA 미표시
- 두 연결형 SVG 스윔레인의 lane·node·의사결정·연결선 표시
- 핵심 여섯 단계의 순서 표시
- 실패·복구가 색상 이외의 선 스타일·도형·문구로 구분
- `연결과 분기`, `순서형 대체 설명`, `제한:` 미표시
- `전체 흐름 설명`, `예외 상황과 대응`, 근거별 범위 label 표시
- 관련 인사이트 링크 정상 연결

### 검증 순서

1. 콘텐츠·데이터 계약 테스트
2. TypeScript 타입 검사
3. 대상 ESLint·Prettier
4. Production build
5. Playwright E2E
6. 320, 768, 1024, 1440px 브라우저 QA
7. 키보드와 스크린 리더용 구조 확인
8. 페이지 전체 overflow와 다이어그램 내부 스크롤 확인
9. 인터뷰·최신 하네스 소스·작업물·인사이트 사실 일치 검토
10. `speckit-converge`와 `mise run feature:status:sync`

## 11. 완료 조건

- 하네스 본문이 문제·역할·판단·결과 중심으로 압축된다.
- 세부 구현은 네 개 인사이트로 분리되고 본문에서 직접 연결된다.
- 현재 도구와 역사적 도구의 시점이 구분된다.
- AWS 비용은 현재 추정치, 배포 시간은 측정치로 구분된다.
- 하네스에 데모 CTA가 없다.
- 두 스윔레인이 책임 주체 사이의 정상 진행과 중요한 중단·복귀 경로를 연결된
  화살표로 제공한다.
- 공개 화면에 내부 데이터 용어인 `연결과 분기`, `순서형 대체 설명`, 일반적인
  `제한:` label이 남지 않는다.
- `overview`가 상세 상단에 항상 보인다.
- category와 status 강제 캐스팅이 제거된다.
- 콘텐츠 테스트, 타입 검사, lint, build와 E2E가 통과한다.
- 320, 768, 1024, 1440px에서 페이지 전체 가로 overflow가 없다.
- 다음 작업물이 같은 상세 데이터 계약과 페이지 템플릿을 재사용할 수 있다.

## 12. 후속 순서

1. 승인된 스윔레인 재설계를 별도 Spec Kit 후속 기능의 입력으로 사용한다.
2. clarify 필요 여부를 판정하고 사용자 handoff에서 멈춘다.
3. 사용자가 `codi-auto-loop`를 명시적으로 시작한다.
4. plan, tasks, analyze 후 tasks 검토 게이트를 통과한다.
5. TDD로 위치 데이터 계약과 공통 SVG renderer를 구현하고 converge까지 완료한다.
6. 다음 작업물을 하나 선택해 별도 인터뷰로 콘텐츠·데모 공개 범위를 확정한다.
7. 동일한 데이터 계약으로 한 작업물씩 완결한다.
