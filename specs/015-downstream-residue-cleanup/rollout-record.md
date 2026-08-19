# Rollout Record: 6개 다운스트림 일괄 정리 (T024·T025)

**Date**: 2026-07-30 | **하네스 버전**: v1.3.0 (PR #114 머지 → CI 태그 발행 12:12 UTC)

## 절차 (레포 공통)

pkg-sync ×2 (v1.3.0 수신 → 신버전 동작 적용) → skills-link (스킬 링크 상대화)
→ prune-downstream check 검토 → 사용자 승인(A~D 일괄, 2026-07-30) → --apply
→ 보완 정리(README 스텁·구버전 audits·vendor 실사본) → pkg-sync 재실행
→ 최종 check 0건 → `git add -u` 커밋 → push → PR.

사전 리허설: codi-hipass 사본에서 --apply 62건 → 재check 0건 수렴,
자체 데이터(data/feature-relations.json) 보존 확인.

## 레포별 결과 (quickstart V6 표)

| 레포 | check 잔재(전) | apply 후 | 추적 심링크 | 절대링크* | 커밋 | PR |
|---|---|---|---|---|---|---|
| codi-hansi | 37 | **0** | 46→0 | 0 | ecd65f4 | #15 (main) |
| codi-hipass | 62 | **0** | →0 | 0 | 9ce840d | #38 (dev) |
| codi-account | 96 | **0** | →0 | 0 | d5b0f0e | #13 (main) |
| codi-crew | 42 | **0** | →0 | 0 | 35f1daf | #8 (dev) |
| codi-crawling | 40 | **0** | →0 | 0 | 6b18817 | #10 (dev) |
| codi-liveview-admin | 56 | **0** | →0 | 0 | 290990a9 | #14 (dev) |

\* `.harness/current`(머신 캐시 대상, 비추적) 제외 — 계약상 유일한 절대 예외.

**SC-001 달성**: 6/6 레포 잔재 0건. PR 머지는 사용자 수행.

## 팀원 시나리오 실측 (V4, SC-002)

codi-crawling 정리 브랜치를 새 경로에 clone → `./harness bootstrap`:

- 버전 1.3.0 수신·materialize, doctor 실패 0, 요약에 잔재 라인 없음
- **git 인덱스 불변** (`git diff --cached --quiet` 통과), 추적 파일 수정 0
- 절대경로 링크 0 (current 제외)
- 비추적 생성물 2건 잔존: `?? .specify/`(install 재배치 벤더 자산),
  `?? package-lock.json`(로컬 생성) — 아래 후속 항목

## 실측에서 확인된 한계·후속 (v1.3.1 후보)

1. **구버전-사본 미판정**: README·docs/audits 가 clone 시점 구버전이면 현행
   패키지와 바이트가 달라 보존된다 (보존 원칙의 의도된 결과). 이번엔 승인
   하에 제목-마커(`# Codi Harness v2`)·이름-일치 수동 보완으로 정리했다.
   → 후속: selectHarnessSelfstate 에 제목-마커 판정 추가 검토.
2. **실사본이 링크 자리를 막음**: `.harness/vendor` 실디렉터리
   (account·crawling·liveview)·`shared-manifest.json` 실파일(account)은
   비추적이라 어느 분류에도 안 잡히고 materialize 가 보존한다. 승인 하에
   수동 제거 후 재sync 로 링크 생성. → 후속: stale-workcopy 부류 추가 검토.
3. **`.specify` 커밋/비추적 정책 미결** (spec 에서 명시적 범위 밖): uncache
   후 `?? .specify/` 가 status 에 상시 노출되고, 팀원 bootstrap 후에도
   생성물이 untracked 로 남아 SC-002 의 "변경 0건" 이 문자 그대로는 미충족
   (인덱스·추적 파일 기준으로는 충족). → 후속 결정 필요: 벤더 경로
   gitignore 등재 vs 프로젝트 베이스라인 재커밋.
