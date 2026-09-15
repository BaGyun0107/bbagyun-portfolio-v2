# Verification: Codi Harness 콘텐츠 보강 및 인사이트 통합

## Loops

### Loop 1 — T001~T004 공통 정본과 증거 성숙도

- 상태: T003의 `Feature.content` 제거 완료, representative insight 관련 계약은 후속 task로 이관
- 범위: 중복 본문 정본, 대표 insight 대체 장문, 측정·관찰·산정, 약 2주 운영 확장 실험
- T011 이후 이관: 대표 insight 본문과 `legacyContent`는 T011~T017에서 변경하므로 관련 RED는 의도적으로 유지한다.

### Loop 2 — T005~T010 작업물 상세 MVP

- 상태: 완료
- 범위: 설명·개요, 책임·문제, 대표 설계 네 개, 전환 판단, 결과·회고, 단일 대표 링크

## RED

### 2026-08-21 — T011~T018/T025/T026 통합 전 focused RED

- 명령: `pnpm --dir apps/front exec vitest run src/data/portfolio/feature-detail-quality.test.ts src/data/portfolio/content-quality.test.ts src/components/projects/project-detail-rendering.test.tsx -t '공개 정본은 중복 Feature 본문과 대표 insight 대체 장문|하네스 관련 insight는 대표 정본 하나와 유지 인프라 세 개만 남긴다|canonical insight는 승인된 8단계 발전 서사와 사실 근거를 깊이 있게 제공한다'`
- 결과: 2 files failed, 1 file skipped, 3 tests failed, 58 tests skipped.
- 실패 이유: 대표 insight에 `legacyContent`가 남아 있고 제목이 이전 값이며, 하네스 관련 registry가 제거 대상 네 slug를 포함한 8개라 exact canonical+유지 인프라 3개 계약을 위반했다.
- 명령: `pnpm --dir apps/front exec playwright test e2e/codi-harness-portfolio-detail.spec.ts --grep '통합 대표 insight|제거된 네 insight|실제 작업물 route' --reporter=line`
- 결과: 3 tests failed.
- 실패 이유: 키보드 이동 후 대표 insight가 이전 h1을 표시했고, 첫 제거 대상 route가 HTTP 200이었으며, 실제 작업물 route의 canonical href가 본문과 자동 related 목록에 중복돼 2개였다.

### 2026-08-21 — 구현 전 data/content RED

- 명령: `pnpm --dir apps/front exec vitest run src/data/portfolio/feature-detail-quality.test.ts src/data/portfolio/content-quality.test.ts -t '공개 정본|구조화 상세만 본문 정본|세 책임과 세 문제|대표 설계 네 개|대표 설계는 두 도구|결과와 회고|하네스 증거'`
- 결과: 2 files failed, 7 tests failed, 41 tests skipped.
- 실패 이유: 하네스 `Feature.content`와 대표 insight `legacyContent`가 남아 있었고, description·overview·role·problem·outcomes·retrospective가 승인 문구 이전 상태였다. 구현 heading은 `현재 구조`, `발전 기록`, `더 깊이 읽기`였고 대표 링크 대신 제거 대상 네 링크를 가리켰다. 대표 발전 글에는 `약 2주`와 `운영 확장 실험` 구분이 아직 없었다.

### 2026-08-21 — 구현 전 server rendering RED

- 명령: `pnpm --dir apps/front exec vitest run src/components/projects/project-detail-rendering.test.tsx -t '대표 설계 네 개와 단일 정본 링크'`
- 결과: 1 file failed, 1 test failed, 10 tests skipped.
- 실패 이유: `relatedInsights={[]}`인 본문 renderer의 정적 markup에 첫 승인 heading `./harness와 doctor`가 없어 heading assertion이 실패했다. 이 RED도 actual project route의 자동 관련 목록은 포함하지 않았다.

### 2026-08-21 — 구현 전 targeted Playwright RED

- 명령: `pnpm --dir apps/front exec playwright test e2e/codi-harness-portfolio-detail.spec.ts --grep '대표 설계 네 개|대표 insight 링크 하나' --reporter=line`
- 결과: 2 tests failed.
- 실패 이유: 공개 페이지에서 `./harness와 doctor` heading 수가 0개였고 승인 제목의 canonical insight 링크 수도 0개였다.

## GREEN

### 2026-08-21 — T019/T020 보존 계약 보강

- production data/component/page는 수정하지 않았다.
- T019 mutation RED: legacy fixture의 기대 본문 길이 목록을 빈 배열로 변조한 뒤 `pnpm --dir apps/front exec vitest run src/data/portfolio/feature-detail-quality.test.ts -t '구조화 상세은 하네스 하나뿐이며 다른 7개 작업물의 기존 본문을 보존한다'` → 1 failed, 44 skipped. 실제 7개 slug와 trim 길이 `5097/4903/4400/3584/5127/3474/4067`을 차이로 검출했다.
- T020 mutation RED: legacy 본문 영역의 고유 snippet 기대 개수를 2로 변조한 뒤 `pnpm --dir apps/front exec playwright test e2e/codi-harness-portfolio-detail.spec.ts --grep '8개 작업물 경로' --reporter=line` → 1 failed. `the-siena-golf-reservation`의 actual body paragraph가 expected 2 / received 1로 정확히 검출됐다.
- T019 focused GREEN: 승인 fixture로 복원한 뒤 `pnpm --dir apps/front exec vitest run src/data/portfolio/feature-detail-quality.test.ts -t '하네스 상세은 근거가 구분된 6개 결과|설계·개발·검증 흐름|CI/CD·시크릿·배포 흐름|구조화 상세은 하네스 하나뿐이며 다른 7개 작업물의 기존 본문'` → 4 passed, 41 skipped.
- T019 full data GREEN: `pnpm --dir apps/front exec vitest run src/data/portfolio/feature-detail-quality.test.ts` → 1 file, 45 tests passed. 두 swimlane의 title·lane·step·edge·summary, highlight 6개의 전체 `id/label/value/kind/asOf/evidence/caveat`, demo `undefined`, legacy 7개의 exact slug·snippet·trim 길이를 승인 데이터에 고정했다.
- T020 targeted GREEN: 동일 legacy route E2E 명령 → 1 passed. `.first()` 우회 없이 `main` actual body 영역이 하나임을 확인하고, 각 slug의 고유 paragraph가 정확히 1개이며 visible임을 검증했다.
- removed-route 제외 전체 GREEN: `pnpm --dir apps/front exec playwright test e2e/codi-harness-portfolio-detail.spec.ts --grep-invert '제거된 네 insight route' --reporter=line` → 15 passed. 10개 h2, 두 named region, 두 region의 320px ArrowRight scroll, 4 viewport overflow, 8 project route/7 legacy body, canonical same-tab·AWS external safe attrs를 포함했다.
- shared 1104 전체 E2E: `pnpm --dir apps/front exec playwright test e2e/codi-harness-portfolio-detail.spec.ts --reporter=line` → 15 passed, 1 failed. 유일 실패는 기록된 stale shared server의 `harness-lock-and-project-ownership-boundary` HTTP status expected 404 / received 200이며, T019/T020 보존 검증 15건은 모두 통과했다. 요구대로 actual full file GREEN이 아니므로 T020은 unchecked로 유지한다.
- fresh 전체 E2E: 현재 `apps/front`를 `/tmp/bbagyun-front-e2e.zJLolv`에 복제하고 기존 `node_modules`를 연결한 뒤, 임시 Playwright config에서 fresh Webpack 서버 `127.0.0.1:1114`를 사용해 `pnpm exec playwright test e2e/codi-harness-portfolio-detail.spec.ts --reporter=line`을 실행했다. 결과는 16 tests passed, exit 0이었다. 제거 4개 route의 redirect 없는 HTTP 404, 유지 인프라 3개 제목·본문, canonical route, 두 diagram, 4 viewport, 두 keyboard scroll, 8 project route와 7 legacy 본문을 같은 fresh 서버에서 확인했으므로 T020을 완료했다. 임시 복제본 외 production·project config는 수정하지 않았다.
- exact test lint: `pnpm --dir apps/front exec eslint src/data/portfolio/feature-detail-quality.test.ts e2e/codi-harness-portfolio-detail.spec.ts` → exit 0, error 0.
- whitespace: `git diff --check -- specs/004-codi-harness-content-consolidation/tasks.md specs/004-codi-harness-content-consolidation/verification.md apps/front/src/data/portfolio/feature-detail-quality.test.ts apps/front/e2e/codi-harness-portfolio-detail.spec.ts` → exit 0.

### 2026-08-21 — Checkpoint2 preserved infra title/body 회귀 계약

- HEAD/current 비교: 세 preserved insight의 제목과 아래 고유 body snippet은 모두 기존 공개 값과 현재 registry에서 동일했다. Jenkins의 비용 근거 문단은 이전 task에서 공개 가격 기준으로 의도적으로 정정됐으므로, HEAD와 현재에 공통으로 남은 회고 문장을 fixture로 선택했다. 이번 checkpoint에서 production data는 수정하지 않았다.
- Jenkins
  - title: `Jenkins 제거와 GitHub Actions CI/CD 마이그레이션`
  - snippet: `관성적으로 쓰던 도구를 버리고 현재의 비즈니스 체급과 비용에 가장 알맞은 아키텍처를 새로 그리는 것, 이것이 진정한 의미의 DevOps이자 인프라 최적화임을 깨달았습니다.`
- Infisical
  - title: `Infisical 도입기: 환경변수 중앙화와 단일 장애점(SPoF)을 방어하는 CI/CD 아키텍처`
  - snippet: `"배포 장애를 감수하더라도 실 서비스의 장애는 막는다."`
- Cloudflare
  - title: `Cloudflare Tunnel을 활용한 Zero Trust CI/CD 구축과 트러블슈팅`
  - snippet: `단순히 튜토리얼을 따라 하는 것을 넘어, WAF의 특성, L4/L7 로드밸런싱의 원리, 그리고 비용 대비 효율을 고려한 아키텍처적 결단(Bastion 보류)까지 검토할 수 있었습니다.`
- mutation RED unit: Jenkins expected title에 `[변조]`를 붙인 뒤 `pnpm --dir apps/front exec vitest run src/data/portfolio/feature-detail-quality.test.ts -t '유지 인프라 insight 세 개의 기존 제목과 대표 본문을 보존한다'` → 1 failed, 실제 title과 변조 fixture 차이를 검출했다.
- mutation RED E2E: Cloudflare expected snippet에 `[변조]`를 붙인 뒤 `pnpm --dir apps/front exec playwright test e2e/codi-harness-portfolio-detail.spec.ts --grep '유지 인프라 세 경로는 기존 제목과 대표 본문' --reporter=line` → 1 failed, 변조 문장이 화면에 없음을 검출했다.
- GREEN unit: 변조 fixture를 기존 값으로 되돌린 같은 focused Vitest → 1 passed, 44 skipped.
- locator refinement: Cloudflare snippet은 더 긴 paragraph의 첫 문장이므로 fixture 값은 유지하고 E2E는 exact paragraph 일치가 아니라 substring visibility를 검사한다. title은 exact h1을 계속 검사한다.
- GREEN E2E: 같은 targeted Playwright → 1 passed. 세 route 모두 성공 응답·redirect 부재·exact h1·대표 body snippet visibility를 확인했다. shared stale removed route 시나리오는 이 명령에 포함하지 않았다.
- focused regression: `pnpm --dir apps/front exec vitest run src/data/portfolio/feature-detail-quality.test.ts` → 1 file passed, 45 tests passed.
- exact lint: `pnpm --dir apps/front exec eslint src/data/portfolio/feature-detail-quality.test.ts e2e/codi-harness-portfolio-detail.spec.ts` → exit 0.
- whitespace: `git diff --check` → exit 0.

### 2026-08-21 — T011~T018 canonical 통합과 exact registry

- focused 계약 명령: `pnpm --dir apps/front exec vitest run src/data/portfolio/feature-detail-quality.test.ts src/data/portfolio/content-quality.test.ts src/components/projects/project-detail-rendering.test.tsx`
- 결과: 3 files passed, 61 tests passed.
- 대표 insight: 제목 `DX 하네스 v2: 복사형 도구에서 사내 개발 운영 플랫폼까지`, `9 min`, 승인된 h2 8개 순서, 4,500자 초과 본문을 확인했다. 본문은 `운영 중인 핵심 구조`, `실제 적용 결과`, `약 2주`의 `운영 확장 실험`을 구분하고, Jenkins 출발·v1 copy drift·shared/project-owned와 `harness.lock`·CLI/doctor·policy runtime adapter·GSD→Spec Kit·GStack→Playwright MCP·멀티 세션 격리를 연결한다.
- 증거 범위: 5개 호텔 배포의 실행 화면 기준 약 15분→약 3분, 환경 혼입 동일 유형 문제가 현재까지 다시 관찰되지 않은 범위, 공개 가격 기반 월 $151.84 컴퓨팅 추정치와 스토리지·네트워크·세금 제외를 구분했다.
- registry: canonical 1개와 유지 인프라 3개만 하네스 `featureSlug`에 남고 제거 4개는 `REAL_INSIGHTS`와 `getInsightBySlug`에서 존재하지 않으며 `legacyContent` 타입·값도 없다.

### 2026-08-21 — T025/T027 실제 route와 HTTP status

- shared 1104 targeted 명령: `pnpm --dir apps/front exec playwright test e2e/codi-harness-portfolio-detail.spec.ts --grep '통합 대표 insight|제거된 네 insight|실제 작업물 route' --reporter=line`
- shared 결과: 2 tests passed, 1 test failed. canonical 링크 keyboard same-tab 이동·제목·`9 min`·h2 8개와 실제 작업물 route의 canonical href 1개·제거 href 0개는 통과했다. 장기 실행 중이던 shared dev server는 route config를 hot-reload하지 않아 첫 removed route를 계속 HTTP 200으로 응답했다.
- 잘못된 초기 가설 기각: data registry와 `getInsightBySlug`가 제거를 반영했는데도 fresh 수정 전 서버에서 removed route가 HTTP 200이었다. 응답 본문에는 `noindex`, `NEXT_HTTP_ERROR_FALLBACK;404`, `This page could not be found`가 있어 stale data가 아니라 page render 중 `notFound()`가 streaming 404 UI를 200 status로 반환한 것이 원인이었다.
- 최소 수정: insight 정적 registry의 `generateStaticParams`를 유지하고 `dynamicParams = false`를 추가해 registry 밖 slug를 router 단계에서 거부한다.
- fresh Webpack proof: 현재 `apps/front`를 다시 복제한 fresh 1114 server에서 removed 4개/canonical/project 순으로 `404, 404, 404, 404, 200, 200`; `redirect_url`은 6개 모두 빈 값이었다. server log도 removed GET 4개를 각각 404로 기록했다.
- shared full E2E: `pnpm --dir apps/front exec playwright test e2e/codi-harness-portfolio-detail.spec.ts --reporter=line` → 15 tests 중 14 passed, 1 failed. 실패는 위 shared server의 removed HTTP status 하나이며, 나머지 기존 swimlane·contrast·4 viewport·keyboard·8 project route와 새 canonical/href 계약은 통과했다. fresh route proof와 shared hot-reload 제약을 합쳐 완료 여부를 판단하며 shared 결과를 전체 GREEN으로 표시하지 않는다.

### 2026-08-21 — T018/T026 정적·정확 fixture 검증

- removed reference 검사: `rg -n 'harness-lock-and-project-ownership-boundary|harness-cli-and-doctor-productization|claude-codex-policy-parity-and-regression-testing|multi-session-testbed-and-context-lifecycle' apps/front/src apps/front/e2e` → feature-detail·renderer·E2E의 의도된 제거 fixture만 남았다.
- production-only 검사: 같은 패턴을 `apps/front/src --glob '!*.test.ts' --glob '!*.test.tsx'`에 실행 → 0건(exit 1).
- TypeScript: `pnpm --dir apps/front exec tsc --noEmit` → exit 0.
- test exact-file ESLint: `pnpm --dir apps/front exec eslint src/data/portfolio/feature-detail-quality.test.ts src/data/portfolio/content-quality.test.ts src/components/projects/project-detail-rendering.test.tsx e2e/codi-harness-portfolio-detail.spec.ts` → exit 0.
- production exact-file ESLint: `pnpm --dir apps/front exec eslint src/data/portfolio/insights.ts 'src/app/(public)/projects/[slug]/page.tsx' 'src/app/(public)/insights/[slug]/page.tsx'` → exit 1, 기존 파일 전반의 Prettier/import-order 126 errors. 이번 변경 줄 외 기존 장문 객체와 두 page의 전체 formatting debt를 자동 수정하면 공유 worktree의 사용자 변경을 대량 재작성하므로 범위를 확대하지 않았다.
- whitespace: `git diff --check` → exit 0.

### 2026-08-21 — 작업물 상세 data

- 명령: `pnpm --dir apps/front exec vitest run src/data/portfolio/feature-detail-quality.test.ts -t '구조화 상세만 본문 정본|세 책임과 세 문제|대표 설계 네 개|대표 설계는 두 도구|결과와 회고'`
- 결과: 1 file passed, 5 tests passed, 38 tests skipped.
- 확인: harness legacy `Feature.content` 제거, description·overview 역할 분리, 책임 3범주, 문제 3범주, 대표 설계 4개와 `더 깊이 읽기`, implementation 문자열 내부 canonical link 1개·제거 링크 0개, 전환 이유, outcomes·retrospective.

### 2026-08-21 — 본문 renderer fixture

- 명령: `pnpm --dir apps/front exec vitest run src/components/projects/project-detail-rendering.test.tsx -t 'relatedInsights가 없는 본문 renderer fixture'`
- 결과: 1 file passed, 1 test passed, 10 tests skipped.
- 확인: `ProjectDetailContent`에 `relatedInsights={[]}`를 전달한 본문 전용 renderer fixture에서 h3 승인 설계 4개가 유일하게 순서대로 렌더링되고, 본문 내부 canonical href 1개, 제거 href 0개, figure 2개, 근거 지표 6개, demo 문구 0개다. 이 테스트는 실제 project route가 조합하는 자동 관련 목록까지 증명하지 않는다.

### 2026-08-21 — targeted browser

- 명령: `pnpm --dir apps/front exec playwright test e2e/codi-harness-portfolio-detail.spec.ts --grep '대표 설계 네 개|작업물 본문의 대표 insight 링크' --reporter=line`
- 결과: 2 tests passed.
- 확인: 승인 설계 heading과 두 도구 전환 이유가 보이고, `핵심 설계와 구현` 본문의 `더 깊이 읽기` heading 아래 canonical link가 같은 탭에서 열리며 AWS 외부 근거 링크의 새 창·안전 속성을 유지한다. 실제 route 전체 href 수량은 이 phase에서 주장하지 않는다.

## Full verification

### 2026-08-21 — T021 최종 품질 게이트

- 실행 순서: `pnpm --dir apps/front exec tsc --noEmit` → `pnpm --dir apps/front test` → `pnpm --dir apps/front run lint` → `pnpm --dir apps/front run build` → `mise run //apps/front:e2e` → `git diff --check`.
- TypeScript: exit 0.
- Unit·integration rendering: Vitest 4 files, 73 tests passed. 별도 integration script는 없으며 server rendering 계약이 같은 Vitest suite에 포함된다. Vite의 향후 native config loader 관련 경고만 출력됐다.
- 전체 lint: exit 1, 2,086 problems(2,068 errors, 18 warnings, 2,064 fixable). 대부분 저장소 전반의 기존 Prettier·import-order 기준선 불일치이며 자동 수정은 unrelated dirty worktree를 대량 재작성하므로 실행하지 않았다. 이번 변경 테스트·E2E exact-file lint는 exit 0이고 production 변경 줄의 새 의미상 오류는 별도 리뷰에서 확인되지 않았다.
- Build: exit 0. Next.js 16.1.6이 38개 static page를 생성했다. `/insights/[slug]`는 canonical과 유지 인프라를 포함한 19개 정적 경로, `/projects/[slug]`는 하네스를 포함한 8개 정적 경로로 빌드됐다. 저장소 루트의 별도 lockfile을 감지한 workspace-root 경고는 기존 환경 상태로 남았다.
- 정책 명령 E2E: `mise run //apps/front:e2e` → 16개 중 15 passed, 1 failed. 장기 실행 shared 1104 서버가 route config를 갱신하지 않아 첫 removed slug를 HTTP 200으로 반환한 기존 단일 실패이며 나머지 15개 사용자 흐름은 통과했다.
- Fresh E2E: 같은 현재 소스를 복제한 fresh Webpack 1114 서버에서는 전체 16 tests passed, exit 0. 따라서 코드의 공개 경로·본문·스윔레인·반응형 계약과 shared dev process의 hot-reload 잔여를 분리한다.
- Whitespace: `git diff --check` exit 0.

전체 앱 검증은 T021에서 기록한다. T001~T010 변경 범위에서는 아래 검증을 실행했다.

- owned focused Vitest: `pnpm --dir apps/front exec vitest run src/data/portfolio/feature-detail-quality.test.ts src/data/portfolio/content-quality.test.ts src/components/projects/project-detail-rendering.test.tsx -t '^(?!.*(?:공개 정본은 중복 Feature 본문과 대표 insight 대체 장문|canonical insight는 약 2주의 운영 확장 실험)).*$'` → 3 files, 58 tests passed, 2 deferred tests skipped.
- typecheck: `pnpm --dir apps/front exec tsc --noEmit` → exit 0.
- exact-file lint: `pnpm --dir apps/front exec eslint src/data/portfolio/feature-detail-quality.test.ts src/data/portfolio/content-quality.test.ts src/components/projects/project-detail-rendering.test.tsx e2e/codi-harness-portfolio-detail.spec.ts src/data/portfolio/features.ts src/data/portfolio/feature-details/codi-harness-dx-platform.ts` → exit 0, error 0.
- E2E readiness flake: 품질 리뷰의 fresh full E2E에서 12/13만 통과했고, `page.goto()` 직후 loading 상태의 빈 h3 배열을 `allTextContents()`가 읽는 실패를 재현했다. viewport 검사도 실제 하네스 콘텐츠가 준비되기 전 `scrollWidth`를 읽을 수 있는 같은 구조였다.
- readiness 수정: heading 순서 측정 전 `핵심 설계와 구현` 및 마지막 승인 h3가 visible인지 확인하고, 각 viewport 측정 전 `프로젝트 개요`와 두 named diagram region이 visible인지 web-first assertion으로 확인한다. loading 문구나 arbitrary timeout은 사용하지 않는다.
- affected E2E stability: `pnpm --dir apps/front exec playwright test e2e/codi-harness-portfolio-detail.spec.ts --grep '대표 설계 네 개|페이지 전체 가로 넘침' --repeat-each=5 --reporter=line` → 25 tests passed.
- fresh full owned E2E: `pnpm --dir apps/front exec playwright test e2e/codi-harness-portfolio-detail.spec.ts --reporter=line` → 13 tests passed.
- latest exact-file lint: `pnpm --dir apps/front exec eslint e2e/codi-harness-portfolio-detail.spec.ts src/data/portfolio/content-quality.test.ts` → exit 0, error 0.
- 320px integration regression: 무중단 문자열 `Brainstorming·Planning·Execution·Review·Verification`가 288px 본문에서 384px scrollWidth를 만들어 문서가 80px 넘쳤다. 구분자에 공백을 추가해 wrap point를 만든 뒤 320px targeted test와 4개 viewport 전체를 GREEN으로 확인했다.

## Review

- T022 Minor preserved content length 계약: `PRESERVED_HARNESS_INFRA_INSIGHTS`에 현재 승인된 `content.trim().length`를 Jenkins `1958`, Infisical `2167`, Cloudflare `3221`로 고정했다. Jenkins fixture만 `1959`로 변조한 focused Vitest는 `expected 1959 / received 1958`로 1 failed하여 길이 변조를 검출했고, `1958`로 복원한 같은 테스트는 1 passed, 44 skipped였다. Production data와 T022/T023 task 상태는 변경하지 않았다.
- 최종 코드·콘텐츠 리뷰: preserved 본문 길이 보강 후 Critical 0, Important 0, Minor 0으로 승인됐다.
- `speckit-converge`: 첫 분석에서 plan Summary/Constitution의 insight static-route gate 누락과 이미 완료된 T011~T017을 후속 RED로 표현한 오래된 verification 문구를 발견했다. 기존 T023 범위에서 두 문서를 현재 구현과 맞춘 뒤 재분석했고 `✅ Converged`, Critical 0, Important 0, Minor 0 판정을 받았다. 새 append-only task는 필요하지 않았다.
- ROADMAP/status sync: root `ROADMAP.md`의 Completed에 Feature 004의 콘텐츠 통합, 기존 증거 보존, fresh E2E 16/16과 수렴 완료를 추가했다. `mise run feature:status:sync`는 exit 1, `no task //:feature:status:sync found`로 미지원이었고 출력된 task 목록에도 해당 명령이 없었다. 따라서 deterministic transition은 적용하지 않고 기존 workflow note에 따라 ROADMAP과 완료된 `tasks.md`를 수동 정본으로 유지한다.
- 완료 직전 fresh 검증: TypeScript exit 0, 전체 Vitest 4 files/73 tests passed, 변경 범위 exact ESLint exit 0, Next.js build 38 static pages/exit 0, fresh Webpack 1114 전체 E2E 16/16 passed, `git diff --check`와 cached diff-check exit 0을 다시 확인했다. Feature 004 tasks에는 unchecked 항목이 없다.

- 보존: 기존 swimlane 2개와 그 데이터, highlight 6개의 값·kind·evidence, demo 부재를 수정하지 않았다. full owned Vitest와 E2E에서 두 diagram, 6개 지표, 10개 h2, 4 viewport, ArrowRight, 8 routes와 7 legacy 본문 snippet을 확인했다.
- 단일 정본: harness `Feature.content`만 제거했고 다른 7개 `content` 문자열은 수정하지 않았다.
- 링크: 작업물 implementation은 canonical insight 링크 1개만 소유하고 제거 대상 4개 slug를 더 이상 참조하지 않는다. AWS 가격 외부 링크는 같은 근거를 안전 속성과 함께 유지한다.
- actual route 후속: T025에서 project route의 canonical href 1개·제거 href 0개를 구현·검증했다. shared 1104의 removed route HTTP status는 stale server 제약으로 전체 E2E에서만 1건 남아 있으며, data registry와 actual project href 계약은 GREEN이다.
- fixture inventory 후속: T026에서 유지 인프라 insight 3개·제거 insight 4개의 exact slug fixture와 보존/제거 assertion을 추가해 완료했다.
- T004 source 책임: `detail.outcomes`는 실행 화면 측정, 현재까지의 관찰, 공개 가격 산정과 비용 제외 범위를 자체 문장만으로 검증한다. `canonicalInsight.content`의 `약 2주`·`운영 확장 실험`은 별도 deferred test로 분리해 두 source가 서로의 누락을 보완해 통과하지 못하게 했다. 실제 과장 표현은 `성공률 100%`, `향후 발생 가능성이 0입니다`, `완전 무결점`을 구체적으로 차단한다.
- legacy body locator 완료: T019/T020에서 7개 slug의 exact snippet·trim 길이를 data fixture로 고정하고, E2E에서 `.first()`를 제거했다. 각 route의 `main` actual body에 고유 paragraph가 정확히 1개 visible인지 검증한다.
- 증거 정직성: 측정 배포 시간, 관찰된 환경 혼입 미발생, 공개 가격 산정 범위를 outcomes에 분리했다. 성공률·미래 무결점·공개 demo 주장을 추가하지 않았다.
- 단계별 RED 해소: T001~T010 시점에는 `legacyContent`와 `약 2주`/`운영 확장 실험` 표지 테스트가 후속 RED로 남아 있었다. T011~T017에서 대표 insight를 통합하고 제거 객체·대체 장문을 삭제한 뒤 해당 계약을 GREEN으로 전환했으며, 최신 전체 Vitest 73/73과 canonical focused 검증에 포함된다.
- self-review: T001~T010 범위에서 Critical/Important 미해결 발견 없음. commit 또는 stage하지 않았다.
