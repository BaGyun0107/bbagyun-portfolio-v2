# Quickstart: 검증 시나리오 가이드

각 시나리오는 spec.md의 SC와 대응한다. 결정 근거는
[research.md](research.md) 참조.

## V1. 대화형 초기화 (SC-001, SC-002)

```sh
# 새 폴더에 하네스 clone (기존 경로) 또는 스켈레톤 생성 (신규 경로)
# 에이전트 세션 시작: ./harness claude
# "새 프로젝트 초기화해줘" → 질문 답변만으로 완료
npm test  # init-project-skill-contract 테스트 GREEN (히스토리 재시작 질문 포함)
```

기대: 플래그 문서 없이 초기화 완료, 신규 경로에서 git 히스토리 재시작 보장.

## V2. 스킬·CLI 동등성 (SC-003)

스킬 계약 테스트가 "스킬 문서의 실행 명령 = 정본 CLI 호출"을 검사. 동일
입력의 스킬 경로와 CLI 경로 결과 트리를 비교(수동 1회 + 계약 테스트 상시).

## V3. 스켈레톤 → bootstrap 도달성 (SC-004, SC-005)

```sh
mkdir /tmp/pilot-019 && cd /tmp/pilot-019
<harness>/harness new-project .     # 스켈레톤 생성
./harness bootstrap                  # lock 자가 부트스트랩 → materialize
./harness doctor                     # 통과 확인
npm test                             # new-project-skeleton 테스트 GREEN
```

기대: 2단계로 doctor 통과, 하네스-자체 작업 상태(업스트림 spec·테스트·허브
산출물·감사 기록) 0건.

## V4. 릴리스 동기화 (SC-006)

스켈레톤은 lock 채널(latest-minor)로 bootstrap 시점에 최신 릴리스를
해석하므로 별도 발행 단계가 없다. 검증: 릴리스 후 신규 스켈레톤 생성 →
materialize된 버전이 최신 릴리스와 일치.

## V5. 품질 게이트

```sh
./harness rule-check && ./harness context-check && ./harness doctor && npm test
```

기대: 4종 모두 통과.
