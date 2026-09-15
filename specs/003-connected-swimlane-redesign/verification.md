# Verification: 연결형 스윔레인 재설계

## Session Baseline

- Date: 2026-08-21 (Asia/Seoul)
- Branch: `chore/cleanup-downstream-harness`
- Size: Large
- Checklist gate: `checklists/requirements.md` 16/16 checked, 0 unchecked
- Worktree condition: 기존 사용자 변경과 기능 002 산출물이 함께 있는 dirty shared worktree를
  보존한다. commit, stage, restore/reset, 관련 없는 일괄 formatting을 수행하지 않는다.
- Existing isolation: 일반 checkout(`git-dir`과 `git-common-dir` 모두 `.git`)이며, 공유
  workspace를 사용하라는 세션 조건에 따라 별도 worktree를 만들지 않는다.

### Focused baseline

Command:

```bash
pnpm --dir apps/front exec vitest run src/data/portfolio/feature-detail-quality.test.ts src/components/projects/project-detail-rendering.test.tsx
```

Result: exit 0, 2 files passed, 22 tests passed. Vite가 향후 native config loader와 관련된
기존 경고를 1건 출력했지만 테스트 실패나 runtime warning은 없었다.

## TDD Evidence

### T002~T006 — connected data contract and geometry

- Validator RED: `-t '연결형 스윔레인 validator'`에서 기존 validator 누락으로 12 failed,
  15 skipped.
- Validator GREEN: runtime union, graph, layout, outcome, exception narrative와 malformed array
  보강 후 validator·geometry 결합 집중 실행이 2 files passed, 32 passed, 15 skipped.
- Invalid edge kind 회귀: 기존 validator가 `failure`를 오류 없이 허용하는 RED 1건을 확인한
  뒤 path 기반 kind 오류를 추가해 GREEN 1건.
- Malformed array 회귀: highlights/swimlanes/lanes/steps/edges/edgeIds가 TypeError를 내는
  RED 6건을 확인한 뒤 모든 배열을 path 오류와 안전한 빈 view로 처리해 7건 GREEN.
- Geometry RED: 모듈 부재로 `Cannot find module './project-swimlane-layout'`.
- Geometry GREEN: 승인 상수, 다섯 node shape, anchor, bounds, 음수·소수 gutter,
  waypoint/label position과 polyline을 검증하는 11 tests passed.
- Foundation exact-file ESLint: exit 0.
- Foundation spec review: compliant.
- Foundation quality review: Critical 0, Important 0. Runtime constant/type union 중복,
  shallow registry freeze와 anchor exhaustiveness는 비차단 Minor로 기록.
- Deferred expected state: 하네스 flow data와 기존 renderer가 old DTO를 소비하므로 전체
  typecheck 및 old content tests는 T009~T016 마이그레이션 전까지 실패한다.

### T007~T019 — flow data, SVG renderer and metric scopes

- Pre-implementation unit/server RED: data + rendering 2 files failed, 10 failed and 37 passed.
  Old flow는 summary/exceptions/row/shape/anchors가 없고 legacy failure/recovery kind를
  사용했으며, card UI에는 semantic SVG와 근거별 범위 label이 없었다.
- Pre-implementation browser RED: targeted `두 연결형 스윔레인` Playwright 1 failed.
  `설계·개발·검증 전체 흐름` accessible image 부재로 timeout이 발생했다.
- Data GREEN: 두 승인 flow, core/auxiliary node, normal/exception route, decision label,
  summary와 exception narrative를 포함해 38/38 passed.
- Integrated GREEN after proof strengthening: data + geometry + rendering 3 files, 59/59 passed.
- TypeScript: `pnpm --dir apps/front exec tsc --noEmit`, exit 0.
- Browser GREEN: `pnpm --dir apps/front exec playwright test e2e/codi-harness-portfolio-detail.spec.ts`,
  14/14 passed. 두 flow, computed light/dark solid-vs-dashed stroke, 실제 node shapes,
  두 region keyboard scroll, no-demo, 10 headings, links, 4 viewports, 8 routes와 7 legacy
  public body snippets를 포함한다.
- Owned-file ESLint and diff-check: exit 0.
- Test-proof review 보강: visible summary target 문장, empty exception omission, unique marker
  IDs, edge-before-node order와 actual polygon/rect/radius를 직접 assertion한다.

### T020~T023 — accessibility, responsive flow and visual quality

- Proof gaps were closed for both named regions, both keyboard scroll targets, exact visible summary
  text, empty exception omission, actual shapes, marker uniqueness, edge order and all seven legacy
  public bodies.
- Header overlap RED: rendering test expected 8 lane header markers but found 0 in the old renderer;
  the old `y=30..100` header overlapped valid row-0 process/decision geometry.
- Header overlap GREEN: lane body/header start at `y=0`, keep `HEADER_HEIGHT=70` and bottom 30px
  padding; row-0 process and decision tops are below the header. Rendering 10/10 passed.
- Dark contrast RED: Canvas RGBA/WCAG calculation measured exception stroke vs card at
  `1.974851:1`, below the required 3:1.
- Dark contrast GREEN: exception path, marker, label and stop use `destructive` in light mode and
  the brighter semantic `destructive-foreground` in dark mode. E2E asserts path contrast ≥3:1 and
  12px label contrast ≥4.5:1 in both themes.
- Fresh integrated evidence after fixes: Vitest 59/59, typecheck exit 0, full Playwright 14/14,
  diff-check exit 0.
- Final T007~T023 spec review: Critical 0, Important 0, Minor 0.
- Final code quality review: APPROVED, Critical 0, Important 0. Nonblocking Minor: same-flow
  duplicate component instances could duplicate IDs; internal title/desc IDs are not referenced;
  validator is intentionally not a complete `unknown` schema parser.

## Verification Gates

- `pnpm --dir apps/front exec tsc --noEmit`: exit 0.
- `pnpm --dir apps/front test`: exit 0, 4 files and 63 tests passed. Vite native config
  loader 호환성 경고 1건은 기존 비차단 경고다.
- `pnpm --dir apps/front run lint`: exit 1, 저장소 전역 기존 기준선에서 2,093 problems
  (2,075 errors, 18 warnings). 대부분 기존 파일의 `prettier/prettier`와 import order이며,
  관련 없는 사용자 파일을 일괄 formatting하지 않았다.
- `pnpm --dir apps/front run build`: exit 0, Next.js production compile과 42개 static page
  generation 성공. 저장소 root의 복수 lockfile 추론 경고는 기존 비차단 경고다.
- `mise run //apps/front:e2e`: exit 0, 14/14 passed. `설계·개발·검증 전체 흐름`은
  6 normal·3 exception edge, `변경·배포 전체 흐름`은 5 normal·3 exception edge를
  유지하며 두 flow, light/dark 대비, 320/768/1024/1440 overflow, keyboard scroll,
  no-demo, 8개 route와 legacy content를 실제 브라우저에서 확인했다.
- `git diff --check`: exit 0.

### Scoped lint 판정

이번 기능이 생성·수정한 DTO/barrel/validator/data, geometry, 두 renderer, metric component,
Vitest와 Playwright 파일 13개를 한 명령으로 전체 ESLint rule에 통과시켰다(exit 0).
따라서 전역 lint 실패는 이번 기능 파일의 오류가 아니라 기존 저장소 기준선이며, 신규 파일
전체 lint와 수정 legacy 파일의 비-Prettier lint 요구보다 강한 동일 전체-rule 검사를 만족한다.

## Review and Convergence

- 첫 최종 리뷰: Critical 0, Important 1. 현재 두 flow는 올바르지만 후속 작업물에서
  decision의 normal 분기 label이 비어도 validator가 통과하는 FR-021 재사용 계약 공백을
  발견했다.
- Review remediation RED: `decision에서 나가는 normal edge` 집중 테스트가 validator의
  빈 오류 배열을 확인하며 1 failed, 38 skipped.
- Review remediation GREEN: decision에서 출발하는 normal edge의 빈 결과 label을 path
  오류로 차단했다. exception 분기는 기존 조건 label 규칙이 계속 차단한다. 집중 테스트
  1 passed, 통합 data·geometry·rendering 60/60 passed, typecheck와 두 파일 ESLint exit 0.
- 동일 reviewer 재검토: **APPROVED**, Critical 0, Important 0. 독립 validator 39/39와
  diff-check를 통과했다. 동일 flow 중복 instance ID, 미참조 SVG title/desc ID, 완전한
  unknown schema parser가 아닌 점은 현재 typed build-time 경계에서 비차단 Minor다.
- `speckit-converge`: 22 FR, 12 buildable SC, 12 acceptance scenario, plan/data/renderer
  결정과 헌법 5개 원칙을 현재 코드·테스트·검증 증거에 대조했다. 남은 missing, partial,
  contradicts, unrequested finding은 각각 0건이며 `tasks.md`에 convergence task를
  추가하지 않았다. **✅ Converged — the implementation satisfies the spec, plan, and tasks.**

## Feature Status

- `mise run feature:status:sync`: exit 1, `no task //:feature:status:sync found`.
- 자동 적용 가능한 task가 없으므로 `ROADMAP.md`의 Completed에 기능 003과 검증 잔여
  상태를 수동 반영했다. commit, stage 또는 관련 없는 파일 변경은 수행하지 않았다.

## Final Audit

- 최종 review 보정 후 전체 Vitest를 다시 실행해 4 files, 64/64 passed.
- 공개 구현 범위에서 `연결과 분기`, `순서형 대체 설명`, `이전 단계로 복구`, `계속`,
  `제한:` 검색 결과 0건.
- 하네스 detail data의 `demo` 또는 `준비 중` 검색 결과 0건이며, rendering/E2E 계약은
  예외가 없을 때 빈 `예외 상황과 대응` 영역을 만들지 않는 상태를 유지한다.
- `tasks.md`의 T001~T028과 위 증거를 대조했으며 남은 미완료 기능 task는 0개다.
- 최종 `git diff --check`: exit 0.
