#!/usr/bin/env sh
# project-owned 분류의 셸 fallback — Node 를 쓸 수 없는 환경 전용.
# update.sh 와 update-check.sh 가 source 한다 (감사 L-1: 동일 case 가 두 곳에
# 복제돼 있던 것을 공용화). 정본은 project-owned.mjs 의
# PROJECT_OWNED_DIRS/FILES 테이블이며, 이 case 와의 항목 집합 일치는
# tests/harness-cli.test.mjs 가 기계 대조로 고정한다 — 한쪽만 고치면 실패한다.

is_project_owned_path_fallback() {
  case "$1" in
    .planning|.planning/*|docs/audits|docs/audits/*|docs/superpowers|docs/superpowers/*|docs/prompts|docs/prompts/*|data|data/*|projects|projects/*|specs|specs/*|.specify|.specify/*|.github|.github/*|.harness/state|.harness/state/*|.harness/skills-local|.harness/skills-local/*|tests|tests/*|examples|examples/*|apps|apps/*|tools|tools/*|.harness/rules-local|.harness/rules-local/*|.claude/rules/local|.claude/rules/local/*)
      return 0
      ;;
    docs/index.html|docs/planning.html|CHANGELOG.md|harness.lock.example|registry.json|ROADMAP.md|README.md|mise.toml|package.json|package-lock.json|pnpm-lock.yaml|pnpm-workspace.yaml|renovate.json|.gitignore|.harness/config/project-profile.yaml|.harness/config/skill-triggers.local.json)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}
