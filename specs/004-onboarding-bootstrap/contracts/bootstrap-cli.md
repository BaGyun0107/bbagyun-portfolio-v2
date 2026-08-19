# CLI Contract: ./harness bootstrap

## 호출

```sh
./harness bootstrap [--dry-run]
```

- `--dry-run`: 실제 변경 없이 수행할 단계를 `dry-run:` 접두사로 출력 (기존
  install.sh 컨벤션과 동일)
- 알 수 없는 인자: exit 2 + 사용법 안내

## 종료 코드

| 코드 | 의미 |
|------|------|
| 0 | 모든 단계 성공 또는 확인-스킵 (doctor 통과 포함) |
| 1 | 단계 실패 — 실패 원인과 "다음 행동" 안내 출력 후 종료 (FR-012) |
| 2 | 사용법 오류 또는 미지원 OS (변경 0건 보장, FR-002) |
| 3 | 재실행 필요 상태로 정상 중단 — CLT 설치 창 대기, gh 로그인 미완 등 |

## 출력 형식

- 언어: 한국어 (FR-011)
- 단계별 라인: `[bootstrap N/7] <단계명> ... <완료|확인됨|건너뜀|실패>`
- 마지막 요약 블록: 성공/스킵/실패 단계 수 + 남은 수동 단계 목록
  (예: Superpowers 수동 설치 안내 — FR-010 폴백)

## 단계 (순서 고정)

1. OS 확인 (Darwin 아니면 즉시 exit 2)
2. git / Xcode CLT 확인 (`xcode-select -p`; 부재 시 설치 창 실행 후 exit 3)
3. mise 확인/설치 + 셸 활성화 라인 멱등 추가
4. `mise install` (도구 목록은 mise.toml 소유)
5. gh 인증 확인 (`gh auth status`; 미인증 시 `gh auth login` 대화형 안내,
   거부 시 exit 3)
6. `./harness install` 위임 + Superpowers 자동 설치 시도 — claude CLI
   존재 시 `claude plugin install superpowers@claude-plugins-official`
   비대화식 실행, 부재/실패 시 안내문 폴백 (research.md R4)
7. `./harness doctor` 실행 + 요약 출력

## 멱등성 보장 (FR-003)

- 각 단계는 "검사 → 이미 충족이면 확인됨 출력 후 스킵" 패턴을 따른다.
- 셸 프로필 변경은 마커 주석 grep 후에만 append한다.
- 어떤 단계도 기존 사용자 설정을 삭제·수정하지 않는다 (추가만).
