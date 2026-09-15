# Quickstart: Codi Harness 콘텐츠 보강 및 인사이트 통합 검증

## Prerequisites

- 저장소 루트: `/Users/codiworks_dev/Desktop/bbagyun-portfolio-v2`
- 앱 패키지 설치 완료: `apps/front/node_modules`
- Node.js 24와 앱의 `pnpm` 환경 사용
- 검증 대상 계약: [portfolio-content-contract.md](./contracts/portfolio-content-contract.md)

## 1. RED 확인

구현 파일을 수정하기 전에 콘텐츠·서버 렌더링 계약을 새 요구사항으로 바꾸고 실행한다.

```bash
pnpm --dir apps/front exec vitest run \
  src/data/portfolio/feature-detail-quality.test.ts \
  src/components/projects/project-detail-rendering.test.tsx \
  -t '구조화 상세만 본문 정본|대표 insight 하나|대표 설계 네 개'
```

기대 결과: 기존 하네스 중복 `content`, 네 개의 짧은 insight, 기존 heading 때문에 새 테스트가 요구한 이유로 실패한다.

```bash
pnpm --dir apps/front exec playwright test \
  e2e/codi-harness-portfolio-detail.spec.ts \
  --grep '대표 설계 네 개|통합 대표 insight|제거된 네 insight'
```

기대 결과: 대표 heading·제목이 없고 제거 route가 아직 200이므로 실패한다.

## 2. Focused GREEN

```bash
pnpm --dir apps/front exec vitest run \
  src/data/portfolio/feature-detail-quality.test.ts \
  src/data/portfolio/content-quality.test.ts \
  src/components/projects/project-detail-rendering.test.tsx
```

```bash
pnpm --dir apps/front exec playwright test \
  e2e/codi-harness-portfolio-detail.spec.ts \
  --grep '대표 설계 네 개|통합 대표 insight|제거된 네 insight'
```

기대 결과: 데이터 정본, 공개 HTML, 통합 navigation과 404 계약이 통과한다.

## 3. Full verification

아래 순서와 실제 출력을 `verification.md`에 기록한다.

```bash
pnpm --dir apps/front exec tsc --noEmit
pnpm --dir apps/front test
pnpm --dir apps/front run lint
pnpm --dir apps/front run build
mise run //apps/front:e2e
git diff --check
```

추가로 `rg`로 제거 slug의 앱 내부 참조가 0개인지 확인한다. dirty/untracked worktree 때문에 `mise run e2e:changed`가 suite 실행 후 evidence stamp를 거부하면 테스트 성공과 stamp 거부를 분리해 기록하며, 무관한 사용자 파일을 stage하거나 format하지 않는다.

## 4. Manual acceptance

1. 작업물 상세만 읽고 문제 3개, 책임 3개, 대표 설계 4개와 결과 4개 범주를 설명할 수 있는지 확인한다.
2. 대표 insight에서 8개 구간과 운영 구조·실제 결과·약 2주 실험의 성숙도 차이가 보이는지 확인한다.
3. 제거 route 4개가 redirect 없이 404인지, 유지 insight 3개와 작업물 route 8개가 정상인지 확인한다.
4. 하네스 두 diagram과 여섯 metric, 하네스 외 7개 본문이 변경 전과 같은지 확인한다.
