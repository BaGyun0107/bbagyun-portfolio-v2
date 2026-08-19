# 기능정의 흐름 분석과 개선 백로그 (2026-07-17)

탑다운/바텀업 시나리오 분석에서 발견한 문제 4건의 기록.
상세 근거는 세션 분석 결과를 요약한 것이며, 각 항목은 착수 시
Size 선언 후 필요하면 spec으로 승격한다.

## 항목 1 — 실프로젝트 배선 수정 (2026-07-17 코드 적용, 미커밋)

문제(적용 전): `build-hub.mjs`가 `workspace.kind === 'demo'`일 때만
`loadPlanningWorkspace`(카탈로그+상세+Delivery Evidence+work item 전체
경로)를 태웠다. demo가 아닌 워크스페이스는 spec 스캔 경로로 떨어져
`featureWorkItems`가 항상 빈 배열이었고, 실프로젝트는 계약을 다 따라도
기능 현황의 `선택 기능 작업`이 구조적으로 채워질 수 없었다.

적용된 대응: 라우팅을 `kind === 'demo' || hasPlanningCatalog(workspace)`
(planningSource의 신형 카탈로그 존재 판정)로 변경. 데모 데이터를 전 기능
최소 1개의 work item으로 보강하고 회귀 방지 테스트를 추가했다. legacy
`deliveryStatus: "verified"`가 기본 상태 집합에 없어 FEED/POST-DETAIL의
legacy 투영이 조용히 탈락하던 잠복 버그도 base `status` 추가로 해결.

## 항목 2 — 정의-후행(definition-later) 경량 경로 (2026-07-17 구현, specs/011)

문제: spec ID(`NNN-*`)와 기능 ID(`FEAT-*`)는 다른 네임스페이스이고,
연결은 planning 쪽 `traceability.specIds`/`specified-by`를 손으로
적어야만 성립한다. 정의가 없는 기능은 적을 자리 자체가 없다. 또한
`normalize-feature-work-items.mjs`는 카탈로그에 없는
`featureDefinitionId`의 work item을 health만 남기고 버리므로
"구현 먼저 → 정의 나중" 순서가 원천적으로 불가능하다. 소급 정의
워크플로도 없다(authoring은 처음부터, normalizer는 외부 문서 전용).

대응: 구현 착수 시 `FEAT-*` stub(id/title/summary +
`definitionStatus: draft`) 자동 생성, 미확인 featureDefinitionId의
work item을 "미등록 기능" 버킷으로 투영, `status.yaml`에 `featureId`
역방향 링크 허용, 소급 상세 작성은 열린 결정 큐로 넘긴다.

## 항목 3 — work item 기록의 워크플로 통합 (2026-07-17 구현)

문제: "구현 상태 변화는 work item 갱신으로 표현한다"는 규칙만 있고
수행 주체가 없다. `delivery-evidence.json`을 손으로 편집해야 하는
데이터는 자연 발생하지 않으므로 기능 현황 보드는 계속 비게 된다.

적용된 대응: 공용 Stop 어댑터(`runPlanningSyncIfRelevant`)에
`buildWorkItemReminder`를 추가 — specs 진행 변화(tasks/status)가 있는데
delivery evidence 갱신이 없으면 `[workitem-reminder]` 비차단 안내를
낸다(Claude/Codex 공용, deliverySource가 spec 디렉터리면 침묵). 011의
spec-scan 투영·미등록 버킷·stub 명령과 결합해 "기록 주체 부재" 갭을
줄였다. 자동 승격 금지 원칙 유지 — 어떤 파일도 자동 편집하지 않는다.

## 항목 4 — 사이트맵 규칙 정비 (2026-07-17 완료)

문제: (a) 화면 없는 기능 처리 규칙이 두 입구 스킬에서 모순
(normalizer는 `common` surface 배치, authoring은 미배치 유지),
(b) actor↔surface 교차 검증 부재(moderator 기능을 user 화면에
배치해도 무경고), (c) 사이트맵 확인이 벌크 승인 1회뿐, (d) 신고류처럼
user/admin 양쪽에 걸치는 기능의 분할 규칙이 관례로만 존재,
(e) 열린 결정(decisions) 소비 루프 부재.

적용된 대응: (a) 1차 정비(M4)에서 3문서 규칙 통일. (b)
`actorSurfaceMismatches` 비차단 힌트 — 확실한 actor 부류(admin/user계)
만 지적, 목록 밖 actor·common은 침묵(fail-open). (c) 사이트맵 확인을
surface 단위 + 변경분 요약으로 세분화(normalizer Step 0·authoring).
(d) 걸침 기능 분할 규칙(FEAT-REPORT/FEAT-MODERATION 패턴)을 스킬
2종+빅 가이드에 명문화. (e) 열린 결정(status: open)을 빌드 힌트와
planning:check 경고로 노출(`openDecisionSummary`) — stub이 만드는
DEC-STUB-* 열린 결정이 해소될 때까지 계속 보인다.

## 재점검 추가 발견 (2026-07-17 2차)

문서 간 모순 (항목 4에 병합해 함께 정비):

- M1. 신규 기능(소스 문서 없음) 진입점 라우팅 충돌 — normalizer의
  "When To Use"는 Spec Kit(`speckit.specify`)로 보내지만, 같은 파일의
  trio 설명과 authoring 스킬은 그 시나리오를 authoring 담당으로 규정.
- M2. 기능 현황 진실의 원천 이원화 — hub 스킬이 한쪽에서는
  `specs/<NNN>/status.yaml`을, 다른 쪽에서는 delivery evidence의
  `workItems`를 원천으로 지목. 두 축(spec 상태 vs work item)의 관계를
  명시적으로 구분·연결하는 서술이 없다.
- M3. done 가드 기준 불일치 — work item 축(acceptance passed+evidence)과
  specs 축(verification.md 체크리스트)의 완료 조건이 서로 참조 없이
  다르게 정의됨 (M2에서 파생).
- M4. 화면 없는 기능 처리 3파전 — normalizer=common 고정, authoring=미배치,
  빅 가이드=common 또는 별도 추적 관계.
- M5. normalizer Step 0의 사이트맵 경로 `data/sitemap.json` 하드코딩 —
  같은 스킬 Deliverables와 authoring의 `<planningSource>/sitemap.json`
  계약과 충돌 (데모/다중 워크스페이스에서 배치).

보강 필요:

- R1. `feature:seed-check`는 title 유사도 검색기(Row_ID 안내)이지
  FEAT-* ID 중복 검증기가 아님 — 문서 3곳의 "ID 중복 확인" 서술 정정
  또는 도구를 ID 대조까지 확장.
- R2. harness-internal flip 리스크 — `data/`에 카탈로그가 생기는 순간
  planning 경로로 전환되며 `deliverySource: specs`를 읽지 못해 spec 유래
  행이 워크스페이스 화면에서 사라짐(런타임 재현 확인). 항목 2 범위에
  "planning 경로의 specs deliverySource 스캔 지원"을 포함할 것.
  → **해소(2026-07-17, specs/011)**: loadPlanningWorkspace가 spec
  디렉터리형 deliverySource를 `source: spec-scan` 항목으로 보충
  투영한다(명시 evidence 우선). 런타임 재검증으로 보존 확인.
- R3. "정확히 하나의 primary placement" 규칙이 빅 가이드·데모 테스트에만
  있고 authoring 카탈로그 계약에 없음 — 계약에 명문화.
- R4. specs/010 verification.md의 "FEAT-FEED 작업 0개" 검증 기록이 데모
  보강 이후 사실과 불일치 — 날짜 주석으로 이력 보존하며 갱신 필요.

### 정비 결과 (2026-07-17, 미커밋)

- M1 정비: normalizer "When To Use"를 authoring 진입점으로 정정, Spec Kit은
  구현 시드 역할로 한정.
- M2/M3 정비: hub 스킬과 feature-hub-guide에 spec 상태 축과 work item 축의
  구분·상호 참조 문장 추가. 두 done 가드가 다른 객체를 다룸을 명시.
- M4 정비: 화면 없는 기능 규칙을 "실제 화면이 있으면 배치(공유 화면이면
  common), 없으면 미배치 — 가짜 화면 노드 금지, 연결은 traceability"로
  normalizer·authoring·빅 가이드 3문서 통일.
- M5 정비: normalizer Step 0의 사이트맵 저장 경로를 workspace
  `planningSource` 상대 경로로 정정(예시로 data/·데모 경로 병기).
- R1 정비: feature-seed-check.mjs에 정규화 ID 일치 검색 추가(TDD,
  tests/feature-hub-duplicate-guard.test.mjs +2건), 문서 3곳 문구 정정.
- R3 정비: authoring 카탈로그 계약에 "사용자 노출 기능은 정확히 하나의
  primary placement" 규칙 추가.
- R4 정비: specs/010 verification.md에 날짜 주석으로 이력 보존.
- 남은 항목: M4 파생인 actor↔surface 빌드 힌트와 확인 절차 세분화는 항목
  4 본체로, R2(specs deliverySource 스캔)는 항목 2 범위로 유지.
- 검증: 전체 테스트 627/627, docs:build 정상, planning:check 통과,
  feature:status:sync 제안 없음.

## 잔여·한계 (2026-07-17 최종 재점검)

백로그 4항목 완료 후에도 남는 것들. 다음 착수 시 이 목록에서 승격한다.

- 잔여 1. **이중 모델 공존** — 문서 허브의 legacy 21필드 표와 Planning
  Hub 카탈로그가 병존. 스캐너 상호 수용으로 완화됐지만 "기능정의서"
  화면 두 곳이 다른 집합을 보여줄 수 있는 구조는 그대로. legacy 표
  은퇴 계획이 필요하다.
- 잔여 2. **단일 저장소 manifest/lock/pull 왕복 과중** — 같은 repo에서
  planning source를 직접 고칠 수 있는데도 digest 재컴파일·pull 절차가
  요구되며 단축 경로가 미문서화.
- 잔여 3. **항목 3은 축소 구현** — 원 구상(tasks.md 기반 work item 초안
  자동 생성·갱신 제안) 대신 Stop 훅 비차단 리마인더로 구현. explicit
  multi-workType 작업 기록은 여전히 수동.
- 잔여 4. **actor↔surface 힌트의 고정 어휘 한계** — admin/user계 표준
  actor 목록만 검사(설계상 fail-open). 프로젝트 고유 actor는 침묵.
- 잔여 5. **절차 규칙은 비강제** — surface 단위 확인, 걸침 분할, 기록
  계약은 narrative 규칙 + 비차단 힌트 조합. 하네스 철학과 일치하지만
  강제 게이트는 아니다.
- 잔여 6. **하네스 자신의 FEAT 카탈로그 미도입** — data/에
  feature-definitions.json이 없어 harness-internal은 legacy(spec 유래)
  경로. 도입 시 spec-scan 투영으로 현황은 보존되나 도입 자체는 미착수.
- (참고) P1/P2/P3 라벨 혼동 후보, 사람 게이트 spec task(010 T098/T101,
  004 T021), 하우스키핑 힌트(002~007 검증 보완, 빈 화면 노드)는 기존
  기록 유지.

### 잔여 해소 기록 (2026-07-17 2차 백로그)

- 잔여 2 → **해소**: `mise run planning:publish` 신설(비-demo 우선,
  projectId/revision 보존·증가, 실패 시 기존 manifest 보존). 단일
  저장소 왕복은 publish → pull 두 명령으로 문서화.
- 잔여 3 → **해소**: `mise run feature:workitem` 신설 — explicit 항목
  기록 마찰 제거(스켈레톤 생성, ID 불변, done 생성 금지). "초안 자동
  생성"은 하지 않기로 확정(자동 승격 금지 일관).
- 잔여 4 → **해소**: workspace `actorClasses`로 actor 어휘 병합 확장.
- 잔여 5 → **해소**: 비강제 유지 결정과 강제 전환 기준 3가지를
  `.harness/policies/quality-gates.md`에 명문화.
- 잔여 1·6 → **해소(2026-07-18, specs/012)**: advisory/source health
  분리, 하네스 카탈로그 12항목(spec ID 재사용) 도입, 죽은
  렌더러·미사용 golden·구 설계 초안 16파일 제거(참조 0 확인 + 테스트
  이식 + 생성 페이지 해시 불변), legacy 행 신규 계약 제거 + 변환 안내.
  사용자 지시에 따라 구 문서·미사용 파일은 환각 방지 차원에서 적극
  제거함.

### 3차 백로그 해소 기록 (2026-07-18 — 추적성 누락 작업함 분석)

- 백로그 10 → **해소**: registry가 planningSource `needs.json`과 spec
  스캔의 검증 기록을 소스로 수용(critical 오탐 14건 해소 — verified-by
  11건은 카탈로그 경로에 verification 엔티티 미등록, 데모 3건은
  entities 공란이 원인). coverage가 typed satisfied-by/specified-by를
  소비해 요구/Spec 연결 없음 표현 갭 24건 해소. 워크스페이스 linked
  모델의 카탈로그 self-match는 coverage 소스에서 제외(가짜 해소 차단).
- 백로그 12 → **해소**: FLOW-FEATURE-DELIVERY step에 010/011/012 반영.
  001은 세 흐름과 무관한 정직한 잔존 갭.
- 남은 큐(전부 의도됨): 정의 불완전 12(백필), 구현 근거 미수집
  2(001 검증 기록 부재·010 사람 게이트), 흐름 1(001), 데모 시드들.
