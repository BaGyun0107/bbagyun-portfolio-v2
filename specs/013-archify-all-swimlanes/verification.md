# Feature 013 검증 기록

검증일: 2026-09-10, 최종 갱신 2026-09-15 (Asia/Seoul)

## 범위와 환경

- 대상은 `apps/front/public/diagrams/`의 여덟 Archify HTML과 `apps/front/e2e/swimlane-viewer.spec.ts`다.
- 최종 검증 시 사용자 소유 개발 서버는 `TCP 1104`, Node PID `11082`였다. 검증 중 종료·재시작하지 않았다.
- 최종 production browser 검증은 build 후 별도 `12120` 포트의 `pnpm exec next start -p 12120`으로 수행했다.
- 임시 `apps/front/playwright.feature-013.prod.config.ts`는 `apply_patch`로 삭제했고 Playwright가 소유한 12120 server를 종료했다. 1104 PID `11082`는 그대로 유지했다.

## T041 / T044: 실제 production browser

명령:

```bash
pnpm --dir apps/front exec playwright test e2e/swimlane-viewer.spec.ts \
  --config=playwright.feature-013.prod.config.ts --reporter=line
```

최종 결과: `21 passed (2.3m)`.

검증한 계약:

- 여덟 target의 MAP preview와 Dialog READ가 320/768/1024/1440px에서 같은 artifact URL을 사용하며, card/document/Dialog 가로 overflow가 없다.
- Dialog legend, 모바일 transcript, Escape 후 trigger focus 복귀, touch/Enter/Space 실행을 확인했다.
- iframe은 `pointer-events: none`, `tabindex=-1`, inert body 상태이며 Viewer toolbar/단축키를 노출하지 않는다. portfolio theme 변경은 iframe reload 없이 동기화된다.
- malformed DOM, network error, 5초 초과 prepare timeout의 Dialog fallback이 ready preview snapshot을 바꾸지 않는지 각 target에서 확인했다.
- `/projects/integrated-reservation-platform`에는 Archify embed/iframe/Viewer control이 생기지 않는지 확인했다.

중간 실패와 수정 근거:

- 첫 실행은 이전 hotel-only 가정이 다른 일곱 target에서 React inline SVG를 기대해 실패했다. production DOM probe는 6개 route/8개 card 모두 `data-archify-swimlane=preview`, React inline 0개임을 확인했다. E2E를 all-eight contract로 교체했다.
- 새 all-eight test는 lazy iframe 준비의 기본 5초 expect와 30초 test timeout에 걸렸다. helper timeout을 15초, batch timeout을 180초로 명시했다.
- modal open 뒤 role-based background locator가 aria-hidden 처리를 따라 재해석되는 문제는 card overflow를 open 전 측정하고, fallback isolation은 element-handle의 `{ connected, state, src }` snapshot으로 비교해 해결했다.

## T042: Archify automated browser evidence

각 artifact에 다음을 실행했다. 이 명령은 HTML bytes를 수정하지 않고 receipt/PNG/contact-sheet sidecar를 만든다.

```bash
node /Users/codiworks_dev/.agents/skills/archify/bin/archify.mjs visual-check <artifact>.html --json
```

| Artifact | SHA-256 | Automated result |
| --- | --- | --- |
| `blackstone-belleforet-resort/payment-and-compensation.html` | `79021ddd2a67dd13f0b5caaf3e901bf0a89c567d4d137e107f32ed43c954514d` | pass: 4/4 captures |
| `codi-harness-dx-platform/cicd-secrets-deployment.html` | `a9db6cb5b7b4e279b36b5e89af8dca93d5a35108883dc8205fb7343e2703ab54` | pass: 4/4 captures |
| `codi-harness-dx-platform/design-development-verification.html` | `d6add5e1966122e2fbd824ca1cd4f3b1ce85a902af1f3e5c807d4620bddfb672` | pass: 4/4 captures |
| `hanmaum-science-institute/ingestion-and-recovery.html` | `ac85d47072f8290506e127c5f3edafe7a010581c8a527f1f0c953b7ca1aeff3e` | pass: 4/4 captures |
| `hanmaum-science-institute/search-request-flow.html` | `3d2905ea0a3370d31f3960e6d245397296e57fa0157d7d5d091b53cc2b72bc13` | pass |
| `hipass-b2b-platform/order-payment-compensation.html` | `646be89949d22fa32d86293c4d856bb3801a9e6d0df86e2f45f0d02ab9416162` | pass: 4/4 captures |
| `hotel-reservation-platform/platform-change-verification-deployment.html` | `a23ebd2219cda3bad5deccc3461e7d6522cfc90d5e34d6d4dffd5469817f49d3` | pass |
| `integrated-sso-server/central-account-auth-flow.html` | `998f2f58e1b7e4108b9262706615368c6873da42c447e7a592fd03d1df9fc254` | pass: 4/4 captures |

모든 receipt의 artifact hash/byte가 현재 HTML과 일치한다. 여덟 artifact 모두 1440×900·2048×1320의 light/dark 캡처에서 `overflowX: false`, `overflowY: false`, `readability: pass`, `viewerChrome: pass`, `captures: pass`다. T048 대상 여섯 source는 fresh `validate workflow --json`에서도 각각 9/9 검사, composition 오류 0·경고 0으로 통과했다.

## T039: 8개 parity manifest

`feature-detail-quality.test.ts`의 자동 parity 검사를 기준으로 다음 매핑을 고정했다. 각 행은 source·public URL·SHA를 하나의 swimlane ID로 추적하며, node/edge ID·방향·kind/outcome mismatch는 모두 0건이다. 독립 viewer의 수직 containment를 위해 다섯 source는 인접 canonical lane을 presentation band로 합쳤으며, 역추적 매핑은 `data-model.md`에 기록했다. 단계의 전체 description은 포트폴리오 원본과 Dialog transcript에 유지된다.

| Swimlane ID | Source SHA-256 | Public artifact | Artifact SHA-256 | Parity |
| --- | --- | --- | --- | --- |
| `codi-harness-dx-platform/design-development-verification` | `5d14e4a1a34d3b9131ba35691c2991a9a429e0453c67d7e1d278ff0d4f27e9dc` | `/diagrams/codi-harness-dx-platform/design-development-verification.html` | `d6add5e1966122e2fbd824ca1cd4f3b1ce85a902af1f3e5c807d4620bddfb672` | 0 mismatch |
| `codi-harness-dx-platform/cicd-secrets-deployment` | `c57409291e91232c6ed21cc50fb7d81ea0df24f0ce2a360c0b77d9405197eacb` | `/diagrams/codi-harness-dx-platform/cicd-secrets-deployment.html` | `a9db6cb5b7b4e279b36b5e89af8dca93d5a35108883dc8205fb7343e2703ab54` | 0 mismatch |
| `hanmaum-science-institute/ingestion-and-recovery` | `8e73170bb434c2f4ac58b8402d18e4a936886f11ce3d3311fa8afa5c2724a903` | `/diagrams/hanmaum-science-institute/ingestion-and-recovery.html` | `ac85d47072f8290506e127c5f3edafe7a010581c8a527f1f0c953b7ca1aeff3e` | 0 mismatch |
| `hanmaum-science-institute/search-request-flow` | `6a75771dd638ca9d8d5bdcb80f0f457b3bca5632d6f068f23123a34c2c33b9a0` | `/diagrams/hanmaum-science-institute/search-request-flow.html` | `3d2905ea0a3370d31f3960e6d245397296e57fa0157d7d5d091b53cc2b72bc13` | 0 mismatch |
| `blackstone-belleforet-resort/payment-and-compensation` | `b21b25cfa3bd488086470be73f2460fcf1080b6ecd42825948ab80f295e4be08` | `/diagrams/blackstone-belleforet-resort/payment-and-compensation.html` | `79021ddd2a67dd13f0b5caaf3e901bf0a89c567d4d137e107f32ed43c954514d` | 0 mismatch |
| `hipass-b2b-platform/order-payment-compensation` | `3061edca909d5b96aa72f9f2dec1f7411b81e226ad6ff5ea28cd6a6d49c3e7e9` | `/diagrams/hipass-b2b-platform/order-payment-compensation.html` | `646be89949d22fa32d86293c4d856bb3801a9e6d0df86e2f45f0d02ab9416162` | 0 mismatch |
| `hotel-reservation-platform/platform-change-verification-deployment` | `b5472af8952722b9b5fea87fc930f2c5880634ff8da5f17f16c6aaa4f819c419` | `/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html` | `a23ebd2219cda3bad5deccc3461e7d6522cfc90d5e34d6d4dffd5469817f49d3` | 0 mismatch (frozen) |
| `integrated-sso-server/central-account-auth-flow` | `0f1ada1e8724daec694c9bf19a7febf8c0f301bf10e6b162356cf3d2f7d56d40` | `/diagrams/integrated-sso-server/central-account-auth-flow.html` | `998f2f58e1b7e4108b9262706615368c6873da42c447e7a592fd03d1df9fc254` | 0 mismatch |

## T040: 공개 문구 회귀 확인

8개 대상의 기존 제목·목적·요약·예외 상황과 대응·연결 인사이트는 `project-detail-rendering.test.tsx`와 production E2E에서 기존 데이터와 동일함을 확인했다. Archify 전환이 없는 `integrated-reservation-platform`은 embed·iframe·Viewer control이 0건으로 유지됐다. 전환으로 고객 거래 데이터, secret, 비공개 소스 또는 승인되지 않은 운영 수치를 추가하지 않았다.

T048 보정 대상 여섯 artifact의 1440×900·2048×1320, light·dark 캡처 24장을 모두 직접 확인했다. 노드·관계선·관계 label이 서로 또는 lane 제목을 가리는 경우, 화살촉 잘림, Viewer chrome 침범, 하단 잘림, 가로·세로 스크롤이 0건이었다. SSO는 네 책임 lane을 유지했고 회귀 경로가 정상 흐름과 분리되어 있으며, 블랙스톤의 긴 timeout 예외 경로도 노드를 침범하지 않았다. 사람의 perceptual 판정은 여섯 건 모두 `passed`다.

보정은 HTML 수동 편집 없이 source JSON→`deliver workflow`로만 수행했다. 다섯 artifact는 canonical 책임을 문서화된 3개 presentation band로 압축하고 중복 sublabel을 제거했다. SSO는 4개 lane을 유지한 채 시간 순서 column과 두 회귀 경로만 재배치했다. 수정 라운드는 하이패스·SSO 각 2회, 나머지 네 artifact 각 1회였다.

## T043: 정적·unit·build 검증

| Command | Result |
| --- | --- |
| `pnpm --dir apps/front exec vitest run src/data/portfolio/feature-detail-quality.test.ts src/components/projects/archify-swimlane-embed.test.tsx src/components/projects/project-detail-rendering.test.tsx src/components/projects/project-swimlane-layout.test.ts` | 4 files, 254/254 pass |
| `pnpm --dir apps/front exec vitest run` | 8 files, 443/443 pass |
| `pnpm --dir apps/front exec tsc --noEmit` | pass |
| scoped `pnpm --dir apps/front exec eslint` for E2E, Archify components/tests, feature-detail metadata | pass |
| `pnpm --dir apps/front build` | pass; Next.js 16.1.6, 38 static pages |

최종 갱신 직전에 전체 Vitest(`443/443`), TypeScript, 관련 파일 범위 ESLint, production build를 다시 실행했으며 모두 통과했다. 기존 Vitest native config-loader와 Next workspace-root 경고만 재현됐다.

## 후속 UI 보정: artifact별 preview 비율

초기 공통 wrapper가 호텔 artifact의 `1085/528` 비율을 모든 preview에 고정해 세로형 artifact가 잘려 보이는 문제를 확인했다. `ArchifySwimlaneEmbed`가 8개 artifact의 실제 SVG `viewBox` 비율을 사용하도록 변경했고, fallback 상태에서는 기존 React renderer의 자체 비율을 유지한다. 1104 서버에서 8개 preview·4개 viewport E2E를 다시 실행해 `20 passed (2.2m)`을 확인했다.

## 후속 UI 보정: 내부 Legend와 Dialog 세로 잘림

호텔 artifact에는 없던 Archify 기술 종류 범례(`[data-legend]`, 영문 `Legend`)가 다른 일곱 artifact의 SVG 안에 남아 외부 한글 선 범례와 중복되는 문제를 확인했다. 공통 iframe 준비 단계에서 내부 기술 범례를 비노출·접근성 트리 제외 처리하고, 포트폴리오의 `일반 진행·검증 통과` / `예외 발견·복구 및 재검증` 범례만 유지했다.

Dialog는 공통 높이가 약 700px인데 원본 Archify CSS의 intrinsic ratio가 우선되어, 1440px 검증에서 블랙스톤 SVG는 약 1,544px, SSO SVG는 약 1,919px로 렌더링된 뒤 iframe에 잘리고 있었다. 공통 어댑터가 iframe viewport를 SVG viewport로 명시하고, preview와 Dialog 모두 artifact별 실제 `viewBox` 비율을 컨테이너에 적용하도록 수정했다. 가로형 호텔은 기존처럼 한 화면에 표시되고, 세로형은 모달 내부 스크롤로 원본 폭과 전체 높이·하단 범례·요약까지 읽을 수 있다.

1104 개발 서버와 별도 12115 production 서버에서 각각 전체 스윔레인 E2E를 다시 실행했다. 두 실행 모두 8개 preview와 8개 Dialog를 320/768/1024/1440px에서 검사했고, 각 iframe의 SVG width/height가 iframe viewport와 1px 이내로 일치하며 내부 기술 범례가 보이지 않고 Dialog 마지막 요약까지 스크롤 가능한 것을 확인했다.

- 개발 서버: `20 passed (2.3m)`
- production build 및 별도 서버 최종 재검증: `21 passed (2.3m)`
- 전체 Vitest 최종 재검증: `8 files, 443/443 pass`
- TypeScript, 변경 파일 범위 ESLint, production build: pass
- 임시 production Playwright 설정과 12120 서버는 검증 후 제거·종료했고 1104 서버는 유지했다.

Vitest는 현재 CommonJS로 읽히는 `vitest.config.ts`의 future native config-loader warning을 출력했다. 실행은 0 exit code로 통과했고 이번 변경과 무관한 도구 경고다. Build는 root `package-lock.json`과 app `pnpm-lock.yaml` 때문에 workspace root를 추론했다는 기존 Next.js warning을 출력했으나 compilation, TypeScript, static generation은 통과했다.

## T045–T048 상태

- `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks`는 현재 브랜치의 활성 Feature 015를 반환했고, `speckit-converge`와 `speckit` executable은 PATH에 없었다. 따라서 Feature 013의 committed spec·plan·tasks·design artifacts를 동일한 converge 계약으로 직접 대조했으며, 상세 결과는 `.superpowers/sdd/plan/feature013-convergence-report.md`에 기록했다.
- `mise tasks --all`에 `feature:status:sync`가 없어서 `mise run feature:status:sync`를 실행할 repository task가 없다.
- T048의 여섯 artifact는 구조 검사·visual-check·24장 사람 검토·production E2E를 모두 통과했다. 37 FR, 13 SC, 16 acceptance scenario, plan/design 결정과 task 사이의 missing·partial·contradictory·unrequested finding은 0건으로 수렴했다.
- T001~T048은 모두 checked이고 `tasks.md` SHA-256은 `24b6f00ce57c135dc7c71c7f5c34489917164d3ba74cd4341cfa829895317d49`다. 마지막 gate에서 `.harness/state/current-size`를 `Small`로 복원했다.

## 잔여 위험과 handoff

- Feature 013 범위의 잔여 구현·검증 위험은 없다.
- 저장소 전체 `*.visual-check.json` 11건을 추가 대조한 결과 Feature 013 대상 8건을 포함한 10건은 artifact hash 일치·4/4 capture pass였다. 나머지 `integrated-reservation-platform/uat-booking-payment-flow.html` 1건은 Feature 015에서 정확한 5개 lane을 유지하기 위해 사용자가 2026-09-15 승인한 standalone 세로 overflow known limitation이며, 실제 공개 preview/Dialog containment는 해당 feature의 production E2E에서 통과했다. 이를 Feature 013의 미해결 task로 다시 열지 않는다.
- 생성 HTML은 계속 직접 편집하지 않으며, 후속 의미 변경은 사용자 인터뷰와 별도 feature 승인 뒤 source JSON에서 시작한다.
- 기존 Vitest native config-loader와 Next workspace-root 경고는 이번 변경과 무관한 baseline 경고다.
