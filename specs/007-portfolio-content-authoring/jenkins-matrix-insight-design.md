# Jenkins matrix 인사이트 설계

- 승인일: 2026-08-27
- 상태: 콘텐츠 승인 완료, 구현 전
- 대상 slug: `jenkins-retirement-and-github-actions-migration`
- 유형: `project-case`
- origin: `codi-harness-dx-platform`
- 근거 인터뷰: `docs/portfolio-interviews/2026-08-27-jenkins-github-actions-matrix.md`
- 승인 문안: `jenkins-matrix-insight-approved-copy.md`

## 목표와 화면 역할

제목은 `GitHub Actions 전환보다 중요했던 배포 단위 재설계`로 바꾼다. 글은 다음 한 가지 질문에 답한다.

> Jenkins를 GitHub Actions로 옮기는 것만으로는 해결되지 않던 다중 호텔 배포 병목을, 배포 단위를 어떻게 다시 나눠 해결했는가?

작업물은 하네스 전체 역할, 규칙, CI/CD, 시크릿과 운영 결과를 요약한다. 인사이트는 `codi-rs-module`의 Jenkins 순차 대기열에서 변경 범위 기반 matrix로 배포 단위를 바꾼 판단만 분석한다. Infisical의 환경변수 경계와 Cloudflare의 접근 권한 경계, 하네스 전체 역사를 반복하지 않는다.

## 승인된 사실과 공개 경계

- 기존 Jenkins 구성은 작성자가 설계하거나 설정한 영역이 아니다.
- 작성자는 여러 프로젝트의 GitHub Actions 마이그레이션과 새 workflow 설계부터 담당했다.
- 구조가 복잡한 `codi-rs-module`은 다른 프로젝트 뒤 거의 마지막에 이전했다.
- 경로 감지와 platform matrix는 2026-07-01, 공통 pipeline·재사용 workflow 통합은 2026-07-07 Git 이력으로 확인했다.
- 공통 코드 변경은 다섯 호텔 전체, 호텔별 코드 변경은 해당 호텔만 대상으로 계산한다.
- 대상 배열은 matrix job으로 병렬 실행한다.
- `fail-fast: false`는 다른 hotel job을 즉시 취소하지 않으려는 설계 의도다. 실패 상황을 실제로 검증한 성과가 아니다.
- 약 15분에서 약 3분은 Jenkins 순차 실행 화면과 GitHub Actions matrix 실행 화면을 비교한 관찰값이며 반복 평균이나 개선율이 아니다.
- `$151.84/월`은 2026-08-20 공개 가격 기반 컴퓨팅 추정치이며 실제 과거 청구액이나 확정 절감액이 아니다.
- Jenkins slave·executor 확장은 실제 검토 대안이 아니다.
- 대상 사이에 순서가 필요하거나 변경 영향 범위를 계산할 수 없으면 같은 병렬화를 적용하지 않는다.

## Project-case 의미 재검토

| Row | Status | Evidence |
| --- | --- | --- |
| Role and responsibility | supported | 승인 인터뷰와 code/history inspection. 기존 Jenkins 구성 소유권과 GitHub Actions 마이그레이션·workflow 설계 책임을 구분한다. |
| Problem and time | supported | slave 1개의 다섯 호텔 순차 실행과 2026년 7월 matrix 도입·통합 이력. |
| Constraints and criteria | supported | 공통 코드와 호텔별 코드·환경·대상이 한 저장소에 있고 변경 영향 범위를 계산해야 했다. 비용과 운영 판단은 보조 배경이다. |
| Considered alternatives | supported | 다른 프로젝트부터 GitHub Actions로 이전하는 순서를 선택했다. Jenkins 확장은 검토하지 않았다고 명시하며 비교 대안으로 만들지 않는다. |
| Selection and implementation | supported | 경로 감지, 전체 또는 특정 호텔 대상 계산, matrix job과 `fail-fast: false`를 실제 code/history에서 확인했다. |
| Outcome evidence | supported with scope | 실행 화면 기준 약 15분→약 3분. 반복 평균·통제 실험·비율이 아니다. |
| Limits and retrospective | supported | 실패 격리 미시험, 순서가 필요하거나 영향 범위를 계산할 수 없는 경우 회피, 도구보다 배포 단위가 중요하다는 사용자 회고. |
| Project origin | supported | 기존 작업물 `codi-harness-dx-platform`과 공개 양방향 연결을 유지한다. |

## 시각 자료 필요성 인벤토리

### 작업물

| Inventory row | Relationship | Evidence status |
| --- | --- | --- |
| Actors and components | present | supported — 저장소, GitHub Actions, Infisical, 배포 대상의 책임 경계를 보여 준다. |
| Parallel paths | present | supported — 현재 병렬 배포 단계를 포함한다. |
| Failure paths | present | supported — 품질·시크릿 실패 시 중단을 표시한다. |
| Retry paths | present | supported — 원인 수정 후 처음부터 재실행한다. |
| Recovery paths | absent | N/A — 작업물 스윔레인은 장애 복구 절차가 아니라 배포 실행을 설명한다. |
| Data relationships | absent | N/A — entity·cardinality가 질문이 아니다. |
| Alternatives | absent | N/A — 현재 선택된 전체 흐름을 보여 주는 자료다. |
| Time evolution | absent | N/A — Jenkins 이전 흐름과의 시간 비교를 맡지 않는다. |
| Existing source visual | present | supported — 현재 `CI/CD·시크릿·배포` swimlane과 text summary가 있다. |

**Visual decision: provided — retain existing swimlane.** 작업물은 현재 CI/CD 전체 실행과 책임 경계를 보여 준다.

### 인사이트

| Inventory row | Relationship | Evidence status |
| --- | --- | --- |
| Actors and components | present | supported — 코드 변경, Jenkins slave, 대상 계산, matrix job과 다섯 호텔을 비교한다. |
| Parallel paths | present | supported — 다섯 호텔 matrix job의 병렬 경로가 핵심이다. |
| Failure paths | absent | N/A — 실제 실패 사례나 시험 결과가 없어 실패 경로를 그리지 않는다. |
| Retry paths | absent | N/A — 재시도 동작을 조사하거나 검증하지 않았다. |
| Recovery paths | absent | N/A — 장애 복구가 글의 질문이 아니다. |
| Data relationships | absent | N/A — entity 관계가 없다. |
| Alternatives | absent | N/A — Jenkins 확장을 실제 비교하지 않았고 도구 비교표를 만들지 않는다. |
| Time evolution | present | supported — Jenkins 순차 대기열에서 2026년 7월 matrix 병렬 실행으로 바뀌었다. |
| Existing source visual | present | supported — 작업물 자료는 현재 전체 CI/CD 흐름이며 인사이트의 before/after와 역할이 다르다. |

**Visual decision: provided — add before/after data-flow.** 배포 단위가 순차 대기열에서 변경 범위 기반 matrix로 바뀐 관계를 보여 준다. `fail-fast: false`는 검증된 실패 경로가 아니라 구성 의도로만 보조 설명한다.

시각 자료가 답할 질문은 “다섯 호텔 배포 단위를 어떻게 다시 나눴는가?”이다. text alternative는 Jenkins slave 1개의 A→E 순차 배포와, 공통·호텔별 변경 범위를 계산해 대상별 job을 병렬 실행한 차이를 동일하게 설명해야 한다.

## 공개 검증 계약

- insight route와 목록 제목·날짜·한 줄 소개를 확인한다.
- 작업물에서 새 제목의 insight link를 키보드로 활성화하고 insight에서 작업물로 돌아간다.
- 기존 slug와 origin을 유지하고 빈 source placeholder를 만들지 않는다.
- 기존 Jenkins 설정을 직접 구성했다는 주장, Jenkins 확장을 비교했다는 주장, 실패 격리를 시험했다는 주장, 과거 실제 `$151.84`를 절감했다는 주장을 금지한다.
- 2026년 7월 시점, 약 15분→약 3분의 관찰 한계, 적용·회피 조건이 렌더링되는지 확인한다.
- 320, 768, 1024, 1440px에서 문서 전체 overflow가 0이고 data-flow가 읽히는지 확인한다.
- 작업물 swimlane과 인사이트 before/after data-flow의 long-form duplication과 visual duplication을 별도 판정한다.
- production build와 전체 permanent E2E를 별도 포트에서 실행하고 승인 화면을 캡처한다.

## 범위

공개 구현은 기존 insight 한 건, 작업물과의 연결 label, 관련 unit/E2E 계약, Feature 007 검증 기록과 ROADMAP 증거만 수정한다. 다른 인사이트 본문, 작업물 전체 서사, 기존 작업물 swimlane은 변경하지 않는다.

커밋, push, PR, merge와 배포는 별도 사용자 요청 없이는 수행하지 않는다.
