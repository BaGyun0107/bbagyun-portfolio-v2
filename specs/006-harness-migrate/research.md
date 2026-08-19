# Research: 기존 다운스트림 migrate (Phase 3)

**Date**: 2026-07-15 | **Plan**: [plan.md](./plan.md)

## R1. 제거 목록의 출처

- **Decision**: `제거 목록 = 패키지(.harness/current)의 shared-manifest.json
  ∩ git tracked 파일 − project-owned 분류`. untracked 파일은 건드리지 않는다.
- **Rationale**: shared-manifest는 업스트림이 이미 유지하는 "공유 파일"의
  단일 출처이고, project-owned.mjs가 소유 분류의 단일 출처다. 두 출처의
  교차만 쓰면 migrate가 자체 목록을 하드코딩하지 않는다(FR-002).
- **Alternatives considered**: 경로 패턴 하드코딩(분류 3경로 정합 원칙
  위반·드리프트 위험, 기각), 내용 해시 비교(버전 차이와 로컬 수정을 구분
  못함, 기각).

## R2. "로컬 수정" 차단의 정의

- **Decision**: git-dirty(미커밋 변경·untracked 제외 staged 포함) 워킹트리는
  전체 중단한다. **커밋된** 공유 파일 drift는 차단하지 않는다 — 제거로
  흡수되며 git 히스토리로 복원 가능함을 안내한다.
- **Rationale**: 구 update.sh의 dirty-path 선례와 동일. 커밋된 drift까지
  차단하면 버전 차이(구버전 복사본)와 구분할 방법이 없어 모든 레포가
  중단된다. 미커밋 변경만이 "소실될 수 있는 유일한 데이터"다.
- **Alternatives considered**: 패키지와 내용 비교 후 다르면 중단(버전
  차이로 전 레포 오탐, 기각).

## R3. 룰 이중 로드 해소 경로

- **Decision**: migrate의 제거 목록에 복사본 공유 룰이 자연 포함되어
  해소된다. 신규 프로젝트는 init-project가 install 직후 같은
  `migrate.sh --fresh`(확인 생략 모드)를 호출해 복사본을 제거한다 — 단일
  구현 재사용.
- **Rationale**: 두 경로가 같은 목록 계산을 쓰면 "신규만 다른 규칙" 류의
  드리프트가 생기지 않는다.

## R4. 구 동기화 은퇴 범위

- **Decision**: lock 파일 존재 시 안내-후-종료 가드를 추가하는 대상은
  `update.sh`(--apply-harness 포함 적용 경로), `prune-downstream.mjs`,
  `restore-missing-shared.mjs` 3곳. `update-check.sh`의 daily 알림은
  lock 모드에서 pkg-update-check가 이미 대체하므로 harness-repo fetch 부분만
  lock 감지 스킵. 업스트림 레포(lock 없음)는 전부 기존 동작 유지.
- **Rationale**: 두 동기화 체계가 같은 레포에서 겹치면 혼합 상태가 된다.
  스크립트 삭제가 아니라 가드 추가인 이유: 업스트림과 미전환 레포가 아직
  쓰기 때문 — 완전 삭제는 전 다운스트림 전환 후 별도 정리로 미룬다.
