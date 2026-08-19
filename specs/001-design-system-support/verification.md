# Verification: codi-design-system

날짜: 2026-07-08

## Quickstart 수동 검증

임시 프로젝트: `/private/tmp/codi-design-system-quickstart.SXOUvc`

### T011 / 시나리오 2 생성 모드

- `apps/front/src/styles/tokens.css`, `docs/design-system.md`,
  `apps/front/components/ui/` 구조를 임시 프로젝트에 생성했다.
- 의도적으로 `--foreground: oklch(90% 0 0)`를 넣어 저대비 상태를 만들고
  contrast gate를 실행했다.
- 명령:
  `node .harness/skills/codi-design-system/resources/contrast-check.mjs /private/tmp/codi-design-system-quickstart.SXOUvc/apps/front/src/styles/tokens.css`
- 결과: exit 1, `light background/foreground contrast 1.29:1 is below 4.5:1`.
- 템플릿의 통과 값으로 재조정 후 같은 명령 재실행: exit 0, `ok: true`,
  `failures: []`.
- `apps/front/src/styles/globals.css`에 `@import "./tokens.css";`를 넣고
  `rg "tokens\.css"`로 import 연결을 확인했다.

### T015 / 시나리오 4 에이전트 준수

- `codi-frontend` 계약에서 UI 작업 전
  `apps/front/src/styles/tokens.css`와 `docs/design-system.md`를 읽도록
  명시된 것을 확인했다.
- 임시 컴포넌트
  `/private/tmp/codi-design-system-quickstart.SXOUvc/apps/front/components/ui/sample-card.tsx`
  를 시맨틱 토큰(`bg-card`, `text-card-foreground`,
  `text-muted-foreground`, `bg-primary`, `text-primary-foreground`,
  `ring-ring`)만 사용해 작성했다.
- 하드코딩 색상 검색 명령:
  `rg -n "#[0-9a-fA-F]{3,8}|bg-(white|black|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|green|blue|purple|pink)-|text-(white|black|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|green|blue|purple|pink)-" /private/tmp/codi-design-system-quickstart.SXOUvc/apps/front/components/ui/sample-card.tsx`
- 결과: exit 1, 출력 없음(하드코딩 색상 0건).
- 시맨틱 토큰 검색은 exit 0으로 기대 토큰을 확인했다.

### T017 / 시나리오 3 수정 모드 + 부분 상태

- 시나리오 2 산출물에서 primary light/dark 토큰을 각각
  `oklch(30% 0.15 260)`, `oklch(85% 0.08 260)`으로 변경했다.
- 같은 실행 흐름에서 `docs/design-system.md` 결정 기록에
  `Primary color update` 행을 추가했다.
- contrast gate 재실행 결과: exit 0, `ok: true`, `failures: []`;
  `primary/primary-foreground` 대비는 light 13.35:1, dark 11.28:1.
- 부분 상태 검증을 위해 별도 디렉터리
  `/private/tmp/codi-design-system-quickstart.SXOUvc/partial`에 토큰만 있는
  상태를 만들고 문서를 템플릿에서 복구했다.
- `test -f`로 토큰/문서 동시 존재를 확인했고, partial 토큰에 대한
  contrast gate 결과도 exit 0, `ok: true`, `failures: []`.

## 자동 검증

- `./harness skills-link`: exit 0.
- `npm test -- --test-name-pattern "design-system"`: exit 0, 216 tests passed.
- `npm test`: exit 0, 220 tests passed, 0 failed.
- `./harness doctor`: exit 0, 실패 0개, 경고 0개.

## Speckit Converge 대체 기록

이 환경에는 직접 실행 가능한 `speckit-converge` 명령이 노출되어 있지
않다. T021에서는 대체 기준으로 `specs/001-design-system-support/tasks.md`
의 unchecked task가 0건인지 확인하고, 전체 회귀 검증 결과를 함께 기록한다.

최종 대체 확인:

- `rg "^- \[ \]" specs/001-design-system-support/tasks.md`: exit 1,
  출력 없음(unchecked task 0건).
- 루트 `ROADMAP.md` 생성 및 `Project design system support` 상태 반영.

## 재검증 체크리스트 (2026-07-18 소급 기록)

- [x] `codi-design-system` 스킬 계약 — 
  `tests/design-system-skill-contract.test.mjs` 4/4 통과 (2026-07-18)
- [x] 전체 스위트 내 회귀 없음 (npm test 629/629, 2026-07-18)
