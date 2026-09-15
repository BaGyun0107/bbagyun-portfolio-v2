# Phase 0 Research: 포트폴리오 콘텐츠 작성 규칙과 인사이트 계약

**Date**: 2026-08-25

Technical Context에 `NEEDS CLARIFICATION` 항목은 없다. 사용자와 콘텐츠 유형,
출처 원칙, 점진 적용, 시각 자료 판정 방식, 규칙의 skill화까지 합의했고 설계 문서가
승인됐다. 아래 결정은 저장소의 현재 데이터·렌더러·harness 소유권 규칙과 공식
외부 자료를 대조해 확정했다.

## D-001. always-on rule과 project-local skill을 함께 사용한다

**Decision**:

- `.harness/rules-local/portfolio-editorial-standard.md`: 적용 trigger와 소수의
  불변 조건만 둔다.
- `.harness/skills-local/portfolio-content-authoring/`: 실제 작성·검토 절차,
  유형별 의미 계약, 근거·연결, 시각 증거 기준과 eval을 둔다.
- `./harness skills-link`로 Claude Code와 Codex 양쪽 discovery surface를 만든다.

**Rationale**: 일반 문서만으로는 새 세션에서 자동 발견되지 않고, 모든 세부를
always-on rule에 넣으면 매 요청마다 context를 소비한다. rule이 언제 skill을
사용할지 정하고 skill이 필요할 때만 상세 절차를 제공하는 구성이 목적과 비용을
함께 만족한다. downstream 소유 규칙에 따라 shared `.harness/skills/`가 아니라
project-owned `.harness/skills-local/`을 사용한다.

**Alternatives considered**:

- `docs/portfolio-content-standard.md`만 유지: 기각. 참고 여부가 agent 재량에 남는다.
- `.codex/rules`와 Claude hook을 각각 작성: 기각. 이 규칙은 명령 차단이 아니라
  편집 판단이며, 런타임별 복제보다 하나의 skill 정본이 적합하다.
- shared `.harness/skills/` 수정: 기각. downstream 프로젝트의 쓰기 금지 영역이다.

## D-002. skill은 6개 paired evaluation으로 TDD한다

**Decision**: skill을 작성하기 전 아래 6개 prompt에 대해 without-skill baseline을
남기고, 같은 prompt를 skill 적용 상태에서 다시 실행해 차이를 기록한다.

1. 작업물 사실 정정 후 연결 인사이트를 누락하는 상황
2. 모든 글에 같은 Markdown 제목을 강제하는 상황
3. 공부 기록과 기술 탐구형 인사이트가 장문을 중복하는 상황
4. 출처가 없는 독립 글을 이유 없이 유지하는 상황
5. 단순한 글에 장식용 ERD·스윔레인을 추가하는 상황
6. 작업물과 인사이트의 역할·수치·시점이 충돌하는 상황

각 eval은 유형, 출처, 의미 계약, 시각 자료 판단, 교차 검증, 근거 보존을
expectation으로 가진다. 실행 산출물은 `mktemp -d`로 만든 isolated workspace에
생성하고, 최종 요약과 판정만 feature verification 기록에 남긴다.

**Rationale**: 문서가 좋아 보이는지는 행동 개선의 증거가 아니다. 동일한 입력의
baseline과 적용 결과를 비교해야 누락을 실제로 줄였는지 확인할 수 있다.

**Alternatives considered**:

- SKILL.md 문장만 리뷰: 기각. trigger와 실제 적용 결과를 검증하지 못한다.
- 기존 콘텐츠를 eval fixture로 사용: 기각. 콘텐츠 회귀와 agent 행동 평가는 다른
  대상이다. 행동 평가는 6개 실패 유형, 공개 데이터 검증은 현재 8개 fixture로 분리한다.
  최초 7개 fixture는 2026-08-26 The Siena 승인 전의 역사적 실행 증거다.

## D-003. 인사이트 metadata는 점진형 discriminated union으로 추가한다

**Decision**: `SeedInsight`와 `InsightDto`에 선택적 `editorial` 필드를 추가한다.
필드가 없으면 legacy 공개 글로 그대로 렌더링하고, 존재하면 다음 둘 중 하나로
완전해야 한다.

- `project-case`: 유효한 `featureSlug` 필수, `studySlug`와 독립 유지 이유 금지
- `technical-exploration`: 유효한 `studySlug` 또는 비어 있지 않은
  `independentReason` 중 하나가 필요, `featureSlug` 금지

기존 `featureSlug`와 `studySlug`는 현재 route filtering과 양방향 링크가 사용하므로
중복 이전하지 않는다. editorial union은 유형과 예외 사유, 시각 판정만 추가하고
출처 slug는 기존 최상위 필드를 참조한다.

**Rationale**: 18개 전체에 즉시 필수 필드를 추가하면 현재 적용 범위 밖 10개의
의미와 출처를 추측하게 된다. 선택 필드는 점진 이전을 허용하고, validator가
"존재하면 완전함"을 강제해 부분적 metadata를 막는다.

**Alternatives considered**:

- 모든 18개에 즉시 필수화: 기각. 점진 완성과 사실 보존 원칙을 위반한다.
- `type?: string`만 추가: 기각. 잘못된 출처 조합과 이유 없는 독립 글을 막지 못한다.
- 별도 registry에 slug별 metadata 저장: 기각. 콘텐츠와 계약이 분리돼 수정 누락이
  쉬워진다.

## D-004. 초기 7개 집합은 승인된 The Siena 후속으로 현재 8개가 됐다

**Initial decision history (2026-08-25)**: 아래 7개는 최초 Spec Kit 설계와 RED
evidence의 기준 집합이었다. 당시 6:1 유형 분포와 11개 preservation fixture는 이
초기 상태를 재현하는 역사적 증거로 보존한다.

| 유형 | 출처 | 인사이트 slug |
| --- | --- | --- |
| 프로젝트 사례형 | `codi-harness-dx-platform` | `codi-harness-dx-platform-design` |
| 프로젝트 사례형 | `codi-harness-dx-platform` | `infisical-centralized-secrets-and-spof-defense` |
| 프로젝트 사례형 | `codi-harness-dx-platform` | `cloudflare-tunnel-zero-trust-cicd-and-troubleshooting` |
| 프로젝트 사례형 | `codi-harness-dx-platform` | `jenkins-retirement-and-github-actions-migration` |
| 프로젝트 사례형 | `hanmaum-science-institute` | `optimizing-770k-text-search-in-rdbms` |
| 프로젝트 사례형 | `blackstone-belleforet-resort` | `spa-api-key-exposure-and-bff-architecture` |
| 기술 탐구형 | `ai-dx-harness-starter-kit` | `vercel-team-plan-bypass-and-serverless-cost-analysis` |

**Initial rationale**: 완료된 작업물 3개의 연결 글은 6개다. 이것만 적용하면 기술 탐구형
계약이 공개 데이터에서 검증되지 않는다. 이미 존재하는 공부 기록 연결 글 1개를
포함하면 두 유형과 양방향 링크를 모두 추측 없이 검증할 수 있다.

**Approved follow-up evolution (2026-08-26)**: `the-siena-golf-reservation`의
인터뷰와 제목·한 줄 소개·본문·visual·연결 주장에 대한 명시적 콘텐츠 승인을 근거로
`logging-decoupling-and-buffering-in-external-api-systems`를 `project-case`로 편입했다.
이는 초기 rationale을 무효화하거나 공개 route를 바꾸는 변경이 아니라, 별도 승인된
후속이 현재 Feature 007 적용 범위를 확장한 것이다.

**Current decision**: 정확히 8개(프로젝트 사례형 7개, 기술 탐구형 1개)를 적용하고,
나머지 10개 공개 글의 본문·기존 출처·route를 보존한다. 현재 집합은 초기 표의 7개에
다음을 더한 것이다.

| 유형 | 출처 | 인사이트 slug |
| --- | --- | --- |
| 프로젝트 사례형 | `the-siena-golf-reservation` | `logging-decoupling-and-buffering-in-external-api-systems` |

## D-005. 시각 자료는 생성 의무가 아니라 판정 의무다

**Decision**: 현재 8개 대상 모두 `visualAssessment`를 갖는다. 판정 값은
`not-needed`, `recommended`, `provided`다. `recommended`는 후속 시각 자료 후보이며
이번 feature에서 그림 생성을 의미하지 않는다. `provided`만 질문, text alternative,
연결 작업물과 중복하지 않는 이유가 필수다.

초기 판정은 다음과 같다.

| 인사이트 | 판정 | 후보/이유 |
| --- | --- | --- |
| 하네스 발전 서사 | `recommended` | 여러 단계의 시간 변화가 핵심이므로 timeline 후보 |
| Infisical | `recommended` | 시크릿 소유권과 배포 경계가 핵심이므로 architecture/data-flow 후보 |
| Cloudflare | `recommended` | 요청·배포·복구 주체가 셋 이상이므로 architecture/data-flow 후보 |
| Jenkins 전환 | `not-needed` | 전환 판단과 비용 근거는 본문·표로 충분 |
| The Siena 로그 분리 | `provided` | 업무 DB와 `syslog` 사이에서 바뀐 로그 저장 경계를 전후 architecture로 제공 |
| 한마음 검색 | `provided` | 작업물의 요청 흐름과 달리 2023년 LIKE, 2025년 FULLTEXT, 2026년 토큰별 검증으로 이어진 시간 변화를 timeline으로 제공 |
| 블랙스톤 BFF | `recommended` | 브라우저·BFF·외부 API 신뢰 경계가 핵심이므로 architecture/data-flow 후보 |
| Vercel 비용 분석 | `not-needed` | 기존 비교표가 대안을 직접 표현하므로 별도 다이어그램은 중복 |

**Rationale**: 필요성 판정은 장식용 그림을 막으면서 복잡한 관계를 발견하게 한다.
근거가 부족한 상태에서 `recommended`를 `provided`로 바꾸지 않는다.

## D-006. public UI는 이전된 글에만 유형과 출처를 표시한다

**Decision**: 인사이트 목록과 상세 상단에 editorial metadata가 있는 글만 유형
label을 표시한다. 상세의 기존 "연관된 기록" sidebar를 유지하고, 출처 이름과
작업물/공부 기록 구분을 함께 보여준다. legacy 10개에는 빈 badge나 "미분류"를
표시하지 않는다.

프로젝트 상세과 공부 상세의 기존 `featureSlug`/`studySlug` filtering은 유지한다.
새로운 링크 구조를 만들지 않고 contract test와 E2E로 양방향 탐색을 고정한다.

**Rationale**: 독자는 이전 완료 글의 목적과 출처를 빠르게 이해할 수 있고,
점진 적용 중인 legacy 글에는 확정하지 않은 분류를 노출하지 않는다.

## D-007. 사실 정정은 출처별로 제한하고 연결 쌍을 함께 검사한다

**Decision**:

- 하네스 4개: feature 004의 인터뷰·spec·verification을 정본으로 사용한다.
- 한마음 1개: feature 005 근거에 맞춰 `약 1500ms → 약 400ms`를 브라우저
  네트워크 엔드투엔드 응답으로 표현하고, DB 쿼리 단독 평균이나 `73%` 비율로
  확장하지 않는다.
- 블랙스톤 1개: feature 006 근거에 맞춰 신규 구축과 React 환경변수의 빌드 산출물
  포함 사실을 유지한다. 당시 문제가 있던 API와 현재 수정 상태는 작업물 상세의 결제
  서사에만 남기고 API Key/BFF 인사이트에는 가져오지 않는다. 확인하지 않은 Request
  Header 노출 경로나 결제 fallback 식별자를 만들지 않는다.
- 공부/Vercel 1개: 기존 공부 기록과 인사이트의 가격·비용 문장을 함께 점검한다.
  2026-08 현재 공식 문서가 확인하는 것은 Pro 월 $20, 포함된 developer seat 1개,
  추가 developer seat 월 $20, viewer 무료, 월 $20 usage credit다. 실제 bill이 아닌
  계산은 가정·산식·제외 범위와 기준 시점을 표시한다.

**Official references**:

- [Vercel Pro plan](https://vercel.com/docs/plans/pro-plan) — updated 2026-02-03
- [Vercel pricing documentation](https://vercel.com/docs/pricing) — updated 2025-11-13
- [Vercel pricing](https://vercel.com/pricing) — current plan summary
- [Vercel limits and pricing](https://vercel.com/docs/limits) — updated 2026-02-03

**Rationale**: 작업물과 인사이트가 같은 사실을 다르게 말하면 링크 구조 자체가
신뢰를 훼손한다. 변경 가능한 가격은 현재 공식 근거와 과거 계산을 섞지 않고,
재현 불가능한 과거 고정 총액은 유지하지 않는다.

## D-008. 새 다이어그램 renderer와 CMS는 범위 밖이다

**Decision**: 이번 feature는 visual assessment metadata까지만 구현한다.
`recommended` 후보의 실제 diagram schema/renderer와 authoring CMS는 후속 feature로
남긴다.

**Rationale**: 사용자가 승인한 핵심은 "인사이트당 다이어그램 의무화"가 아니라
"필요성 판정 의무화"다. renderer까지 추가하면 확인되지 않은 관계를 그릴 위험과
불필요한 UI 범위가 생긴다.

## D-009. skill eval 실행 산출물은 저장소 밖 임시 workspace를 사용한다

**Decision**: `evals/evals.json`은 skill에 커밋하지만 모델 출력, timing, grading과
viewer 산출물은 OS 임시 디렉터리에 둔다. 최종 benchmark 요약만
`verification.md`에 옮긴 뒤 임시 디렉터리를 정리한다.

**Rationale**: harness의 `skills-link`는 `.harness/skills-local/*`의 모든 하위
디렉터리를 skill 후보로 링크한다. skill 옆에 `<name>-workspace`를 남기면 SKILL.md가
없는 평가 workspace까지 agent skill tree에 노출된다. 임시 workspace는 평가가
작업 트리를 오염시키지 않아야 한다는 원칙과도 일치한다.
