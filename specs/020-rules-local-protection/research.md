# Research: rules-local 보장 경로

날짜: 2026-08-07. NEEDS CLARIFICATION 0건 — 브레인스토밍(사용자 확정
2건 포함)과 코드 탐사로 모든 결정이 선행 확정됨. 아래는 결정 기록.

## R1. 소스 디렉터리 위치

- Decision: `.harness/rules-local/<name>.md` (커밋되는 팀 공유 규칙).
- Rationale: `.harness/skills-local/`과 대칭 — 팀이 이미 아는 관례,
  project-owned 등재·링크 병합·업데이트 보호가 같은 절차로 처리됨.
- Alternatives: `.claude/rules/local/` 직접 소유(B안) — Codex가 볼 수
  없어 패리티 위반으로 기각. 루트 단일 파일 관례(C안) — path-scoped
  frontmatter와 규칙별 분리가 안 돼 기각.

## R2. Claude 배선 방식

- Decision: `skills-link.sh`에 rules 링크 단계를 추가해
  `.claude/rules/local/<name>.md` 상대경로 심링크 생성.
- Rationale: 호출 지점 4곳(install·preflight·update·pre-commit)이 이미
  있어 새 진입점이 불필요. 상대경로 링크 관례(specs/015 US4)와 lock 모드
  `.claude/rules/shared` 심링크 서브디렉터리 로딩이 검증돼 있음.
- Alternatives: 별도 rules-link 스크립트 신설 — 호출 지점 4곳을 전부
  다시 배선해야 해서 기각. 파일 복사 — 이중 소스 드리프트로 기각.

## R3. Codex 배선 방식

- Decision: 공유 `AGENTS.md`에 조건부 로드 문구 1개 +
  `agent-preflight.sh`가 존재 시 파일 목록 출력.
- Rationale: Codex는 UserPromptSubmit 훅이 없어 진입점+preflight가
  유일한 주입 채널(기존 phase routing 리마인더와 동일 패턴). AGENTS.md는
  업스트림 소유라 업스트림에서 일반 문구로 배포 가능.
- Alternatives: `.codex/rules-local/` execpolicy 확장 — execpolicy는
  내러티브 규칙을 실을 수 없고 수요 미확인이라 범위 밖.

## R4. stale 삭제 제한의 구현 지점

- Decision: `update.sh`의 stale 삭제 루프에서 분기 — 이미 diff-제거
  흐름용으로 만들어지는 prior_manifest_list(적용 전 로컬
  `.harness/shared-manifest.json` 목록)와 대조해, 목록에 있는 파일만
  삭제하고 나머지는 보존+이전 안내 경고. 목록을 못 읽으면 stale 삭제
  전체 생략.
- Rationale: v1.0.0의 "삭제는 하네스가 배포했던 파일만" 계약을 diff
  흐름과 stale 흐름에 일관 적용. prune-stale.mjs(감지)는 그대로 두고
  삭제 실행 지점에서만 분기해 변경 표면 최소화. doctor에는 동일 판정을
  읽기 전용 감지로 추가.
- Alternatives: prune-stale.mjs에서 prior manifest를 읽어 출력 자체를
  나누기 — 감지기와 실행기의 책임 분리가 무너지고 doctor 재사용이
  어려워져 기각.

## R5. 마이그레이션 범위

- Decision: 감지 + 비차단 이전 안내까지만. 자동 이동 없음 (사용자 확정
  2026-08-07).
- Rationale: 오판 시 자동 이동이 또 다른 사고 형태가 된다. 안내 문구가
  대상 경로(`.harness/rules-local/`)를 명시하므로 이동 자체는 1회성
  수동/에이전트 작업으로 충분.
- Alternatives: update가 자동 이동 — 기각(위 근거).

## R6. 충돌·shadowing 정책

- Decision: 업스트림은 `.claude/rules/local/` 이름을 배포 금지(가드
  테스트). 공유 규칙 shadowing/override 미지원 — skills-local과 동일
  정책.
- Rationale: 병합 우선순위 규칙을 만들면 "어느 쪽이 이기는가"라는 새
  결정 표면이 생긴다. skills-link의 이름 충돌 fail-fast 선례를 따른다.
- Alternatives: local이 shared를 덮는 shadowing — skill-ownership
  정책이 이미 기각한 모델이라 재도입하지 않음.
