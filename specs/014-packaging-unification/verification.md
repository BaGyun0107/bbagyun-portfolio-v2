# Verification: 패키징 단일화

**Feature**: 014-packaging-unification
**Date**: 2026-07-30

## Checklist

- [x] SC-001 준비·갱신 명령이 1개 — `./harness help` 가 일상 4개만 싣고 그중 준비는 `bootstrap` 하나
- [x] SC-003 재실행이 워킹트리에 변경 0건 (T031 자동 검증)
- [x] SC-004 소실 상태에서 1회 실행으로 복구 (T032 자동 검증)
- [x] SC-005 copy 갱신 시 전환 방법 100% 안내 (T017 자동 검증)
- [x] SC-006 배포 모드 보고 정확 (T019 자동 검증 + 실측)
- [x] SC-007 회귀 없음 — 655 → 695 pass / 0 fail
- [x] SC-008 실행 결과 요약 출력 (T008 자동 검증 + 실측)
- [x] FR-014 CI 의존 경로 불변 — 런처 자가 부트스트랩·lock 스키마·materialize 미변경
- [ ] SC-002 온보딩 판단 0회 — 문서는 정리했으나 실제 신규 팀원 온보딩으로 확인 필요 (T026)

## 기준선 (T001)

작업 시작 시점 `npm test`: **655 pass / 0 fail**.

## 구현 후 (T027)

`npm test`: **695 pass / 0 fail** — 기준선 대비 40건 증가, 감소 없음 (SC-007 충족).

## T023 — 신규 프로젝트 lock 배선

T022 가 통과하므로 `init-project.sh` 를 수정하지 않았다.

FR-012 의 안전망은 기존 테스트
`init-project bootstraps mise and harness install in one command` 다. 그 테스트가
`Step 5 → write_harness_lock → migrate.sh --fresh → run_harness_install_if_needed`
순서를 정규식으로 고정하고 있고, 이 순서가 곧 lock 구조 성립 조건이다 —
`install`(→ `pkg-sync` materialize)이 복사본 제거보다 먼저 돌면 링크가 생성되지
못해 혼합 상태가 된다.

실효성을 뮤테이션으로 확인했다:

```
$ sed -i '' 's|^write_harness_lock$|# write_harness_lock  (뮤테이션)|' \
    .harness/scripts/setup/init-project.sh
$ node --test tests/harness-cli.test.mjs
✖ init-project bootstraps mise and harness install in one command
```

원복 후 통과를 재확인했다. 중복 테스트를 새로 만드는 대신 기존 테스트에
FR-012 근거 주석을 남겼다.

## 적대적 검증에서 잡힌 것

구현을 5개 갈래로 나눠 병렬 실행하고, 각 결과에 "반증을 목적으로 하는" 검증
에이전트를 붙였다. 그 검증이 실제로 잡아낸 문제들 — 모두 조율 단계에서 수정했다.

| 문제 | 심각도 | 처리 |
|---|---|---|
| US1-help 가 T006/T007 테스트를 쓰지 않고 썼다고 보고 | critical | 직접 작성, 뮤테이션으로 실효성 확인 |
| 같은 에이전트가 기존 `wire-infisical` 테스트를 깨뜨리고 방치 | critical | `--all` 로 이전, 이유 주석 |
| 병렬 편집 lost-update 로 T019 테스트 유실 | critical | 재작성, 뮤테이션 확인 |
| T033 정규식이 앵커되지 않아 호출을 지워도 통과 | important | 줄 시작 + 따옴표 앵커로 교정 |
| US3 테스트가 뮤테이션 3건에 모두 생존 | critical | 무의미한 중복이라 삭제, 기존 안전망으로 대체 |
| 생산자 3종(pkg-sync/reclaim/doctor) 배선 테스트 부재 | important | 3건 추가 |
| `doctor` 단독 실행 시 요약 파일 무한 누적 | minor | 자기 종류만 갱신하도록 수정 + 테스트 |

마지막 항목은 수정 자체에도 버그가 있었다. `grep -v '^doctor '` 는 남는 줄이
없으면 exit 1 이라, `&& mv` 로 엮으면 모든 줄이 `doctor` 인 흔한 경우에 정리가
통째로 건너뛰어진다. 실측(3회 실행 후 3줄)으로 발견해 종료 코드를 무시하도록
고쳤고, 그 함정을 테스트로 고정했다.

## 뮤테이션 검증 기록

추가한 테스트가 실제로 동작을 검증하는지 확인한 목록.

| 테스트 | 뮤테이션 | 결과 |
|---|---|---|
| T006 | 기본 도움말에 `migrate` 누출 | 실패 감지 |
| T007 | `--all` 에서 `wire-infisical` 제거 | 실패 감지 |
| T019 | `ok` → `warn` 으로 변경 | 실패 감지 (3건) |
| T022 (기존) | `write_harness_lock` 호출 제거 | 실패 감지 |
| T033 | `skills-link.sh` 호출 주석 처리 | 실패 감지 (교정 후) |
| T033 | `harness install` 호출 주석 처리 | 실패 감지 (교정 후) |
| 생산자 배선 | `reclaimed` → `RECLAIMEDX` | 실패 감지 |

## 실측 확인

### 도움말 분할 (FR-004)

```
$ ./harness help
사용법:
  ./harness bootstrap     하네스 준비·갱신 (최초 설치와 일상 갱신 모두 이 명령)
  ./harness doctor        로컬 하네스 상태 점검
  ./harness codex         공통 preflight 실행 후 Codex 시작
  ./harness claude        공통 preflight 실행 후 Claude Code 시작

전체 명령 목록: ./harness help --all
$ echo $?
0
```

`--all` 은 그룹 4개(일상/점검/패키지 관리/레포 운영)와 27개 명령 전체를 출력한다.
숨긴 명령도 정상 동작을 확인했다 (`./harness profile` exit 0).

### 요약 출력 (FR-017)

```
$ printf 'version 1.1.4->1.2.0\nreclaimed 9\ndoctor 0/2\n' > <임시>/bootstrap-summary
$ node .harness/scripts/setup/bootstrap-summary.mjs <임시>/bootstrap-summary
준비 완료 요약:
  하네스 버전: 1.1.4 -> 1.2.0
  정리된 잔재: 9건
  조치 필요: 없음
```

변경 없음 케이스와 파일 부재 케이스(조용히 exit 0)도 확인했다.
`contracts/harness-cli.md` 의 예시와 일치한다.

### 배포 모드 보고 (FR-008)

```
$ ./harness doctor 2>&1 | grep "배포 모드"
확인: 배포 모드 copy — 전환하려면 ./harness migrate
$ ./harness doctor 2>&1 | tail -1
하네스 doctor 완료: 실패 0개, 경고 2개
```

`ok` 로 보고되어 집계를 바꾸지 않는다.

### 요약 파일 누적 방지

```
$ rm -f .harness/state/bootstrap-summary
$ ./harness doctor >/dev/null; ./harness doctor >/dev/null; ./harness doctor >/dev/null
$ cat .harness/state/bootstrap-summary
doctor 0/2
```

3회 실행에도 1줄. 다른 생산자 줄(`version`, `reclaimed`)은 보존됨을 별도 확인했다.

### 실제 다운스트림 실측 (T026 — quickstart 5·6절)

임시 clone 2개로 확인했다 (2026-07-30).

- **codi-hansi** (lock 모드, `harness.lock` 존재, v1.1.4)
- **codi-crawling** (copy 모드, `harness.lock` 없음)

copy 레포에서 갱신 적용:

```
$ cd <codi-crawling clone> && sh .harness/scripts/setup/update.sh --apply-harness
안내: copy 방식 하네스는 단계적으로 은퇴합니다.
  이 레포를 패키징(lock) 구조로 전환하려면:
    ./harness migrate
    git push
  전환 후에는 ./harness bootstrap 하나로 준비·갱신이 끝납니다.
Codi 하네스를 가져옵니다: ...#v2
project-owned 경로 건너뜀: 130
```

예고 후에도 갱신이 정상 진행된다 (FR-006).

lock 레포에서 같은 명령:

```
$ cd <codi-hansi clone> && sh .harness/scripts/setup/update.sh --apply-harness
lock 모드 레포입니다 — 하네스 동기화는 './harness pkg-sync' 가 담당합니다.
```

예고 없이 조기 종료한다 (FR-007).

배포 모드 보고 (FR-008):

```
codi-crawling: 확인: 배포 모드 copy — 전환하려면 ./harness migrate
codi-hansi:    확인: 배포 모드 lock (버전 1.1.4)
```

> 검증 방법 주의: `update.sh` 의 `ROOT_DIR` 은 스크립트 파일 위치 기준이다
> (`SCRIPT_DIR/../../..`). 이 저장소의 스크립트를 다른 cwd 에서 실행하면
> 대상 레포가 아니라 이 저장소(copy 모드)로 판정한다. 처음에 그 방식으로
> 돌려 "lock 레포인데 예고가 뜬다" 는 오탐을 만들었고, 대상 레포에 스크립트를
> 복사해 자체 경로로 실행해 재확인했다.

### 게이트 (T028)

```
$ ./harness context-check
Context check complete: 0 failure(s), 0 warning(s)
$ ./harness doctor
하네스 doctor 완료: 실패 0개, 경고 2개
```

경고 2건은 이 작업과 무관한 기존 항목이다.

## 작업 중 발견 — 카탈로그 등록 결합도

`specs/014-*/status.yaml` 을 만들면 그 파일 자체가 기능 카탈로그 인식
트리거가 된다. 실측:

```
$ (status.yaml 없음)   → feature-hub-canonical-data 그린
$ (status.yaml 추가)   → ✖ actual: 14, expected: 13
```

`data/feature-definitions.json` 에 항목만 더해도 부족하다 — relation health
와 traceability 링크 수가 어긋나 같은 테스트가 계속 깨진다. 등록은
definitions + relations(entities·links 5종) + 테스트 기대 상수를 한 번에
맞춰야 완결된다.

반쯤 손대면 정합성이 더 나빠지므로 되돌리고 T035 로 분리했다. status.yaml
도 그 태스크에서 함께 커밋한다. 013 등록 커밋 `2b3e178` 이 선례다.

## 완료한 Polish

- **T024**: `CONTRIBUTING.md` 의 "`bootstrap`(또는 `install`)" 선택지를 없애고,
  `README.md` 에 "최초 설치든 일상 갱신이든 같은 명령" 을 명시했다. "도구가 이미
  준비된 환경이라면 직접 실행해도 됩니다" 서술은 명령 선택 판단을 되살리므로
  제거했다.
- **T025**: `codi-dev-workflow` 에는 준비 명령 언급이 없다. 전체 스킬에서
  `harness install` 을 찾으면 `skill-creator/ORIGIN.md` 와
  `init-project/references/flow.md` 두 곳뿐인데, 둘 다 내부 동작 서술이지
  사용자 안내가 아니라 수정하지 않았다.
- **T030**: `ROADMAP.md` 에 014 를 in-progress 로 추가하고, 013 을 done 으로
  갱신했다(`feature:status:sync` 가 결정적 전이로 제안).

## T035 — 기능 카탈로그 등록

`data/feature-definitions.json`(14번째 항목), `data/feature-relations.json`
(need 엔티티 `NEED-ONE-PREP-COMMAND` + 링크 6건), 테스트 기대 상수
(기능 13→14, 링크 103→109, satisfied/specified/verified-by 각 13→14,
appears-on 47→50)를 함께 갱신했다.

등록 중 두 번째 결합도를 발견했다: `verified-by` 링크는 대상
`verification` 엔티티가 registry 에 있어야 하는데, 그 등록 조건이
**`verification.md` 에 체크리스트 항목(`- [ ]` / `- [x]`)이 존재하는 것**이다
(`scan-specs.mjs` 의 `inspectChecklist`). 산문만 있으면 링크가 broken 으로
잡힌다:

```
brokenLinks: [{ from: feature:014-..., to: verification:014-...,
                reason: "missing endpoint: verification:014-packaging-unification" }]
```

이 문서 맨 위에 Checklist 절을 추가해 해소했다.

## T029 — 상태 동기화

T035 완료 후 재실행: `상태 전이 제안 없음`. 014 가 in-progress 로 정확히
인식된다. 013 전이(in-review → done)는 앞서 적용했다.

## 미완

없음. 남은 항목은 SC-002(신규 팀원 온보딩 실측)뿐이며, 실제 온보딩이
일어날 때 확인할 사항이라 Checklist 에 미체크로 남겼다.
