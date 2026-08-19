# Feature Specification: Planning Hub 데모·동기화·기능 허브 재설계

**Feature Branch**: `010-planning-hub-redesign`

**Created**: 2026-07-16

**Status**: Approved

**Input**: User description: "승인된 분리형 허브, screen-only 사이트맵,
구현 가능한 기능정의 상세, Planning Manifest와 Delivery Evidence 기반 동기화,
격리된 Community Demo 워크스페이스를 구현한다. Claude/Codex 및 사람의 편집을
공용 동기화 흐름과 CI로 검증하며 include test tasks (TDD)."

**Design Basis**:
Planning Hub 데모·동기화·기능 허브 재설계 (설계 초안 — 2026-07-18 정리, git history 참조),
문서 허브·Planning Hub 페이지 분리 (설계 초안 — 2026-07-18 정리, git history 참조),
Planning Hub 기능 워크벤치 재설계 (설계 초안 — 2026-07-18 정리, git history 참조)

## Clarifications

### Session 2026-07-16

- Q: 기능정의서를 어떻게 분리할 것인가? → A: 별도 생성 HTML로 이동한다.
- Q: 기능정의와 기능현황을 분리할 것인가? → A: 통합 Planning Hub에서 같은 기능 선택 상태로 제공한다.
- Q: 첨부 예시형 사이트맵은 어떤 방향인가? → A: 홈 중심 가로 확장 조직도를 별도 보기로 추가한다.
- Q: 하네스 가이드와 프로젝트 문서는 어떻게 읽는가? → A: 범주·목록·Markdown 읽기 패널 구조를 사용한다.
- Q: 기능 정의와 실제 구현 작업은 어떤 관계인가? → A: planning-owned
  `FeatureDefinition` 하나에 project-owned `FeatureWorkItem` 여러 개를 연결한다.
- Q: 기능 현황의 기본 표현은 무엇인가? → A: 선택 기능 컨텍스트가 있는 작업
  Kanban을 기본으로 하고 기능별 계층 보기를 대안으로 제공한다.
- Q: Release와 downstream 저장소는 어디에 속하는가? → A: Release는 구현 작업의
  속성·필터이며 기능 정의에 downstream 저장소 위치를 저장하지 않는다.
- Q: planning package 갱신은 프로젝트 원본을 어떻게 바꾸는가? → A: immutable
  version/digest package를 프로젝트가 명시적으로 수신하며 기존 Spec·task·작업을
  자동 덮어쓰거나 양방향 병합하지 않는다.
- Q: 전달·동기화·추적성의 정보 위계는 어떻게 바꾸는가? → A: 구현·검증 근거는
  기능 현황에 흡수하고, 동기화는 운영·고급으로 이동하며, 추적성은 coverage와
  누락 작업함에서 선택 기능의 국소 관계를 여는 방식으로 제공한다.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 제품 구조를 혼동 없이 탐색 (Priority: P1)

PM/PL, 디자이너, 개발자와 AI가 일반 제품 기능으로 구성된 데모 워크스페이스에서
화면 구조, 기능 정의, 기능 현황, 사용자 흐름과 추적성을 서로 다른 목적으로
탐색하고 동기화·자동화 정보는 운영·고급에서 확인한다. 사이트맵에서는 실제 화면의
계층과 이동만 확인하며, 하네스 자체 개발 기능은 별도 워크스페이스로 전환해 확인한다.

**Why this priority**: 사용자가 각 산출물의 의미를 구분하지 못하면 이후 상세
정의와 전달 상태도 올바르게 해석할 수 없으므로 전체 기능의 진입점이다.

**Independent Test**: Community Demo만으로 워크스페이스 전환, 여섯 개의 제품
보기, 운영·고급, screen-only 사이트맵과 화면 상세를 탐색해 각 보기의 질문과
원본을 설명할 수 있는지 검증한다.

**Acceptance Scenarios**:

1. **Given** 하네스 저장소의 기능 허브를 처음 연 사용자, **When** 기본
   워크스페이스를 확인하면, **Then** `DEMO DATA`로 명시된 Community Demo가
   표시되고 하네스 내부 기능과 섞이지 않는다.
2. **Given** Community Demo의 화면 구조 보기, **When** 사이트맵을 탐색하면,
   **Then** 사용자·관리자·공통 화면의 계층은 실선, 직접 이동은 점선으로
   구분되며 기능·Spec·테스트가 화면 노드로 나타나지 않는다.
3. **Given** 선택한 화면, **When** 상세를 열면, **Then** stable ID, 화면 종류,
   상위 화면, 직접 이동과 접근 조건을 확인하고 관련 기능·흐름·기능 현황의 전용
   보기로 이동할 수 있다.
4. **Given** 하네스 자체 개발 기능을 확인하려는 사용자, **When** Harness
   Internal로 전환하면, **Then** 기존 정본 데이터가 보존된 상태로 표시된다.
5. **Given** 실제 다운스트림 프로젝트의 허브, **When** 데이터를 읽지 못하면,
   **Then** Community Demo로 자동 대체하지 않고 실제 원본의 실패와 복구 행동을
   표시한다.

---

### User Story 2 - 구현 가능한 기능정의 판단 (Priority: P1)

PM/PL과 구현 담당자가 기능 목록에서 우선순위, 정의 상태와 구현 상태를 구분하고,
선택한 기능의 사용자 가치, 정상·대안·실패 동작, 상태, 규칙, 데이터·인터페이스,
인수 조건, 근거와 열린 결정을 확인한다.

**Why this priority**: 기능 이름과 짧은 설명만으로는 사람이 무엇을 구현하고
어떻게 완료를 검증해야 하는지 판단할 수 없다.

**Independent Test**: `게시물 작성 및 발행` 데모 기능 하나만 선택해 actor와
목표부터 오류 회복, 정책, 인수 조건과 미검증 항목까지 구현 판단에 필요한 정보가
서로 모순 없이 나타나는지 검증한다.

**Acceptance Scenarios**:

1. **Given** 기능 목록, **When** P1/P2/P3 badge를 확인하면, **Then** 모두
   `우선순위`라는 전체 의미와 프로젝트 legend가 함께 표시되고 구현 phase나
   화면 상태로 오해되지 않는다.
2. **Given** 선택한 기능, **When** 기능 상세를 확인하면, **Then** 의도, actor,
   전제조건, 정상 흐름, 대안·오류·권한 상태, 규칙, 데이터, 외부 연결과 측정 가능한
   인수 조건을 확인할 수 있다.
3. **Given** 승인된 정의이지만 구현이 진행 중인 기능, **When** 상태를 확인하면,
   **Then** 정의 상태, 구현 상태와 동기화 상태가 별도 그룹으로 표시된다.
4. **Given** 필수 오류·회복 동작이나 인수 조건이 누락된 기능, **When** 상세와
   health를 확인하면, **Then** `정의 불완전`과 누락 필드 및 해결 행동이 표시된다.
5. **Given** 기존 irregular 기능정의 source, **When** 정규화되면, **Then**
   확인되지 않은 내용을 사실처럼 채우지 않고 근거 수준과 열린 질문을 보존한다.

---

### User Story 3 - 계획과 구현·검증의 차이 조정 (Priority: P1)

PM/PL과 개발팀이 planning 원본과 다운스트림 구현 근거를 stable ID와 버전으로
결합해 어떤 정의가 전달·구현·검증됐는지 확인한다. 차이가 발견되면 승인된 계획을
자동으로 덮어쓰지 않고 근거가 있는 변경 제안을 검토한다.

**Why this priority**: 단순 상태 동기화는 계획 누락, 오래된 구현, 정의와 실제
동작의 차이와 검증 공백을 숨길 수 있다.

**Independent Test**: 계획의 이미지 첨부 제한 10장과 실제 구현 근거의 4장
차이를 입력해 drift, 근거, 담당자와 가능한 해결 방향이 변경 제안으로 생성되고
양쪽 원본은 수정되지 않는지 검증한다.

**Acceptance Scenarios**:

1. **Given** 승인된 계획 배포 단위, **When** 다운스트림이 이를 수신하면,
   **Then** 프로젝트, schema·manifest 버전, source revision과 digest가 고정된
   수신 기록을 확인할 수 있다.
2. **Given** 다운스트림의 Spec, task, 실제 화면·연결, 테스트와 검증 기록,
   **When** 구현 근거를 결합하면, **Then** consumed manifest와 source revision이
   포함된 전달 근거로 표시된다.
3. **Given** 계획과 구현 값이 다름, **When** 조정 결과를 확인하면, **Then**
   planned value, observed value, 근거, 제안 이유와 결정 담당자가 표시되고
   `drifted` 상태가 계산된다.
4. **Given** 양쪽이 같은 항목을 양립할 수 없게 변경함, **When** 조정하면,
   **Then** `conflicted`로 표시되고 사람이 `구현 보완`, `정의 변경`, `보류`,
   `기각` 중 하나를 이유와 함께 결정할 때까지 어느 원본도 덮어쓰지 않는다.
5. **Given** 승인 기능에 Spec 또는 인수 검증이 없음, **When** 기능 현황의 근거
   상세을 확인하면, **Then** `전달 누락` 또는 `미검증`으로 표시되고 완료 판단이
   차단된다.

---

### User Story 4 - 에이전트와 사람 편집의 일관성 검증 (Priority: P2)

Claude, Codex 또는 사람이 관련 원본을 변경하면 같은 동기화 규칙이 변경을 감지하고
허브 projection과 health를 갱신한다. 지원되지 않는 훅이나 실패가 있어도 명시적
명령과 merge 전 검증으로 복구할 수 있다.

**Why this priority**: 빠른 로컬 피드백은 중요하지만, 에이전트별 훅 차이와 직접
편집 때문에 훅만으로 일관성을 보장할 수 없다.

**Independent Test**: 같은 source 변경을 Claude 종료 흐름, Codex 종료 흐름,
사람의 직접 편집 후 merge 전 검증으로 각각 처리해 동일한 조정 결과와 health가
나오는지 검증한다.

**Acceptance Scenarios**:

1. **Given** 관련 source가 변경됨, **When** 지원되는 Claude 또는 Codex 종료
   adapter가 실행되면, **Then** 같은 공용 규칙이 변경 source를 감지하고 동일한
   결과를 생성한다.
2. **Given** 에이전트 훅을 거치지 않은 사람 편집, **When** merge 전 검증이
   실행되면, **Then** 누락된 재생성, invalid manifest, broken ID와 unresolved
   conflict가 검출된다.
3. **Given** 지원되는 prompt hook이 없는 Codex, **When** 새 세션과 작업 종료를
   거치면, **Then** 시작 검증과 공용 종료 adapter로 결과 동등성을 유지하며 존재하지
   않는 hook이 실행됐다고 보고하지 않는다.
4. **Given** 로컬 자동 갱신이 실패하거나 timeout됨, **When** 허브를 확인하면,
   **Then** 마지막 정상 결과, 실패한 source, 시각과 수동 복구 행동이 표시된다.
5. **Given** 동일한 입력과 버전, **When** 여러 번 동기화하면, **Then** 의미가
   같은 결과와 digest를 생성하며 출력 변경이 다시 입력 변경을 유발하지 않는다.

---

### User Story 5 - 별도 planning-hub로 이동 가능한 계약 유지 (Priority: P3)

하네스 관리자가 향후 planning-hub 저장소를 별도로 만들 때 데모와 실제 프로젝트가
사용한 계획·근거 계약과 stable ID를 유지한 채 top-down 원본만 분리할 수 있다.

**Why this priority**: 별도 저장소 생성은 이번 범위가 아니지만 현재 구조가 로컬
경로와 하네스 내부 기능에 결합되면 후속 분리에 큰 재작업이 발생한다.

**Independent Test**: 계획 원본의 repository location만 별도 source로 바꿔도
동일 manifest가 검증되고 다운스트림 lock과 evidence가 같은 entity ID로 연결되는지
계약 수준에서 검증한다.

**Acceptance Scenarios**:

1. **Given** 저장소와 무관한 계획 배포 단위, **When** source location이
   변경되면, **Then** entity ID와 관계 의미가 보존된다.
2. **Given** 이전 manifest를 사용하는 다운스트림, **When** 새 계획 버전이
   존재하면, **Then** 자동으로 latest를 덮어쓰지 않고 `behind` 상태와 명시적
   수신 행동을 표시한다.
3. **Given** 이번 기능 완료, **When** 범위를 검토하면, **Then** 별도 저장소
   생성·발행·교차 저장소 쓰기는 수행되지 않고 후속 handoff 계약만 제공된다.

---

### User Story 6 - 문서와 제품 계획을 각 목적에 맞게 읽기 (Priority: P1)

PM/PL, 개발자와 하네스 사용자가 문서 탐색과 제품 계획 탐색을 서로 다른 페이지에서
수행한다. 하네스 가이드와 프로젝트 문서는 목록의 문맥을 유지한 채 본문을 읽고,
Planning Hub에서는 기능정의와 기능현황을 함께 확인하며 전체 화면 계층을 가로 확장
조직도로 조망한다.

**Why this priority**: 현재 문서 탭은 닫힌 legacy 영역에 묶여 선택 결과가 즉시
보이지 않고, 문서·기능정의·기능현황이 한 생성물에 중첩돼 사용자가 현재 목적을
인지하기 어렵다.

**Independent Test**: 로컬 파일로 문서 허브를 열어 하네스 가이드와 프로젝트 문서를
선택·검색·새로고침하고, 별도 Planning Hub로 이동해 같은 기능을 정의와 현황에서
이어 본 뒤 조직도형 사이트맵의 모든 화면과 연결을 탐색한다.

**Acceptance Scenarios**:

1. **Given** 문서 허브를 연 사용자, **When** 하네스 가이드 또는 프로젝트 문서를
   선택하면, **Then** 해당 목록과 첫 문서 본문이 접힌 중간 단계 없이 즉시 보인다.
2. **Given** 문서 목록, **When** 문서를 선택하고 페이지를 새로고침하면, **Then**
   같은 범주와 문서가 복원되고 원본 경로를 확인할 수 있다.
3. **Given** 문서 허브, **When** Planning Hub 링크를 선택하면, **Then** 별도 제품
   계획 페이지가 열리고 문서 목록이나 legacy 기능 보드가 섞이지 않는다.
4. **Given** Planning Hub의 기능 정의, **When** 기능을 고르고 기능 현황으로
   이동하면, **Then** 같은 stable feature ID의 Spec, task, 검증과 delivery 상태가
   선택된 채 표시된다.
5. **Given** 화면 구조, **When** 조직도 보기를 선택하면, **Then** 홈에서 큰 영역이
   좌우로 펼쳐지고 하위 화면은 아래로 이어지며 hierarchy와 direct navigation이
   서로 다른 연결로 표시된다.
6. **Given** 시각 캔버스를 사용하지 못하는 사용자, **When** `계층 목록(접근성 보기)` 또는
   비교표를 사용하면, **Then** 조직도와 동일한 screen ID와 연결 정보를 탐색한다.

---

### User Story 7 - 배치 중심 기능 정의와 구현 작업 현황 판단 (Priority: P1)

PM/PL과 구현 담당자가 기능을 어느 Surface·Screen·기능 그룹에 배치해야 하는지
먼저 파악한 뒤, 하나의 기능 정의에 연결된 프론트엔드·백엔드·DB·QA·인프라 작업을
Kanban에서 확인한다. 정상 사용자 여정과 복구 분기, 추적 누락과 근거를 같은 기능
컨텍스트에서 왕복하며 다음 행동을 결정한다.

**Why this priority**: 기능 정의와 구현 현황을 1:1로 취급하거나 내부 필드 순서대로
나열하면 사람이 “어디에 무엇을 만들고, 어떤 작업과 검증이 남았는가”를 동시에
판단할 수 없다.

**Independent Test**: `게시물 작성 및 발행` 기능을 선택해 주 화면과 보조 배치,
기능 그룹, Release별 구현 작업 3개 이상, 상태·보류·완료 근거를 확인한 뒤 사용자
흐름의 실패·복구와 추적 누락을 왕복한다. 같은 feature ID가 모든 보기에서 유지되고
planning source와 project-owned source가 수정되지 않는지 검증한다.

**Acceptance Scenarios**:

1. **Given** 기능 정의 보기, **When** Surface와 Screen을 선택하거나 기능명·사용자
   목표·화면·기능 그룹으로 검색하면, **Then** 해당 배치의 기능 목록과 선택 기능의
   목적, 행동, 규칙, 인수 조건, 주·진입·결과·지원 화면 및 작업 분포가 표시된다.
2. **Given** 하나의 기능 정의에 여러 구현 작업이 연결됨, **When** 기능 현황으로
   이동하면, **Then** 같은 feature ID가 유지되고 예정·진행 중·검토·검증·완료
   Kanban 열에 작업 단위 카드가 나타난다.
3. **Given** Kanban의 작업 카드, **When** Release, 기능 그룹, work type, 보류와
   검색 필터를 적용하거나 기능별 보기를 선택하면, **Then** 같은 정규화 작업 집합을
   필터링하며 기능 정의 아래 여러 작업 관계를 잃지 않는다.
4. **Given** 완료를 요청한 작업, **When** 연결 task, 인수 검증, 필수 근거 또는
   열린 차단 결정 조건이 충족되지 않으면, **Then** 완료로 승격하지 않고 누락 근거와
   복구 행동을 표시한다.
5. **Given** actor와 goal이 있는 사용자 흐름, **When** 흐름을 확인하면, **Then**
   정상 경로는 순서대로 보이고 결정·실패·복구는 발생 단계에 연결되며 각 단계의
   screen ID와 feature ID를 확인할 수 있다.
6. **Given** 기능이 많은 workspace, **When** 추적성을 열면, **Then** 전체 matrix
   대신 coverage와 누락 작업함이 먼저 표시되고 선택한 기능의 Need·Screen·Flow·
   Spec·WorkItem·Verification 국소 관계만 확장된다.
7. **Given** 일상 제품 계획 메뉴, **When** Planning Hub를 열면, **Then** 여섯 제품
   보기만 기본 탐색에 표시되고 전달 근거는 기능 현황에, 버전·digest·동기화·자동화
   기록은 운영·고급에 나타난다.
8. **Given** 새 planning package, **When** 프로젝트가 이를 수신하면, **Then**
   수신한 version과 digest를 명시적으로 기록하고 기존 Spec·task·작업은 사람이
   변경 제안을 채택하기 전까지 자동 수정되지 않는다.

### Edge Cases

- 사이트맵 node ID 또는 alias가 중복되면 어떤 node가 충돌했는지 표시하고
  정본 검증에서는 해결 전 통과시키지 않는다.
- 기능, 화면, 흐름 또는 검증 관계가 존재하지 않는 stable ID를 가리키면 unsafe
  edge를 표시에서 제외하고 broken reference를 보고한다.
- 계획 manifest의 digest와 downstream lock이 다르면 부분 적용하지 않고 마지막
  정상 projection을 유지한다.
- 선택적 source 하나가 없거나 invalid여도 다른 유효 source의 탐색은 유지하되,
  해당 source의 coverage는 성공으로 추정하지 않는다.
- source 수집 도중 새 변경이 들어오면 두 실행이 출력을 교차 덮어쓰지 않고 최신
  완결 실행만 현재 결과가 된다.
- 실제 downstream 원본이 비어 있거나 읽기 실패해도 demo data가 대신 표시되지
  않는다.
- 기능정의가 승인됐지만 priority, actor, 인수 조건 또는 필수 상태가 누락되면
  승인 badge만으로 ready로 판단하지 않는다.
- 같은 stable ID가 계획에서는 폐기되고 downstream에서는 계속 구현 중이면
  삭제하지 않고 conflict와 migration/alias 필요성을 보고한다.
- 로컬 훅이 실행되지 않거나 timeout돼도 명시적 복구와 merge 전 검증이 같은
  결과를 재현한다.
- 화면을 그래프로 표현할 수 없는 환경에서도 tree, table과 텍스트 흐름으로 모든
  핵심 정보를 확인할 수 있어야 한다.
- 문서 하나의 본문 변환이 실패해도 다른 문서의 목록과 본문은 유지하고 실패한
  문서의 원본 경로와 복구 행동을 표시해야 한다.
- 문서 fragment가 존재하지 않는 범주나 경로를 가리키면 첫 유효 문서 또는 명시적
  빈 결과로 복구하고 빈 화면을 표시하지 않아야 한다.
- 두 생성 페이지 중 하나만 오래된 경우 정본 검증은 전체가 최신이라고 보고해서는
  안 된다.
- 명시적 구현 작업이 없는 기능은 `0%`나 실패가 아니라 `작업 미생성`으로 표시한다.
- 명시적 작업과 legacy feature delivery evidence가 함께 있으면 같은 기능의 legacy
  투영을 중복 생성하지 않는다.
- legacy evidence만 있는 기능은 기술 분야를 추론하지 않고 하나의 `unspecified`
  작업과 미분류 Release로 투영한다.
- 작업 ID가 중복되거나 parent feature, Release, status 또는 work type이 invalid면
  해당 작업을 제외하고 누락 작업함과 health에 복구 행동을 표시한다.
- `done` 상태를 받았더라도 task, 인수 검증, 근거 또는 차단 결정 조건이 부족하면
  완료 집계에 포함하지 않고 검토·검증 단계에 유지한다.
- `on-hold`는 별도 Kanban 열로 이동하지 않고 현재 기본 단계에 사유와 해제 조건을
  붙이며, 필터와 집계에서 별도로 식별한다.
- Release 필터 결과에 작업이 없으면 전체 기능의 완료율을 재사용하지 않고 해당
  Release의 `작업 미생성` 상태를 표시한다.
- 사용자 흐름의 target이 깨지거나 cycle이 있으면 무한 순회하지 않고 유효 정상
  경로와 순서형 대안을 유지하며 broken branch를 health에 보고한다.
- package version 또는 digest가 invalid하면 현재 Planning Lock과 last-good
  projection을 유지하고 부분 package를 적용하지 않는다.
- 새 package에서 기능이 삭제돼도 project-owned Spec·작업을 자동 삭제하지 않고
  orphan과 검토 제안으로 표시한다.
- 추적성 누락이 많아도 기본 DOM에 전체 관계망을 펼치지 않고 선택 기능 주변의
  제한된 관계만 표시한다.

## Requirements *(mandatory)*

### Functional Requirements

#### Workspace and information architecture

- **FR-001**: 허브는 Community Demo, Harness Internal과 실제 downstream을 서로
  다른 workspace로 취급하고 현재 source를 항상 표시해야 한다.
- **FR-002**: 하네스 preview는 Community Demo를 기본으로 표시해야 하며,
  downstream은 실제 project source를 기본으로 표시해야 한다.
- **FR-003**: Planning Hub는 개요, 화면 구조, 기능 정의, 기능 현황, 사용자 흐름과
  추적성을 여섯 개의 제품 보기로 제공하고 동기화·자동화 정보는 별도
  `운영·고급` 영역에서 설명해야 한다.
- **FR-004**: 화면 구조의 기본 diagram은 page/screen/content destination만
  node로 포함해야 한다.
- **FR-005**: 화면 구조는 parent-child hierarchy와 direct navigation을 서로
  다른 connector와 legend로 표시해야 한다.
- **FR-006**: 모든 diagram과 flow는 같은 source를 사용하는 searchable tree,
  table 또는 textual alternative를 제공해야 한다.
- **FR-007**: 사용자는 surface filter, screen search, zoom/fit과 keyboard
  selection으로 큰 사이트맵을 탐색할 수 있어야 한다.

#### Feature definitions and status semantics

- **FR-008**: 기능 목록은 stable ID, title, summary, actor, priority, owner,
  definition status, review time, linked artifact counts와 열린 결정 수를 비교 가능하게
  표시해야 한다.
- **FR-009**: 기능 상세는 intent, scope/non-goals, precondition, normal/alternative/
  failure behavior, processing/empty/error/permission state, rule, data/interface,
  quality requirement, acceptance, evidence와 open decision을 제공해야 한다.
- **FR-010**: P1/P2/P3는 항상 `우선순위`로 명시하고 release phase와 별도 값으로
  취급해야 한다.
- **FR-011**: 정의 상태, 구현 상태와 동기화 상태를 서로 다른 owner와 lifecycle로
  표시해야 한다.
- **FR-012**: feature definition source를 정규화할 때 확인되지 않은 사실을
  생성하지 않고 confirmed, inferred와 question의 provenance를 보존해야 한다.
- **FR-013**: 누락 상태는 `빈 화면`이 아니라 `연결된 기능정의 없음`, `연결된
  화면 없음`, `구현 근거 미수집`, `정의 불완전`처럼 원인별 명칭, 영향과 복구
  행동을 제공해야 한다.

#### Flows, traceability and delivery

- **FR-014**: 사용자 흐름은 actor, goal, action, decision branch와 success/failure
  end를 화면 계층과 분리해 표현해야 한다.
- **FR-015**: 추적성 보기는 need, feature, screen, flow, specification, task,
  test와 verification 관계를 stable ID로 양방향 탐색하게 해야 한다.
- **FR-016**: 추적성의 기본 표현은 coverage와 누락 작업함이어야 하며 선택 기능의
  국소 관계를 확장해야 한다. 전체 matrix/table과 CSV는 선택적 진단·export 보기로
  제공해야 한다.
- **FR-017**: 제품 정의, 구현 전달과 현실 조정의 coverage, 누락과 다음 행동은
  개요와 기능 현황에 흡수해 표시하고 별도 전달 제품 보기를 만들지 않아야 한다.
- **FR-018**: 승인된 정의는 acceptance verification 없이 완료로 표시되어서는
  안 된다.

#### Planning and downstream ownership

- **FR-019**: planning source는 need, sitemap, feature definition, flow, decision과
  definition status의 원본이어야 한다.
- **FR-020**: planning source는 project, schema version, manifest version, source
  revision, generation time와 digest를 포함한 versioned 배포 단위를 제공해야 한다.
- **FR-021**: downstream은 수신한 planning version/digest를 고정해 기록하고
  명시적 수신 없이 다른 버전으로 바꾸지 않아야 한다.
- **FR-022**: downstream은 consumed planning digest, source revision, Spec/task,
  구현 artifact, acceptance test와 verification을 delivery evidence로 제공해야 한다.
- **FR-023**: 조정은 양쪽 원본을 수정하지 않고 stable ID와 field별 aligned,
  behind, drifted, conflicted 또는 collection-failed 상태를 계산해야 한다.
- **FR-024**: 계획과 구현 차이는 planned value, observed value, evidence,
  rationale, proposer, decision owner와 resolution을 가진 change proposal로
  표현해야 한다.
- **FR-025**: conflict는 human decision이 기록되기 전까지 last-write-wins 또는
  자동 원본 덮어쓰기로 해결되어서는 안 된다.

#### Automation, recovery and observability

- **FR-026**: Claude, Codex, 사람과 merge 전 검증은 같은 deterministic
  normalization, validation, reconciliation과 projection 규칙을 사용해야 한다.
- **FR-027**: 지원되는 agent event는 공용 규칙을 호출하되 존재하지 않는 event를
  지원한다고 표시해서는 안 된다.
- **FR-028**: 변경 감지는 Spec뿐 아니라 구성된 planning input, sitemap,
  definition, flow, relation, status, task, implementation evidence와 verification을
  source group별로 판별해야 한다.
- **FR-029**: generated output은 다시 source change로 취급되지 않아야 하며 같은
  input은 같은 의미의 결과를 생성해야 한다.
- **FR-030**: hook을 거치지 않은 편집도 merge 전 필수 검증에서 invalid schema,
  digest mismatch, broken relation, stale projection과 unresolved conflict를
  검출해야 한다.
- **FR-031**: 자동화 실행은 trigger, source revision/digest, changed group,
  result, warning, duration과 마지막 정상 실행을 기록해야 한다.
- **FR-032**: 로컬 편의 갱신 실패는 사용자 작업을 손상시키지 않아야 하며 수동
  복구 행동과 merge 전 검증 결과를 제공해야 한다.

#### Demo, compatibility and trust

- **FR-033**: Community Demo는 실제 canonical harness data를 수정하거나 대체하지
  않는 독립 workspace여야 한다.
- **FR-034**: Demo는 user/admin/common surface의 화면, 기능정의, 세 사용자 목표
  흐름, 정상 연결과 의도적인 누락·drift·미검증 사례를 포함해야 한다.
- **FR-035**: Demo의 각 의도적 진단 사례는 기대 health 결과와 연결돼 회귀
  검증할 수 있어야 한다.
- **FR-036**: malformed parser input은 설명용 demo가 아니라 invalid test
  fixture로 격리해야 한다.
- **FR-037**: 기존 row-oriented 기능정의 source는 호환 입력으로 유지하되 풍부한
  기능 상세와 저장소 간 배포 데이터는 독립적으로 versioning해야 한다.
- **FR-038**: schema와 source 오류 시 부분적으로 만들어진 새 결과를 현재 정본으로
  사용하지 않고 마지막 정상 결과와 실패 상태를 표시해야 한다.
- **FR-039**: planning과 delivery 데이터는 실행 가능한 명령이나 secret을 포함하지
  않아야 하며 외부 text와 file reference를 안전한 경계 안에서 처리해야 한다.
- **FR-040**: 이번 feature는 별도 planning-hub repository 생성, publish, 자동
  cross-repository write 또는 PR merge를 수행해서는 안 된다.

#### Document hub and generated page separation

- **FR-041**: 문서 탐색과 제품 계획 탐색은 서로 다른 생성 페이지로 제공해야 하며
  두 페이지의 현재 목적과 이동 대상이 사이드바에서 명확해야 한다.
- **FR-042**: 문서 허브는 하네스 가이드와 프로젝트 문서의 범주, 검색 가능한 목록,
  선택 본문과 원본 경로를 제공하고 Planning Hub 내용을 중첩해 표시하지 않아야 한다.
- **FR-043**: Planning Hub는 기능 정의와 기능 현황을 함께 제공하고 같은 stable
  feature ID의 선택 상태를 두 보기에서 유지해야 한다.
- **FR-044**: 문서 선택은 범주와 문서 경로를 주소에 보존해 새로고침과 공유 진입에서
  같은 읽기 상태를 복원해야 한다.
- **FR-045**: Markdown 본문은 제목, 표, 목록, 링크, 인라인 코드와 코드 블록을
  읽을 수 있게 표시하되 실행 가능한 외부 입력으로 승격해서는 안 된다.
- **FR-046**: 화면 구조는 검색형 구조 탐색과 별도로 홈 중심 가로 확장 조직도 보기를
  제공해야 한다.
- **FR-047**: 조직도는 screen만 node로 포함하고 hierarchy는 실선, direct
  navigation은 점선 화살표, surface는 색상과 label로 함께 구분해야 한다.
- **FR-048**: 조직도는 pan, zoom과 fit, keyboard screen selection을 지원하고
  구조 탐색·tree·table과 동일한 screen ID 집합과 선택 상태를 사용해야 한다.
- **FR-049**: 생성과 정본 검증은 문서 허브와 Planning Hub를 하나의 projection
  단위로 취급하고 둘 중 하나의 누락·오래된 결과를 검출해야 한다.
- **FR-050**: 문서와 Planning renderer는 Markdown, sitemap, planning, delivery와
  status 원본을 수정하거나 외부 network 의존성을 추가해서는 안 된다.

#### Feature workbench continuation

- **FR-051**: Planning Hub는 planning-owned `FeatureDefinition` 하나와
  project-owned `FeatureWorkItem` 여러 개의 관계를 정본으로 사용하고 기능 정의에
  구현 상태를 직접 저장하지 않아야 한다.
- **FR-052**: 기능 정의는 `Surface → Screen → 기능 그룹 → 기능 정의` 순서로
  탐색할 수 있어야 하며 선택 기능의 목적, 행동, 규칙, 인수 조건과 연결 작업 집계를
  함께 제공해야 한다.
- **FR-053**: 기능 정의는 하나 이상의 화면 배치를 `primary`, `entry`, `result`,
  `support` 역할로 표현하고 목록의 기본 배치는 `primary`를 사용해야 한다.
- **FR-054**: 기능 정의 검색·필터는 기능명, 사용자 목표, 화면, 기능 그룹, 연결
  현황과 target Release를 지원하고 같은 feature ID를 기능 현황으로 전달해야 한다.
- **FR-055**: 구현 작업은 stable ID, parent feature ID, title, work type, Release,
  base status, 보류, task reference와 evidence reference를 제공해야 하며 기능 정의에
  downstream repository 위치를 요구해서는 안 된다.
- **FR-056**: work type은 `frontend`, `backend`, `db`, `qa`, `infra`, `unspecified`를
  지원하고 base status는 `planned`, `in-progress`, `in-review`, `done`을 사용하며
  보류는 base status와 독립된 속성으로 취급해야 한다.
- **FR-057**: 작업 완료는 연결 task 완료, 모든 필수 인수 조건 검증, 필수 코드·
  테스트 근거와 열린 차단 결정 없음이 모두 확인될 때만 허용해야 한다.
- **FR-058**: 기능 현황 집계는 작업 0개, 예정, 진행 중, 검토·검증과 완료를 구분하고
  작업 수와 상태 분포를 함께 표시하며 Release 필터가 활성화되면 해당 작업만
  집계해야 한다.
- **FR-059**: 기능 현황 기본 보기는 기능 컨텍스트가 있는 네 열 Kanban이어야 하며
  같은 정규화 작업을 기능 정의 아래 묶는 기능별 계층 보기를 제공해야 한다.
- **FR-060**: Task·코드·인수 검증 근거와 완료 차단 사유는 기능 현황 카드와 상세에
  표시해야 하며 별도 `전달 현황` 제품 보기를 요구해서는 안 된다.
- **FR-061**: 사용자 흐름은 actor와 goal별 정상 경로를 순서대로 제공하고 결정,
  실패와 복구를 발생 단계에 연결하며 screen/feature ID와 순서형 접근성 대안을
  보존해야 한다.
- **FR-062**: 추적성 기본 보기는 전체 matrix가 아니라 coverage 요약과 누락
  작업함이어야 하며 선택 항목의 Need·Feature·Screen·Flow·Spec·WorkItem·
  Verification 국소 관계를 제공하고 전체 matrix/CSV는 보조 기능으로 유지해야 한다.
- **FR-063**: 일상 제품 계획 navigation은 개요, 화면 구조, 기능 정의, 기능 현황,
  사용자 흐름과 추적성 여섯 보기로 구성하고 version/digest, 동기화 health와 자동화
  기록은 `운영·고급`에 배치해야 한다.
- **FR-064**: planning source는 프로젝트별 sitemap, feature definition, user flow,
  decision과 Release를 immutable version/digest package로 제공해야 한다.
- **FR-065**: 프로젝트는 수신한 package version/digest와 수신 시각을 Planning
  Lock에 명시적으로 기록하며 새 package를 자동 채택해서는 안 된다.
- **FR-066**: Spec, task, FeatureWorkItem, 구현 상태와 근거의 생성·분할·완료 판정은
  프로젝트가 소유하며 planning-hub는 기술 작업을 사전 생성해서는 안 된다.
- **FR-067**: 새 package의 추가·변경·삭제 기능은 project-owned source를 직접
  수정하지 않고 영향과 orphan을 가진 변경 제안으로 표시하고 사람이 채택한 뒤에만
  해당 owner의 원본을 바꿀 수 있어야 한다.
- **FR-068**: 명시적 작업이 없는 기존 feature delivery evidence는 기능별 하나의
  `unspecified` legacy 작업으로 투영하되 title, path 또는 task text로 기술 분야를
  추론해서는 안 된다.
- **FR-069**: work item 또는 package source가 malformed/invalid이면 부분 결과를
  정본으로 승격하지 않고 유효 항목과 last-good projection을 유지하며 정확한 source,
  영향과 복구 행동을 표시해야 한다.
- **FR-070**: 화면 구조의 시각 조직도와 같은 screen source를 사용하는 보조 tree는
  `계층 목록(접근성 보기)`로 명명하고 구조 탐색·표와 screen ID 선택을 공유해야 한다.

### Key Entities *(include if feature involves data)*

- **Workspace**: 현재 탐색하는 제품/하네스/downstream source와 기본 표시 정책을
  나타낸다.
- **User Need**: 사용자·사업 문제, 출처, 가정과 관련 feature를 가진 계획 항목이다.
- **Screen**: stable ID, surface, hierarchy, direct navigation, 접근 조건을 가진 실제
  화면 또는 content destination이다.
- **Feature Catalog Entry**: 검색·필터·비교를 위한 기능 요약과 priority,
  definition status, owner와 연결 ID를 가진다.
- **Feature Detail**: intent, behavior, state, rule, interface, acceptance와 evidence를
  가진 구현 판단 단위다.
- **User Flow**: actor와 goal을 중심으로 action, decision branch와 end를 연결한다.
- **Planning Manifest**: planning entities, version, revision, provenance와 digest를
  묶은 승인 계획 배포 단위다.
- **Planning Lock**: downstream이 소비한 manifest identity와 적용 상태를 기록한다.
- **Delivery Evidence**: downstream revision에 기반한 Spec/task, 구현, test와
  verification 사실을 묶는다.
- **Traceability Link**: 두 stable entity 사이의 typed relation, evidence와
  certainty를 나타낸다.
- **Sync Result**: 두 source의 관계를 aligned, behind, drifted, conflicted 또는
  collection-failed로 계산한 projection이다.
- **Change Proposal**: planned/observed difference, evidence, rationale, owner와
  human disposition을 가진 역방향 제안이다.
- **Automation Run**: trigger, input identity, result, warning, duration과 recovery
  information을 가진 실행 기록이다.
- **Document Projection**: 범주, 제목, 경로, 안전하게 표시할 본문과 변환 health를
  가진 읽기 전용 문서 표현이다.
- **Generated Page Set**: 같은 source revision에서 생성된 문서 허브와 Planning
  Hub의 경로와 내용을 묶는 projection 단위다.
- **Organization Layout Node**: screen ID, depth, surface와 결정적 좌표를 가진
  조직도 배치 결과이며 원본 sitemap을 수정하지 않는다.
- **Feature Definition**: 기능 그룹, 사용자 목적과 행동, 인수 조건, target Release와
  주·진입·결과·지원 화면 배치를 가진 planning-owned 제품 정의다.
- **Feature Work Item**: 하나의 Feature Definition을 실제 프로젝트 구조에 맞게
  나눈 project-owned 기술 작업이며 work type, Release, 상태, 보류, task와 근거를
  가진다.
- **Feature Status Rollup**: 선택 기능과 Release에 속한 작업의 base status와 보류
  분포를 계산한 읽기 전용 현황이다.
- **Planning Package Receipt**: 프로젝트가 명시적으로 수신한 immutable planning
  package의 version, digest와 수신 시각을 고정한 기록이다.
- **Traceability Coverage**: 기능별 필수 관계의 완전성, 누락·깨진 관계와 선택 기능
  주변의 제한된 관계를 계산한 진단 projection이다.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 처음 보는 PM/PL 또는 개발자 5명 중 최소 4명이 2분 안에 사이트맵,
  사용자 흐름, 추적성 coverage와 기능 현황 근거의 차이를 올바르게 설명하고 원하는
  화면, 기능 또는 구현 작업을 찾는다.
- **SC-002**: Community Demo의 14개 화면, 12개 기능과 3개 목표 흐름이 모두
  stable ID로 탐색되며 기대 정상·진단 사례가 100% 일치한다.
- **SC-003**: 기능 상세 표본 12개 중 100%가 actor, user goal, normal behavior,
  적용 가능한 failure/recovery state와 최소 1개의 측정 가능한 acceptance criterion을
  표시하거나 누락 이유를 `정의 불완전`으로 보고한다.
- **SC-004**: 모든 기능에서 priority, definition, delivery와 sync status가 서로
  다른 label과 owner로 100% 구분된다.
- **SC-005**: 계획/구현 변화 조합의 검증 표본에서 aligned, behind, drifted,
  conflicted와 collection-failed가 100% 기대 상태로 계산되고 source-of-truth
  파일은 변경되지 않는다.
- **SC-006**: 동일한 planning version과 delivery evidence를 10회 반복 처리해도
  digest와 의미상 projection이 동일하며 추가적인 재생성 loop가 발생하지 않는다.
- **SC-007**: Claude, Codex와 agent hook을 거치지 않은 편집의 검증 표본이 merge
  전 동일한 invalid schema, broken relation, stale projection과 conflict 결과를
  100% 검출한다.
- **SC-008**: 실제 downstream source가 없거나 invalid인 모든 검증 표본에서 Demo
  fallback은 0건이며 source, impact, last success와 recovery action이 표시된다.
- **SC-009**: graph를 사용하지 않는 keyboard/text-only 검증에서도 사이트맵과 세
  사용자 흐름의 모든 node, branch와 end를 탐색할 수 있다.
- **SC-010**: 별도 repository location을 사용하는 planning source 표본이 기존과
  동일한 entity ID, manifest 의미와 downstream relation을 유지한다.
- **SC-011**: 하네스 가이드와 프로젝트 문서 표본 100%에서 범주 선택 후 목록과 첫
  본문이 한 번의 사용자 행동 안에 표시된다.
- **SC-012**: 선택 문서 URL 표본 100%가 새로고침과 직접 진입 후 같은 범주, 제목과
  원본 경로를 복원한다.
- **SC-013**: Community Demo 조직도의 14개 screen ID와 hierarchy/direct-navigation
  edge가 source와 100% 일치하고 feature, Spec 또는 test node는 0개다.
- **SC-014**: 1280px, 768px와 375px 검증에서 문서 읽기와 Planning Hub 왕복,
  조직도 fit·선택 및 text alternative를 키보드로 완료할 수 있다.
- **SC-015**: 생성 페이지 하나를 누락하거나 이전 내용으로 바꾼 모든 검증 표본에서
  merge 전 정본 검사가 100% 실패한다.
- **SC-016**: Community Demo의 표본 기능 하나에 frontend, backend와 qa를 포함한
  구현 작업 3개 이상이 연결되고 각 카드의 parent feature ID, Release, work type과
  상태가 source와 100% 일치한다.
- **SC-017**: 12개 기능 정의 표본의 100%가 Surface·Screen·기능 그룹에서 탐색되고
  주 화면과 적용 가능한 보조 배치 및 연결 작업 분포를 2번 이하의 선택으로 확인할
  수 있다.
- **SC-018**: planned, in-progress, in-review, done, on-hold와 완료 근거 누락 표본의
  100%가 기대 Kanban 열·label·차단 행동으로 표시되고 Release 필터 집계가 source와
  일치한다.
- **SC-019**: 3개 목표 흐름의 정상 단계, 결정, 실패·복구 branch, screen/feature
  관계가 source와 100% 일치하며 cycle/broken target 표본은 무한 순회 없이 health를
  보고한다.
- **SC-020**: 500개 기능, 2,000개 구현 작업의 추적성 표본에서 coverage와 누락 수가
  100% 일치하고 기본 관계 탐색기는 선택 깊이 밖의 전체 관계망을 표시하지 않는다.
- **SC-021**: planning package 추가·변경·삭제·invalid 표본의 100%에서 명시적 수신
  전 Planning Lock과 project-owned Spec·task·work item의 byte 내용이 바뀌지 않는다.
- **SC-022**: 1280×720, 768×1024와 375×812에서 여섯 제품 보기, `운영·고급`,
  `계층 목록(접근성 보기)`, 기능 정의↔작업 현황 왕복과 근거 상세을 키보드만으로
  완료하고 색상 없이 상태·누락을 구분할 수 있다.
- **SC-023**: 500개 기능, 2,000개 구현 작업, 100개 화면과 50개 흐름 표본에서 외부
  network 없이 두 생성 페이지를 2초 안에 만들고 브라우저 console error가 0건이다.
- **SC-024**: legacy delivery evidence 표본 100%가 기능별 최대 하나의
  `unspecified` 작업으로 투영되고 기술 분야를 임의로 분류한 사례는 0건이다.

## Assumptions

- 현재 `data/`, 기존 001~009 Spec과 생성 허브는 migration 동안 읽을 수 있는
  상태로 보존한다.
- Community Demo는 제품 정보구조를 설명하기 위한 고정된 커뮤니티 도메인을
  사용하며 실제 production 사용자 데이터를 포함하지 않는다.
- P1/P2/P3의 구체적 의미는 project config에서 선언하되 기본 UI는 항상
  `우선순위`로 표시한다.
- 실제 route/API 자동 탐지는 project stack별 신뢰도가 다르므로 선언 데이터와
  scanner evidence를 함께 허용하고 certainty를 표시한다.
- local hook과 watcher는 빠른 피드백 수단이며 merge 전 검증이 최종 일관성
  gate다.
- cross-repository publish와 write 권한은 미래 planning-hub feature에서 별도로
  승인한다.
- 구현은 TDD로 진행하고 schema, reconcile, renderer, adapter parity와 demo
  acceptance에 대한 테스트 작업을 명시적으로 포함한다.
- 문서 허브와 Planning Hub는 로컬 `file://`에서 외부 서버 없이 동작하고 한 번의
  문서 생성 명령으로 함께 갱신한다.
- planning-hub의 `PlanningPackage`는 현재 `PlanningManifest` envelope의 후속 의미로
  다루며 별도 repository·publish transport 구현은 후속 feature로 남긴다.
- 명시적 FeatureWorkItem은 Release를 필수 속성으로 가지며 legacy evidence의
  Release를 확인할 수 없으면 `unassigned`로 보존하고 임의 추론하지 않는다.
- `on-hold`는 base status를 대체하지 않으며 사유와 해제 조건이 있는 별도 속성이다.
- 기능 정의의 priority는 세부 참고 정보로 유지할 수 있지만 배치 탐색과 작업 현황의
  기본 분류 기준으로 사용하지 않는다.
- 전체 traceability matrix와 CSV는 진단·export를 위한 보조 보기이며 기본 화면의
  확장 가능한 coverage 계약을 대체하지 않는다.
