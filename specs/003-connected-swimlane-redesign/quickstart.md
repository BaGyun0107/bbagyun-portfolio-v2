# Quickstart: 연결형 스윔레인 재설계 검증

## Prerequisites

- 저장소 루트에서 실행한다.
- Node.js 24와 pnpm은 현재 mise 구성을 따른다.
- `apps/front` 의존성이 설치되어 있어야 한다.
- 기존 사용자 변경을 stage, 되돌림 또는 일괄 포맷하지 않는다.
- 구현 전 `spec.md`, `plan.md`, `tasks.md`와 checklist gate를 확인한다.

## 1. Data and Geometry Contracts

```bash
pnpm --dir apps/front exec vitest run src/data/portfolio/feature-detail-quality.test.ts src/components/projects/project-swimlane-layout.test.ts
```

Expected:

- 중복 위치, 잘못된 참조·좌표와 단절된 정상 경로를 차단한다.
- start/end 단일성, 모든 비중단 단계의 정상 경로 참여와 exception 설명·edge 양방향
  관계를 검증한다.
- lane/row를 안정적인 좌표로 변환하고 anchor·waypoint·polyline 계산이 통과한다.
- 승인된 두 흐름의 핵심 여섯 단계와 예외 대응 문장이 일치한다.

## 2. Server Rendering Contract

```bash
pnpm --dir apps/front exec vitest run src/components/projects/project-detail-rendering.test.tsx
```

Expected:

- 두 figure와 이름 있는 connected-flow image가 표시되고 보이는 `전체 흐름 설명`이
  image 설명으로 연결된다.
- process, decision, start/end/stop 도형과 normal/exception edge가 존재한다.
- 설계 흐름은 `리뷰·검증` decision에서 `통과`하면 보조 `완료` end로 가고 `실패`하면
  `테스트·구현`으로 돌아간다.
- 모든 decision의 나가는 정상·예외 edge에 승인·통과·일치·실패 결과 label이 표시된다.
- `전체 흐름 설명`과 `예외 상황과 대응`이 표시된다.
- `연결과 분기`, `순서형 대체 설명`, `이전 단계로 복구`, `계속`, `제한:`이 없다.
- 산정·측정·관찰 범위 label mapping이 통과한다.

## 3. Static Verification

```bash
pnpm --dir apps/front exec tsc --noEmit
pnpm --dir apps/front test
pnpm --dir apps/front run lint
pnpm --dir apps/front run build
```

Expected:

- typecheck와 전체 Vitest가 통과한다.
- 신규·수정 기능 범위의 ESLint가 통과한다.
- production build가 8개 작업물 경로를 포함한 정적 페이지를 생성한다.
- 저장소 전역 lint가 기존 Prettier 기준선으로 실패하면 전체 결과와 기능 범위 lint를
  분리해 기록하고 관련 없는 파일을 일괄 포맷하지 않는다.

## 4. Browser E2E

```bash
mise run //apps/front:e2e
```

Expected critical flows:

1. 두 다이어그램에서 정상 여섯 단계와 exception path 수 확인
2. 320/768/1024/1440px에서 page overflow 1px 이하
3. 320px에서 이름 있는 diagram region의 ArrowRight 내부 scroll
4. 정적 node와 edge에 tab stop 없음
5. 밝은/어두운 화면에서 실선·점선과 도형·문구 구분
6. 하네스 demo CTA 부재와 8개 작업물 경로 유지
7. 하네스 외 대표 legacy 본문 유지

깨끗한 index-scoped E2E stamp가 가능한 경우 기본 gate는 다음이다.

```bash
mise run e2e:changed
```

dirty worktree 때문에 stamp를 만들 수 없으면 사용자 변경을 임의로 stage하지 않고 앱 전용
E2E의 명령·결과와 사유를 `verification.md`에 기록한다.

## 5. Manual Observation

- 정상선을 따라 시작부터 완료까지 끊김 없이 읽힌다.
- exception 점선은 어떤 조건에서 어느 단계로 돌아가는지 명확하다.
- 자연어 예외 문장만 읽어도 같은 중단·복귀 결과를 이해한다.
- SVG node와 edge label이 lane 경계 또는 다른 node와 겹치지 않는다.
- 작은 화면에서는 diagram 내부만 움직이고 페이지 본문은 고정된다.
- 다크 모드에서 선, 화살표, node label과 lane title이 읽힌다.

## 6. Completion Evidence

`verification.md`에 다음을 기록한다.

- TDD RED→GREEN 명령과 핵심 실패·통과 결과
- typecheck, unit, lint, build와 E2E 결과
- 네 viewport와 키보드·다크 모드 관찰
- 기존 8개 경로와 공개 금지 문구 회귀 결과
- reviewer Critical/Important 해결 내역
- `speckit-converge` 결과
- `mise run feature:status:sync` 결과 또는 task 부재 상태
