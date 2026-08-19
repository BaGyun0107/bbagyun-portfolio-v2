# 다운스트림 → 업스트림 기여 가이드

> **shared 하네스 문서입니다.** 다운스트림 프로젝트는 직접 수정하지 않습니다.

다운스트림 프로젝트에서 검증한 스킬, 규칙, 정책, 훅, 스크립트 개선을
모든 Codi 프로젝트가 받도록 중앙 하네스 레포에 반영하는 절차입니다.

## 원칙

- **다운스트림 워킹트리에서 shared 파일을 직접 고치지 않습니다.**
  `.harness/skills/**`, `.harness/policies/**`, `.harness/hooks/**`,
  `.harness/scripts/**`, `.claude/rules/**`, `.codex/rules/**`, 루트
  `AGENTS.md`/`CLAUDE.md`/`CONTRIBUTING.md` 등 shared-manifest.json에 있는
  파일이 대상입니다. 직접 고치면 다음 `./harness update`가 dirty-path
  경고를 내거나 덮어씁니다.
- 모두에게 필요한 변경은 **하네스 레포에 PR**로 올립니다. 프로젝트 하나에만
  필요한 변경은 `.harness/skills-local/`이나 app-local 파일에 둡니다.
- PR 머지는 사용자가 GitHub에서 수행합니다. 에이전트는 머지하지 않습니다.

## 기본 절차 (규칙/정책/스킬 수정 공통)

1. 하네스 레포를 별도로 클론하고 `v2`에서 작업 브랜치를 만듭니다.

   ```sh
   git clone https://github.com/CODIWORKS-Engineer/codi-harness.git
   cd codi-harness
   git checkout v2 && git checkout -b feat/<change-name>
   ```

2. 다운스트림에서 검증한 변경을 하네스 레포에 포팅합니다.
3. 커밋 후 `v2` 대상으로 PR을 올리고 리뷰/머지를 받습니다.
4. 머지 후 각 다운스트림 프로젝트에서 수신합니다.

   ```sh
   ./harness update
   ```

## 로컬 스킬 승격 (`skills-local` → `skills`)

다운스트림 `.harness/skills-local/<name>/`에서 검증한 스킬을 공유 스킬로
올릴 때는 이름 충돌 순서에 주의합니다. 같은 이름이 `.harness/skills/`와
`.harness/skills-local/`에 동시에 존재하면 `./harness skills-link`가
fail합니다.

1. 하네스 레포 작업 브랜치에 스킬을 `.harness/skills/<name>/`으로 복사해
   커밋하고 PR을 올립니다.
2. PR이 머지될 때까지 다운스트림은 로컬 스킬을 그대로 사용합니다.
3. 머지 확인 후, 만들었던 다운스트림 프로젝트에서 **로컬 스킬을 먼저
   삭제한 뒤** 업데이트를 적용합니다.

   ```sh
   rm -rf .harness/skills-local/<name>
   ./harness update
   ```

   순서를 바꿔 update부터 실행하면 skills-link가 이름 충돌로 fail합니다.
   그 경우에도 로컬 스킬을 지우고 `./harness skills-link`를 다시 실행하면
   복구됩니다.

## 규칙/정책 기여 시 주의

- 규칙은 Codex/Claude **양쪽 미러를 함께** 갱신해야 합니다
  (`.claude/rules/**` ↔ `.codex/rules/**`, 정책 본문은 `.harness/policies/**`).
  하네스 레포에서 `codi-rule-authoring` 스킬을 사용하면 미러 동기화와
  검증 절차를 안내받을 수 있습니다.
- 훅/가드레일 변경은 `npm test`(가드레일 회귀 배터리 포함)를 통과해야 합니다.
- 커밋 전 하네스 레포의 pre-commit 훅이 `shared-manifest.json`을 자동
  재생성합니다. 새 파일이 매니페스트에 들어가야 다운스트림에 전파됩니다.
