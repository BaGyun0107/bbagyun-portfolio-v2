# Research: 전체 스윔레인 Archify 임베드 전환

**Date**: 2026-09-10

## D001. 전체 전환의 입력 사실

**Decision**: 현재 portfolio data의 8개 `FeatureSwimlane`을 각 Archify source의 유일한 의미 입력으로 사용한다.

**Rationale**: 사용자가 승인한 작업물 본문과 기존 React 스윔레인의 단계·관계·예외 의미가 사실 기준이다. 다이어그램을 보기 좋게 만든다는 이유로 새 단계, 수치, 운영 결과를 추정하면 Evidence-First 원칙을 위반한다.

**Alternatives considered**:

- 각 프로젝트 소스코드에서 흐름을 다시 추론: 이미 승인된 공개 사실과 다른 해석이 들어갈 수 있다.
- 동일한 샘플 topology 복제: 프로젝트별 관계와 예외를 잃는다.

## D002. Archify source와 artifact 생성

**Decision**: 새 workflow source는 Archify schema v2, `meta.quality_profile: "showcase"`, 자동 route를 기본으로 작성하고 `validate` 통과 후 `deliver`한다.

**Rationale**: v2의 자동 geometry와 showcase 검증이 label 보존·교차 방지·완성 artifact identity를 함께 제공한다. source와 generated HTML을 프로젝트/스윔레인 ID로 일치시켜 재현 가능하게 보관한다.

**Alternatives considered**:

- schema v1 고정 좌표: 새 source의 topology 차이를 일괄 표현하기 어렵고 수동 좌표 drift가 커진다.
- 기존 React SVG를 Archify 스타일로 재작성: 실제 Archify 산출물이라는 사용자 승인 방향과 달라진다.

## D003. 기존 호텔 artifact 불변

**Decision**: Feature 012의 호텔 JSON·HTML은 수정·재생성하지 않고 SHA-256, byte count, node/edge 구조의 회귀 기준으로만 읽는다.

**Rationale**: 선행 사용자 검토와 delivery receipt가 이미 해당 artifact identity에 묶여 있다. 전체 전환의 공통 UI를 검증하기 위해 파일을 바꾸면 선행 근거와 현재 결과를 혼합하게 된다.

**Alternatives considered**:

- 8개를 같은 시점에 모두 재생성: 승인된 파일의 provenance를 잃고 변경 범위가 불필요하게 넓어진다.

## D004. 공통 표시 계층

**Decision**: 모든 대상은 하나의 `ArchifySwimlaneEmbed` adapter, `ProjectSwimlane` card/Dialog, 범례와 transcript를 공유한다. 같은 HTML URL을 preview의 MAP 밀도와 Dialog의 READ 밀도로 표시한다.

**Rationale**: 대상별 bespoke renderer를 만들지 않아도 같은 읽기 순서·동작·테마·fallback을 보장할 수 있다. 정보 밀도만 달리하면 topology와 방향 parity를 유지하면서 작은 보기의 가독성을 확보한다.

**Alternatives considered**:

- 스윔레인별 컴포넌트·HTML을 별도 작성: 공통 UX가 drift하고 회귀 검사가 8배로 늘어난다.
- preview/Dialog용 HTML을 각각 생성: 동일 흐름의 node·edge가 달라질 가능성이 있다.

## D005. 테마와 선 의미

**Decision**: parent portfolio의 semantic token을 artifact root에 연결한다. 일반 진행·검증 통과는 기본색 실선, 예외 발견·복구·재검증은 예외색 점선과 구조화 텍스트로 표현한다.

**Rationale**: 기술 종류별 색상보다 현재 포트폴리오의 시각 언어와 사용자가 승인한 공통 범례가 우선이다. 색상만으로 정상·예외를 구별하지 않도록 선 종류, 방향과 transcript를 함께 제공한다.

**Alternatives considered**:

- Archify 기본 기술별 색상을 그대로 노출: 포트폴리오 theme과 어긋나고 기술 종류 범례라는 새 의미를 만든다.
- 예외를 색상으로만 표시: 색각·인쇄·보조기술 환경에서 의미가 사라진다.

## D006. 로드·실패 경계

**Decision**: preview는 viewport 근접 시, Dialog는 열릴 때만 준비한다. load error, same-origin 접근 실패, 필수 DOM 부재와 5초 timeout은 기존 React renderer로 독립 fallback한다.

**Rationale**: 8개 self-contained HTML을 페이지 진입 시 모두 준비하면 초기 비용과 실패 표면이 커진다. 검증된 fallback을 유지하면 하나의 artifact 문제가 다른 카드나 전체 본문을 비우지 않는다.

**Alternatives considered**:

- 모든 iframe 즉시 eager mount: 사용자에게 보이지 않는 자료의 로드 비용을 선지불한다.
- 오류 문구 또는 무한 loading만 표시: 시각 흐름과 본문을 함께 잃는다.

## D007. 표시 전용·접근성 계약

**Decision**: 외부 wrapper가 role/name/description과 transcript를 제공하고, iframe은 표시 전용으로 제한한다. 내부 Viewer 도구·탐색·pointer·keyboard·focus는 노출하지 않는다.

**Rationale**: Archify standalone Viewer의 기능은 이번 카드의 요구사항이 아니다. 카드의 summary, exceptions, 단계·관계 transcript가 의미의 텍스트 대안이므로 내부 도구를 사용자 흐름에 섞지 않는다.

**Alternatives considered**:

- Viewer toolbar를 남김: 새 탭이나 확대·검색 등의 동작이 공통 카드 계약을 깨뜨린다.
- iframe title만 제공: 내부 focus와 상호작용이 여전히 남는다.

## D008. 검증 근거 분리

**Decision**: Archify `validate`/`deliver`, source-artifact parity/hash, Vitest, 실제 production 브라우저, screenshot 이미지 검토를 각각 별도 증거로 기록한다.

**Rationale**: 구조 검사는 문구와 layout의 실제 브라우저 동작을 보장하지 않고, screenshot은 source parity나 fallback lifecycle을 증명하지 않는다. 서로 다른 근거의 범위를 구분해야 한다.

**Alternatives considered**:

- 단일 snapshot 또는 dev server 검사: artifact identity, lazy lifecycle, focus와 실제 viewport를 모두 증명하지 못한다.

## D009. 범위와 후속 변경

**Decision**: 이번 feature는 현재 8개 스윔레인의 renderer 전환과 검증으로 한정한다. 새 프로젝트·새 인사이트·artifact 외부 공개 링크·Viewer 기능 추가는 별도 승인을 요구한다.

**Rationale**: 전환 대상은 데이터에서 확인된 목록과 사용자가 선택한 A 방향으로 이미 확정됐다. 범위를 넓히면 인터뷰되지 않은 사실을 생성하거나 다른 콘텐츠 작업과 섞일 위험이 있다.
