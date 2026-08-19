# Contract: human-owned canonical hub data

## Ownership

`data/sitemap.json`, `data/feature-relations.json`, `data/user-flows.json`은
사람이 명시적으로 작성·검토하는 정본이다. `docs/index.html`과 linked hub model은
정본에서 생성한 projection이다. builder와 status sync는 세 정본을 쓰지 않는다.

## Reused machine contracts

- Sitemap: `.harness/config/sitemap-schema.json`
- Traceability: `.harness/config/traceability-schema.json`
- User flow: `.harness/config/user-flow-schema.json`

이번 기능은 위 schema, scanner 또는 renderer를 변경하지 않는다.

## Stable identity

- Screen: `HUB-*`
- Need: `NEED-*`
- Feature/Spec: `001-*`부터 `009-*`
- Verification: 연결된 feature와 동일 ID
- Flow: `FLOW-*`; step ID는 flow 안에서 유일

시각화, 트리, 표, flow와 상세 패널은 같은 ID를 사용한다.

## Evidence

모든 명시적 relation은 `evidence`를 가진다. confirmed는 로컬 source 또는 승인
결정을 가리킨다. inferred는 `label`에 `inferred — PM/PL review`를 포함하고
`evidence`가 추론 근거를 가리킨다. question은 정본에 포함하지 않는다.

## Fail-open

- 파일 부재·파싱·최상위 schema 실패: 해당 source만 사용하지 않고 warning을 남긴다.
- 개별 entity/link/step/edge 실패: 잘못된 항목만 제외하고 유효 항목은 보존한다.
- 최종 actual data acceptance: unassigned, broken, duplicate와 모든 orphan 0.

## Change rule

실제 화면, 기능, 의존성 또는 목표 흐름이 변하면 먼저 근거 원장을 갱신하고 관련
stable ID를 유지한다. ID 의미가 완전히 바뀌는 경우 새 ID를 만들고 기존 ID의
이력과 migration 판단을 Spec에 남긴다.
