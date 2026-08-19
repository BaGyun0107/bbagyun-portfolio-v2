# CLI Contract: 패키징 단일화

**Feature**: 014-packaging-unification

이 기능이 바꾸는 사용자 표면의 계약. 변경되지 않는 부분은 명시적으로
"불변" 으로 적는다 — 다운스트림 CI 가 의존하기 때문이다 (FR-014).

## `./harness help`

### 기본 출력

일상 명령만 싣는다.

```
사용법:
  ./harness bootstrap     하네스 준비·갱신 (최초 설치와 일상 갱신 모두 이 명령)
  ./harness doctor        로컬 하네스 상태 점검
  ./harness codex         공통 preflight 실행 후 Codex 시작
  ./harness claude        공통 preflight 실행 후 Claude Code 시작

전체 명령 목록: ./harness help --all
```

**계약**:
- 종료 코드 0.
- 기본 목록에 없는 명령도 전부 정상 동작한다 (숨김이지 제거가 아니다).
- 마지막 줄에 `--all` 안내가 반드시 포함된다.

### `--all` 출력

전체 명령을 그룹 제목과 함께 출력한다. 그룹은 4개:

| 그룹 | 포함 |
|---|---|
| 일상 | `bootstrap`, `doctor`, `codex`, `claude` |
| 점검 | `context-check`, `rule-check`, `secret-surface-check`, `package-policy-check`, `workflow-check`, `codex-replay-check` |
| 패키지 관리 | `install`, `update`, `pin`, `pkg-sync`, `pkg-gc`, `migrate`, `update-check` |
| 레포 운영 | `release`, `manifest`, `skills-link`, `init-project`, `prune-downstream`, `wire-infisical`, `speckit-vendor`, `profile`, `role`, `notify-decision` |

**계약**:
- 종료 코드 0.
- 현재 `help` 가 나열하는 모든 명령이 `--all` 에 빠짐없이 나타난다.
  (테스트로 고정: 런처의 `case` 분기 목록과 대조.)

## `./harness bootstrap`

### 불변

- `--dry-run` 지원.
- 진행 표시 형식 `[bootstrap N/7]`, 번호 1~7 연속.
- 종료 코드: 0 성공/확인, 1 실패, 2 사용법·미지원 OS, 3 재실행 필요.
- macOS 외 OS 에서 exit 2.

### 추가

7단계 이후 요약 블록을 출력한다.

```
준비 완료 요약:
  하네스 버전: 1.1.4 -> 1.2.0
  정리된 잔재: 9건
  조치 필요: 없음
```

변경이 없을 때:

```
준비 완료 요약:
  하네스 버전: 변경 없음 (1.2.0)
  조치 필요: 없음
```

**계약**:
- 요약은 진행 표시(1~7) 이후, 기존 "부트스트랩 완료" 안내 이전에 온다.
- 값이 없는 항목은 줄 자체를 생략한다 (정리된 잔재 0건이면 그 줄 없음).
- **요약 생성 실패가 `bootstrap` 을 실패시키지 않는다.** 요약을 못 만들면
  그 블록만 생략하고 종료 코드는 영향받지 않는다.
- `--dry-run` 에서는 요약을 출력하지 않는다 (실제 변경이 없으므로).

## `./harness update` (copy 모드)

### 불변

- `--check`, `--apply-harness`, `--major` 플래그와 각각의 동작.
- lock 모드에서의 조기 종료 동작.
- 종료 코드.

### 추가

copy 모드에서 갱신 적용 시 은퇴 예고를 출력한다.

```
안내: copy 방식 하네스는 단계적으로 은퇴합니다.
  이 레포를 패키징(lock) 구조로 전환하려면:
    ./harness migrate
    git push
  전환 후에는 ./harness bootstrap 하나로 준비·갱신이 끝납니다.
```

**계약**:
- copy 모드에서만 출력된다. lock 모드는 이미 조기 종료하므로 자연히 제외된다.
- 경고 출력 후에도 갱신은 정상 완료된다 (종료 코드 불변).
- stderr 가 아니라 stdout 으로 낸다 — 실패가 아니라 안내다.

## `./harness doctor`

### 불변

- 기존 검사 항목 전부와 fail/warn 집계, 종료 코드.

### 추가

배포 모드를 한 줄 보고한다.

```
ok: 배포 모드 lock (버전 1.2.0)
```

또는

```
ok: 배포 모드 copy — 전환하려면 ./harness migrate
```

**계약**:
- 두 경우 모두 `ok` 다. copy 모드는 아직 지원되는 상태이므로 fail/warn 이
  아니다.
- 이 줄 추가가 기존 fail/warn 집계 수를 바꾸지 않는다.

## 상태 파일 (내부 계약)

`.harness/state/bootstrap-summary` 의 형식은
[data-model.md](../data-model.md#1-준비-결과-요약-신규) 참조.

**계약**:
- 이 파일은 내부 구현이며 사용자가 직접 읽거나 쓰지 않는다.
- 구버전 스크립트가 이 파일을 모르는 상태로 섞여도 `bootstrap` 이 깨지지
  않는다 (알 수 없는 줄 무시, 파일 없으면 요약 생략).

## 영향받지 않는 것 (FR-014)

다음은 이 기능이 절대 건드리지 않는다. 다운스트림 CI 10곳 이상이 의존한다.

- `harness` 런처 7~55행의 lock 자가 부트스트랩 경로.
- `harness.lock` 스키마와 채널 해석.
- `pkg-sync` / `materialize` 의 링크 구조.
- CI 워크플로우가 호출하는 `.harness/scripts/checks/**` 경로.
