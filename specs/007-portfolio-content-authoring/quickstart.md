# Quickstart: 포트폴리오 콘텐츠 작성 규칙과 인사이트 계약 검증

**Date**: 2026-08-25

이 문서는 구현 순서와 완료 검증을 고정한다. 규칙은
[contracts/portfolio-insight-contract.md](./contracts/portfolio-insight-contract.md),
타입과 fixture는 [data-model.md](./data-model.md)를 참조한다.

## 사전 조건

- repo 작업 디렉터리: 저장소 root
- frontend 명령 작업 디렉터리: `apps/front`
- package manager: `pnpm` (`pnpm --dir apps/front ...` 또는 app cwd)
- feature Size: Large
- 현재 적용 대상: 정확히 8개(프로젝트 사례형 7개, 기술 탐구형 1개), legacy 보존 대상: 10개
- The Siena 로그 분리 인사이트는 2026-08-26 사용자 승인 후속으로 현재 적용 대상에 포함한다. 초기 7개/11개 RED 증거는 history로 보존한다.
- 포트 1104 dev server는 `.next/dev` lock을 사용 중이므로 건드리지 않는다.

## 1. Skill RED — baseline 먼저

skill 본문을 작성하기 전에 `evals/evals.json`에 들어갈 6개 scenario를 확정한다.
각 scenario를 skill 없이 실행하고 결과·실패 항목을 `mktemp -d`로 만든 isolated
workspace에 저장한다.

기대 RED:

- 최소 한 시나리오에서 연결 콘텐츠 누락, 출처/독립 이유 누락, 동일 heading 강제,
  불필요 visual, 사실 충돌 미탐지 중 하나가 관찰된다.
- baseline이 이미 expectation을 전부 만족하면 prompt가 구분력을 갖도록 보완한 뒤
  다시 실행한다. 결과를 꾸미지 않는다.

## 2. Skill GREEN

always-on rule과 project-local skill/reference를 작성하고 link를 갱신한다.

```bash
./harness skills-link
```

확인:

```bash
test -e .agents/skills/portfolio-content-authoring/SKILL.md
test -e .claude/skills/portfolio-content-authoring/SKILL.md
```

같은 6개 scenario를 skill과 함께 실행한다. 각 결과가 유형, 출처, 의미 계약,
시각 자료 판단, 교차 검증, 근거 보존 expectation을 모두 만족해야 한다.

## 3. Frontend RED

구현 전에 다음 계약 테스트를 추가하고 예상 이유로 실패를 확인한다.

```bash
cd apps/front
pnpm vitest run src/data/portfolio/insight-editorial-quality.test.ts
pnpm vitest run src/data/portfolio/content-quality.test.ts
```

예상 실패:

- `InsightDto`에 editorial contract 없음
- 8개 대상에 type/visual assessment 없음
- target content의 stale/충돌 표현 존재
- public list/detail에 type label 없음

UI 테스트가 별도 renderer 없이 page component를 검증하기 어렵다면 E2E assertion을
먼저 추가해 production E2E에서 RED를 확인한다. RED command와 핵심 failure를
verification에 기록한다.

## 4. 최소 구현과 GREEN

순서:

1. type union과 validator
2. 8개 metadata와 target fact correction (The Siena 승인 후속 포함)
3. 공부 기록과 Vercel 기술 탐구 글의 공유 가격 전제 정정
4. list/detail type/source 표현
5. 양방향 링크와 legacy 보존 회귀

검증:

```bash
cd apps/front
pnpm exec tsc --noEmit
pnpm vitest run src/data/portfolio/insight-editorial-quality.test.ts
pnpm vitest run src/data/portfolio/content-quality.test.ts
pnpm vitest run
```

## 5. 변경 범위 lint와 build

저장소 전역 lint는 기존 baseline 때문에 사용하지 않는다. 실제 변경한 frontend
파일만 명시한다.

```bash
cd apps/front
pnpm exec eslint \
  'src/app/(public)/insights/page.tsx' \
  'src/app/(public)/insights/[slug]/page.tsx' \
  src/data/portfolio/insight-editorial.ts \
  src/data/portfolio/insight-editorial-quality.test.ts \
  src/data/portfolio/content-quality.test.ts \
  src/data/portfolio/index.ts \
  src/data/portfolio/insights.ts \
  src/data/portfolio/studies.ts \
  src/data/portfolio/types/insight.dto.ts
pnpm run build
```

실제 변경 목록이 달라지면 관련 파일만 조정한다. 관련 없는 파일을 포맷하지 않는다.

## 6. Fresh production E2E

포트 1104와 `.next/dev`를 재사용하지 않는다. 프로덕션 build를 별도 미사용 포트로
실행하고 Playwright의 임시 baseURL 설정으로 검증한다.

검증 시나리오:

- 인사이트 목록에서 migrated 글의 두 type label 확인
- 하네스/한마음/블랙스톤 작업물 → 연결 인사이트 → 작업물 왕복
- 공부 기록 → Vercel 인사이트 → 공부 기록 왕복
- legacy 인사이트 route와 본문 snippet 보존
- 320/768/1024/1440px에서 document-level horizontal overflow 0
- 키보드로 type/source link 접근 가능

임시 server/config/process는 실행 후 제거한다. 장기 실행 dev server는 종료하지 않는다.

## 7. 최종 검사

```bash
git diff --check
mise run feature:status:sync
```

`feature:status:sync` task가 저장소에 없으면 실패 사실을 verification에 그대로
기록하고 `ROADMAP.md`와 `tasks.md`의 상태를 수동으로 대조한다. 자동으로 대체 명령을
만들지 않는다.

완료 조건:

- skill eval 6쌍 GREEN
- current target 8개 계약 100%, legacy 10개 보존
- typecheck·관련 Vitest·changed-file lint·build·fresh E2E 통과
- `speckit-converge`가 `Converged`
- Critical/Important review finding 0
- `verification.md`에 RED/GREEN, 자동/수동 증거와 잔여 위험 기록
