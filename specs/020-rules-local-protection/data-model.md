# Data Model: rules-local

## 1. 엔티티

- **rules-local 규칙 파일**: `.harness/rules-local/<name>.md`. 커밋 대상,
  project-owned. `<name>`은 영문 kebab-case 파일명. `.md` 외 파일·하위
  디렉터리는 링크 대상에서 제외(무시).
- **소비 링크**: `.claude/rules/local/<name>.md` — 소스로 향하는 상대경로
  심링크. 링크 단계가 소유하며 git 추적하지 않는다(스킬 링크 트리와 동일
  관례, gitignore 등재).
- **이전 로컬 shared-manifest**: 업데이트 적용 전
  `.harness/shared-manifest.json`의 `files` 배열. stale 삭제 허용
  목록이자 "하네스가 배포했던 파일"의 판정 기준.

## 2. stale 후보 분류 (update 적용 시)

prune-stale 감지 결과의 각 경로를 다음 하나로 분류한다:

| 분류 | 판정 | 처리 |
|---|---|---|
| dirty-stale | 로컬 미커밋 변경 있음 | 보존 + 기존 경고 (불변) |
| distributed-stale | prior manifest에 실재 | 삭제 (기존 동작 유지) |
| unknown-file | prior manifest에 없음 | 보존 + rules-local 이전 안내 |
| (전체) | prior manifest 읽기 실패 | stale 삭제 전체 생략 (fail-safe) |

project-owned 경로(`.harness/rules-local`, `.claude/rules/local` 포함)는
prune-stale 필터에서 이미 제외되므로 분류 대상에 오르지 않는다.

## 3. 상태 전이

- 신규 규칙: 파일 생성 → 링크 단계 실행 → 링크 존재 (멱등: 재실행 시
  변화 없음).
- 규칙 삭제: 소스 삭제 → 링크 단계가 고아 링크 정리.
- 위험 파일 이전: unknown-file 안내 → 사용자가 rules-local로 이동 →
  다음 update부터 project-owned로 보호.

## 4. 검증 규칙

- 업스트림 shared-manifest에 `.claude/rules/local/` 경로가 실리면 가드
  테스트 실패 (배포 금지).
- `.harness/skills-local`과 달리 이름 충돌 검사가 불필요 — 업스트림이
  `local/` 디렉터리 자체를 만들지 않으므로 충돌 표면이 없다.
