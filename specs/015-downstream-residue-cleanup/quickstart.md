# Quickstart: 다운스트림 잔재 정리 완결 — 검증 가이드

## 사전 조건

- 하네스 레포 루트, Node 24 (mise), git.
- 다운스트림 실측 검증은 로컬 6개 레포 사용:
  codi-hansi, codi-hipass, codi-account, codi-crew, codi-crawling,
  codi-liveview-admin.

## V1. 단위·회귀 (하네스 레포)

```sh
npm test                  # 신규 테스트 5본 포함 전부 green
./harness context-check
./harness rule-check
./harness doctor
```

기대: 전부 통과. 신규 테스트는 구현 전에는 실패해야 한다(TDD 증거).

## V2. 상대경로 링크 (갭 5)

```sh
# 픽스처 레포에서 materialize 실행 후
find . -type l -not -path './.git/*' -exec readlink {} \; | grep -c '^/'
```

기대: `.harness/current` 1건만 절대경로(그 외 0건). 레포를 다른 경로로
`cp -R` 복사해도 링크 해석 유효.

## V3. 소유자 정리 플로우 (갭 1·2·3·4)

잔재 픽스처(또는 실제 레포 1곳, 예: codi-crew)에서:

```sh
./harness pkg-sync            # 신규 버전 수신 → gitignore 반영 + 잔재 보고
./harness prune-downstream    # check: 분류별 잔재 목록 검토
./harness prune-downstream --apply   # (사용자 승인 후)
git status                    # 삭제·회수·정규화 확인 → 소유자 커밋
./harness prune-downstream    # 재실행 → "정리 대상 없음"
```

기대: apply 후 check 재실행이 0건. 프로젝트 소유물(자체 spec, 수정 README,
자체 audit 문서)은 목록에 나타나지 않는다.

## V4. 팀원 플로우 (갭 6)

정리 완료 레포를 새 경로에 clone:

```sh
git clone <repo> /tmp/member-test && cd /tmp/member-test
./harness bootstrap
git status --porcelain | wc -l   # 기대: 0
git diff --cached --quiet && echo INDEX-CLEAN   # 기대: INDEX-CLEAN
./harness doctor                 # 기대: 통과
```

잔재 미정리 레포에서는: 인덱스 불변 + `residue <N>` 보고 + 소유자 안내
출력을 확인.

## V5. gitignore 자동 최신화 (갭 1 회귀)

픽스처 패키지의 required-gitignore.json에 시험 항목 추가 → pkg-sync 실행 →
다운스트림 .gitignore에 반영 확인. 프로젝트가 직접 쓴 항목은 불변.

## V6. 6개 레포 롤아웃 (US5)

release 후 레포별로 V3 절차 수행, 결과를
`specs/015-downstream-residue-cleanup/rollout-record.md`에 기록:

| 레포 | pkg-sync 버전 | check 잔재(전) | apply 후 | 커밋 |
|---|---|---|---|---|

기대 최종: 6/6 레포 잔재 0, 이후 각 레포에서 V4 성립.

