# 다중 세션 오케스트레이션 테스트베드 설계

- 날짜: 2026-08-12
- 상태: 사용자 승인 완료 (harness 세션 브레인스토밍)
- 실행 위치: 그누보드5 멀티몰 마이그레이션 레포 (php-monolith)
- 실행 주체: testbed 세션 (이 문서를 전달받아 셋업 수행)

## 1. 목적과 배경

사용자가 설계에만 집중하고 실행은 세션 계층이 처리하는 구조를 실제 프로젝트에서
검증한다. 검증 후 하네스 승격 여부를 판단한다.

- 구조: planner(설계, 사용자 상주) + shipper(릴리즈 매니저) + 워커(서브에이전트).
- 워커는 독립 세션이 아니라 shipper가 스폰하는 이름 붙은 백그라운드 서브에이전트다.
- shipper는 얇은 오케스트레이터다: 판단·라우팅만 직접 하고, 리뷰·진단·검증 등
  무거운 작업은 일회성 서브에이전트에 위임한다 (컨텍스트 보존 + 셀프 리뷰 편향 방지).
- 상태의 진실은 채팅이 아니라 커밋된 파일이다.
- 실험 대상: 마이그레이션 레포의 확산 로드맵 호차 062~073
  (정본: `docs/architecture/db-consolidation.md` 6절).
- 구성 수위는 B안(반자동형): 프로토콜은 문서로, 컨텍스트 안전망 3종만 결정적
  장치(훅·statusline)로 설치. 역할의 스킬화/에이전트 정의는 관찰 후 2라운드에서.

## 2. 세션 토폴로지와 네이밍

| 이름 | 역할 | 비고 |
|---|---|---|
| `planner` | 브레인스토밍 ~ speckit-specify/clarify, 결정 승인 창구 | 사용자 상주. chief 역할 승계 |
| `shipper` | 배정·감독·독립 리뷰·머지 순서·PR 준비 | 사전 allowlist로 무인 운행 |
| `worker-<호차>` | 자기 worktree에서 codi-auto-loop 실행 | `isolation: "worktree"`, 동시 상한 3 |

- 세션 이름은 `--name`으로 명시 지정 필수. 명시 이름은 `/clear` 후에도 유지되어
  SendMessage 주소가 끊기지 않는다.
- 기존 세션 정리: chief는 정본 미반영 지식을 커밋하는 마지막 턴 후 종료,
  second는 059 온보딩을 자기 손으로 완주 후 종료. 이후 신규 작업은 전부
  planner → shipper 체계로만 진입한다. "구세션에 살짝 부탁"은 금지
  (테스트베드 관찰 데이터 오염).

### 흐름 (호차 1개 기준)

1. planner: 브레인스토밍 → specify → clarify (사용자 질의 포함) → spec 커밋.
2. shipper: spec 확인 후 워커 스폰 (스폰 프롬프트에는 spec 경로 + auto-loop 지시
   + 보고 규칙 + 작업 브랜치 체크아웃 지시. 구현 지시는 하지 않는다).
   브랜치 지시가 필요한 이유: worktree 기점이 현재 브랜치가 아니라 main 계열일
   수 있음이 스모크에서 실측됨 (2026-08-12, testbed 보고 quickstart V4).
3. 워커: codi-auto-loop 실행. tasks.md 리뷰 게이트에서 정지 → shipper에 보고.
4. shipper: 게이트 승인 (설계 차원 의문이면 planner 경유 에스컬레이션).
   SendMessage로 워커 재개.
5. 워커 "Converged" 보고 → shipper 릴리즈 파이프라인 (3절) → PR → 사용자 머지.

## 3. shipper 운영 프로토콜

### 수령과 배정
- 입력 단위는 "clarify 완료 spec이 있는 호차"뿐. spec 없는 요청은 planner로 반려.
- A그룹(쓰기 전환 6도메인)은 정본 순서 준수, 동시 1개만. B그룹(~50테이블)은
  독립 호차끼리 병렬. 총 동시 워커 상한 3.

### 작업 큐 (스택은 레포에 쌓는다)
- planner가 spec을 계속 넘겨도 shipper 컨텍스트에 쌓지 않는다. 큐의 진실은
  `docs/testbed/shipper-state.md` (실행 중 / 대기 큐 / 리뷰 대기 / 완료·PR).
- 슬롯이 비면 큐 맨 앞에서 꺼내 배정하고 상태 파일을 갱신·커밋한다.
  FIFO 기본, A그룹 순서 제약이 우선.
- 따라서 `/clear` 후에도 상태 파일 재로드만으로 큐가 복원된다.

### 감독 루프
- tasks.md 게이트 보고: 작업 분해가 spec과 맞는지만 검토해 승인.
- 워커 blocked 보고: 진단은 일회성 서브에이전트에 위임, shipper는 결론만 받아
  재지시 또는 에스컬레이션 판단.
- shipper는 diff·로그를 직접 읽지 않는 것이 원칙. 무거운 분석은 전부 위임.

### 릴리즈 파이프라인 (워커 Converged 후)
1. 독립 리뷰는 ultracode(Workflow 멀티에이전트)로 실행한다. 구현에 관여하지
   않은 신선한 컨텍스트에서, 해당 워커 브랜치의 diff만 입력으로:
   - 차원별 리뷰어 병렬: 무회귀("전환 전후 고객이 보는 값·동작 동일") /
     테넌트 스코프·fail-closed 정합성 / 정본 문서(db-consolidation.md) 합치.
   - 발견(finding)마다 적대적 검증 1회 — 반박 시도 후 살아남은 것만 결함으로 채택.
   - 기본 규모는 리뷰어 3 + 발견별 검증 1이며, diff 규모에 따라 shipper가
     조절한다. 검증 결과는 spec 디렉토리에 기록.
   - 워커 실행은 ultracode가 아니다 (일반 codi-auto-loop). 팬아웃은 shipper
     계층의 리뷰 단계에만 둔다 — 이중 팬아웃 금지.
2. 머지 순서 결정 (A그룹 순서 준수, B그룹 완료순). 실질적 코드 판단이 필요한
   충돌은 해당 워커에게 반려.
3. 검증 증거(테스트, 해당 도메인 점검 예: `mise run pii:verify`)를 spec 디렉토리에 기록.
4. PR 생성 (한국어 규칙). 머지는 절대 하지 않는다 — planner 경유로 사용자에게 보고.

### 에스컬레이션 기준 (planner에게 올리는 것)
- 설계·정본 문서와 어긋나는 발견, spec 해석이 갈리는 지점.
- 가드레일 승인 대상 작업(DB 파괴적 조작 등)이 필요해진 경우.
- 동일 문제로 워커 재시도 2회 실패.
- 그 외는 shipper 재량 처리 + 상태 파일에 기록만.

## 4. 컨텍스트 관리

### 결정적 장치 3종 (설치 대상)
1. statusline: `context_window.used_percentage` 상시 표시, 50% 초과 시 경고 표기.
2. PreCompact 훅: 컴팩션 직전 `.harness/state/handoff-<세션이름>.md`(로컬 전용)에
   진행 중 작업·미결 결정·다음 단계를 자동 기록.
3. SessionStart 훅: 시작/clear 시 자기 이름의 핸드오프 파일이 있으면
   additionalContext로 재주입 (10,000자 상한 — 요점만, 상세는 상태 파일·spec 링크).

### 운영 규칙
- clear 우선 원칙: 컴팩션(손실 압축)보다 경계에서의 clear + 파일 재로드(무손실)가
  우선. autocompact는 기본값 유지, 백스톱으로만.
- clear 타이밍은 세션이 먼저 알린다: planner는 spec 하나 완성 시, shipper는
  웨이브 경계(실행 중 워커 0)에서 "핸드오프 기록 완료, clear 타이밍" 보고.
- shipper는 워커 실행 중 clear 금지. 백그라운드 서브에이전트는 스폰 세션에
  묶이므로 clear 시 고아화된다. 실행 중 컨텍스트 한계는 컴팩션 백스톱이 받는다
  (컴팩션은 세션 유지라 워커가 고아화되지 않음).
- CLAUDE.local.md에 Compact Instructions: "워커 상태·큐·머지 순서·미결 결정은
  요약에서 반드시 보존".
- 워커는 clear 대상 아님. 워커 컨텍스트가 길어지면 호차 분할이 잘못됐다는
  신호로 planner에 보고한다.

## 5. 상태 관리와 인수인계

각 파일에 쓰는 주체는 하나다. 워커는 자기 spec 디렉토리 안에서만 쓴다.

| 파일 | 쓰기 주체 | 내용 | 갱신 시점 |
|---|---|---|---|
| `specs/<NNN-호차>/` | planner 생성 → 워커 갱신 | spec·plan·tasks.md·검증 기록 | 각 단계마다 |
| `docs/testbed/shipper-state.md` | shipper | 실행 중 / 대기 큐 / 리뷰 대기 / 완료·PR | 상태 변화마다 커밋 |
| `docs/testbed/decision-log.md` | planner | 사용자 결정 한 줄 기록 (날짜·결정·근거 링크) | 결정 시마다 |
| `docs/testbed/observations.md` | planner·shipper (섹션 구분) | 운영 마찰 한 줄 기록 | 발생 시마다 |
| `.harness/state/handoff-<이름>.md` | PreCompact 훅 | 컴팩션 직전 스냅샷 | 자동 |

- observations.md가 승격 판단의 원료다: "지시했는데 안 지켜진 것"(→ 에이전트
  정의 후보), "반복해서 다시 쓴 프롬프트"(→ 스킬화 후보), "수동 개입 순간".
- planner는 별도 상태 파일이 없다. planner의 산출물이 곧 spec과 decision-log다.
  "planner 컨텍스트에만 있는 정보"가 생기면 그게 clear 타이밍 신호다.

## 6. 승격 판정 기준

정량 게이트 (전부 충족해야 승격 후보):
1. 완주 3회 이상: 호차 3개 이상이 planner → shipper → 워커 → 독립 리뷰 → PR까지
   완주. 최소 1회는 동시 3워커 웨이브 포함.
2. 무인 운행: shipper가 권한 프롬프트로 멈춘 횟수 0.
3. 컨텍스트 생존: clear 또는 컴팩션 후 큐·워커 상태 무손실 복구 사례 1회 이상.
4. 품질 사고 0: 무회귀 위반이 머지 후 발견된 사례 0
   (독립 리뷰 단계에서 잡힌 건 구조가 일한 증거로 가점).

정성 판정 (observations.md 기반):
- 사용자 개입 횟수가 기존 방식(chief 직접 지휘)보다 늘었으면 불합격이 기본값.
- 승격 산출물 형태: 반복 프롬프트 → 스킬, 지시 불이행 규칙 → 에이전트 정의
  (도구 제한), 무문제 규칙 → 문서 그대로.

## 7. 셋업 순서 (testbed 실행 목록)

실행 위치는 마이그레이션 레포. 이 문서를 speckit-specify 입력으로 사용해 해당
레포의 spec으로 변환한 뒤 진행한다 (그 레포의 plan-of-record 규칙 준수).

1. 작업 브랜치 생성 → `docs/testbed/`에 프로토콜 문서 2개(planner용·shipper용)와
   `shipper-state.md`·`decision-log.md`·`observations.md` 스켈레톤 생성.
2. statusline 스크립트(컨텍스트 % + 50% 경고), PreCompact·SessionStart 훅 설치,
   `settings.local.json`에 shipper용 allowlist(git·mise·php lint·파일 도구 중심,
   가드레일 차단 목록은 그대로) 구성.
3. `CLAUDE.local.md`에 Compact Instructions 추가.
4. 스모크 테스트: 훅 발화, statusline 표시, 더미 서브에이전트 worktree 스폰 1회.
5. 기동: chief 마지막 턴(정본 미반영 지식 커밋) → `claude --name planner` →
   `claude --name shipper` → 파일럿: 워커 1개로 A그룹 첫 호차(정본 6절 순서의 첫 도메인) 1회전 → 프로토콜
   결함 수정 → B그룹 병렬 웨이브 시작.
   주의: chief 마지막 턴이 끝나기 전에는 해당 체크아웃에서 어떤 세션도 브랜치를
   전환하지 않는다 — chief의 미커밋 작업이 오염될 수 있음이 셋업 중 실측됨
   (2026-08-12, testbed 보고).

파일럿을 워커 1개로 시작하는 이유: 첫 회전에서 프로토콜 결함(보고 형식, 게이트
라우팅)을 고친 뒤 병렬로 가야 결함이 3배로 복제되지 않는다.

## 8. 제약과 근거 (공식 문서 확인 사항)

2026-08-12 claude-code-guide 에이전트로 공식 문서 검증한 사실:

- 자동 `/clear`는 불가: 훅·설정·모델 호출·타 세션 메시지 어느 경로로도 트리거할
  수 없다. 메시지 안의 `/clear`는 텍스트로만 도착한다.
- 훅 입력에는 컨텍스트 사용량이 없다. 유일한 관측 지점은 statusline JSON의
  `context_window.used_percentage` (입력 토큰 기준, 초기값 null 가능).
- autocompact 임계값은 `/autocompact <tokens>` 또는
  `CLAUDE_CODE_AUTO_COMPACT_WINDOW` (v2.1.221+, 토큰 수 기준).
- PreCompact 훅은 존재하며 `trigger`(manual/auto)를 받는다. 핸드오프 파일 기록에
  적합. SessionStart 훅 additionalContext는 10,000자 상한.
- `--name`/`/rename`으로 지정한 이름은 `/clear` 후에도 유지되어 SendMessage
  주소가 보존된다. AI 생성 제목은 유지되지 않는다.
- `/clear`의 세션 ID 재할당 여부는 문서에 명시가 없다. 필요 시 `/status`로
  전후 비교해 확인한다.
