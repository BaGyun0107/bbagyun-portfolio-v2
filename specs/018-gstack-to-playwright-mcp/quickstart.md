# Quickstart: 검증 시나리오 가이드

각 시나리오는 spec.md의 SC와 1:1로 대응한다. 상세 결정은
[research.md](research.md) 참조.

## 사전 조건

- mise로 Node.js 24 활성화 (`mise install` 완료 상태)
- 네트워크 접근 가능 (npx 패키지 취득, Chromium 1회 설치)

## V1. 양 런타임 MCP 동작 (SC-001)

```sh
# 등록 상태 확인
claude mcp list                      # playwright 항목 존재
grep -A2 "mcp_servers.playwright" ~/.codex/config.toml

# Claude Code 세션에서: 아무 페이지나 열어 스냅샷 → 클릭 → 스크린샷 요청
# Codex 세션에서: 동일 흐름 요청
```

기대: 두 런타임 모두 브라우저 조작과 결과물이 확인된다.

## V2. PHP 파일럿 (SC-002)

```sh
# php-gnuboard5-6-32 로컬 기동 (레포 기존 구성 따름)
# MCP로: 메인 페이지 로드 → 폼 상호작용 → 스크린샷
```

기대: Node 앱과 동일한 QA 흐름 성립. 증적(명령, 결과, 스크린샷 경로)을
`specs/018-gstack-to-playwright-mcp/pilot-evidence.md`에 기록.

## V3. 참조 제거 회귀 검증 (SC-003)

```sh
npm test                             # gstack 잔존 검출 테스트 포함 GREEN
```

기대: 살아 있는 규칙/스크립트 경로에서 gstack 참조 0건 (허용 목록 제외).

## V4. 품질 게이트 (SC-004)

```sh
./harness rule-check
./harness context-check
./harness doctor
npm test
```

기대: 4종 모두 통과.

## V5. 전역 삭제와 롤백 문서 (SC-005)

```sh
# (사용자 승인 + 정책 PR 머지 후에만)
ls ~/.claude/skills | grep -i gstack   # 0건
ls ~/.codex/skills | grep -i gstack    # 0건
ls -d ~/.gstack 2>/dev/null            # 없음
```

기대: 전역 잔존 0건. 롤백 문서 절차만으로 재설치 가능(데이터 미복원 명시).

## V6. 신규 머신 재현성 (SC-006)

기대: 하네스 설치 절차(`./harness install` + 프리플라이트)만으로 V1이
재현된다. 팀원 머신에서 확인 시 004 피처의 T021(온보딩 실사용 검증)과 함께
수행 가능.
