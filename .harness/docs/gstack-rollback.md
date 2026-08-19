# GStack 재설치(롤백) 절차

2026-08-06 018 피처로 GStack이 전면 제거되었다 (근거:
`docs/audits/2026-08-06-skill-usage-recheck.md`, 스펙:
`specs/018-gstack-to-playwright-mcp/`). 다시 필요해지면 아래 절차로
재설치한다.

**중요: 데이터는 복원되지 않는다.** 제거 시 `~/.gstack`(프로젝트별
learnings, 세션 타임라인, 분석 기록, 저장된 브라우저 상태)을 함께
삭제했으므로, 재설치는 신규 설치이며 과거 학습·기록은 돌아오지 않는다.

## 재설치

```sh
# 1) 소스 clone (제거 전 기본 위치와 동일)
git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack

# 2) 런타임별 team setup
~/.claude/skills/gstack/setup --host claude --team
~/.claude/skills/gstack/setup --host codex --team
```

## 하네스 정책 복원

정책·스크립트에서 제거된 GStack 통합(설치/업데이트/라우팅 절)은 git
이력으로 되돌린다. 제거 커밋은 018 피처 브랜치
(`feature/018-gstack-to-playwright-mcp`)에 있으므로, 해당 커밋들의
revert PR을 만들어 사용자 머지로 복원한다.

## Playwright MCP와의 관계

재설치해도 Playwright MCP 등록(사용자 레벨, 핀 버전)은 영향받지 않는다.
둘은 병행 사용 가능하며, 등록 해제가 필요하면:

```sh
claude mcp remove --scope user playwright
# Codex: ~/.codex/config.toml 의 [mcp_servers.playwright] 블록 삭제
```
