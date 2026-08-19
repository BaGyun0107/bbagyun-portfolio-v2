# Quickstart Validation: 하네스 원클릭 온보딩 부트스트랩

계약 상세는 [contracts/bootstrap-cli.md](./contracts/bootstrap-cli.md) 참조.

## 사전 조건

- macOS, 레포 clone 완료, 레포 루트에서 실행

## 시나리오 1 — dry-run (안전 검증)

```sh
./harness bootstrap --dry-run
```

기대: 7단계가 순서대로 `dry-run:` 접두사로 출력되고 실제 변경 0건, exit 0.

## 시나리오 2 — 완료 상태 재실행 (멱등성, US2/SC-003)

```sh
time ./harness bootstrap
```

기대: 모든 단계 "확인됨"으로 스킵, 1분 이내 종료, `~/.zshrc`에 중복 라인
없음(`grep -c 'mise activate' ~/.zshrc` == 1), exit 0.

## 시나리오 3 — 미지원 OS (FR-002)

```sh
node --test tests/bootstrap-flow.test.mjs
```

기대: uname을 Linux로 스텁한 테스트 케이스가 "변경 0건 + exit 2"를 검증하고
통과한다.

## 시나리오 4 — 가드레일 carve-out 회귀 (V3)

```sh
node --test tests/tool-permission-guard-carveout.test.mjs
```

기대: 차단 유지(bun/yarn을 커맨드로 실행) + 통과(mise 도구 관리, 검색 인자)
케이스 전부 green.

## 시나리오 5 — 신규 머신 실사용 (SC-001/002/005)

도구가 없는 팀원 머신(또는 새 macOS 사용자 계정)에서:

```sh
git clone <다운스트림 레포> && cd <레포> && ./harness bootstrap
```

기대: 대화형 입력 ≤ 2회(CLT 창, gh 로그인), 15분 이내, 종료 시 doctor 통과
요약. Superpowers는 자동 설치 성공 또는 수동 안내 표시 중 하나(US3).
