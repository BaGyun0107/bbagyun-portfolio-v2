# rules-local: 프로젝트 소유 규칙 경로 설계

날짜: 2026-08-07
상태: 승인됨 (brainstorming 산출물 — speckit-specify 입력용)
Size: Large

## 배경

다운스트림 레포에서 루트 `AGENTS.md`, `CLAUDE.md`, `.claude/rules/*`,
`.codex/rules/*`는 전부 shared-manifest 등재 업스트림 소유다. 프로젝트
전역 상시 로드 규칙을 둘 "보장된 project-owned 자리"가 양 런타임 모두에
없다. 실제 사고: 다운스트림이 `.claude/rules/codi-architecture.md` 등
프로젝트 고유 파일을 직접 두었고, 구버전 update.sh가 이를 stale/구버전
공유 파일로 오판해 삭제했다 (2026-08-07, gnuboard 830건과 동일 형태).

`.claude/rules`는 stale prune의 스캔 루트라, manifest에 없고
project-owned도 아닌 커밋 파일은 현행 v1.5.0에서도 삭제된다. 이 공백을
`.harness/skills-local/` 패턴의 복제로 메운다.

## 결정 요약

- 채택안: A안(skills-local 패턴 복제) + 공통 보호(배포 이력 기반 stale
  삭제 제한). 사용자 승인 완료.
- 런타임 범위: 양 런타임 (Claude 상시 로드 + Codex 진입점/preflight).
- 규칙 성격: 커밋되는 팀 공유 프로젝트 규칙. 개인 취향은 기존
  `CLAUDE.local.md`/`AGENTS.local.md` 관례 유지.
- 기존 위험 파일 마이그레이션: 감지 + 비차단 이전 안내까지 (자동 이동
  없음).

## 1. 디렉터리와 소유권

- 신설: `.harness/rules-local/<name>.md` — 팀 공유 프로젝트 규칙의 단일
  소스, 커밋 대상. `.harness/skills-local/`과 대칭.
- project-owned 4중 정합 등재: `project-owned.mjs`의
  `PROJECT_OWNED_DIRS`에 `.harness/rules-local`·`.claude/rules/local`
  추가 + `project-owned-fallback.sh` 동기 + `update-policy.md` 서술 +
  정합 테스트 갱신. 기존 필터 재사용으로 update 덮어쓰기·stale prune
  양쪽에서 자동 제외된다.
- 업스트림 가드: 하네스는 `.claude/rules/local/` 이름을 절대 배포하지
  않는다 — skills-link 이름 충돌 검사와 대칭인 테스트로 고정.

## 2. Claude 배선

`skills-link.sh`에 rules 링크 단계 추가: `.harness/rules-local/*.md` →
`.claude/rules/local/<name>.md` 상대경로 심링크. 기존 호출 지점
4곳(install·preflight·update·pre-commit)을 그대로 타므로 새 진입점이
없다. lock 모드의 `.claude/rules/shared` 심링크 서브디렉터리가 이미
로드되고 있어 로딩 방식은 검증돼 있고, path-scoped frontmatter도 그대로
동작한다. 멱등이어야 하며 fresh clone에서 `.harness/rules-local/`을 지연
생성한다(skills-local과 동일).

## 3. Codex 배선

- 업스트림 소유 `AGENTS.md`에 일반 문구 1개: `.harness/rules-local/`이
  존재하면 프로젝트 규칙으로 로드하라.
- `agent-preflight.sh`가 세션 시작 시 존재하는 rules-local 파일 목록을
  출력한다(phase routing 리마인더와 같은 채널).
- 잔여 갭(명시): Codex는 매 턴 훅이 없어 첫 턴 이후 재주입이 안 된다
  (기존 하네스 규칙과 동일한 한계). execpolicy 로컬
  확장(`.codex/rules-local`)은 범위 밖.

## 4. 공통 보호 — 배포 이력 기반 stale 삭제 제한

`update.sh`의 stale 정리(현재 update.sh:359-370)를 분기한다:

- stale 후보가 이전 로컬 shared-manifest에 실재했던 파일이면 지금처럼
  삭제한다 (진짜 stale — 배포 후 업스트림에서 제거된 파일).
- 실재한 적 없는 파일이면 삭제하지 않고 비차단 경고를 낸다:
  "다운스트림 고유 파일로 보입니다 — 규칙이면 `.harness/rules-local/`로
  옮기세요."
- prior manifest를 못 읽으면 stale 삭제 전체를 생략한다 (v1.0.0
  diff-흐름과 같은 fail-safe).
- `doctor`에도 같은 감지를 추가해 update를 돌리지 않은 팀원 머신에도
  안내가 전파되게 한다 (gstack-cleanup 경고와 같은 패턴).

이로써 v1.0.0의 계약("삭제는 하네스가 배포했던 파일만")이 diff-제거
흐름과 stale 흐름 양쪽에 일관 적용되고, 사고 사례는 구조적으로 재발
불가가 된다.

## 5. 테스트

- 분류기·셸 fallback 항목 집합 기계 대조 (기존 정합 테스트 확장).
- update 적용 회귀: (1) 비-manifest `.claude/rules` 파일 보존+경고,
  (2) prior-manifest 실재 stale 삭제 유지, (3) 기존 "830 사고 형태" 핀
  테스트 불변.
- skills-link 확장: rules 링크 생성·멱등성·lock 모드 동작·`local/` 이름
  배포 금지 가드.
- doctor 감지 항목 테스트.

## 6. 문서

- `update-policy.md`: 보호 서술(스캔 루트·stale 삭제 제한·rules-local).
- `AGENTS.md`: rules-local 관례 + Codex 로드 문구.
- 소유권 설명은 기존 상시 로드 룰 파일(`skill-ownership.md` 계열)에 짧게
  편입 — 새 상시 로드 룰 신설은 지양 (컨텍스트 예산).

## 범위 밖 (YAGNI)

- 자동 마이그레이션(비-manifest 파일을 rules-local로 자동 이동) — 오판
  시 자동 이동이 또 다른 사고 형태가 된다. 감지+안내까지만.
- `.codex/rules-local/` execpolicy 확장 — 수요 확인 후 별도 작업.
- 공유 규칙 shadowing/override — skills-local과 동일하게 미지원. 이름
  충돌은 배포 금지 가드로 차단.
- 개인(비커밋) 규칙 경로 — 기존 `*.local.md` 관례 유지.
