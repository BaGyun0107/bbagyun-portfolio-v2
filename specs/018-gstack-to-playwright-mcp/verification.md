# Verification Record: 018 GStack 제거·Playwright MCP 대체

증거 세부는 [pilot-evidence.md](pilot-evidence.md)와 tasks.md Notes 참조.

- [x] V1 양 런타임 MCP 동작 (SC-001) — 2026-08-06 `claude mcp list`
  Connected, Codex config.toml 동일 핀(0.0.79), stdio 스모크(tools 24,
  navigate/snapshot) 성공, `tests/mcp-parity.test.mjs` 5케이스 GREEN
- [x] V2 PHP 파일럿 (SC-002) — 리허설 스택(hf, 38081) 로그인 폼
  입력→제출→실패 alert 처리→스크린샷 재현 성공
- [x] V3 참조 제거 회귀 (SC-003) — `tests/gstack-residue.test.mjs`
  RED(34파일)→GREEN
- [x] V4 품질 게이트 (SC-004) — rule-check ok, context-check 0/0, doctor
  실패 0(경고 1건은 018 무관), npm test 그린(최종 실행 기록은 tasks.md)
- [x] V5 전역 삭제 (SC-005) — 정책 PR 머지 + 사용자 명시 승인 후 실행
- [ ] V6 신규 머신 재현 (SC-006) — 004 T021(팀원 온보딩 검증)과 함께 수행
