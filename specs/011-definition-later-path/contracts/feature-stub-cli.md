# Contract: feature:stub 명령

```sh
mise run feature:stub "<FEAT-ID>" "<title>" [summary] [ownerRole]
```

동작:

1. `<FEAT-ID>`가 `FEAT-`로 시작하는지 검증. 아니면 exit 1 + 사용법.
2. 기본 워크스페이스(`data/hub-workspaces.json`의
   `defaultWorkspaceId`)의 planningSource에서
   `feature-definitions.json`을 읽는다(없으면 빈 배열로 시작).
3. 같은 `id`가 이미 있으면 **아무것도 쓰지 않고** 기존 항목
   정보(definitionStatus 포함)를 출력하고 exit 0.
4. 없으면 draft 항목을 추가하고, 같은 planningSource의
   `decisions.json`에 소급 상세 열린 결정을 추가한다(파일 없으면
   생성; 이미 같은 결정 ID가 있으면 중복 생성하지 않는다).
5. 결과 요약 출력: 생성된 ID, 대상 파일 경로, 다음 단계 안내
   (`mise run docs:build`).

실패 모드: planningSource 경로가 저장소 밖이거나 쓰기 불가면 제안
메시지만 출력하고 exit 1 (fail-open은 빌드 경로에만 적용, 명령 자체는
명확히 실패를 알린다).

# Contract: 빌드/게이트 출력

- `docs:build` 힌트: `미등록 기능 N건 — mise run feature:stub "<ID>"
  "<제목>"으로 등록하세요` (N>0일 때만).
- `planning:check` 리포트: 같은 개수를 경고로 표시하되 exit 0 유지
  (다른 실패가 없다면).

# Contract: status.yaml `featureId`

- 형식: `featureId: "FEAT-EXAMPLE"` (선택 필드, 문자열 1개).
- 스캐너는 값이 비었거나 문자열이 아니면 무시하고 경고 힌트를 낸다.
