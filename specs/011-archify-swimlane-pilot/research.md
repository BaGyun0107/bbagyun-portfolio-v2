# Phase 0 Research: Archify 스윔레인 파일럿

**Date**: 2026-09-09

승인된 Feature 011 명세와 설계, Feature 010의 호텔 예약 시스템 스윔레인, 현재 DTO·validator·React renderer·테스트, Archify 2.17의 authoring/delivery 계약을 대조했다. Technical Context에 남은 미확정 항목은 없다.

## D-001. 기존 React 스윔레인은 교체하지 않고 선택형 비교 viewer를 추가한다

**Decision**: 현재 작은 미리보기와 `크게 보기` Dialog를 그대로 유지하고, 대상 card header에 `Archify로 보기` 링크를 하나 추가한다.

**Rationale**: 파일럿의 목적은 동일 의미의 표현 품질을 비교하는 것이다. 기존에 검증된 읽기 경험을 제거하면 viewer 품질과 마이그레이션 회귀를 분리해 판단할 수 없다.

**Alternatives considered**: 작은 미리보기를 즉시 Archify로 바꾸는 안은 사용자 승인 전 전환이라 제외했다. 기존 Dialog 안에 iframe을 넣는 안은 두 viewer의 focus·navigation 경계를 중첩시키므로 제외했다.

## D-002. viewer는 same-origin 정적 HTML을 안전한 새 탭으로 연다

**Decision**: `/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html`을 `target="_blank"`, `rel="noopener noreferrer"` 링크로 연다.

**Rationale**: self-contained HTML은 앱 runtime과 독립적으로 제공되며, 새 탭은 기존 React viewer의 상태와 focus를 방해하지 않는다. same-origin 고정 경로는 임의 외부 링크나 잘못된 산출물 연결을 차단할 수 있다.

**Alternatives considered**: iframe은 viewer UI 중첩 때문에 제외했다. 외부 CDN·별도 호스트는 가용성·출처·보안 경계를 늘리므로 제외했다. Next.js 전용 route handler는 정적 파일로 충분해 불필요하다.

## D-003. `FeatureSwimlane`에는 최소 선택형 link metadata만 추가한다

**Decision**: `archify?: { url: string; label: string }`을 추가한다. `url`은 `/diagrams/`로 시작하고 `.html`로 끝나는 same-origin path, `label`은 공백이 아닌 문자열만 허용한다.

**Rationale**: renderer가 artifact 제작 방식이나 Archify 내부 schema를 알 필요가 없다. URL과 보이는 이름만 있으면 조건부 UI·접근성·경로 검증을 분리할 수 있다.

**Alternatives considered**: HTML 문자열이나 JSON을 DTO에 포함하면 정적 데이터와 renderer 책임이 섞인다. boolean flag만 두면 경로와 label이 암묵적이어서 다이어그램 추가 시 안전한 확장이 어렵다.

## D-004. JSON 원본과 생성 HTML을 함께 버전 관리한다

**Decision**: 편집 가능한 workflow JSON은 `apps/front/diagrams`, 배포 산출물은 `apps/front/public/diagrams`에 같은 slug 구조로 보존한다. 앱 build 과정에서는 Archify를 실행하지 않는다.

**Rationale**: JSON은 의미 검토와 재생성 기준이고 HTML은 독자가 실제 여는 배포물이다. 둘을 함께 두면 생성 도구가 없는 CI·runtime에서도 사이트가 동작하면서 provenance를 확인할 수 있다.

**Alternatives considered**: JSON만 커밋하고 build 때 생성하면 개인 skill 설치가 앱 build dependency가 된다. HTML만 커밋하면 의미 변경과 재생성 경로를 추적하기 어렵다. HTML을 직접 수정하는 방식은 deterministic receipt를 무효화한다.

## D-005. Feature 010 데이터가 Archify 의미의 canonical source다

**Decision**: Archify workflow는 기존 step ID·label·description과 edge 방향·label을 가능한 그대로 사용해 정확히 10개 node와 12개 edge를 표현한다. 세 코드 배치 경로는 동등한 분기이고, 패리티 누락은 운영 브랜치 감사와 수동 이식 뒤 검증으로 돌아오는 recoverable 경로다.

**Rationale**: 이번 작업은 새 사실을 발굴하는 콘텐츠 작업이 아니라 승인된 시각의 대체 표현이다. 양쪽 표현이 독립적으로 진화하면 같은 프로젝트 안에서 서로 다른 사실을 전달할 수 있다.

**Alternatives considered**: 가독성을 위해 node·edge를 합치는 안은 10/12 의미 계약을 깨므로 제외했다. 새 운영 시스템·자동화·성과를 보강하는 안도 인터뷰 근거가 없어 제외했다.

## D-006. Archify는 새 workflow v2와 showcase 품질 계약을 따른다

**Decision**: workflow schema v2, `meta.quality_profile: "showcase"`를 사용하고 visual preset, subtitle, animation, engineering profile은 생략한다. workflow schema, common schema와 workflow 예제 하나만 읽은 직후 candidate를 먼저 작성한다. 첫 candidate 뒤 update checker를 한 번 실행하고, 매 JSON 수정 뒤 validate한다.

**Rationale**: Archify의 fast authoring path는 자동 route·label에서 시작해 객관적 diagnostic이 있을 때만 한 개씩 geometry control을 추가하도록 규정한다. showcase acceptance는 artifact check 9개, composition error 0, warning 0이다.

**Alternatives considered**: schema v1은 기존 고정 geometry 보존용이므로 새 workflow에 부적합하다. 시작부터 좌표와 route control을 수동 지정하는 방식은 불필요한 충돌과 유지보수 비용을 만든다.

## D-007. validation, delivery, browser evidence와 육안 검토를 별도 증거로 남긴다

**Decision**: 최종 JSON validation 통과 후 원본을 동결한다. `deliver`로 snapshot·HTML·SHA-256·byte receipt를 만들고, 그 결과에 `visual-check`를 실행한다. 생성 screenshot은 별도로 직접 확인해 node 관통, label 잘림, 흐름 오독을 판단한다.

**Rationale**: deterministic artifact 검증은 실제 browser behavior나 시각적 완성도를 대신하지 않는다. 반대로 눈으로 본 화면은 정확한 source/artifact provenance를 증명하지 못한다.

**Alternatives considered**: `validate`만으로 완료하는 안, `visual-check`만으로 delivery 성공을 추정하는 안, screenshot만 남기는 안은 각각 검증 층 하나 이상이 빠져 제외했다.

## D-008. 콘텐츠 validator와 renderer 테스트를 TDD로 확장한다

**Decision**: 구현 전에 유효·무효 `archify` metadata, 대상 한 건만의 연결, 다른 스윔레인의 placeholder 부재, 기존 action 보존, 안전한 새 탭 속성, JSON/HTML 존재와 10/12 parity를 검사하는 Vitest를 먼저 실패시킨다.

**Rationale**: TypeScript interface만으로 runtime content를 검증할 수 없고, E2E만으로 모든 정적 데이터와 금지 경로를 빠르게 전수 검사하기 어렵다.

**Alternatives considered**: 렌더링 snapshot만 추가하면 URL validation과 의미 parity가 약하다. 수동 점검만 사용하면 후속 스윔레인 추가 때 회귀를 자동으로 막지 못한다.

## D-009. 기존 페이지와 standalone viewer의 반응형 계약을 분리한다

**Decision**: 프로젝트 페이지는 320/768/1024/1440px에서 title과 두 action, document overflow를 확인한다. standalone viewer는 Archify 기본 desktop 범위인 1440×900, 1600×1000, 1920×1080에서 전체 가로·세로 overflow와 핵심 node·edge·label 가림을 확인한다.

**Rationale**: 두 문서는 다른 layout runtime을 사용한다. 한쪽 viewport pass가 다른 쪽의 품질을 증명하지 않는다.

**Alternatives considered**: 동일 viewport 집합만 강제하는 안은 standalone desktop viewer의 실제 계약과 맞지 않는다. overflow를 CSS로 숨기는 방식은 잘린 내용을 감추므로 허용하지 않는다.

## D-010. 1104는 보존하고 별도 production 포트에서 최종 E2E를 수행한다

**Decision**: 사용자가 실행한 1104 dev server는 구현 중 확인에만 사용하고 PID·lock을 건드리지 않는다. 최종 build와 E2E는 빈 포트의 production server와 임시 Playwright config로 수행하고, 소유한 process와 임시 파일만 정리한다.

**Rationale**: `.next/dev` lock 때문에 두 번째 dev server가 실행되지 않으며 기존 서버는 사용자 소유 상태다. fresh production server가 정적 HTML 제공과 build 결과를 더 재현 가능하게 검증한다.

**Alternatives considered**: 1104를 재시작하거나 그 위에서 최종 증거를 수집하는 안은 사용자 상태와 HMR 영향을 섞으므로 제외했다.

## Visual Evidence Inventory

| 공개 기록 | 기존 판정 | 이번 처리 | 답하는 질문 |
| --- | --- | --- | --- |
| 호텔 예약 시스템 `platform-change-verification-deployment` | `provided`, 기존 React swimlane 유지 | 같은 10개 node·12개 edge의 선택형 Archify viewer 추가 | 변경을 어디에 배치하고 어떻게 검증·배포·복구하는가? |
| 연결 인사이트 2건 | 기존 visual 유지 | 변경 없음 | 각 인사이트가 승인받은 코드 경계·Context 질문 |
| 다른 구조화 작업물 | 각 기존 visual 유지 | Archify action·placeholder 없음 | 각 작업물이 이미 승인받은 개별 질문 |

Archify viewer는 새로운 기술 증거가 아니라 기존 스윔레인의 선택적 표현이다. 따라서 프로젝트 본문이나 인사이트에 별도 visual block으로 중복 삽입하지 않는다.
