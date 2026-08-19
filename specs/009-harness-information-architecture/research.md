# Research: 하네스 정보구조·기능 추적성·사용자 흐름 정본화

## 조사 결론

사이트맵, typed traceability와 user flow는 하나의 근거 원장에서 도출하되 서로
다른 질문에 답하는 별도 정본으로 유지한다. 사이트맵은 현재 화면·콘텐츠 계층,
관계는 요구에서 검증까지의 추적성, flow는 actor의 목표 달성 과정을 표현한다.
세 정본은 동일한 stable feature/screen ID로 기존 연결형 허브에서 결합한다.

이 작업은 사용자가 기존 미완료 004의 상태를 바꾸지 않은 채 009로 명시 전환한
것이다. 2026-07-16 기준 다른 unchecked task는
`specs/004-onboarding-bootstrap/tasks.md`의 실기기 검증 T021 한 건이다.

## 전문 실무 근거

| Basis | 핵심 주장 | 출처 |
| --- | --- | --- |
| RB-01 | 사이트맵은 페이지·콘텐츠의 계층, user flow는 목표 달성 행동·결정·종료를 나타내므로 분리하되 ID로 연결한다. | [Yale — Site Mapping and Information Architecture](https://usability.yale.edu/ux/plan/establish-structure-findability/site-mapping-and-information-architecture), [Figma — What Is a User Flow?](https://www.figma.com/resource-library/user-flow/) |
| RB-02 | 요구→초기 IA/flow→상세 기능정의→구현·검증은 선형 동결이 아니라 반복 갱신하는 흐름이다. | [GOV.UK — Writing user stories](https://www.gov.uk/service-manual/agile-delivery/writing-user-stories), [GOV.UK — Use agile ways of working](https://www.gov.uk/service-manual/service-standard/point-7-use-agile-ways-of-working), [ISO 9241-210:2019](https://www.iso.org/standard/77520.html) |
| RB-03 | 좋은 요구사항은 명확하고 단일하며 검증 가능해야 하고, 사용자 시나리오와 인수 조건은 목표와 기대 결과를 드러내야 한다. | [NASA — How to Write a Good Requirement](https://www.nasa.gov/reference/appendix-c-how-to-write-a-good-requirement/), [GOV.UK — Writing user stories](https://www.gov.uk/service-manual/agile-delivery/writing-user-stories) |
| RB-04 | 요구와 설계·구현·테스트·검증 사이의 추적성은 누락, 근거 없는 기능과 미검증 완료를 찾는 데 사용한다. | [IIBA — Tracing Requirements and Designs](https://www.iiba.org/knowledgehub/the-business-analysis-standard/4-implementing-business-analysis/4-4-understanding-requirements-and-designs/), [PMI-PBA Examination Content Outline](https://www.pmi.org/the-project-economy/sitecore/content/home/certifications/types/-/media/pmi/documents/public/pdf/certifications/professional-business-analysis-exam-outline.pdf?v=d7ca9eef-fe72-4005-91fc-c13706d6b524), [W3C PROV Overview](https://www.w3.org/TR/prov-overview/) |
| RB-05 | 관계도와 flow 시각화는 원본 데이터와 텍스트·표 대체를 함께 제공해야 한다. | [USWDS — Data visualizations](https://designsystem.digital.gov/components/data-visualizations/), [USWDS — Table](https://designsystem.digital.gov/components/table/) |

외부 근거의 적용 범위와 로컬 데이터 매핑은
`설계 초안(2026-07-18 정리 — git history)`에
상세히 기록돼 있다.

## Evidence ledger

| Decision ID | Claim | Level | Sources | Affected IDs | Review result | Decision owner | Resolve by / condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ED-01 | 실제 sitemap은 현재 `render-hub.mjs`가 제공하는 팀 기능 허브 계층 17개 node만 포함한다. | confirmed | `render-hub.mjs`; 승인 설계 §5 | `HUB-*` | 승인 | PM/PL | 완료 |
| ED-02 | CLI와 자동화는 화면 node가 아니라 feature와 flow step으로 표현한다. | confirmed | specs 004~006; 승인 설계 §5.2 | `004-*`~`006-*`, flows | 승인 | PM/PL | 완료 |
| ED-03 | 회원·투어·운영 대시보드 샘플은 actual data에서 제거하고 contract/fixture에 보존한다. | confirmed | 007 implementation basis E3; 사용자 승인 | `data/sitemap.json` | 승인 | PM/PL | 완료 |
| ED-04 | 009 Spec이 scan 대상이 되므로 최종 feature count는 9다. | confirmed | `scan-specs.mjs`; 사용자 승인 | `001-*`~`009-*` | 승인 | PM/PL | 완료 |
| ED-05 | 현재 실제 관리자 웹 화면이 없어 admin surface는 빈 node 목록이다. | confirmed | `render-hub.mjs`; 사용자 승인 | `admin` | 승인 | PM/PL | 새 관리자 화면 구현 시 재검토 |
| ED-06 | 각 기능의 첫 유효 `appears-on`을 primary screen으로 사용한다. | confirmed | 008 linked-model contract; 사용자 승인 | 기능 9개 | 승인 | PM/PL | 관계 우선순위 변경 시 재검토 |
| ED-07 | inferred 관계는 `inferred — PM/PL review` label과 evidence를 모두 가진다. | confirmed | 승인 설계 §3; 사용자 승인 | 추론 link | 승인 | PM/PL | PM/PL이 confirmed 또는 기각으로 재분류할 때 |
| ED-08 | question 수준의 관계는 canonical JSON에 넣지 않는다. | confirmed | 승인 설계 §3; 사용자 승인 | 전체 canonical data | 승인 | PM/PL | 새 근거 확보 후 |
| ED-09 | flow 재시도는 cycle 대신 recovery end로 끝내고 새 invocation으로 다룬다. | confirmed | 008 cycle validation; 사용자 승인 | flow recovery end | 승인 | PM/PL | cycle contract 변경 시 재검토 |
| ED-10 | 001은 프로젝트 문서, 003은 기능정의 표, 004는 가이드, 005~006은 프로젝트 문서를 주 화면으로 연결한다. | inferred | 각 spec의 목적·surface; 승인 설계 §6 | `001-*`, `003-*`~`006-*` | 승인, PM/PL 재검토 표시 유지 | PM/PL | 실제 전용 UI가 생기거나 화면 소유자가 확정할 때 |
| ED-11 | 002는 허브 root, 007~009는 기능정의 relation/sitemap/status 화면을 confirmed 주 화면으로 사용한다. | confirmed | 각 spec과 구현 결과; 승인 설계 §6 | `002-*`, `007-*`~`009-*` | 승인 | PM/PL | 화면 구조 변경 시 재검토 |

## Clarification resolution

1. 최종 기능 수는 009 자체를 포함한 9개다.
2. 관리자 screen은 현재 근거가 없어 `nodes: []`다.
3. primary screen은 첫 유효 `appears-on` relation이다.
4. inferred 데이터는 label과 evidence에 표시하고 question은 정본에서 제외한다.
5. retry는 recovery end로 종료하며 재실행은 새 flow invocation이다.

미해결 명세 표식은 없다.

## Alternatives considered

- 세 정보를 하나의 graph JSON으로 합치는 안은 각 산출물의 작성 목적과 검증
  규칙이 흐려져 기각했다.
- 샘플 sitemap을 실제 구조와 함께 유지하는 안은 미배치·orphan 지표를
  왜곡하므로 기각했다.
- 근거 없는 관리 화면과 프로세스 화면을 추가하는 안은 화면 IA와 운영 절차를
  섞고 사실성을 해치므로 기각했다.
- 009를 coverage에서 제외하는 안은 생성 직후 orphan 기능을 만들기 때문에
  기각했다.

## Implementation decision

기존 008의 schema, scanner, linked model과 renderer를 그대로 재사용한다.
이번 기능의 변경 범위는 세 사람 소유 JSON, 실제 데이터 회귀 테스트, 009의
근거·검증 기록, ROADMAP과 생성된 HTML이다. builder는 정본 파일을 쓰지 않는다.
