# Data Model: 전체 스윔레인 Archify 임베드 전환

**Date**: 2026-09-10

## 1. TargetSwimlane

기존 `FeatureSwimlane` 중 이번 전환의 대상이 되는 공개 흐름이다.

| Field | Type | Validation |
| --- | --- | --- |
| featureSlug | string | 현재 portfolio feature에 존재하는 slug |
| swimlaneId | string | feature detail의 stable ID와 일치 |
| title | string | 기존 공개 제목과 동일 |
| lanes | lane[] | canonical 책임의 순서·ID·label 보존; artifact band 통합 시 명시적 매핑 기록 |
| steps | step[] | 순서·ID·canonical lane·label·description 보존 |
| edges | edge[] | ID·from·to·kind·outcome·label 보존 |
| exceptions | exception[] | trigger·response·edgeIds 보존 |

대상 식별자는 다음 8개로 고정한다.

```text
codi-harness-dx-platform/design-development-verification
codi-harness-dx-platform/cicd-secrets-deployment
hanmaum-science-institute/ingestion-and-recovery
hanmaum-science-institute/search-request-flow
blackstone-belleforet-resort/payment-and-compensation
hipass-b2b-platform/order-payment-compensation
hotel-reservation-platform/platform-change-verification-deployment
integrated-sso-server/central-account-auth-flow
```

## 2. ArchifySource

`TargetSwimlane`에서 생성한 편집 가능한 Archify workflow JSON이다.

| Field | Type | Validation |
| --- | --- | --- |
| path | relative path | `apps/front/diagrams/<feature>/<swimlane>.json` |
| schema_version | literal | 새 workflow는 `2` |
| meta.quality_profile | literal | `showcase` |
| lanes/nodes | Archify lane/node[] | node stable ID는 1:1 반영하고, lane은 canonical 책임 또는 기록된 presentation band로 매핑 |
| relationships | Archify relationship[] | source edge의 from/to, 방향, kind, label 의미를 보존 |
| layout controls | optional | 자동 route 우선, validator 진단 때만 최소 control 사용 |

source에는 고객 데이터·secret·비공개 소스·미승인 운영 수치를 넣지 않는다. 관계 label이 실제 데이터에 없고 양 끝점만으로 의미가 완전히 함의되는 경우에만 생략 사유를 provenance에 기록한다.

### Canonical lane → presentation band mapping

presentation band는 책임을 삭제하거나 바꾸는 모델이 아니라 독립 viewer에서 전체 흐름을 한 화면에 읽기 위한 표시 계층이다. node·relationship stable ID와 정상/예외 의미는 그대로 유지하며, canonical 단계의 소유 책임은 아래 매핑으로 역추적한다.

| Swimlane ID | Canonical lanes | Archify presentation bands |
| --- | --- | --- |
| `design-development-verification` | `user`, `agent`, `delivery`, `verification` | `user → user`, `agent + delivery → agent`, `verification → verification` |
| `cicd-secrets-deployment` | `repository`, `actions`, `infisical`, `deployment` | `repository → repository`, `actions + infisical → actions`, `deployment → deployment` |
| `ingestion-and-recovery` | `admin`, `parsing`, `persistence`, `validation` | `admin → admin`, `parsing + persistence → parsing`, `validation → validation` |
| `search-request-flow` | `reader`, `routing`, `storage` | 동일 ID의 3개 presentation bands |
| `payment-and-compensation` | `guest`, `php-service`, `payment-provider`, `pms` | `guest → guest`, `php-service → php-service`, `payment-provider + pms → external-services` |
| `order-payment-compensation` | `client`, `order-server`, `payment`, `database` | `client → client`, `order-server + database → order-server`, `payment → payment` |
| `platform-change-verification-deployment` | `requirement`, `core`, `platform`, `delivery` | `requirement → requirement`, `core + platform → code-boundary`, `delivery → delivery` (Feature 012 동결) |
| `central-account-auth-flow` | `user`, `service`, `account`, `database` | 동일한 4개 presentation bands |

다섯 artifact는 node의 짧은 label만 남기고 중복 sublabel을 생략했다. 단계의 전체 description은 원본 `FeatureSwimlane`과 Dialog transcript가 계속 소유하므로 공개 사실이나 좁은 화면 판독 정보는 손실되지 않는다. SSO의 `verify-refresh-token` relationship label은 도착 node가 이미 `Refresh Token 검증`임을 밝히므로 `Access Token 만료`로 축약했고, 분기 의미는 유지된다.

## 3. ArchifyArtifact

`ArchifySource`를 `validate`와 `deliver`로 통과시킨 self-contained 정적 HTML이다.

| Field | Type | Validation |
| --- | --- | --- |
| sourcePath | path | 대응 source와 feature/swimlane ID가 동일 |
| publicPath | relative URL | `/diagrams/<feature>/<swimlane>.html`, query/hash 없음 |
| sha256 | string | delivery receipt와 일치 |
| bytes | integer | delivery receipt와 일치 |
| nodeIds | string[] | source와 target steps의 stable ID parity |
| edgeIds | string[] | source와 target edges의 stable ID parity |
| validation | receipt | 오류·경고 0건 |
| visualEvidence | paths | 1440px 이상 visual-check와 사람의 이미지 검토 연결 |

Feature 012의 호텔 artifact는 별도 frozen identity로 관리한다.

```text
JSON  b5472af8952722b9b5fea87fc930f2c5880634ff8da5f17f16c6aaa4f819c419  4355 bytes
HTML  a23ebd2219cda3bad5deccc3461e7d6522cfc90d5e34d6d4dffd5469817f49d3  714531 bytes
```

## 4. SwimlaneEmbedInstance

하나의 `TargetSwimlane`이 카드 preview 또는 Dialog에서 표시되는 runtime 상태다.

```text
mode: preview | dialog
state: idle | loading | ready | fallback
```

| Mode | Detail | Mount condition | Fallback |
| --- | --- | --- | --- |
| preview | MAP: topology·step label 중심 | viewport root margin 240px | ResponsiveSwimlaneDiagram |
| dialog | READ: 세부 설명·관계 label 포함 | Dialog open | 상세 React renderer/transcript |

한 instance의 timeout, observer, theme observer와 iframe lifecycle은 다른 instance와 공유하지 않는다.

## 5. PortfolioThemeSnapshot

런타임 저장 없이 parent document의 semantic token을 artifact root에 전달하는 값이다.

```text
background, foreground, card, muted, mutedForeground, destructive, border
```

일반 진행·검증 통과는 기본색 실선, 예외·복구·재검증은 예외색 점선으로 연결한다. transcript와 방향·구조가 색상 의미를 보완한다.

## 6. ParityManifest

각 대상의 원본과 Archify 결과를 비교하기 위한 검증 record다.

```text
featureSlug
swimlaneId
sourcePath
publicPath
sourceSha256
artifactSha256
sourceNodeIds
artifactNodeIds
sourceEdgeIds
artifactEdgeIds
directionMismatches
kindOutcomeMismatches
labelMismatches
validationReceiptPath
browserEvidencePath
visualReviewStatus
canonicalLaneToPresentationBands
```

`sourceNodeIds`와 `artifactNodeIds`, `sourceEdgeIds`와 `artifactEdgeIds`의 순서·집합 차이는 0이어야 한다. mismatch가 있으면 artifact를 성공으로 공개하지 않고 source를 수정·재검증하거나 기존 fallback을 유지한다.

## Relationships

```text
FeatureDetail
  └─ TargetSwimlane
       ├─ existing steps/edges ──> ResponsiveSwimlaneDiagram fallback
       └─ ArchifySource ──validate/deliver──> ArchifyArtifact
                                             └─ SwimlaneEmbedInstance
                                                  ├─ preview: MAP
                                                  └─ dialog: READ + transcript

ArchifyArtifact + TargetSwimlane ──> ParityManifest ──> verification.md
```
