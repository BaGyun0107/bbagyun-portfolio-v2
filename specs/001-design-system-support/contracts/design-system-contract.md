# 계약: 프로젝트 디자인 시스템의 표준 위치·형식·우선순위

이 문서는 하네스(shared)와 다운스트림 프로젝트(project-owned) 사이의
디자인 시스템 인터페이스를 규정한다. 구현 시 이 내용이
`codi-design-system` SKILL.md의 계약 절로 들어가며, 여기 사본은 설계
검증용이다.

## 표준 위치 (project-owned)

| 산출물 | 경로 | 형식 |
|---|---|---|
| 토큰 파일 (값의 정본) | `apps/front/src/styles/tokens.css` | Tailwind v4 CSS — `:root`/`.dark` 변수 쌍 + `@theme inline` |
| 원칙 문서 | `docs/design-system.md` | Markdown — 결정과 근거만 얇게 |
| 커스텀 컴포넌트 | `apps/front/components/ui/` | shadcn vendored copy + composition + cva variant |

## 토큰 형식 규칙

- shadcn 시맨틱 토큰명을 변경하지 않는다: `background`/`foreground`,
  `primary`/`primary-foreground`, `secondary`, `muted`, `accent`,
  `destructive`, `border`/`input`/`ring` (+ 필요 시 chart/sidebar 계열).
- 모든 색상 토큰은 라이트(`:root`)/다크(`.dark`) 쌍으로 존재해야 한다.
- 색 공간은 OKLCH를 기본으로 한다.
- 모든 전경/배경 쌍은 WCAG AA 대비를 통과해야 한다(일반 텍스트 4.5:1,
  대형 텍스트/UI 컴포넌트 3:1).

## 우선순위 규칙

1. 프로젝트 디자인 시스템(위 표준 위치에 존재)이 있으면 **그것이 우선**.
2. 없으면 `.harness/imported-rules/design.md`의 공용 표준이 기본값.

## 로딩 규칙 (context rot 방지)

- 디자인 시스템 내용을 상시 컨텍스트(CLAUDE.md, always-on 규칙)에
  사전 로드하지 않는다.
- `codi-frontend`는 UI 작업 시작 시점에 토큰 파일과 원칙 문서를 읽는다
  (온디맨드 JIT). 이 읽기 단계는 codi-frontend SKILL.md의 계약이다.

## 확장 경로 (지금은 미적용, 구조 변경 없이 도달 가능해야 함)

- **다중 front 앱**: shadcn 공식 모노레포 규약으로 승격 —
  `packages/ui/src/styles/globals.css`로 토큰 중앙화, components.json의
  css 경로를 공유 패키지로 변경.
- **Codi 공통 베이스**: 스킬 템플릿(`tokens-template.css`)의 중립
  기본값을 공통 베이스 값으로 교체. 기존 프로젝트 파일은 project-owned라
  무영향, 원하는 프로젝트만 수정 모드로 재생성.

## 소유권

- 계약(이 문서의 규칙들), 템플릿, 스킬: **shared** —
  `./harness update --apply-harness`로 전파, 다운스트림 수정 금지.
- 표준 위치의 실제 파일들(토큰 값, 문서 내용, 컴포넌트): **project-owned**
  — 업데이트가 절대 건드리지 않음.
