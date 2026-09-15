# Phase 1 Data Model: 포트폴리오 인사이트 편집 계약

**Date**: 2026-08-25

## 1. 타입 계약

### 1.1 InsightType

```ts
type InsightType = 'project-case' | 'technical-exploration';
```

공개 label은 각각 `프로젝트 사례형`, `기술 탐구형`이다. 저장 값과 사용자 표시를
분리해 추후 문구 수정이 데이터 migration을 일으키지 않게 한다.

### 1.2 VisualAssessment

```ts
type InsightVisualKind =
  | 'swimlane'
  | 'sequence'
  | 'erd'
  | 'architecture'
  | 'data-flow'
  | 'state-transition'
  | 'decision-matrix'
  | 'timeline';

type InsightVisualAssessment =
  | {
      decision: 'not-needed';
      rationale: string;
    }
  | {
      decision: 'recommended';
      kind: InsightVisualKind;
      rationale: string;
    }
  | {
      decision: 'provided';
      kind: InsightVisualKind;
      rationale: string;
      question: string;
      textAlternative: string;
      nonDuplicationReason: string;
    };
```

`recommended`는 구현 완료가 아니라 후속 후보 상태다. `provided`에서만 실제 시각
자료의 질문·대체 설명·중복 방지 이유를 강제한다.

### 1.3 InsightEditorialMetadata

```ts
type InsightEditorialMetadata =
  | {
      type: 'project-case';
      visualAssessment: InsightVisualAssessment;
    }
  | {
      type: 'technical-exploration';
      independentReason?: string;
      visualAssessment: InsightVisualAssessment;
    };
```

출처 slug는 기존 `SeedInsight.featureSlug`와 `SeedInsight.studySlug`를 그대로
사용한다. metadata에 같은 값을 복제하지 않는다.

### 1.4 SeedInsight / InsightDto 변경

```ts
type SeedInsight = {
  // 기존 필드 유지
  editorial?: InsightEditorialMetadata;
};

interface InsightDto {
  // 기존 필드 유지
  editorial?: InsightEditorialMetadata | null;
}
```

`insightToDto`는 값이 있을 때 복사하고, legacy insight에는 `editorial: null`을
반환한다. 기존 `featureSlug`·`studySlug` DTO가 누락값을 `null`로 정규화하는 방식과
같게 유지하며 `undefined`를 섞지 않는다.

## 2. 참조 및 상태 불변 조건

### 2.1 project-case

- `editorial.type === 'project-case'`
- `featureSlug`가 비어 있지 않고 `REAL_FEATURES`에 존재
- `studySlug` 없음
- `independentReason` 구조상 없음
- `visualAssessment`가 유효

하나라도 위반하면 완료된 project-case가 아니며 validator가 오류를 반환한다.

### 2.2 technical-exploration

- `editorial.type === 'technical-exploration'`
- `featureSlug` 없음
- 다음 중 정확히 하나:
  - `studySlug`가 비어 있지 않고 `REAL_STUDIES`에 존재
  - `studySlug`가 없고 trim 후 비어 있지 않은 `independentReason`
- `visualAssessment`가 유효

공부 기록과 독립 사유를 동시에 갖는 모호한 상태는 허용하지 않는다.

### 2.3 legacy

- `editorial` 없음
- 기존 `featureSlug`/`studySlug`, 본문, route를 그대로 사용
- 이번 feature에서 새 계약 실패로 처리하지 않음
- 첫 적용 집합 밖의 legacy를 자동 분류하거나 삭제하지 않음

## 3. Validator 계약

`validateInsightEditorial(insight, featureSlugs, studySlugs)`는 throw 대신
검사 가능한 오류 문자열 배열을 반환한다.

오류 범주:

| code | 조건 |
| --- | --- |
| `missing-feature-source` | project-case에 featureSlug 없음 |
| `unknown-feature-source` | featureSlug가 실제 작업물에 없음 |
| `conflicting-study-source` | project-case에 studySlug 존재 |
| `conflicting-feature-source` | technical-exploration에 featureSlug 존재 |
| `missing-study-or-independent-reason` | technical-exploration에 둘 다 없음 |
| `ambiguous-study-and-independent-reason` | technical-exploration에 둘 다 존재 |
| `unknown-study-source` | studySlug가 실제 공부 기록에 없음 |
| `empty-independent-reason` | 독립 사유가 공백뿐임 |
| `missing-visual-rationale` | 모든 판정에서 이유가 비어 있음 |
| `missing-visual-kind` | recommended/provided에 kind 없음 |
| `incomplete-provided-visual` | provided에 question/textAlternative/nonDuplicationReason 중 하나 누락 |

`validateMigratedInsightSet`은 다음을 추가 검사한다.

- slug 집합이 하네스 4개 + The Siena 1개 + 한마음 1개 + 블랙스톤 1개 + 공부 기록 1개의 정확한 8개와 일치
- 8개 모두 editorial metadata 보유
- project-case 7개, technical-exploration 1개
- 모든 참조가 존재
- 나머지 10개가 원래 route와 본문 hash/fixture를 유지

## 4. 첫 적용 fixture

| slug | type | source | visual decision | kind |
| --- | --- | --- | --- | --- |
| `codi-harness-dx-platform-design` | project-case | `codi-harness-dx-platform` | provided | timeline |
| `infisical-centralized-secrets-and-spof-defense` | project-case | `codi-harness-dx-platform` | provided | architecture |
| `cloudflare-tunnel-zero-trust-cicd-and-troubleshooting` | project-case | `codi-harness-dx-platform` | provided | data-flow |
| `jenkins-retirement-and-github-actions-migration` | project-case | `codi-harness-dx-platform` | provided | data-flow |
| `logging-decoupling-and-buffering-in-external-api-systems` | project-case | `the-siena-golf-reservation` | provided | architecture |
| `optimizing-770k-text-search-in-rdbms` | project-case | `hanmaum-science-institute` | provided | timeline |
| `spa-api-key-exposure-and-bff-architecture` | project-case | `blackstone-belleforet-resort` | recommended | architecture |
| `vercel-team-plan-bypass-and-serverless-cost-analysis` | technical-exploration | `ai-dx-harness-starter-kit` | not-needed | — |

모든 `rationale`은 해당 글에서 왜 시각 자료가 필요하거나 중복인지 구체적으로
설명한다. generic 문장 하나를 복사하지 않는다.

## 5. 사실 계약 fixture

자동 검사는 공개 문구 전체를 동일하게 만들지 않고, 잘못된 주장과 핵심 근거의
존재를 고정한다.

### 하네스

- AWS 값은 공개 가격 기반 월 `$151.84` 계산이며 실제 청구액이 아님
- 스토리지·네트워크·세금 제외
- 운영 실험과 기본 기능을 구분
- 성공률 100%, 장애 가능성 0 같은 단정 금지

### 한마음

- `약 1500ms → 약 400ms`
- 브라우저 네트워크 엔드투엔드 응답, 동일 검색어·전량 적재·반복 관찰
- DB 쿼리 단독 평균, `73% 향상`, 복원되지 않은 단락 수 금지

### 블랙스톤

- 신규 구축이며 무중단 전환 아님
- React 환경변수는 프로젝트 중간에 빌드 산출물 노출 가능성을 발견
- 작업물 상세의 결제 서사에서는 20초를 정상 평균으로 표현하지 않고, 당시 문제가
  있던 API 상태이며 현재는 수정되었다는 범위만 사용
- API Key/BFF 인사이트에는 위 결제 API timing을 가져오지 않음
- 총 결제 건수·비율·fallback 식별자·확인하지 않은 Request Header 경로 금지

### The Siena

- 프로젝트 전체는 정해진 구조 안에서 구현했고, 로그 저장 경로를 업무 DB에서 `syslog()`로 분리하는 방향과 구현은 직접 담당
- 수백만 건 로그 테이블에 접근할 때 DB GUI가 다운돼, 외부 PMS에 확인을 요청하기 전 당사 로그를 조회할 수 없었던 문제
- 변경 후 실제 예약 문제에서 시스템 로그의 요청·응답을 직접 확인한 사용자 관찰만 결과로 사용
- PHP-FPM 요청마다 logger와 배열이 초기화되므로 요청 간 버퍼링·20건/2초 배치 성과·파일 I/O 95% 감소를 주장하지 않음
- 저장 경계의 전후 architecture는 제공하되, 작업물 전체 시각 자료와 중복하지 않음

### 공부/Vercel

- plan/seat/credit 값은 기준 시점과 공식 URL을 함께 기록
- 공개 가격 계산과 실제 bill을 구분
- 가정, 산식, 제외 범위 없는 고정 비용 총액 금지
- 공부 기록과 연결 인사이트가 같은 가격 전제를 사용

## 6. 공개 표현 모델

- 목록: `editorial`이 있는 글만 type label 출력
- 상세: type label + 기존 tags + 기존 관련 기록 sidebar
- project-case label은 작업물 출처 link와 의미상 일치
- technical-exploration label은 공부 기록 link 또는 독립 유지 설명과 의미상 일치
- legacy: 빈 label·"미분류"·빈 source card를 추가하지 않음
- visual assessment는 이번 feature의 편집 metadata이며 공개 badge로 노출하지 않음

## 7. 상태 전이

```text
legacy
  -> evidence reviewed
  -> type/source decided
  -> meaning + fact contract reviewed
  -> visual necessity assessed
  -> editorial metadata complete
  -> public navigation verified
```

어느 단계에서든 근거가 부족하면 완료 상태로 진행하지 않는다. project-case는 독립
예외로 우회할 수 없다. technical-exploration은 연결 근거가 없는 기존 글에 한해
독립 사유를 남길 수 있다. 통합·비공개는 사용자 승인 전 자동 전이하지 않는다.
