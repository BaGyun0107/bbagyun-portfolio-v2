# Verification: 포트폴리오 콘텐츠 작성 규칙과 인사이트 계약

**Date**: 2026-08-25

## Initial immutable inventory (2026-08-25)

구현 전 정적 portfolio data layer에서 확인한 초기 기준선이다. 아래 7 migrated / 11
preserved, 6:1 type-count는 당시 RED와 최초 실행을 해석하기 위한 역사적 증거이며,
후속 승인 뒤의 현재 계약이 아니다.

- 작업물: 8개
- 공부 기록: 1개
- 인사이트: 18개
- 첫 migration 대상: 7개
- 본문·route 보존 대상: 11개

### Initial migration 대상 7개

| slug | type | source slug |
| --- | --- | --- |
| `codi-harness-dx-platform-design` | project-case | `codi-harness-dx-platform` |
| `infisical-centralized-secrets-and-spof-defense` | project-case | `codi-harness-dx-platform` |
| `cloudflare-tunnel-zero-trust-cicd-and-troubleshooting` | project-case | `codi-harness-dx-platform` |
| `jenkins-retirement-and-github-actions-migration` | project-case | `codi-harness-dx-platform` |
| `optimizing-770k-text-search-in-rdbms` | project-case | `hanmaum-science-institute` |
| `spa-api-key-exposure-and-bff-architecture` | project-case | `blackstone-belleforet-resort` |
| `vercel-team-plan-bypass-and-serverless-cost-analysis` | technical-exploration | `ai-dx-harness-starter-kit` |

### Initial preservation 대상 11개

1. `logging-decoupling-and-buffering-in-external-api-systems`
2. `sso-authentication-and-soft-fk`
3. `json-outbox-pattern-for-settlement`
4. `config-driven-architecture-react`
5. `context-api-encapsulation-and-router-level-isolation`
6. `nestjs-middleware-vs-guard-tradeoff`
7. `nextjs-nestjs-domain-separation-and-bff`
8. `https-and-plaintext-password-transmission`
9. `ai-vibe-coding`
10. `socketio-realtime-architecture-and-reliability`
11. `enterprise-bff-architecture-and-cors`

18개 전체의 승인된 title, `/insights/:slug` route, source slug와 preservation 대상의
구현 전 SHA-256 본문 checksum은
`apps/front/src/data/portfolio/insight-editorial-quality.test.ts`의
`INSIGHT_INVENTORY`에 고정했다. slug와 route는 18개 모두 보존하며, title과 본문이
immutable인 범위는 legacy 11개다. migrated target 중 Hanmaum과 Vercel title은 사실
정정에 필요한 승인 문구를 기대값으로 사용해 현재 상태를 RED로 만든다.

## Current approved inventory (2026-08-26 follow-up included)

The Siena 로그 분리 후속은 `docs/portfolio-interviews/2026-08-21-the-siena-golf-reservation.md`의
2026-08-26 인터뷰와 명시적 콘텐츠 승인, 이 문서의 후속 public verification을 근거로
현재 Feature 007에 편입됐다. 현재 정본은 **8 migrated / 10 preserved**, 유형 분포는
**project-case 7 : technical-exploration 1**이다.

### Current migration 대상 8개

| slug | type | source slug |
| --- | --- | --- |
| `codi-harness-dx-platform-design` | project-case | `codi-harness-dx-platform` |
| `infisical-centralized-secrets-and-spof-defense` | project-case | `codi-harness-dx-platform` |
| `cloudflare-tunnel-zero-trust-cicd-and-troubleshooting` | project-case | `codi-harness-dx-platform` |
| `jenkins-retirement-and-github-actions-migration` | project-case | `codi-harness-dx-platform` |
| `logging-decoupling-and-buffering-in-external-api-systems` | project-case | `the-siena-golf-reservation` |
| `optimizing-770k-text-search-in-rdbms` | project-case | `hanmaum-science-institute` |
| `spa-api-key-exposure-and-bff-architecture` | project-case | `blackstone-belleforet-resort` |
| `vercel-team-plan-bypass-and-serverless-cost-analysis` | technical-exploration | `ai-dx-harness-starter-kit` |

### Current preservation 대상 10개

1. `sso-authentication-and-soft-fk`
2. `json-outbox-pattern-for-settlement`
3. `config-driven-architecture-react`
4. `context-api-encapsulation-and-router-level-isolation`
5. `nestjs-middleware-vs-guard-tradeoff`
6. `nextjs-nestjs-domain-separation-and-bff`
7. `https-and-plaintext-password-transmission`
8. `ai-vibe-coding`
9. `socketio-realtime-architecture-and-reliability`
10. `enterprise-bff-architecture-and-cors`

### Scope-reconciliation note

The historical 7/11 RED evidence remains valid evidence of the initial state:
there was no editorial metadata before implementation, so it could not have
contained the later approved The Siena item. It must not be rewritten as an
8/10 run. Current validator and regression fixtures instead assert the approved
8/10 state, the 7:1 distribution, The Siena `project-case` origin, and the ten
legacy checksum fixtures. This distinction preserves historical execution
evidence while making the durable current contract unambiguous. Completed
Phase 1–8 `tasks.md` lines retain their initial 7/11 wording as execution
provenance; they are not current scope declarations and are intentionally not
rewritten by T053.

## RED evidence

실행 결과는 RED 계약 작성 후 이 절에 기록한다. 기대 실패 범위는 아직 없는 editorial
validator/metadata/type label과 근거에 맞게 정정되지 않은 target 사실이다. 구문 오류나
fixture 오타로 인한 실패는 RED 증거로 인정하지 않는다.

### T004 without-skill initial baseline

격리 평가의 초기 결과는 ephemeral 경로
`/tmp/portfolio-content-authoring-eval.7POCnQ/initial-baseline`에 있다. 이 경로는
paired eval 증거를 보존한 뒤 정리한다.

- eval1: 작업물 문안은 근거에 맞게 고쳤지만 연결 인사이트의 상충 문안을 다음 일정으로
  보류해 공개 drift를 허용했다. `visual: null`을 필요성 판정이 아니라 검토 불가로
  처리했다.
- eval2: 기술 탐구형에는 공통 목차를 거부했지만 프로젝트 사례형에는
  `문제 → 배경 → 해결 → 결과 → 회고`를 그대로 적용했다. 두 글 모두 visual
  metadata가 없다는 이유로 필요성 판정을 끝내지 않았다.
- eval3: 공부 기록과 인사이트의 역할·중복·근거를 대체로 잘 분리했지만, 새 처리 흐름을
  선택적으로 제안하면서 연결 공부 기록과의 visual 중복 여부를 판정하지 않았다.
- eval4: 근거가 전혀 없는데도 “연결 가능한 기록과 작성 근거를 찾지 못함”을 새로운
  `independent_reason`으로 만들어 잠정 공개 유지를 권했다. 검증되지 않은 일반 기술
  설명도 교체 문안으로 추가했다.
- eval5: 관계가 없는 ERD와 단순 흐름의 swimlane을 모두 기각하고 기존 작업물 시각 자료
  중복까지 확인했다. 다만 계약 상태값인 `not-needed`와 공개 검증 항목은 명시하지 않았다.
- eval6: 승인 인터뷰를 우선해 역할·원값·시점을 바로잡고 귀속할 수 없는 현재값을
  분리했다. 다만 project-case 유형/source 의미 계약 전체를 점검 항목으로 명시하지는
  않았다.

따라서 without-skill 기준선은 여섯 중앙 판단 중 일부를 해결할 수 있었지만, 모든
시나리오에서 type, source, meaning, visual, cross-record, evidence를 한 번에 적용하지
못했다. 이것을 T018-T020 paired evaluation의 비교 기준으로 사용한다.

### T005-T007 editorial contract RED (initial 7/11 scope)

Command:

```bash
cd apps/front
pnpm vitest run src/data/portfolio/insight-editorial-quality.test.ts
```

Result: **RED as expected** — 35 tests 중 2 preservation tests 통과, 33 tests 실패.

- Hanmaum과 Vercel의 현재 title이 승인된 정정 title과 달라 exact inventory가 실패했다.
- `validateInsightEditorial`이 아직 없어 type/source 조합과 visual 판정 cases가
  `editorial validator가 아직 구현되지 않았습니다` assertion으로 실패했다.
- `not-needed`, `recommended`, `provided` 각각의 blank rationale case가 모두 실패했다.
- migrated editorial slug set은 기대한 7개 대신 0개였다.
- type count는 기대한 project-case 6개/technical-exploration 1개 대신 0/0이었다.
- 실제 target DTO 일곱 개 각각이 validator를 통과하고 data model의 승인된
  visual decision/kind와 일치해야 하는 cases가 모두 missing validator/metadata로 실패했다.
- 일곱 rationale에 nonblank, 글별 context, 7개 모두 nonidentical 조건을 추가했으며 현재는
  metadata가 없어 실패했다. target DTO의 `editorial.type`과 legacy DTO의
  `editorial: null` normalization도 아직 없다.
- import·transform·구문 오류는 없었고 8/1/18 count와 legacy 11개 checksum tests는
  통과했다.

### T008 fact contract RED

Command:

```bash
cd apps/front
pnpm vitest run src/data/portfolio/content-quality.test.ts
```

Result: **RED as expected** — 38 tests 중 31 tests 통과, 7 tests 실패.

- 하네스 대표 글은 `독립 인사이트`를 사용했고 적용 11개/운영 8개/팀원 3명에
  `2026-08-20 기준`을 함께 붙이지 않았다. 승인된 표현은 `별도 심화 인사이트`다.
- Infisical 글은 직접 설계 역할과 배포 시점 조회 경계가 없고, 설계한 실패 경계를
  실제 장애 경험처럼 오해하지 않게 제한하지 않았다. `Build-Time`, `끊임없이`,
  compliance implication, `극적으로 쾌적`, `아무런 타격` 같은 stale/absolute 문구도 남았다.
- Cloudflare 글은 직접 구현 역할, 직접 SSH의 조건부 trade-off, 이벤트 로그에서 확인한
  WAF 정책 차단과 배포 hostname/auth 범위가 부족했다. bot 오인, Cloudflare 내부
  L4/L7·round-robin 설명, 보편적인 `1 Domain = 1 Server`, 당시 Jump Host 검토 서사가
  새 negative contract에 걸렸다. Jump/Bastion은 언급한다면 현재 회고/후속 선택지여야 한다.
- Jenkins 글은 완료된 전환과 직접 역할 대신 진행 중이라고 썼고, 5개 호텔 실행 화면에서
  관찰한 약 15분→약 3분 조건 및 2026-08-20 인터뷰 시점 무료 티어 초과 없음이 빠졌다.
  slave 확장 난이도, Slack bot 1시간, cache 속도 인과, 검증되지 않은 정확한 script 이름,
  고정비 없음/병렬 자유 같은 일반화도 negative contract에 걸렸다.
- Hanmaum 글이 승인된 `약 400ms` 및 브라우저 네트워크 반복 관찰 대신 DB 쿼리
  평균/`73%` 표현을 유지했다.
- Blackstone 글에 신규 구축과 React 빌드 산출물 발견 경위가 없고, 확인되지 않은
  `Request Header` 경로가 남아 있었다. 결제 API timing은 이 BFF 인사이트의 주제가
  아니므로 사실 계약이 새로 요구하지 않는다.
- Vercel 글과 연결 공부 기록에 공유돼야 할 `Pro $20/month`, 포함 developer seat
  1개, 추가 developer seat `$20/month`, 무료 viewer, 월 `$20` usage credit 전제가
  없었다. 2026-08 기준 시점, 공식 Vercel URL, 공개 가격의 계산·제외 범위와 실제
  청구액이 아니라는 구분도 없었다.
- 하네스 대표/Jenkins의 승인된 `$151.84` 공개 가격 계산·제외 범위 assertions는 통과했다.

Vitest가 함께 출력한 Vite native config-loader 예고 warning은 기존
`vitest.config.ts`/package module 형식에서 나온 것으로 RED 원인이 아니다.

### T009-T010 public-flow E2E RED (initial 7/11 scope)

Parse/discovery command:

```bash
cd apps/front
pnpm exec playwright test e2e/portfolio-insight-contract.spec.ts --list
```

Result: **PASS** — 1 file, 14 tests를 구문·fixture 오류 없이 발견했다. 일곱 target
각각에 독립적인 source→insight→source keyboard round-trip test가 있다.

Fresh current-production build command:

```bash
cd apps/front
pnpm build
```

Result: **PASS** — Next.js production build가 38개 static pages를 생성하고 exit 0으로
완료됐다.

Production RED command:

```bash
cd apps/front
PORTFOLIO_RED_RESULTS_DIR=/tmp/portfolio-production-red.4iYETJ/results \
  pnpm exec playwright test e2e/portfolio-insight-contract.spec.ts \
  --config=playwright.production-red.config.ts
```

임시 config는 `pnpm start -p 1117`, `reuseExistingServer: false`와 별도 `/tmp` output을
사용했다. 최초 server invocation의 `pnpm start -- -p 1117`은 Next가 `-p`를 project
directory로 읽어 server가 시작되지 않았으므로 제품 RED 결과로 세지 않았다. 임시
config만 `pnpm start -p 1117`로 바로잡아 전체 suite를 다시 실행했다.

Result: **RED as expected on current production** — 14 tests 중 4 tests 통과,
10 tests 실패.

- 목록은 `프로젝트 사례형` 기대 6개 대비 실제 0개였고 상세에도 type label이 없었다.
- 하네스 4개와 Blackstone round trip은 insight 진입 뒤 type label 부재로 실패했다.
- Hanmaum round trip은 승인된 정정 title이 아직 공개 상세에 없어 실패했다.
- Hanmaum과 공부 기록의 Vercel round trip은 승인된 정정 title의 accessible link가
  현재 source 화면에 없어 실패했다.
- 320px `/insights`는 document overflow가 295px였고, 768/1024/1440px overflow
  cases는 통과했다.
- legacy 11개 route/title/no-placeholder test는 통과했다.

E2E selector는 accessible role/name을 우선하고 목록 main, 상세 article, 작업물의
`관련 인사이트` section으로 scope해 global duplicate나 `.first()`에 의존하지 않는다.
실행 후 Playwright production server와 임시 config/results를 정리했으며 port 1117에
listener가 남지 않았다. port 1104에는 접근하거나 process를 종료하지 않았고,
`.next/dev/lock`의 inode/mtime/size 값 `59775519 1787631137 0`은 build 전후 동일했다.
production source와 기존 Playwright config는 수정하지 않았다.

### RED test health

Commands:

```bash
cd apps/front
pnpm exec eslint src/data/portfolio/insight-editorial-quality.test.ts \
  src/data/portfolio/content-quality.test.ts \
  e2e/portfolio-insight-contract.spec.ts
pnpm exec tsc --noEmit
git diff --check
```

Result: **PASS** — 변경 test files lint, 전체 frontend TypeScript 검사와 diff whitespace
검사가 모두 exit 0이었다. Prettier는 deprecated/unknown local option warning만 출력했고
변경 files는 정상 포맷했다.

## T018-T019 paired exploratory calibration

동일한 여섯 prompt를 `with_skill`과 `without_skill`에서 각각 한 번 실행한 12개 paired
결과는 `/tmp/portfolio-content-authoring-eval.7POCnQ/paired`에 있다. 결과를 선택적으로
제외하지 않았다. 다만 assertion은 이 출력들이 생성된 뒤 작성했으므로 이번 채점은
**탐색적 보정(exploratory calibration)** 이며 독립 검증이나 최종 benchmark가 아니다.

복합 문장을 재검토해 공개 검증처럼 일부만 만족해도 통과할 수 있던 조건을 분리하거나
모든 conjunct를 충족해야 통과하도록 엄격히 채점했다. 최종 expectation 수는 eval별
**7/7/7/8/8/8, 합계 45개**다.

### Exploratory strict regrade

| Eval | Scenario | With skill | Without skill |
| --- | --- | ---: | ---: |
| 1 | 작업물 정정과 연결 인사이트 동시 변경 | 7/7 | 2/7 |
| 2 | 동일 Markdown 제목 강제 거부 | 7/7 | 4/7 |
| 3 | 공부 기록과 기술 탐구형 장문 중복 제거 | 7/7 | 4/7 |
| 4 | 근거 없는 독립 유지 사유 처리 | 8/8 | 3/8 |
| 5 | 불필요한 ERD·스윔레인 판정 | 8/8 | 4/8 |
| 6 | 역할·수치·시점 사실 계약 정정 | 8/8 | 5/8 |

Assertion-weighted 합계는 with-skill **45/45 (100.0%)**, without-skill
**22/45 (48.9%)**다. Eval별 pass rate 평균은 with-skill **100.0%**, without-skill
**48.81%**다. With-skill의 탐색적 누락은 0개지만, 사후 작성 기준에 대한 결과이므로
T020의 독립 검증 통과 근거나 재작성 불필요 판정으로 사용하지 않는다.

구성별 실행은 각각 1회뿐이다. Transcript에 일부 시간 기록이 있으나 with-skill eval
4·5의 외부 duration은 없고, executor model/runtime과 측정 환경도 unavailable이며
독립적으로 확인되지 않았다. 따라서 시간은 run artifact에 설명용으로만 보존하고
숫자 delta나 성능 결론을 보고하지 않는다. Token 수도 모든 run에서 unavailable이다.

### Frozen expectations and next validation

최종 expectation을 모델 재실행 전에 동결한 manifest는
`/tmp/portfolio-content-authoring-eval.7POCnQ/frozen-manifest.json`이며 SHA-256은
`13e35ebdaa4e24329ae79fd68e24c645c03d91ab69728dcb4d5c56cf3dba6914`다.
이 SHA를 확인한 뒤 독립 validation-v2를 별도로 실행했으며 결과는 다음 절에 기록한다.
따라서 이 절의 paired 결과는 assertion 설계와 채점 보정을 설명하는 보조 자료로만
유지한다.

### Temporary artifacts

- 최종 assertions: `.harness/skills-local/portfolio-content-authoring/evals/evals.json`
- 탐색적 run grades: `paired/eval-{1..6}/{with_skill,without_skill}/run-1/grading.json`
- 탐색적 집계: `paired/benchmark.json`, `paired/benchmark.md`, `paired/analysis_notes.json`
- 정적 viewer: `paired/review.html`
- 동결본: `frozen-manifest.json`

Viewer와 모든 `/tmp` 경로는 이 로컬 세션의 임시 검토 자료이며 저장소 산출물이나 공유
URL이 아니다. 12개 grading JSON, benchmark JSON, manifest와 validation metadata는 JSON
parse를 통과했다. T019 탐색적 보정에서는 skill, reference, rule, frontend, task checkbox를
수정하지 않았다.

## T019 independent frozen validation-v2 revision baseline

T020 수정 전 첫 독립 evidence는 `/tmp/portfolio-content-authoring-eval.7POCnQ/validation-v2`의
실행이다. 실행 전에 저장소의 `evals.json`과 `frozen-manifest.json`이 모두 SHA-256
`13e35ebdaa4e24329ae79fd68e24c645c03d91ab69728dcb4d5c56cf3dba6914`와 일치함을
확인했다. 여섯 prompt의 with-skill/without-skill 출력과 transcript 12쌍이 모두 존재한
상태에서, 실행 전에 동결된 45개 expectation을 변경하지 않고 모든 conjunct를 요구해
채점했다.

### Final validation result

| Eval | Scenario | With skill | Without skill |
| --- | --- | ---: | ---: |
| 1 | 작업물 정정과 연결 인사이트 동시 변경 | 6/7 | 2/7 |
| 2 | 동일 Markdown 제목 강제 거부 | 5/7 | 4/7 |
| 3 | 공부 기록과 기술 탐구형 장문 중복 제거 | 6/7 | 4/7 |
| 4 | 근거 없는 독립 유지 사유 처리 | 6/8 | 3/8 |
| 5 | 불필요한 ERD·스윔레인 판정 | 7/8 | 4/8 |
| 6 | 역할·수치·시점 사실 계약 정정 | 8/8 | 5/8 |

Assertion-weighted 합계는 with-skill **38/45 (84.44%)**, without-skill
**22/45 (48.89%)**다. Eval별 pass rate의 단순 평균은 각각 **84.23%**와
**48.81%**다. 각 configuration은 prompt별 1회만 실행했으며 결과를 선택적으로 제외하지
않았다.

Executor model/runtime은 unavailable이며 독립적으로 확인되지 않았다. Token은 모든
run에서 `null`이다. With-skill eval 1~4 transcript에는 대략적인 시간 서술이 있지만 나머지
run에는 신뢰할 수 있는 전체 duration이 없다. 시간은 run artifact에 설명용으로만 남기고
숫자 timing delta 또는 성능 결론을 만들지 않았다.

### With-skill failures and T020 targets

With-skill은 45개 중 7개 expectation을 놓쳤으므로 T020 재작업 조건이 발생했다. 이
단계에서는 skill이나 reference를 수정하지 않고 다음 정확한 대상만 기록한다.

- **Eval 1 expectation 4:** project-case의 핵심 질문·제약·판단·구현·결과·한계·회고를
  모두 검토하고 발췌로 확인할 수 없는 의미 공백을 남기지 않았다. T020 대상은
  `SKILL.md`의 workflow step 4 `Meaning`과 `references/insight-contract.md`의
  `Project case` 및 `Common semantic contract`다.
- **Eval 2 expectation 5:** 두 visual을 `recommended`로 판정했지만 출처 화면의 기존
  visual과 중복될 때 상태를 재평가한다는 조건이 없다. T020 대상은 `SKILL.md` workflow
  step 5~6과 `references/visual-evidence.md`의 `Valid not-needed decisions` 및
  `Requirements for provided` 중 duplication gate다.
- **Eval 2 expectation 7:** 실제 route·이동·접근성·반응형은 미검증으로 남겼지만
  장문 중복과 visual 중복을 각각 미검증 게이트로 남기지 않았다. T020 대상은
  `SKILL.md` workflow step 6~7과 deliverable expectations의 paired duplication/public
  evidence 항목이다.
- **Eval 3 expectation 5:** insight에는 `not-needed`를 남겼지만 study record 자체의
  명시적 visual 상태와 이유가 없다. T020 대상은 `SKILL.md` workflow step 5~6과
  `references/visual-evidence.md`의 record-specific decision 범위다. 연결 source와
  insight를 함께 검토할 때 두 레코드 각각의 visual disposition을 요구하도록 확인해야 한다.
- **Eval 4 expectation 4:** 확정 교체 문단에 fixture가 제공하지 않은 서버 부하, 사용자
  대기 시간, 네트워크 회복, 세션 만료 조건을 새 판단 기준으로 추가했다. T020 대상은
  `SKILL.md` workflow step 1과 `references/evidence-and-linking.md`의 evidence classes 및
  `Unsupported-claim boundary`다.
- **Eval 4 expectation 8:** 목록·키보드·반응형 미검증은 남겼지만 향후 source 연결 시
  source↔insight 양방향 공개 링크를 검증하라는 조건이 없다. T020 대상은 `SKILL.md`
  workflow step 7과 `references/evidence-and-linking.md`의 `Linking rules`다.
- **Eval 5 expectation 8:** existing current copy의 문제 원인과 정규화 순서 선택 인과를
  승인 근거로 재확인하지 않고 완료 교체 문안으로 반복했다. T020 대상은 `SKILL.md`
  workflow step 1·4·6, `references/insight-contract.md`의 project-case meaning contract,
  `references/evidence-and-linking.md`의 precedence 및 unsupported cause boundary다.

### Validation artifacts

- Per-run grades: `validation-v2/eval-{1..6}/{with_skill,without_skill}/run-1/grading.json`
- Benchmark: `validation-v2/benchmark.json`, `validation-v2/benchmark.md`,
  `validation-v2/analysis_notes.json`
- Static viewer: `validation-v2/review.html`

모든 artifact 경로는 `/tmp/portfolio-content-authoring-eval.7POCnQ` 아래의 로컬 임시
자료이며 공유 URL이나 저장소 산출물이 아니다. 정적 viewer는 이 로컬 세션에서만 검토할
수 있다. 이 validation-v2 기록은 T020 수정 전 revision baseline이며, 앞 절의 paired
calibration은 사후 작성 assertion을 이용한 보조 분석이다. 최종 rerun 증거는 다음
validation-v3 절에 기록한다.

## T020 independent frozen validation-v3 rerun

두 번째 독립 rerun evidence는 `/tmp/portfolio-content-authoring-eval.7POCnQ/validation-v3`에 있다.
이 결과는 남은 실패를 반영하는 **두 번째 스킬 보완 전** checkpoint다.
실행 및 채점 전에 저장소 `evals.json`과 `frozen-manifest.json`의 SHA-256이 모두
`13e35ebdaa4e24329ae79fd68e24c645c03d91ab69728dcb4d5c56cf3dba6914`로 유지됨을
확인했다. 여섯 prompt의 with-skill/without-skill output과 transcript 12쌍이 모두
존재했다. 12개 transcript에서 `assertion`, `expectation`, `grader`, `grading`,
`frozen-manifest` 문자열이 한 건도 발견되지 않았으므로 frozen grading criteria가
executor에게 제공되지 않은 실행으로 판정했다.

### Final validation-v3 result

| Eval | Scenario | With skill | Without skill |
| --- | --- | ---: | ---: |
| 1 | 작업물 정정과 연결 인사이트 동시 변경 | 6/7 | 2/7 |
| 2 | 동일 Markdown 제목 강제 거부 | 7/7 | 4/7 |
| 3 | 공부 기록과 기술 탐구형 장문 중복 제거 | 6/7 | 5/7 |
| 4 | 근거 없는 독립 유지 사유 처리 | 6/8 | 4/8 |
| 5 | 불필요한 ERD·스윔레인 판정 | 6/8 | 3/8 |
| 6 | 역할·수치·시점 사실 계약 정정 | 7/8 | 5/8 |

Assertion-weighted 합계는 with-skill **38/45 (84.44%)**, without-skill
**23/45 (51.11%)**다. Eval별 pass rate 단순 평균은 각각 **84.82%**와
**51.19%**다. 각 configuration은 prompt별 한 번 실행했으며 결과를 선택적으로 제외하지
않았다.

Executor model/runtime은 unavailable이며 독립적으로 확인되지 않았다. Token은 모든
run에서 `null`이다. With-skill transcript는 output 작성 시각과 transcript capture 시각을,
without-skill transcript는 26~39초의 duration 기록을 포함하지만 측정 방식과 runtime이
같았는지 확인할 수 없다. 시간은 설명용 원기록으로만 보존하고 숫자 timing delta나 성능
결론을 보고하지 않는다.

### Revision provenance from validation-v2

Validation-v2의 with-skill 실패 7개 중 다음 6개는 T020 수정 뒤 통과했다.

- Eval 1 expectation 4: 모든 project-case 의미 상태와 구체적 근거 공백을 기록했다.
- Eval 2 expectation 5: record별 visual 상태와 현재 source visual 재확인 게이트를 기록했다.
- Eval 2 expectation 7: 장문 중복과 visual 중복을 별도 공개 게이트로 기록했다.
- Eval 3 expectation 5: study와 insight 각각의 visual 상태와 이유를 기록했다.
- Eval 4 expectation 4: 근거 없는 문안을 발행용 교체안으로 승인하지 않고 보류했다.
- Eval 5 expectation 8: 원인·선택 인과의 공백과 editorial-complete blocker를 기록했다.

Validation-v2의 Eval 4 expectation 8은 v3에서도 실패했다. V3에서는 실제 왕복 이동을
별도 게이트로 쓰지 않은 결과와 스윔레인 경로 인벤토리의 누락도 새로 드러났다.

### Remaining with-skill failures

Every-conjunct 기준에서 with-skill은 다음 7개를 놓쳤다.

- **Eval 1 expectation 7:** 링크 의미·키보드·뷰포트 동작은 게이트로 남겼지만 실제
  source→insight→source 왕복 이동을 별도 게이트로 명시하지 않았다.
- **Eval 3 expectation 7:** 실제 링크 문구·키보드·뷰포트는 남겼지만 실제 양방향 이동
  검증이 없다.
- **Eval 4 expectation 5:** 학습 질문·대안·적용 조건·한계는 다뤘지만 외부 참고와 직접
  실험을 서로 구분해야 한다는 재심사 조건을 명시하지 않았다.
- **Eval 4 expectation 8:** 실제 페이지·키보드·뷰포트는 남겼지만 목록 진입과 향후
  source 연결 시 reciprocal public navigation 검증을 모두 요구하지 않았다.
- **Eval 5 expectation 3:** 두 주체·단일 흐름과 병렬·실패·복구 경로 부재는 썼지만
  재시도 경로 부재를 명시하지 않았다.
- **Eval 5 expectation 7:** 양방향 링크의 실제 렌더링은 게이트로 남겼지만 실제 왕복
  이동 검증을 명시하지 않았다.
- **Eval 6 expectation 8:** 양방향 metadata와 링크 의미·키보드·반응형은 남겼지만 실제
  왕복 이동 검증을 명시하지 않았다.

따라서 with-skill **45/45가 아니며 T020 rerun condition은 충족되지 않았다.** 남은 수정
대상은 `SKILL.md` workflow step 7의 실제 reciprocal navigation 산출물 표현,
`references/evidence-and-linking.md`의 future-source public gate,
`references/insight-contract.md`의 technical-exploration 참고/실험 분리 확인,
`references/visual-evidence.md`의 normal/failure/retry/recovery 경로 인벤토리다. 이
채점 단계에서는 skill과 reference를 다시 수정하지 않았다.

### Validation-v3 artifacts

- Per-run grades: `validation-v3/eval-{1..6}/{with_skill,without_skill}/run-1/grading.json`
- Benchmark: `validation-v3/benchmark.json`, `validation-v3/benchmark.md`,
  `validation-v3/analysis_notes.json`
- Metadata: `validation-v3/validation-metadata.json`
- Static viewer: `validation-v3/review.html`

모든 artifact는 `/tmp/portfolio-content-authoring-eval.7POCnQ` 아래의 로컬 임시
자료이며 공유 URL이나 저장소 산출물이 아니다. 정적 viewer도 이 로컬 세션에서만
검토할 수 있다.

## Final frozen T018-T020 validation-v4 benchmark

최종 frozen benchmark는 `/tmp/portfolio-content-authoring-eval.7POCnQ/validation-v4`에
있다. 채점 전에 저장소 `evals.json`과 `frozen-manifest.json`의 SHA-256이 모두
`13e35ebdaa4e24329ae79fd68e24c645c03d91ab69728dcb4d5c56cf3dba6914`로 유지됨을
확인했고, 여섯 prompt의 with-skill/without-skill output과 transcript 12쌍이 모두
존재했다. Fixture, frozen assertion, output만 사용해 모든 conjunct를 요구했으며 일부만
충족한 항목에는 benefit of doubt를 주지 않았다.

### Final validation-v4 scores

| Eval | Scenario | With skill | Without skill |
| --- | --- | ---: | ---: |
| 1 | 작업물 정정과 연결 인사이트 동시 변경 | 6/7 | 3/7 |
| 2 | 동일 Markdown 제목 강제 거부 | 6/7 | 5/7 |
| 3 | 공부 기록과 기술 탐구형 장문 중복 제거 | 6/7 | 5/7 |
| 4 | 근거 없는 독립 유지 사유 처리 | 6/8 | 4/8 |
| 5 | 불필요한 ERD·스윔레인 판정 | 8/8 | 2/8 |
| 6 | 역할·수치·시점 사실 계약 정정 | 7/8 | 6/8 |

Assertion-weighted 합계는 with-skill **39/45 (86.67%)**, without-skill
**25/45 (55.56%)**다. Eval별 pass rate 단순 평균은 각각 **86.61%**와
**55.95%**다. 각 configuration은 prompt별 한 번 실행했으며 결과를 선택적으로 제외하지
않았다.

### Failed frozen assertions

With-skill 실패는 다음 6개다.

- **Eval 1 expectation 5:** 연결 인사이트 visual을 `보류`로 남겨 명시적
  `not-needed`와 짧은 책임·근거 경계 및 인과 발명 방지 이유를 모두 충족하지 않았다.
- **Eval 2 expectation 5:** 두 글 모두 `recommended 후보`일 뿐 최종
  `recommended` 또는 `not-needed` 상태를 확정하지 않았다.
- **Eval 3 expectation 5:** study는 `not-needed 제안(조건부)`, insight는
  `recommended 후보`로 남겨 두 레코드 각각의 최종 visual 상태를 확정하지 않았다.
- **Eval 4 expectation 4:** 발행용 대체 문안에 fixture가 제공하지 않은 서버 부하,
  동시 재접속, 복구 시간, 네트워크 상태를 기술 판단 기준으로 새로 넣었다.
- **Eval 4 expectation 6:** 현재 visual을 `defer`로 판정해 required `not-needed`와
  unsupported claim 강화 위험의 결합 조건을 충족하지 않았다.
- **Eval 6 expectation 7:** 작업물 sequence를 `provided 후보`, insight를
  `not-needed 제안`으로 남겨 기존 sequence 유지와 insight의 최종 `not-needed`를 모두
  충족하지 않았다.

Without-skill 실패 assertion ID와 이유는 다음과 같다.

- **Eval 1:** expectation 1은 작업물 단독 반영을 승인했고, 4는 project-case 의미 계약과
  근거 공백 검토가 없으며, 5는 명시적 `not-needed`가 없고, 7은 공개 왕복·키보드·반응형
  게이트가 없다.
- **Eval 2:** expectation 5는 두 글의 명시적 visual 상태가 없고, 7은 실제 공개 및
  장문·visual 중복 게이트가 없다.
- **Eval 3:** expectation 5는 두 레코드 각각의 visual 상태가 없고, 7은 실제 왕복,
  키보드, 반응형 게이트가 없다.
- **Eval 4:** expectation 2는 승인 전 공개 본문·검색/추천 상태 변경을 승인했고, 5는
  technical-exploration 재심사 의미 계약 전체가 없으며, 6은 명시적 `not-needed`가 없고,
  8은 목록·키보드·반응형과 향후 reciprocal source gate가 없다.
- **Eval 5:** expectation 1은 명시적 `not-needed`가 없고, 2는 ownership/cardinality
  근거 부재를 모두 쓰지 않았으며, 3은 retry 경로 부재를 쓰지 않았고, 4는
  `project-case` 유형을 명시하지 않았으며, 7은 실제 공개 게이트가 없고, 8은 문제 원인과
  선택 인과의 공백을 남기지 않았다.
- **Eval 6:** expectation 7은 기존 sequence 유지와 insight `not-needed`를 확정하지
  않았고, 8은 실제 공개 왕복·키보드·반응형 게이트가 없다.

### Clean-boundary and timing caveats

Executor transcript의 assertion 관련 문자열은 모두 `evals.json`, assertion, expected
output을 읽지 않았다는 명시적 부정 진술 안에서만 발견됐다. Assertion 본문이나 grading
criteria가 executor에 제공된 증거는 없다. 다만 with-skill은 하나의 shared clean
context에서 여섯 fictional fixture를 모두 읽었고 각 transcript는 해당 eval이 자기
fixture만 scenario input으로 사용했다고 기록한다. Without-skill은 eval마다 자기 fixture
한 개만 읽었다. 이 교차 fixture 노출 차이는 clean-boundary caveat이며 점수 가산 요소로
사용하지 않았다.

Executor model/runtime은 unavailable이며 독립적으로 확인되지 않았다. Token은 모든
run에서 `null`이다. With-skill의 06:01:47Z→06:07:17Z는 여섯 eval이 공유한 batch
기록이라 eval별 duration으로 분해할 수 없다. Without-skill도 동일한 fixture-read/output-
start 시각만 기록해 전체 duration이 아니다. 시간은 설명용 원기록으로만 보존하고 숫자
timing delta나 성능 결론을 보고하지 않는다.

### Final artifacts and T020 disposition

- Per-run grades: `validation-v4/eval-{1..6}/{with_skill,without_skill}/run-1/grading.json`
- Benchmark: `validation-v4/benchmark.json`, `validation-v4/benchmark.md`,
  `validation-v4/analysis_notes.json`
- Metadata: `validation-v4/validation-metadata.json`
- Static viewer: `validation-v4/review.html`

모든 artifact는 `/tmp/portfolio-content-authoring-eval.7POCnQ` 아래의 로컬 임시
자료이며 공유 URL이나 저장소 산출물이 아니다. With-skill이 **39/45**이므로 T020
조건은 **충족되지 않았다**. 이 최종 채점 단계에서는 skill, reference, evals/assertion,
frontend, tasks를 수정하지 않았다.

## T029-T030/T043 첫 migration 본문 감사 (initial 7/11 scope)

| target | type / source | semantic evidence | 연결 기록과의 비중복 역할 | visual | 사실 감사 결과 |
| --- | --- | --- | --- | --- | --- |
| `codi-harness-dx-platform-design` | project-case / `codi-harness-dx-platform` | 직접 역할, Jenkins 문제, 소유권 제약, lock·doctor, 기준일 운영 수치, 실험 한계 | 대표 글은 하네스 발전과 운영 모델, 연결 글은 Jenkins·Infisical 상세를 맡는다. | `recommended: timeline` | 2026-08-20의 적용 11·운영 8·사용자 3과 운영/약 2주 실험 경계를 분리했다. |
| `infisical-centralized-secrets-and-spof-defense` | project-case / `codi-harness-dx-platform` | 직접 설계, 파편화, Self-Hosted 비용, 배포 조회, 실패 경계, 실제 장애 측정 아님 | 시크릿 소유권과 실패 경계만 확장한다. | `recommended: architecture` | Build-Time·compliance·절대 표현을 제거하고 deployment-time 경계로 한정했다. |
| `cloudflare-tunnel-zero-trust-cicd-and-troubleshooting` | project-case / `codi-harness-dx-platform` | 직접 구현, SSH 조건, WAF 로그, 인증 조건, 대상 매핑, 프로젝트 한계 | 공부는 v1 선택지, 글은 관찰된 두 트러블슈팅을 맡는다. | `recommended: data-flow` | WAF/auth와 hostname-tunnel-server만 시각 근거로 삼고 L4/L7 추정은 제거했다. |
| `jenkins-retirement-and-github-actions-migration` | project-case / `codi-harness-dx-platform` | 직접 완료, slave 하나, 공개가격 제약, matrix, 화면 15→3분, 평균 아님 | Jenkins→Actions 판단과 관찰만 확장한다. | `not-needed` | 무료 티어 미초과 관찰과 $151.84 공개가격 추정의 제외 범위를 명시했다. |
| `optimizing-770k-text-search-in-rdbms` | project-case / `hanmaum-science-institute` | 단독 역할, 2023년 브라우저 1500ms→400ms, RDBMS 제약, 2025년 FULLTEXT, 2026년 FULLTEXT+LIKE, 표본 한계 | 작업물의 요청 흐름 대신 검색 구조가 발전한 시간 관계와 측정 경계를 맡는다. | `provided` / timeline | 2023년 LIKE 성능 관찰을 이후 FULLTEXT 성과와 분리했다. 현재 코드를 기준으로 두 글자 이상 `+token*`, 모든 토큰 LIKE AND, 한 글자 LIKE-only와 하나의 SQL 결합을 서술하고 Elasticsearch는 미사용 후보로 한정했다. |
| `spa-api-key-exposure-and-bff-architecture` | project-case / `blackstone-belleforet-resort` | 개발계 빌드 산출물 발견, 악용 없음, PHP 미들웨어 JWT, 전체 요청 Proxy, 원본 응답 전달, BFF 후속 판단 | 프로젝트 중간 시크릿 경계 수정과 Proxy/BFF 적용 기준만 확장한다. | `recommended: architecture` | 신규 구축 배경만 남기고 결제 timeout·20초·fallback·Request Header를 넣지 않았다. 당시 Proxy를 BFF 구현으로 소급하지 않고 public/private API와 직접 호출 허용 조건을 구분했다. |
| `vercel-team-plan-bypass-and-serverless-cost-analysis` | technical-exploration / `ai-dx-harness-starter-kit` | 질문, 공식 근거, 직접 실험, 대안, 조건, 계산 한계 | 공부는 v1 PoC 순서, 인사이트는 현재 가격 조건과 적용 판단을 맡는다. | `not-needed` | 현재 Pro/seat/viewer/credit과 Custom CI 실험을 분리하고 고정 총액·배수를 제거했다. |

새 다이어그램은 추가하지 않았다. 당시 initial migration 밖 legacy 11개는 checksum fixture로
slug·route·title·본문을 보존했다: `logging-decoupling-and-buffering-in-external-api-systems`,
`sso-authentication-and-soft-fk`, `json-outbox-pattern-for-settlement`,
`config-driven-architecture-react`, `context-api-encapsulation-and-router-level-isolation`,
`nestjs-middleware-vs-guard-tradeoff`, `nextjs-nestjs-domain-separation-and-bff`,
`https-and-plaintext-password-transmission`, `ai-vibe-coding`,
`socketio-realtime-architecture-and-reliability`, `enterprise-bff-architecture-and-cors`.

### GREEN commands and result

```bash
cd apps/front
pnpm exec vitest run src/data/portfolio/insight-editorial-quality.test.ts \
  src/data/portfolio/content-quality.test.ts
pnpm exec tsc --noEmit
pnpm exec eslint src/data/portfolio/studies.ts \
  src/data/portfolio/insight-editorial-quality.test.ts \
  src/data/portfolio/content-quality.test.ts
git diff --check -- apps/front/src/data/portfolio/insights.ts \
  apps/front/src/data/portfolio/studies.ts \
  apps/front/src/data/portfolio/insight-editorial-quality.test.ts \
  apps/front/src/data/portfolio/content-quality.test.ts \
  specs/007-portfolio-content-authoring/verification.md
```

Focused Vitest는 **2 files / 88 tests PASS**, frontend TypeScript와 study/test scoped
ESLint, 변경 범위 whitespace 검사는 exit 0이었다. Vitest의 Vite native config-loader
warning은 기존 설정 예고이며 실패 원인이 아니다. `insights.ts` 전체 ESLint는 migration
밖 legacy 본문의 기존 Prettier baseline 때문에 실패해 보존 본문을 포맷하지 않았다.

## T021 project-local rule and skill discovery

두 번째 T020 스킬 보완 뒤 아래 명령을 저장소 루트에서 다시 실행했다.

```bash
./harness skills-link
./harness context-check
./harness rule-check
./harness doctor
```

- `skills-link`: project-owned `portfolio-content-authoring` skill과 local editorial rule의
  Claude/Codex link를 정상 생성·유지했다.
- `context-check`: **0 failures, 0 warnings**.
- `rule-check`: rule lifecycle parity 검사 통과.
- `doctor`: **0 failures, 1 warning**. 경고는 PATH에서 같은 Claude binary 경로가 두 번
  감지된 기존 사용자 환경 항목이며 project-local rule/skill discovery 실패가 아니다.
- 고정 평가 계약은 `evals.json`과 frozen manifest 모두 SHA-256
  `13e35ebdaa4e24329ae79fd68e24c645c03d91ab69728dcb4d5c56cf3dba6914`로 유지됐다.
- shared `.harness/skills/**`는 수정하지 않았다. 프로젝트 소유 원본은
  `.harness/skills-local/portfolio-content-authoring/**`와
  `.harness/rules-local/portfolio-editorial-standard.md`다.

## Final frozen validation-v5 — T018-T020 benchmark

Validation-v4의 실패를 근거로 두 번째 skill 보완을 적용한 뒤, 실행 전에 고정된 같은
45개 expectation으로 validation-v5를 strict every-conjunct 방식으로 채점했다.
`evals.json`과 `/tmp/portfolio-content-authoring-eval.7POCnQ/frozen-manifest.json`의
SHA-256은 모두
`13e35ebdaa4e24329ae79fd68e24c645c03d91ab69728dcb4d5c56cf3dba6914`였다.
각 구성은 시나리오당 1회이며 출력 12개와 transcript 12개가 모두 존재하고 비어 있지
않았다. Fixture, frozen expectation, 해당 output만 채점 근거로 사용했고 assertion의
모든 conjunct가 충족되어야 pass로 처리했다.

| Eval | With skill | Without skill |
| --- | ---: | ---: |
| 1 — linked insight correction | **7/7** | **2/7** |
| 2 — semantic headings | **7/7** | **5/7** |
| 3 — study/insight nonduplication | **7/7** | **5/7** |
| 4 — unsupported independent content | **7/8** | **2/8** |
| 5 — unnecessary visual evidence | **8/8** | **2/8** |
| 6 — fact/role/value/time reconciliation | **6/8** | **6/8** |
| **Assertion-weighted total** | **42/45 (93.33%)** | **22/45 (48.89%)** |

### Strict failures

With-skill 실패는 다음 3개다.

- **E4#1**: 근거 부재와 `좋은 내용이라서`의 부적합은 지적했지만, 동시에 정확한
  유형을 `technical-exploration`으로 선언하고 목표 편집 메타데이터를 확정했다.
  현재 근거 없는 상태에서는 유형과 편집 메타데이터를 확정하지 말아야 한다는 conjunct를
  위반했다.
- **E6#4**: 프로젝트와 인사이트 교체 문구가 역할·시점·원인·대안·p95 결과를 거의
  같은 범위로 반복했다. 인사이트가 독립 요청 병렬화의 한 질문과 적용 경계에 집중하지
  않아 장문 역할 분리 conjunct를 충족하지 않았다.
- **E6#7**: 인사이트의 `not-needed`는 충족했지만 프로젝트 기존 sequence는
  `recommended`/`provided` 후보로만 두어 명시적으로 유지하지 않았다. 모든 conjunct가
  필요하므로 전체 assertion은 실패다.

Without-skill 실패 23개는 다음과 같다.

- **E1#1** 작업물만 먼저 반영하고 연결 인사이트 정정을 미뤘다; **E1#3**
  `project-case`와 단일 출처 프로젝트를 명시적으로 확인하지 않았다; **E1#4** 의미
  계약과 발췌 공백을 검토하지 않았다; **E1#5** 명시적 `not-needed`와 관계·인과 발명
  위험 사유가 없다; **E1#7** 실제 왕복·키보드 접근성·반응형을 각각 게이트로 남기지
  않았다.
- **E2#5** 두 글별 명시적 visual 상태와 중복 시 재평가 조건이 없다; **E2#7** 실제
  공개·왕복·접근성·반응형·장문/visual 중복 미검증 게이트가 없다.
- **E3#5** 공부 기록과 인사이트 각각의 명시적 visual 상태·사유가 없다; **E3#7** 실제
  왕복·키보드 접근성·반응형을 각각 게이트로 남기지 않았다.
- **E4#1** `좋은 내용이라서`는 기각했지만 비계약 유형 `independent-article`과 독립
  메타데이터를 확정해 다른 conjunct를 위반했다; **E4#2** 경로와 공개 상태는
  유지했지만 명시적 승인 전에 공개용 본문 교체를 확정했다; **E4#4** fixture에 없는 서버 부하·다수 클라이언트·네트워크 조건과
  측정 권고를 교체 문안에 추가했다; **E4#5** 기술 탐구 재심사의 여섯 의미 요건을 모두
  제시하지 않았다; **E4#6** 명시적 `not-needed`가 없다; **E4#8** 목록 진입·키보드·
  반응형과 향후 reciprocal 링크 검증을 모두 요구하지 않았다.
- **E5#1** 최종 `not-needed`를 명시하지 않았다; **E5#2** ownership과 cardinality
  근거 부재를 모두 밝히지 않았다; **E5#3** 재시도 경로 부재를 밝히지 않았다;
  **E5#4** `project-case`를 명시적으로 확인하지 않았다; **E5#7** 실제 왕복·접근성·
  반응형 게이트가 없다; **E5#8** 확인되지 않은 원인과 선택 인과를 공백으로 남기지
  않았다.
- **E6#7** 기존 sequence 유지는 명시했지만 인사이트를 명시적 `not-needed`로 판정하지
  않았다; **E6#8** 실제 왕복·키보드 접근·반응형을 모두 배포 전 게이트로 남기지
  않았다.

### Provenance, boundary, and runtime caveats

Validation-v5는 validation-v4 실패 중 **E1#5, E2#5, E3#5, E4#4, E4#6**을
해소했다. **E6#7**은 남았고, strict grading에서 **E4#1과 E6#4**가 새 실패로
드러났다. 초기에 assertion을 실행 뒤 작성한 paired 결과는 계속 exploratory
calibration으로만 취급하며, validation-v2~v4는 최종 증거가 아니라 revision
provenance다.

각 with-skill transcript는 독립 single-prompt pass와 자기 fixture 내용만의 접근을,
without-skill transcript도 자기 fixture만의 사용을 보고한다. 이 clean boundary는
transcript 자기 보고이며 별도 sandbox 감사로 독립 검증되지는 않았다. 노출 스캔에서
`assertion`, `expected output`, `grader` 또는 `grading` 관련 표현은 평가 계약을 읽거나
채점하지 않았다는 명시적 부정문에서만 발견됐고, assertion 본문이나 채점 기준 노출은
없었다. Executor model과 runtime은 unavailable/not independently verified이며 token은
`null`이다. Timestamp는 설명용으로만 보존하고 신뢰할 per-run duration, 숫자 timing
delta 또는 성능 결론을 보고하지 않는다.

### Artifacts and T020 disposition

- Per-run grades:
  `/tmp/portfolio-content-authoring-eval.7POCnQ/validation-v5/eval-{1..6}/{with_skill,without_skill}/run-1/grading.json`
- Benchmark:
  `/tmp/portfolio-content-authoring-eval.7POCnQ/validation-v5/benchmark.json`,
  `/tmp/portfolio-content-authoring-eval.7POCnQ/validation-v5/benchmark.md`
- Notes and metadata:
  `/tmp/portfolio-content-authoring-eval.7POCnQ/validation-v5/analysis_notes.json`,
  `/tmp/portfolio-content-authoring-eval.7POCnQ/validation-v5/validation-metadata.json`
- Local static viewer:
  `/tmp/portfolio-content-authoring-eval.7POCnQ/validation-v5/review.html`

모든 artifact와 viewer는 `/tmp` 아래의 로컬 임시 자료이며 공유 URL이나 저장소
산출물이 아니다. With-skill이 **42/45**이므로 **SC-002 및 T020은 충족되지 않았다**.
관련 보완 대상은 E4#1의 source/independent/type 확정 경계를 다루는
`references/evidence-and-linking.md`와 `references/insight-contract.md`, E6#4의
project/insight 역할 분리를 다루는 `references/project-detail-contract.md`와
`references/insight-contract.md`, E6#7의 기존 visual 유지와 최종 상태 확정을 다루는
`references/visual-evidence.md`다. 이 채점에서는 skill, reference, evals/assertion,
frontend, tasks를 수정하지 않았다.

## Final frozen validation-v6 — T018-T020 benchmark

Validation-v5의 세 실패를 대상으로 skill을 보완한 뒤, 실행 전에 고정된 같은 45개
expectation으로 validation-v6를 strict every-conjunct 방식으로 채점했다.
`evals.json`과 `/tmp/portfolio-content-authoring-eval.7POCnQ/frozen-manifest.json`의
SHA-256은 모두
`13e35ebdaa4e24329ae79fd68e24c645c03d91ab69728dcb4d5c56cf3dba6914`였다.
각 구성은 시나리오당 한 번 실행됐고 output/transcript 12쌍이 모두 존재하며 비어 있지
않았다. Fixture, frozen expectation, 해당 output만 채점 근거로 사용했으며 assertion의
모든 conjunct가 충족돼야 pass로 처리했다.

| Eval | With skill | Without skill |
| --- | ---: | ---: |
| 1 — linked insight correction | **7/7** | **1/7** |
| 2 — semantic headings | **7/7** | **5/7** |
| 3 — study/insight nonduplication | **6/7** | **4/7** |
| 4 — unsupported independent content | **6/8** | **3/8** |
| 5 — unnecessary visual evidence | **8/8** | **2/8** |
| 6 — fact/role/value/time reconciliation | **8/8** | **4/8** |
| **Assertion-weighted total** | **42/45 (93.33%)** | **19/45 (42.22%)** |

### Strict failures

With-skill 실패는 다음 3개다.

- **E3#2**: 인사이트의 좁힌 대표 문단은 제공했지만 study 쪽은 기존 날짜별 chronology를
  보존한다고 설명하고 의미 매트릭스만 제시했다. 두 화면 각각의 개요와 대표 문단을
  모두 제시해야 하는 conjunct 중 study 대표 문단이 없다.
- **E4#6**: visual을 `not-needed`로 확정하고 구성요소·분기·관계·비교 근거 부재를
  열거했지만, 그림이 현재 unsupported claim을 더 강하게 보이게 만들 수 있다는 위험을
  명시하지 않았다.
- **E4#7**: 기존 route 보존과 source 부재/defer는 명시했지만, source가 없는 현재
  화면에서 빈 source 링크를 노출하지 말라는 disposition을 명시하지 않았다.

Without-skill 실패 26개는 다음과 같다.

- **E1#1** 프로젝트만 먼저 수정하고 연결 인사이트를 미뤘다; **E1#2** 두 레코드 중
  프로젝트 교체 문안만 제공했다; **E1#3** `project-case`와 단일 출처 프로젝트를
  명시적으로 확인하지 않았다; **E1#4** project-case 의미 계약과 발췌 공백을 검토하지
  않았다; **E1#5** 연결 인사이트의 명시적 `not-needed`와 관계·인과 발명 위험 사유가
  없다; **E1#7** 실제 왕복·키보드 접근성·반응형을 각각 게이트로 남기지 않았다.
- **E2#5** 두 글 각각에 허용된 최종 visual 상태와 source visual 중복 재평가를 남기지
  않았다; **E2#7** 실제 공개 경로·왕복·접근성·반응형·장문/visual 중복 미검증
  게이트가 없다.
- **E3#2** 인사이트 대표 문단과 study 내용 목록만 있고 study의 개요·대표 문단을 함께
  제시하지 않았다; **E3#5** 두 레코드 각각에 허용된 최종 visual 상태를 남기지 않았다;
  **E3#7** 실제 왕복·키보드 접근성·반응형을 각각 게이트로 남기지 않았다.
- **E4#2** route는 보존했지만 승인 전에 본문을 검증 안내문으로 대체하도록 결정했다;
  **E4#4** fixture에 없는 장애 형태·동시 재접속 규모·서버 재시도 안내·지터를 새 공개
  안내문에 넣었다; **E4#5** 기술 탐구 재심사의 모든 의미 요건을 명시하지 않았다;
  **E4#6** 명시적 `not-needed`와 unsupported claim 강화 위험이 없다; **E4#8** 목록
  진입·키보드·반응형과 향후 reciprocal source 링크 검증을 모두 요구하지 않았다.
- **E5#1** 최종 `not-needed`를 명시하지 않았다; **E5#2** ownership과 cardinality
  근거 부재를 모두 밝히지 않았다; **E5#3** retry 경로 부재를 밝히지 않았다;
  **E5#4** `project-case`를 명시적으로 확인하지 않았다; **E5#7** 실제 왕복·접근성·
  반응형 게이트가 없다; **E5#8** 확인되지 않은 원인과 선택 인과를 공백으로 남기는
  의미 검토가 없다.
- **E6#4** 인사이트가 역할·시점·대안·p95 결과를 반복해 장문 역할 분리에 실패했다;
  **E6#5** 인사이트 유형을 `project-case`로 명시적으로 확인하지 않았다; **E6#7**
  sequence 유지와 비복제는 명시했지만 인사이트 visual을 `not-needed`로 확정하지
  않았다; **E6#8** 실제 왕복·키보드 접근·반응형을 모두 배포 전 게이트로 남기지
  않았다.

### Provenance, boundary, and runtime caveats

Validation-v5의 with-skill 실패 **E4#1, E6#4, E6#7**은 validation-v6에서 모두
통과했다. 그러나 strict every-conjunct 재채점에서 **E3#2, E4#6, E4#7**이 새
실패로 드러났다. 실행 뒤 assertion을 작성했던 초기 paired 결과는 계속 exploratory
calibration으로만 취급하며 validation-v2~v5는 최종 증거가 아니라 revision
provenance다.

With-skill은 하나의 clean executor가 skill contract와 가상 fixture 여섯 개를 모두
읽은 뒤, 각 transcript에서 해당 prompt에는 자기 fixture만 사용했다고 보고했다.
Without-skill transcript는 각각 자기 fixture 하나만 사용했다고 보고했다. 이 경계는
transcript 자기 보고이며 별도 sandbox 감사로 독립 검증되지는 않았다. 노출 스캔에서
`assertion`, `expectation`, `frozen manifest` 및 한국어 대응 표현은 금지 입력을 읽지
않았다는 명시적 부정문에서만 발견됐고 assertion 본문이나 채점 기준 노출은 없었다.
Executor model과 runtime은 unavailable/not independently verified이며 token은
`null`이다. Timestamp는 설명용으로만 보존하고 신뢰할 per-run duration, 숫자 timing
delta 또는 성능 결론을 보고하지 않는다.

### Artifacts and T020 disposition

- Per-run grades:
  `/tmp/portfolio-content-authoring-eval.7POCnQ/validation-v6/eval-{1..6}/{with_skill,without_skill}/run-1/grading.json`
- Benchmark:
  `/tmp/portfolio-content-authoring-eval.7POCnQ/validation-v6/benchmark.json`,
  `/tmp/portfolio-content-authoring-eval.7POCnQ/validation-v6/benchmark.md`
- Notes and metadata:
  `/tmp/portfolio-content-authoring-eval.7POCnQ/validation-v6/analysis_notes.json`,
  `/tmp/portfolio-content-authoring-eval.7POCnQ/validation-v6/validation-metadata.json`
- Local static viewer:
  `/tmp/portfolio-content-authoring-eval.7POCnQ/validation-v6/review.html`

모든 artifact와 viewer는 `/tmp` 아래의 로컬 임시 자료이며 공유 URL이나 저장소
산출물이 아니다. With-skill이 **42/45**이고 여섯 시나리오 모두 100%가 아니므로
**SC-002 및 T020은 충족되지 않았다**. 남은 보완 대상은 E3#2의 두 레코드별 구체 편집
artifact를 다루는 `references/insight-contract.md`, E4#6의 unsupported claim과 visual
위험을 다루는 `references/visual-evidence.md`, E4#7의 source 부재 시 링크 disposition을
다루는 `references/evidence-and-linking.md`다. 이 채점에서는 skill, reference,
evals/assertion, frontend, tasks를 수정하지 않았다.

## Final frozen validation-v7 — T018-T020 benchmark

Validation-v6의 세 실패를 대상으로 skill을 보완한 뒤, 실행 전에 고정된 같은 45개
expectation으로 validation-v7을 strict every-conjunct 방식으로 채점했다.
`evals.json`과 `/tmp/portfolio-content-authoring-eval.7POCnQ/frozen-manifest.json`의
SHA-256은 모두
`13e35ebdaa4e24329ae79fd68e24c645c03d91ab69728dcb4d5c56cf3dba6914`였다.
각 구성은 시나리오당 한 번 실행됐고 output/transcript 12쌍이 모두 존재하며 비어 있지
않았다. Fixture, frozen expectation, 해당 output만 채점 근거로 사용했으며 assertion의
모든 conjunct가 충족돼야 pass로 처리했다.

| Eval | With skill | Without skill |
| --- | ---: | ---: |
| 1 — linked insight correction | **7/7** | **3/7** |
| 2 — semantic headings | **7/7** | **5/7** |
| 3 — study/insight nonduplication | **7/7** | **4/7** |
| 4 — unsupported independent content | **8/8** | **3/8** |
| 5 — unnecessary visual evidence | **8/8** | **2/8** |
| 6 — fact/role/value/time reconciliation | **8/8** | **5/8** |
| **Assertion-weighted total** | **45/45 (100%)** | **22/45 (48.89%)** |

### Strict failures

With-skill 실패는 **없다**. 여섯 시나리오가 모두 각각 **100%**이며 고정된 45개
assertion을 전부 통과했다.

Without-skill 실패 23개는 다음과 같다.

- **E1#3** `project-case` 유형을 명시적으로 확인하지 않았다; **E1#4** project-case
  의미 계약과 발췌 공백을 검토하지 않았다; **E1#5** 연결 인사이트의 명시적
  `not-needed`와 관계·인과 발명 위험 사유가 없다; **E1#7** 실제 왕복·키보드 접근성·
  반응형을 각각 게이트로 남기지 않았다.
- **E2#5** 두 글 각각에 허용된 최종 visual 상태와 source visual 중복 재평가를 남기지
  않았다; **E2#7** 실제 공개 경로·왕복·접근성·반응형·장문/visual 중복 미검증
  게이트가 없다.
- **E3#2** 인사이트 편집 문안은 있지만 study 화면의 개요와 대표 교체 문단을 함께
  제시하지 않았다; **E3#5** study와 insight 각각에 허용된 최종 visual 상태를 남기지
  않았다; **E3#7** 실제 왕복·키보드 접근성·반응형을 각각 게이트로 남기지 않았다.
- **E4#2** route는 보존했지만 승인 전에 공개 본문을 임시 안내문으로 교체하도록
  결정했다; **E4#5** 기술 탐구 재심사의 모든 의미 요건을 명시하지 않았다;
  **E4#6** visual을 보류해 명시적 `not-needed`와 unsupported claim 강화 위험이 없다;
  **E4#7** source metadata는 비워 두지만 공개 화면의 빈 source link/card/placeholder
  미노출 disposition이 없다; **E4#8** 목록 진입·키보드·반응형과 향후 reciprocal
  source 링크 검증을 모두 요구하지 않았다.
- **E5#1** 최종 `not-needed`를 명시하지 않았다; **E5#2** ownership과 cardinality
  근거 부재를 모두 밝히지 않았다; **E5#3** retry 경로 부재를 밝히지 않았다;
  **E5#4** `project-case`를 명시적으로 확인하지 않았다; **E5#7** 실제 왕복·접근성·
  반응형 게이트가 없다; **E5#8** 확인되지 않은 원인과 선택 인과를 공백으로 남기는
  의미 검토가 없다.
- **E6#4** 인사이트가 프로젝트의 시점·대안·p95 결과를 반복해 장문 역할 분리에
  실패했다; **E6#7** 기존 sequence 유지는 조건부이며 인사이트 visual을 명시적
  `not-needed`로 확정하지 않았다; **E6#8** 실제 왕복·키보드 접근·반응형을 모두
  배포 전 게이트로 남기지 않았다.

### Provenance, boundary, and runtime caveats

Validation-v6의 with-skill 실패 **E3#2, E4#6, E4#7**은 validation-v7에서 모두
통과했다. 실행 뒤 assertion을 작성했던 초기 paired 결과는 계속 exploratory
calibration으로만 취급하며 validation-v2~v6는 최종 증거가 아니라 revision
provenance다.

실행 provenance는 혼합 clean executor 구성이다. Main clean executor가 with-skill
**E1/E2/E5/E6**, 별도 clean agent가 각각 with-skill **E3**과 **E4**, 하나의 clean
baseline executor가 without-skill 여섯 건을 실행했다. 각 transcript는 해당 prompt의
fixture만 사용했다고 기록했다. 이 경계는 transcript 자기 보고이며 별도 sandbox 감사로
독립 검증되지는 않았다. 12개 transcript의 노출 스캔에서 `assertion`과 `expected
output` 관련 표현은 금지 입력을 읽지 않았다는 명시적 부정문에서만 발견됐고 assertion
본문이나 채점 기준 노출은 없었다. Executor model과 runtime은 unavailable/not
independently verified이며 token은 `null`이다. Timestamp는 설명용으로만 보존하고
신뢰할 per-run duration, 숫자 timing delta 또는 성능 결론을 보고하지 않는다.

### Artifacts and T020 disposition

- Per-run grades:
  `/tmp/portfolio-content-authoring-eval.7POCnQ/validation-v7/eval-{1..6}/{with_skill,without_skill}/run-1/grading.json`
- Benchmark:
  `/tmp/portfolio-content-authoring-eval.7POCnQ/validation-v7/benchmark.json`,
  `/tmp/portfolio-content-authoring-eval.7POCnQ/validation-v7/benchmark.md`
- Notes and metadata:
  `/tmp/portfolio-content-authoring-eval.7POCnQ/validation-v7/analysis_notes.json`,
  `/tmp/portfolio-content-authoring-eval.7POCnQ/validation-v7/validation-metadata.json`
- Local static viewer:
  `/tmp/portfolio-content-authoring-eval.7POCnQ/validation-v7/review.html`

모든 artifact와 viewer는 `/tmp` 아래의 로컬 임시 자료이며 공유 URL이나 저장소
산출물이 아니다. With-skill이 **45/45**, 여섯 시나리오 각각 **100%**이므로
**SC-002 및 T020은 충족됐다**. 이 채점에서는 skill, reference, evals/assertion,
frontend, tasks를 수정하지 않았다.

최종 점수와 revision provenance를 이 문서에 보존한 뒤 T020 계약에 따라
`/tmp/portfolio-content-authoring-eval.7POCnQ` 평가 workspace를 정리했다. 위 artifact
경로는 실행 당시의 로컬 증거 위치이며 정리 후에는 존재하지 않는다.

## T044-T049 integration and production verification

### TypeScript, Vitest, and scoped ESLint

`apps/front`에서 다음 최종 명령을 실행했다.

```bash
pnpm exec tsc --noEmit
pnpm test
pnpm exec eslint \
  src/data/portfolio/insight-editorial.ts \
  src/data/portfolio/insight-editorial-labels.ts \
  src/data/portfolio/insight-editorial-quality.test.ts \
  src/data/portfolio/content-quality.test.ts \
  src/data/portfolio/feature-detail-quality.test.ts \
  src/data/portfolio/index.ts \
  src/data/portfolio/studies.ts \
  src/data/portfolio/types/insight.dto.ts \
  e2e/portfolio-insight-contract.spec.ts \
  e2e/codi-harness-portfolio-detail.spec.ts
```

- TypeScript: exit 0.
- Vitest: **5 files / 171 tests PASS**. Vite native config-loader 예고 warning만 남았다.
- 신규 계약·테스트·연결 공부 기록의 scoped ESLint: exit 0.
- Quickstart 전체 변경 파일 lint는 상세/목록 페이지의 기존 quote/import/Prettier와
  migration 밖 `insights.ts` legacy 본문 formatting baseline 때문에 실패했다. 관련 없는
  파일과 보존 본문을 포맷하지 않았고, 신규·실제 계약 파일은 위 명령으로 분리해
  통과시켰다.
- Feature 004의 낡은 본문 길이/L4·L7 fixture는 Feature 007이 승인한 현재 근거 경계로
  갱신했다. 그 결과 전체 Vitest가 다시 GREEN이 됐다.

### Production build and browser evidence

`pnpm run build`는 Next.js 16.1.6 production build를 성공했고 **38개 static page**를
생성했다. 작업물 8개, 공부 기록 1개, 인사이트 18개의 정적 경로가 유지됐다. 루트와 앱
lockfile이 함께 있다는 기존 workspace-root warning은 실패가 아니다.

포트 1118에 production server를 띄우고 임시
`playwright.feature007.config.ts`로 다음 두 suite를 실행했다.

```bash
pnpm exec playwright test --config=playwright.feature007.config.ts \
  e2e/portfolio-insight-contract.spec.ts \
  e2e/codi-harness-portfolio-detail.spec.ts --reporter=line
```

첫 실행은 제품 문제가 아닌 두 locator fixture 문제로 34/36이었다. 공부 화면의 동일
Vercel 링크 두 개를 관련 인사이트 카드 heading으로 좁히고, inline code가 나누는
Infisical 문장을 안정적인 근거 문장으로 좁힌 뒤 focused 2/2와 전체 **36/36 PASS**를
확인했다.

- initial 7/11 scope에서 정확히 7개 migrated 유형 label과 6:1 분포.
- initial 7/11 scope에서 작업물/공부 기록에서 연결 인사이트로 키보드 이동하고 source로 돌아오는 7개 왕복.
- initial 7/11 scope의 legacy 인사이트 11개 route/title과 빈 유형 placeholder 부재.
- 320/768/1024/1440px 목록·두 유형 상세·하네스·블랙스톤의 document overflow 0.
- 320px 하네스 상세의 기존 RED `overflow 80px`는 본문 288px보다 긴
  `Brainstorming·Planning·Execution·Review·Verification` 텍스트 런이 원인이었다.
  상세 prose wrapper에 `break-words` 하나를 추가한 뒤 네 viewport 모두 0px가 됐다.

포트 1118 server는 종료했고 임시 Playwright config를 삭제했다. 포트 1104 server는
중단하거나 재사용하지 않았고 `.next/dev/lock`은 inode `59775519`, size `0`으로
유지됐다. 기존 untracked `test-results/.last-run.json`은 이번 작업 전부터 있던 사용자
상태라 삭제하지 않았다.

### Scope and preservation

- `git diff --check`: exit 0.
- `git diff --stat`을 확인했고 shared `.harness/skills/**` 변경은 0개다.
- 프로젝트 소유 변경은 `.harness/skills-local/portfolio-content-authoring/**`와
  `.harness/rules-local/portfolio-editorial-standard.md`에 한정했다.
- initial migration 대상 밖 인사이트 11개의 slug/route/title/body checksum은 당시 최종 unit fixture가
  보존한다. 전체 route 보존은 production build와 E2E가 함께 확인했다.
- 작업 시작 전부터 존재한 다른 feature/harness/frontend dirty state는 정리하거나
  포맷하지 않았다.

## T050 speckit convergence

`.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks`가
Feature 007 directory와 필수 spec/plan/tasks를 정상 반환했다. 등록된 converge extension
hook은 없었다.

현재 구현을 spec/plan/tasks와 constitution에 대조했다.

- Functional requirements: **45 checked**.
- Success criteria: **10 checked**.
- User story acceptance와 edge case: 다섯 story 전부 checked.
- Plan decisions/touchpoints: project-owned rule/skill, 점진 metadata, 정적 data layer,
  list/detail UI, 평가·unit·production E2E와 보존 범위 checked.
- Constitution MUST: Evidence-first truth, interview-driven preservation, shared IA,
  accessibility/responsiveness, test-first delivery checked.
- Findings: missing 0 / partial 0 / contradicts 0 / unrequested 0.
- Severity: Critical 0 / High 0 / Medium 0 / Low 0.

따라서 `tasks.md`에 빈 convergence section이나 새 task를 append하지 않았다.

**Converged — the implementation satisfies the spec, plan, and tasks.**

## T051-T052 status sync and durable handoff

`mise run feature:status:sync`는 exit non-zero로 종료됐다.

```text
mise ERROR no task //:feature:status:sync found
```

저장소의 실제 task 목록에는 `doctor`, `e2e`, `e2e:changed`, `install`, `update`,
`update-check`, `//apps/front:e2e`만 있다. 대체 명령을 만들거나 자동 전이를 추정하지
않고 root `ROADMAP.md`의 Completed에 Feature 007을 수동으로 추가했다.

### Remaining visual recommendations

이번 feature는 “필요성 판정 의무화”만 구현했으며 새 다이어그램을 만들지 않았다.

- `codi-harness-dx-platform-design`: timeline 추천.
- `infisical-centralized-secrets-and-spof-defense`: architecture 추천.
- `cloudflare-tunnel-zero-trust-cicd-and-troubleshooting`: data-flow 추천.
- `spa-api-key-exposure-and-bff-architecture`: architecture 추천.
- Jenkins와 Vercel 인사이트는 현재 산문 또는 연결 source의 기존 자료로 충분해
  `not-needed`를 유지한다. Hanmaum은 후속 인터뷰와 코드 확인 뒤 시간 변화가 핵심이라고
  재판정해 `provided` timeline으로 변경했다.

추천은 구현 완료 주장이 아니며, 향후 제작 시 현재 source visual과 관계 근거를 다시
열어 중복·접근성·text alternative를 검증해야 한다.

### Residual risks

- 인사이트 상세/목록과 `insights.ts` 전체 ESLint는 Feature 007 밖의 기존 quote/import/
  Prettier baseline 때문에 실패한다. 신규 계약·테스트·study 파일 scoped lint는 통과했고
  legacy 본문을 포맷하지 않았다.
- Next build는 루트 `package-lock.json`과 앱 `pnpm-lock.yaml`을 함께 감지하는 기존
  workspace-root warning을 출력한다. build와 38개 정적 page 생성에는 영향이 없었다.
- Skill executor의 clean boundary, model/runtime과 token 정보는 독립 sandbox telemetry가
  아니라 transcript 자기 보고 또는 unavailable이다. 점수는 timing 성능 주장이 아니라
  고정 assertion 충족 결과로만 사용한다.
- `feature:status:sync` task가 없어 ROADMAP 상태를 수동 반영했다.
- 추천 visual 네 건은 미래 후보다. Hanmaum의 timeline 한 건은 2026-08-25 후속
  인터뷰에서 승인된 연도별 코드 이력을 근거로 본문에 제공했다.

### Final disposition

- Skill benchmark: **45/45 (100%)**, baseline **22/45 (48.89%)**.
- TypeScript: PASS.
- Vitest: **5 files / 171 tests PASS**.
- Scoped ESLint: PASS; known whole-file baseline documented.
- Production build: PASS, **38 static pages**.
- Production E2E: **36/36 PASS**.
- Legacy preservation: 11 insight checksums와 8 project/18 insight routes PASS.
- Convergence: **Converged**, Critical/Important finding 0.
- Commit, push, merge, deploy: 수행하지 않음.

## 2026-08-26 Infisical Self-Hosted 인사이트 후속 반영

### 콘텐츠·근거 판정

- 사용자가 제목, 요약, 공개 본문 전체와 시각 자료 역할을 `진행하자`로 명시적
  승인했다.
- incident: 다른 호텔의 환경변수가 운영 배포에 섞여 예약·조회 요청이 실패하고 화면과
  기능 설정도 다른 호텔 기준으로 표시됐으며, 수정·재배포까지 약 10분의 운영 장애가
  발생했다.
- causal boundary: 당시 여러 호텔 배포가 같은 Jenkins 대기열에 있었지만 정확한 원인은
  규명하지 못했다. Jenkins 오류나 사용자 입력 오류 중 하나로 단정하지 않는다.
- ownership: 프로젝트, `dev`/`prod`, frontend/backend, runtime/github-actions와
  `Shared-Secrets`를 나누고 GitHub Secrets에는 Infisical bootstrap 인증 정보만 둔다.
- failure boundary: 별도 테스트 프로젝트·서버에서 Infisical을 중단했을 때 새 배포는
  시크릿 조회 단계에서 실패하고 기존 테스트 서비스는 이전 `.env`로 정상 동작했다.
  운영 복구, 재시작과 scale-out 검증으로 확대하지 않는다.
- observation: 2026년 8월 현재까지 동일 유형 혼입을 다시 발견하지 못했지만, 시스템
  전수 집계나 장애율 통계는 아니다. 배포·온보딩 시간 개선도 측정 성과로 주장하지
  않는다.
- recovery limit: 데이터베이스와 백업 파일이 같은 인스턴스 서버에 있어 함께 삭제되면
  현재 복구할 방법이 없다. 자동 장애 조치나 다중 인스턴스가 있다고 쓰지 않는다.
- future boundary: Self-Hosted 선택은 유지하되 외부 백업·복구 훈련·DX 개선은 실제
  구현 뒤 재검토하며 현재 성과로 공개하지 않는다.
- provenance: 경로·환경 매핑, CLI fallback과 workflow의 `.env` 생성은
  `/Users/codiworks_dev/Desktop/codi-harness-v2` 코드 확인 근거다. 장애·재발 미관찰·중단
  테스트·백업 한계는 사용자 인터뷰 및 운영 관찰 근거다.

### Visual 필요성 인벤토리 — 연결 작업물

| Inventory row | Relationship | Evidence status |
| --- | --- | --- |
| Actors and components | present | supported — GitHub 저장소, GitHub Actions, Infisical과 배포 대상을 작업물의 배포 스윔레인이 보여 준다. |
| Parallel paths | present | supported — 변경 범위에 따라 프론트·백엔드와 플랫폼 배포 대상을 계산하는 흐름이 있다. |
| Failure paths | present | supported — 승인·검증 실패와 시크릿 조회 실패가 이후 배포를 막는 예외 경로를 표시한다. |
| Retry paths | absent | N/A — 자동 재시도 구현을 확인하지 않았고 이를 그리면 근거 없는 복구 주장이 된다. |
| Recovery paths | absent | N/A — 작업물 스윔레인은 배포 실행 순서이며 Infisical 데이터 복구 절차를 다루지 않는다. |
| Data relationships | present | supported — 배포 workflow가 환경·목적별 시크릿 경계를 조회하는 관계가 있다. |
| Alternatives | absent | N/A — 현재 작업물 시각 자료는 Jenkins나 runtime 조회 대안을 비교하지 않는다. |
| Time evolution | absent | N/A — 두 스윔레인은 현재 상호작용 순서이며 도입 전후 연혁을 나타내지 않는다. |
| Existing source visual | present | supported — 설계·개발·검증과 CI/CD·시크릿·배포 흐름의 연결형 스윔레인 두 개가 있다. |

**Visual decision: provided — retain existing swimlanes. 작업물은 현재 설계·검증과
배포 실행 순서를 설명하므로 새 architecture로 교체하거나 중복하지 않는다.**

### Visual 필요성 인벤토리 — Infisical 인사이트

| Inventory row | Relationship | Evidence status |
| --- | --- | --- |
| Actors and components | present | supported — Jenkins UI, 로컬 `.env`, Slack, Infisical, GitHub Actions와 실행 중인 서비스를 표시한다. |
| Parallel paths | absent | N/A — 도입 전후와 실패 경계는 비교 상태이며 동시 실행 경로로 그리지 않는다. |
| Failure paths | present | supported — 다른 호텔 값 혼입, Infisical 중단 시 새 배포 실패와 같은 인스턴스 손실을 분리한다. |
| Retry paths | absent | N/A — 자동 재시도는 확인하지 않았고 추가하면 검증하지 않은 복구 기제를 암시한다. |
| Recovery paths | absent | supported gap — 현재 DB와 백업 파일이 함께 손실되면 복구할 수 없다는 부재 자체를 표시한다. |
| Data relationships | present | supported — 프로젝트·환경·frontend/backend·runtime/github-actions·공용 시크릿의 소유권 관계를 보여 준다. |
| Alternatives | present | supported — runtime 직접 조회 검토와 deployment-time `.env` 생성 선택을 비교한다. |
| Time evolution | present | supported — Jenkins·로컬·Slack 분산 상태와 Infisical 도입 후 상태를 전후로 구분한다. |
| Existing source visual | present | supported — 본문 `<pre><code>` architecture와 같은 관계의 `textAlternative`를 제공한다. |

**Visual decision: provided — architecture. 환경변수 소유권, 배포 실패와 복구 경계를
한 화면에서 비교해야 하므로 산문만으로 두지 않는다.**

Existing visual disposition: **retain existing architecture**. 작업물 스윔레인의 실행
순서를 반복하지 않고, 인사이트만 도입 전후 소유권과 실패·복구 경계를 비교한다.

### 공개 검증 matrix

| Row | Status | Observed evidence |
| --- | --- | --- |
| Route response | supported | production build port 1116에서 `/projects/codi-harness-dx-platform`과 `/insights/infisical-centralized-secrets-and-spof-defense`가 정상 제목을 표시했다. |
| Public list entry | supported | `/insights`에서 승인된 Infisical 제목과 프로젝트 사례형 label을 확인했다. |
| Source to insight | supported | 작업물의 승인 제목 링크를 keyboard focus 후 Enter로 활성화해 인사이트 route로 이동했다. |
| Insight to source | supported | 인사이트의 `사내 DX 하네스 v2 구축` 연결 기록을 keyboard focus 후 Enter로 활성화해 source route로 돌아갔다. |
| Semantic link names | supported | source 링크는 승인된 인사이트 제목, reverse 링크는 작업물 제목으로 목적을 구분한다. |
| Keyboard focus and activation | supported | source↔insight 양방향 링크의 focus와 Enter 이동을 확인했다. |
| Responsive widths | supported | 인사이트를 포함한 목록·상세를 320, 768, 1024, 1440px에서 열어 document-level horizontal overflow가 1px 이하임을 확인했다. |
| Long-form duplication | supported | 작업물은 하네스 전체 운영·배포 흐름, 인사이트는 시크릿 소유권과 실패·복구 경계만 담당한다. |
| Visual duplication | supported | 작업물은 실행 sequence 스윔레인, 인사이트는 도입 전후 architecture로 관계와 질문이 다르다. |

### TDD와 기술 검증

- RED focused: 승인 제목·incident·의도적 중단 테스트·복구 한계와 `provided`
  architecture가 기존 본문에 없어 **5건 실패 / 150건 통과**를 확인했다.
- GREEN focused: `content-quality.test.ts` + `insight-editorial-quality.test.ts` +
  `feature-detail-quality.test.ts` — **3 files / 155 tests PASS**.
- 후속 제목 회귀 RED/GREEN: 공부 기록 Markdown에 남은 구 제목을 금지하는 계약이
  **1건 실패 / 42건 통과**한 뒤 링크를 승인 제목으로 교체했고, focused
  `content-quality.test.ts` **43/43 PASS**와 해당 파일 ESLint PASS를 확인했다.
- Full Vitest: `pnpm test` — **5 files / 177 tests PASS**.
- TypeScript: `pnpm exec tsc --noEmit` — PASS.
- Scoped ESLint: 변경한 계약과 E2E 파일은 PASS. `insights.ts` 전체 검사는 이번
  Infisical 구간 밖 447~895행의 기존 Prettier baseline **10건**으로 실패했다. 관련 없는
  구간을 포맷하지 않았다.
- Production build: `pnpm run build` — PASS, **38 static pages**. 기존 multiple lockfile
  workspace-root warning만 출력됐다.
- Production E2E (port 1116): permanent suite **58/58 PASS**. Infisical 공개 본문·시각
  경계, source 왕복, 키보드 활성화와 320/768/1024/1440px 반응형 검사를 포함한다.
- 화면 캡처: `apps/front/test-results/infisical-insight-approved.png`를 전체 페이지로
  생성해 제목·표·architecture 두 개·연결 카드의 가독성을 육안 확인했다.
- 임시 `playwright.prod.config.ts`는 실행 후 삭제했고 포트 1116 서버를 중단했다. 포트
  1104의 dev server와 `.next/dev` lock은 사용하거나 중단하지 않았다.
- `mise run feature:status:sync` — 저장소에 해당 task가 없어
  `no task //:feature:status:sync found`로 종료됐다. 대체 상태 전이를 추정하거나
  적용하지 않았다.
- Commit, push, merge, deploy: 수행하지 않음.

## 2026-08-27 Cloudflare Tunnel 인사이트 후속 검증

범위는 `cloudflare-tunnel-zero-trust-cicd-and-troubleshooting`와 원 작업물
`codi-harness-dx-platform`의 승인 문안·공개 렌더링·회귀 계약이다. 사실 정본은
`cloudflare-tunnel-insight-approved-copy.md`, 설계·공개 경계는
`cloudflare-tunnel-insight-design.md`, 구현·검증 범위는
`cloudflare-tunnel-insight-implementation-plan.md`를 사용했다. 이 절은 기존
Feature 007 검증 이력을 대체하지 않는다.

### Project-case 의미 재검토

| Row | Status | Evidence class | Evidence and boundary |
| --- | --- | --- | --- |
| Role and responsibility | supported | 승인 인터뷰·사용자 서술 + public copy contract | Cloudflare Tunnel과 Bastion 배포 경로를 직접 설계·구현한 범위만 기록했다. 팀 전체의 성과나 단독 소유권을 부풀려 주장하지 않는다. |
| Apr 2026 problem | supported | 사용자 보고 직접 사건 관찰 (WAF event log/workflow 비교) | WAF 이벤트 로그와 같은 workflow 비교에서 접근 단계를 확인했다. 독립 운영 감사를 뜻하지는 않는다. 같은 hostname의 connector가 의도하지 않은 방향으로 연결돼 SSH 단계에서 실패했으며, 파일 전송·배포 명령 전이므로 잘못된 서버에 배포되지는 않았다. |
| Alternatives and constraint | supported | 사용자 보고 의사결정 이력 | direct SSH는 인바운드 22번 포트를 넓게 열거나 GitHub Actions IP 허용 범위를 관리해야 하는 선택지로 비교했다. self-hosted GitHub Actions runner는 검토하지 않았고, Cloudflare 내부 connector 선택 알고리즘도 알지 못하므로 주장하지 않는다. |
| Temporary choice | supported | 사용자 보고 직접 운영 관찰 | 배포 대상별 hostname으로 임시 분리한 뒤 같은 workflow를 다시 실행해 의도한 서버에 도달하고 배포를 완료했다. |
| May 2026 implementation | supported | 기록된 code/config inspection + 승인 인터뷰·public content contract | 공용 Tunnel·Access·Bastion, `ProxyCommand`/`ProxyJump`, Service Token, shell 실행을 막은 배포 전용 사용자, `PermitOpen`, 프로젝트×배포 서버별 SSH 키를 실제 운영 경계로 기록했다. 비공개 code/config 자체를 공개했다는 뜻은 아니다. |
| Outcome evidence | supported with scope | 사용자 보고 운영 관찰 | 2026-08-27 기준 9개 프로젝트가 5대 서버에 배포되고 동일 유형 문제가 다시 관찰되지 않았다고만 기록했다. 장애율, 보안, 가용성 보장은 아니다. |
| Limitation | supported | 미시험 architectural inference | Bastion은 새 배포의 구조적 단일 장애점이다. 고의 Bastion 중단 시험이나 관찰된 장애는 없었고, 실행 중 서비스의 런타임 독립성도 시험으로 입증한 결과로 제시하지 않는다. |
| Retrospective | supported | 작성자 회고·미구현 future plan | `PermitOpen`·공개키 등록·Infisical 경로 연결 자동화를 먼저 하고, 이후 HA/대체 배포 경로/실제 복구를 검증한다는 후속 판단이다. 구현 완료나 현재 성과로 제시하지 않는다. |
| Project origin | supported | public data model + E2E render/navigation assertion | 기존 작업물 `codi-harness-dx-platform`에 연결한 `project-case`이며, 공개 source↔insight 왕복을 확인했다. |

### Source·insight visual 필요성 인벤토리

**작업물 visual decision: provided — retain existing swimlane.** 기존 CI/CD 스윔레인은
현재 배포 실행 순서를 보여 준다.

**Cloudflare insight visual decision: provided — retain existing data-flow.** 2026년 4월
실패에서 5월 외부 인증·내부 대상 권한 경계로 발전한 관계를 보여 주며, 작업물의
현재 실행 순서를 다시 그리지 않는다.

| Inventory row | Relationship | Evidence status | Source / insight disposition |
| --- | --- | --- | --- |
| Actors and components | present | supported | GitHub Actions, WAF, connector, Access, Tunnel, Bastion, 배포 서버와 권한 경계가 확인된다. source는 실행 주체 순서, insight는 인증·대상 권한 경계를 다룬다. |
| Parallel paths | present | supported | 초기 관찰 모델에서만 같은 hostname의 connector A/B branch를 표시한다. Cloudflare의 선택 알고리즘은 not claimed다. |
| Failure path | present | supported | WAF 차단과 SSH 단계 실패가 확인됐고 실제 deploy 전이었다. |
| Retry path | present | supported | WAF 예외·대상 hostname 적용 뒤 **같은 workflow를 재실행**한 범위만 있다. 애플리케이션 재시도 기제로 주장하지 않는다. |
| Recovery / HA | absent | N/A | 미래·미검증 상태이며 완료된 복구 경로나 HA로 제공하지 않는다. |
| Data relationship | absent | N/A | 데이터 entity·저장소 관계가 이 인사이트의 근거 또는 visual 질문이 아니다. |
| Alternatives | present | supported | direct SSH와 Tunnel, 임시 대상 hostname과 현재 Bastion을 비교한다. self-hosted runner 대안은 검토하지 않았으므로 포함하지 않는다. |
| Time evolution | present | supported | 2026년 4월 초기 실패에서 2026년 5월 Bastion 구조로의 발전을 표시한다. |
| Existing source visual | present | supported | source의 기존 swimlane과 insight의 data-flow는 모두 제공되며, 각각 현재 CI/CD 실행과 실패→권한 경계 발전이라는 다른 역할을 가진다. |

### 공개 검증 matrix

| Row | Status | Observed evidence |
| --- | --- | --- |
| Route response | supported | 격리 production server port 1116에서 `/insights/cloudflare-tunnel-zero-trust-cicd-and-troubleshooting` 응답 200과 승인 H1을 확인했다. |
| Public list entry and preserved route | supported | `/insights`의 `Cloudflare Tunnel만으로는 배포 경계가 완성되지 않는다` 항목을 열었고 기존 insight route가 유지됐다. |
| Source to insight | supported | `/projects/codi-harness-dx-platform`의 Cloudflare insight 링크를 활성화해 `/insights/cloudflare-tunnel-zero-trust-cicd-and-troubleshooting`로 이동했다. |
| Insight to source | supported | insight의 `사내 DX 하네스 v2 구축` source 링크를 활성화해 `/projects/codi-harness-dx-platform`로 돌아갔다. |
| Semantic link names | supported | source 쪽 link name은 승인된 Cloudflare insight 제목, reverse link name은 `사내 DX 하네스 v2 구축`으로 서로의 목적을 구분한다. |
| Keyboard focus and activation | supported | list entry와 source↔insight 두 방향에서 keyboard focus를 확인하고 Enter로 왕복했다. |
| Dedicated Cloudflare body / data-flow / limit E2E | supported | Cloudflare 전용 E2E는 승인된 public wording과 limit statement가 렌더링되는지만 검사했다. 운영 사실 자체를 독립 검증하지 않으며, 그 근거 class는 위 Project-case 의미 재검토 표를 따른다. |
| Responsive widths | supported | Cloudflare route 직접 측정: 320px client/scroll 320/320, overflow 0; 768px 768/768, overflow 0; 1024px 1024/1024, overflow 0; 1440px 1440/1440, overflow 0. |
| Long-form duplication | supported | source swimlane은 현재 CI/CD 실행 순서, insight는 실패에서 인증·대상 권한 경계로의 발전만 다룬다. 전체 프로젝트 설명을 insight에 반복하지 않았다. |
| Visual duplication | supported | source의 swimlane과 insight의 data-flow는 각각 현재 실행과 시간적·권한 경계 변화를 보여 주는 별도 역할이다. |
| Screenshot | supported | `apps/front/test-results/cloudflare-tunnel-insight-approved.png` (1440×4620)에서 H1, intro/meta, 7개 section, data-flow, table, limitation, related card를 확인했다. clipping 또는 깨진 monospace text는 없었다. |

### 명령·검증 이력

- pre-RED baseline focused 3 files: **155/155 PASS**.
- 새 계약 후 RED: **149 PASS / 5 FAIL (154 total)**. 기존 title, metadata, body와
  관련된 행동 계약 실패이며 구문·fixture 오류가 아니었다.
- GREEN focused: **3 files / 154 PASS**.
- Full Vitest: **5 files / 176 PASS**. 기존 Vite `configLoader` future warning만
  출력됐다.
- TypeScript: `pnpm exec tsc --noEmit` — PASS.
- 최종 false-negative guard mutation은 wrong-server 예시에서 처음
  `content-quality.test.ts` **1 FAIL / 41 PASS**를 만들었다. shared guard를 강화한
  뒤 focused 3 files는 **154/154 PASS**, full Vitest는 **176/176 PASS**였고
  `content-quality.test.ts` ESLint도 clean이었다. 승인된 production copy는 바꾸지
  않았다.
- Scoped ESLint: exit 1은 `insights.ts`의 기존 Prettier baseline 10건뿐이다
  (447, 495, 545, 595, 658, 702, 738, 787, 845, 895). Cloudflare block과 다른
  scoped 6개 파일은 0건이었다. 처음 새 test에서 난 formatting 6건은 broad formatting
  없이 수동 정정했다.
- Diff/no-index whitespace checks — PASS.
- Production build: **38/38 static pages**. 기존 multiple-lockfile warning만
  출력됐다.
- Playwright discovery: baseline **58**에서 최종 **59 tests / 4 files**.
- 첫 production E2E는 **58 PASS / 1 FAIL**이었다. Markdown paragraph에 뒤 문장이
  함께 들어간 탓에 정확한 9개/5대 문장 locator가 실패했다. SSR/source로 copy 존재를
  확인하고 article-scoped specific regex selector로 바꿨다.
- 다음 production E2E도 **58 PASS / 1 FAIL**이었다. Markdown hard wrap 때문에
  wrong-server boundary regex가 문장을 놓쳤고, source로 문장 존재를 확인한 뒤 알려진
  boundary locator 두 개를 줄바꿈에서만 좁은 `\s+`로 바꿨다.
- 이 selector 실패들에서 product content는 변경하지 않았다. 이후 rerun과 Cloudflare
  직접 viewport path 추가 후의 최종 rerun은 모두 **59 PASS / 0 FAIL / 0 SKIP**였다.
- 최종 메인 세션 production E2E 재검증: **59 PASS / 0 FAIL / 0 SKIP**, 14.0s.
- `NoFallbackError` 4건은 의도적으로 제거한 insight 404를 확인하는 기존 검사 로그다.
  target Cloudflare route는 200이었으며 shutdown 또는 Cloudflare regression이 아니다.
- Playwright `.last-run.json`은 apply_patch로 삭제했고, `apps/front/test-results/`에는
  `cloudflare-tunnel-insight-approved.png`만 보존했다. production config도 없다.
  port 1116은 해제됐으며 port 1104의 PID 57850은 건드리지 않았다.
- Commit, push, deploy는 수행하지 않았다.

### Feature status와 최종 hygiene

`mise run feature:status:sync`를 사용할 수 없으므로, 이 Cloudflare subtask는 status
files를 바꾸지 않았고 추가 feature status 전이를 추론하거나 적용하지 않았다. 해당
명령으로 status sync 또는 re-convergence도 확인·적용하지 않았다.

`mise run feature:status:sync` 실제 결과는 exit 1이었다.

```text
mise ERROR no task //:feature:status:sync found

Available tasks (`mise tasks ls --all`):
  Name              Description
  //:doctor         Verify the harness structure and local toolchain
  //:e2e            Run e2e for all apps that have a suite (stamps evidence on pass)
  //:e2e:changed    Run e2e only for changed apps (index-scoped); default entry point
  //:install        Install or refresh harness integrations
  //:update         Check harness dependency updates
  //:update-check   Run date-based harness update checks
  //apps/front:e2e  Run Playwright e2e for the frontend app
mise ERROR Version: 2026.7.5 macos-arm64 (2026-07-09)
mise ERROR Run with --verbose or MISE_VERBOSE=1 for more information
```

`git diff --check`는 exit 0·출력 없음으로 통과했다.
`test ! -e apps/front/playwright.prod.config.ts`도 exit 0으로 임시 config 부재를
확인했다. 다음 구 title 검색은 output 없이 exit 1이었다. 이는 public source와 E2E에
해당 정확한 옛 제목이 남아 있지 않음을 뜻하며, 별도의 의도적 match는 없었다.

```bash
rg -n "Cloudflare Tunnel을 활용한 Zero Trust CI/CD 구축과 트러블슈팅" apps/front/src apps/front/e2e
```

### Cloudflare 후속 수렴 재검증

Feature 007의 spec, plan, tasks와 constitution에 Cloudflare 후속 변경을 다시 대조했다.
Functional requirements 45개, success criteria 10개, 다섯 user story의 acceptance와 edge
case, 계획의 데이터·UI·검증 경계, constitution MUST를 모두 확인했다. missing, partial,
contradicts, unrequested finding은 각각 0건이며 Critical/High/Medium/Low finding도 0건이다.
`tasks.md` SHA-256은 재검증 전후 모두
`63cb0b41723b840522c44087c61b408a2e7412f8878801be31d70537bfd333a7`로 동일하다.

**Converged — the implementation satisfies the spec, plan, and tasks.**

## 2026-08-25 사용자 공동 작성 게이트 후속 보완

Feature 007 완료 보고 뒤, 기존 인터뷰와 기술 구현 승인이 있다는 이유로 인사이트
문안을 사용자 질의응답과 별도 콘텐츠 승인 없이 완료 처리한 실제 실패를 확인했다.
사실 근거가 있다는 것과 작성자의 강조점·회고·적용 기준이 승인됐다는 것은 다르므로,
작업물·인사이트·공부 기록의 신규 작성·이전·의미 있는 공개 문안 수정에 공통 사용자
공동 작성 게이트를 추가했다.

### 변경 계약

- 승인된 인터뷰 답변과 사용자가 준 정확한 최종 문구는 반복 질문하지 않고 재사용한다.
- 작업물은 강조할 판단·공개할 실수와 한계·현재 회고, 프로젝트 사례형 인사이트는
  하나의 질문·적용/회피 경계, 공부·기술 탐구형은 학습 계기·이해 변화·다음 검증을
  질의응답으로 확인한다.
- 질의응답 전에는 agent가 새 사실, 강조점, 회고, 적용 기준을 공개 교체 문안으로
  확정하거나 구현하지 않는다.
- 답변 기반 초안을 사용자에게 다시 제시하고 명시적 콘텐츠 승인을 받은 뒤에만 공개
  반영과 완료 처리를 한다.
- `Spec Kit clarify` 생략, 설계·spec·plan·tasks·구현 시작·테스트 승인은 콘텐츠
  인터뷰와 문안 승인을 대체하지 않는다.
- 사용자가 정확한 문장과 적용 범위를 준 경우에는 그 범위만 이미 승인된 것으로
  처리하며, agent가 작성한 주변 문안과 연결 기록 재구성은 별도 승인을 받는다.

### RED/GREEN 회귀 평가

`evals/fixtures/07-user-editorial-gate.json`은 사실 근거와 기술 승인은 충분하지만
사용자의 강조점·회고·적용 기준은 질문하지 않은 압박 상황을 재현한다. 작업물 역할
문장 한 개만 정확한 사용자 승인 문구로 제공해 불필요한 재질문 방지도 함께 검사했다.

- **Old-skill RED: 2/7** — 기술 승인과 문안 승인을 용어상 구분하고 정확한 역할 문장
  범위는 지켰지만, 파일 근거만으로 세 공개 문안을 직접 작성해 `Accept`하고 “추가
  문안 승인은 요청하지 않는다”고 판단했다. 기록별 사용자 질문, 추론 금지, 답변 기반
  초안의 최종 콘텐츠 승인, `Spec Kit clarify` 경계는 충족하지 못했다.
- **Updated-skill GREEN: 7/7** — 승인된 사실과 정확한 역할 문장은 재사용하고,
  작업물·인사이트·공부별 최소 저자 질문을 제시했다. `Spec Kit clarify`와 기술 승인이
  콘텐츠 승인을 대체하지 않음을 명시하고, 답변 기반 초안의 사용자 승인 전까지 공개
  반영과 완료 처리를 차단했다.

이 평가의 구형 스킬 snapshot은
`/tmp/portfolio-skill-user-gate.BGd8Fu/old-skill`에서 실행했다. 최종 정리 명령은
저장소 guard가 재귀 삭제로 차단했으며 별도 삭제 승인을 요청하거나 우회하지 않았다.
이 임시 snapshot은 저장소 밖에 남아 있고, 영구 계약은 project-owned skill,
reference와 eval fixture에 있다.

후속 보완 뒤 `mise run feature:status:sync`를 다시 실행했으나 기존과 같이
`no task //:feature:status:sync found`로 종료됐다. Feature 007의 완료 상태는 유지하며
새로운 모호 상태나 `on-hold` 전이는 없다.

## 2026-08-25 한마음 연결 인사이트 인터뷰 반영

사용자와의 후속 질의응답, `/Users/codiworks_dev/Desktop/codi-hansi` 검색 코드 및 Git
이력 확인, 전체 공개 문안 승인을 거쳐 한마음 연결 인사이트를 수정했다.

- 2023년 LIKE 기반 검색 개선의 브라우저 네트워크 관찰값 약 1500ms→약 400ms를
  2025년 FULLTEXT 및 2026년 결합 구조의 성과와 분리했다.
- 현재 구현을 두 글자 이상 `+token*` FULLTEXT, 모든 토큰 LIKE AND, 한 글자 토큰
  LIKE-only, 하나의 SQL 결합으로 기록했다.
- 최소 인덱싱 길이와 토큰화 방식의 차이를 이해한 회고를 공개하고, Elasticsearch는
  직접 사용하지 않은 향후 PoC 후보로 한정했다.
- visual 필요성 판정을 `not-needed`에서 `provided` timeline으로 변경했다. 이 timeline은
  작업물의 단일 검색 요청 흐름이 아니라 2023→2025→2026의 시간 변화를 설명한다.

### 검증 결과

- TDD RED: 신규 사실 계약 1건이 기존 title 불일치로 실패하는 것을 확인했다.
- Vitest: `pnpm test` — **5 files / 172 tests PASS**.
- Scoped ESLint: 변경 테스트 및 E2E 4개 파일 PASS. `insights.ts` 전체 검사는 이번 변경
  구간 밖의 기존 Prettier baseline 11건으로 실패했으며 관련 없는 본문을 포맷하지 않았다.
- Production build: `pnpm run build` — PASS, **38 static pages**.
- Production E2E (port 1114): 한마음 상세·인사이트, 7개 연결 왕복, legacy route,
  320/768/1024/1440px overflow — **28/28 PASS**.
- 렌더 완료 뒤 전체 페이지 캡처 검증 — **1/1 PASS**,
  `apps/front/test-results/hanmaum-approved/insight-desktop.png`.
- E2E용 임시 Playwright config와 캡처 spec은 실행 뒤 삭제했다.
- `mise run feature:status:sync` — 기존과 같이
  `no task //:feature:status:sync found`로 종료됐다.

## 2026-08-25 블랙스톤 연결 인사이트 인터뷰 반영

사용자 후속 질의응답과 전체 공개 문안 승인을 바탕으로
`spa-api-key-exposure-and-bff-architecture`를 수정했다.

- 개발계 테스트에서 React 빌드 산출물의 API Key 경계를 발견했으며 제3자 악용은
  없었다는 공개 강도를 유지했다.
- 실제 구현은 JWT 쿠키를 검증하는 PHP 미들웨어와 모든 요청의 목적지를 판단하는
  PHP Proxy였고, 외부 API 원본 응답은 그대로 React에 전달했다.
- 당시 구현을 BFF로 소급하지 않고, 현재 회고에서 인증·권한·응답 가공·API 취합이
  필요한 경우 BFF를 선택하는 기준을 분리했다.
- API Key·Secret·인증 헤더는 서버 경계에 두되, 인증 정보가 없는 공개 API는
  브라우저 직접 호출도 허용할 수 있도록 절대 규칙을 피했다.
- 작업물 전체를 반복한다는 내부 편집 문구는 RED/GREEN 회귀 계약으로 공개 본문에서
  제거했다.
- visual은 `recommended: architecture`를 유지한다. 현재 본문에는 새 시각 자료를
  제공하지 않았으며 작업물의 결제·보상취소 스윔레인과 다른 서버 신뢰 경계가
  후속 후보라는 판정이다.

### 검증 결과

- TDD RED/GREEN: 기존 title 불일치와 내부 편집 문구 잔존을 각각 실패로 확인한 뒤
  승인 문안으로 GREEN 전환했다.
- Vitest: `pnpm test` — **5 files / 173 tests PASS**.
- Scoped ESLint: 상세 데이터, 단위 계약, editorial 계약, E2E 5개 파일 PASS.
  `insights.ts` 전체 검사는 이번 변경 구간 밖의 기존 Prettier baseline 11건으로
  실패했으며 관련 없는 본문을 포맷하지 않았다.
- Production build: `pnpm run build` — PASS, **38 static pages**.
- Production E2E (port 1114): 벨포레 본문 계약, source 왕복, 키보드 focus,
  legacy route, 320/768/1024/1440px overflow, 렌더 완료 캡처 — **20/20 PASS**.
- 화면 캡처: `apps/front/test-results/blackstone-approved/insight-desktop.png`.
- E2E용 임시 Playwright config와 캡처 spec은 실행 뒤 삭제했다.
- `mise run feature:status:sync` — 기존과 같이
  `no task //:feature:status:sync found`로 종료됐다.

## 2026-08-25 하네스 연결 인사이트 인터뷰 반영

사용자 후속 질의응답, `/Users/codiworks_dev/Desktop/codi-harness-v2` 현재 구조,
실제 Claude Code·Codex handoff 사례와 전체 공개 문안 승인을 바탕으로
`codi-harness-dx-platform-design`을 수정했다.

- 하네스의 전체 구성·설계·구현을 혼자 담당한 역할을 전면에 두었다.
- Spec Kit·Superpowers·Playwright MCP는 직접 제작한 도구가 아니며, 각 역할을
  구분해 하나의 작업·검증 흐름으로 선택·통합했다는 경계를 명시했다.
- Codex가 `speckit-specify` 후 사용자 확인 지점에서 멈추지 않은 실제 사례를
  공개하고, clarify 필요성 판단 → 생략 사유 보고 → 명시적 `codi-auto-loop`
  요청 대기 → 승인 후 계획으로 이어지는 양 런타임 공통 계약을 설명했다.
- v1 복사형 배포의 버전 드리프트, CLI·doctor, Spec Kit·Feature Hub, `harness.lock`
  버전 캐시와 소유권 경계, 감사·릴리스 게이트, 멀티 세션 실험을 하나의
  발전 서사로 연결했다.
- 2026-08-20 기준 적용 11개·실제 운영 8개·사용 팀원 3명은 기준 시점과
  함께 유지했고, 멀티 세션은 약 2주간 제한된 프로젝트에서 검증한 운영
  확장 실험으로 한정했다.
- 연결 작업물의 전체 성과를 반복하지 않도록 AWS 공개 가격 `$151.84` 계산과
  배포 약 15분→약 3분 관찰은 연결 작업물·Jenkins 심화 글에 남기고 이 글에서
  제거했다.

### 의미·근거 계약

- role: 사용자가 승인한 단독 설계·구현 역할과 연결 작업물의 역할 기록이
  일치한다.
- problem/time: Jenkins 운영 부담, v1 약 2개월 사용 후 버전 드리프트, 실제
  Codex handoff 누락을 각각 발생 시점과 함께 분리했다.
- constraints: Claude Code·Codex의 서로 다른 규칙 주입·명령 실행 방식, 공통
  업데이트와 프로젝트 소유권, 실행 자원 격리를 제약으로 드러냈다.
- alternatives/choice: 실제 검토·사용한 Jenkins 유지, 공통 파일 복사, 하네스
  통합 선택만 기록했다.
- implementation/outcome: CLI·doctor, 런타임 패리티 검증, spec 계획 정본,
  `harness.lock`·소유권, 감사·릴리스 게이트와 11/8/3 운영 범위를 상호
  구분했다.
- limits: 절차·문서·사용자 판단 지점이 늘어나는 비용, 멀티 세션의 제한된
  검증 범위, context compact/clear 시점의 미해결을 공개했다.
- origin: `codi-harness-dx-platform` 작업물에 연결된 `project-case`로 유지했다.

### visual 인벤토리

- 작업물: 현재 설계·개발·검증 흐름과 CI/CD·시크릿·배포 흐름을 보여 주는
  기존 연결형 스윌레인 2개를 유지했다.
- 인사이트: `recommended: timeline`에서 `provided: timeline`으로 변경했다. Jenkins
  제거에서 멀티 세션 실험까지 시간적 발전 단계를 본문 code block과
  `textAlternative`로 같이 제공했다.
- non-duplication: 작업물은 현재 시스템의 상호작용, 인사이트는 과거에서
  현재로 발전한 순서를 보여 주므로 동일 근거를 반복하지 않는다.

### 검증 결과

- 콘텐츠 승인: 사용자가 전체 공개 문안과 단독 설계·구현 문구를
  `진행하자`로 명시적 승인했다.
- TDD RED: 기존 8개 제목과 timeline 미제공, `recommended` visual 상태가 신규
  계약을 실패시키는 것을 확인했다.
- Vitest focused: `content-quality.test.ts` + `insight-editorial-quality.test.ts` —
  **2 files / 91 tests PASS**.
- Vitest full: `pnpm test` — **5 files / 174 tests PASS**.
- TypeScript: `pnpm exec tsc --noEmit` — PASS.
- Scoped ESLint: 변경 단위·editorial 계약·하네스 E2E 파일 PASS.
  `insights.ts` 전체 검사는 이번 변경 구간 밖의 기존 Prettier baseline 11건으로
  실패했으며 관련 없는 본문을 포맷하지 않았다.
- Production build: `pnpm run build` — PASS, **38 static pages**.
- Production E2E (port 1118): 유형 label, 7개 source 왕복, 키보드 이동,
  legacy route, 하네스·블랙스톤 스윌레인, 320/768/1024/1440px overflow,
  승인 본문·타임라인 렌더링 — **37/37 PASS**.
- 첫 E2E 실행은 code block을 개별 줄 텍스트로 탐색한 selector 문제로
  35/37이었다. DOM snapshot으로 `<pre><code>` 두 개를 확인하고 고유 문구로
  각 블록을 식별한 후 focused 2/2와 전체 37/37을 재확인했다.
- 화면 캡처: `apps/front/test-results/harness-insight-approved.png` (1440×6632).
- E2E용 임시 Playwright config와 캡처 spec은 실행 후 삭제했다. 포트 1104
  dev server와 `.next/dev` lock은 사용하거나 중단하지 않았다.
- `mise run feature:status:sync` — 기존과 같이
  `no task //:feature:status:sync found`로 종료됐다. 대체 전이를 추정하지 않았다.

### 역할 문구 후속 조정

사용자 후속 검토에서 `이 하네스는 제가 전적으로 혼자 구성하고
설계했습니다`는 단독 수행을 과도하게 전면화한다고 판단했다. 역할 사실은
낮추지 않되 해당 문장을 삭제하고, `공통 정책과 소유권 경계`부터 시작하는
구체적 설계·구현 범위로 소유권을 보여 주는 안을 사용자가 승인했다.

- TDD RED: 기존 직접 문구가 남아 있어 91건 중 해당 계약 1건 실패.
- Focused GREEN: **2 files / 91 tests PASS**.
- Full Vitest: **5 files / 174 tests PASS**.
- TypeScript·scoped ESLint·production build: PASS, **38 static pages**.
- Production E2E (port 1114): 연결 인사이트 왕복·승인 문구 표시·기존 직접 문구
  부재·캡처 — **2/2 PASS**.
- `apps/front/test-results/harness-insight-approved.png`를 승인 문구가 반영된
  최신 화면으로 갱신했다.

## 2026-08-26 더 시에나 로그 분리 인사이트 인터뷰 반영

사용자 후속 질의응답, PHP-FPM 실행 환경 확인, 비공개 구현 파일
`tmp/phplog.php` 코드 검토와 전체 공개 문안 승인을 거쳐
`logging-decoupling-and-buffering-in-external-api-systems`를 수정했다. 비공개
요청·응답 값과 인증 관련 값은 공개 본문·fixture·검증 기록에 복사하지 않았다.

### 콘텐츠 승인과 사실 정정

- 사용자는 핵심을 “로그는 장애 시점에 실제로 조회할 수 있어야 한다”와
  “외부 API 요청·응답을 당사에도 남겨 책임 범위와 장애 지점을 확인한다”로
  승인했다.
- 예약 기능 자체에 미친 영향은 거의 없었고, 실제 문제는 수백만 건 로그
  테이블에 접근할 때 DB GUI가 다운되어 당사 로그를 확인하지 못한 것이었다.
- 변경 후 실제 예약 문제에서 시스템 로그의 요청·응답을 직접 확인했다.
- `ReadableLogger`에 20건·2초 설정이 존재하지만 PHP-FPM 요청마다 logger와
  배열이 초기화되고 종료 시 `flush()`되므로 요청 간 배치와 95% I/O 감소를
  뒷받침하지 못한다. 사용자는 이 구현 한계를 공개 회고로 전환하지 않고
  버퍼링 내용을 모두 제거하는 선택지 B를 승인했다.
- 사실이 아닌 “PMS 비정상 대량 요청 클레임 방어”, 확인하지 않은 예약 쿼리
  안정성, ELK·Loki·Datadog, 관련 없는 Redis TTL Lock 회고를 제거했다.
- 제목, 한 줄 소개, 전체 본문, 전후 architecture, 작업물과 소개 페이지의 연결
  주장 정정 범위를 사용자가 2026-08-26에 명시적으로 승인했다.

### Project-case 의미 재검토

| Row | Status | Evidence |
| --- | --- | --- |
| Role and responsibility | supported | 전체 프로젝트는 정해진 구조 안의 구현 역할이었고, 로그 저장 경로를 업무 DB에서 `syslog()`로 분리하는 방향과 구현은 사용자가 직접 담당했다고 인터뷰에서 확인했다. |
| Problem and time | supported | 운영 중 로그가 수백만 건으로 증가한 뒤 장애 예약 건의 로그 테이블 접근 시 DB GUI가 다운됐다. 정확한 달력 날짜는 복원하지 않았으며 공개 문구도 `운영 중`보다 좁은 시점을 만들지 않는다. |
| Constraints and criteria | supported | 예약 기능 영향은 거의 없었고, PMS 업체에 확인을 요청하기 전에 당사 요청·응답을 실제로 조회할 수 있는 경로가 필요했다. |
| Considered alternatives | N/A | 당시 다른 로그 저장 대안을 비교했다는 기억·기록은 복원되지 않아 대안 비교나 기각 사유를 공개 문구에 만들지 않았다. |
| Selection and implementation | supported | 제공 코드의 활성 기록 경로 `syslog()`와 사용자 답변으로 업무 DB 적재에서 시스템 로그 전달로 변경한 구현을 확인했다. |
| Outcome evidence | supported | 변경 후 실제 예약 문제에서 시스템 로그의 요청·응답을 직접 확인했다는 사용자 관찰만 결과로 남겼다. 처리 시간·장애 감소율은 측정하지 않았다. |
| Limits and retrospective | supported | 수치 성과를 제거하고, 현재 회고는 검증한 `syslog` 구조에 인증값·개인정보 마스킹과 보존 기간 관리를 추가하는 범위로 제한했다. |
| Project origin | supported | `the-siena-golf-reservation` 작업물과 연결된 `project-case`이며 공개 E2E에서 양방향 키보드 이동을 확인했다. |

### Visual 필요성 인벤토리 — 작업물

| Inventory row | Relationship | Evidence status |
| --- | --- | --- |
| Actors and components | present | supported — React, PHP Proxy, PMS, 업무 DB와 시스템 로그 경계가 본문에 있다. |
| Parallel paths | absent | N/A — 동시 실행 경로는 확인하지 않았으며 시각화하면 근거 없는 병렬 처리를 정당화할 수 있다. |
| Failure paths | present | supported — 로그 테이블 접근 시 DB GUI가 다운되어 PMS 확인으로 넘어간 사건이 있다. |
| Retry paths | absent | N/A — 로그 재시도 구현은 확인하지 않았으며 그리면 근거 없는 복구 기제를 정당화할 수 있다. |
| Recovery paths | present | supported — 로그 저장 경로를 `syslog`로 옮긴 뒤 당사 요청·응답을 직접 조회했다. |
| Data relationships | present | supported — 업무 데이터와 통신 로그의 저장 경계 분리가 핵심이다. |
| Alternatives | absent | N/A — 당시 비교한 로그 저장 대안은 복원되지 않았다. |
| Time evolution | present | supported — 변경 전 업무 DB 적재와 변경 후 시스템 로그 전달의 두 단계가 있다. |
| Existing source visual | absent | supported — 렌더된 작업물 route에 다이어그램이 없음을 확인했다. |

**Visual decision: not-needed — 작업물은 예약 프로젝트 전체와 두 챌린지를 요약하고,
로그 저장 경계의 전후 비교는 연결 인사이트에서 제공한다. 같은 architecture를 작업물에
다시 그리면 source와 insight의 역할을 중복한다.**

### Visual 필요성 인벤토리 — 인사이트

| Inventory row | Relationship | Evidence status |
| --- | --- | --- |
| Actors and components | present | supported — React, PHP Proxy, PMS, 업무 DB와 `syslog`의 저장 경계를 표시한다. |
| Parallel paths | absent | N/A — 두 구조는 동시 경로가 아니라 교체 전후이며 병렬로 그리면 실제 운영 관계를 왜곡한다. |
| Failure paths | present | supported — 변경 전 DB GUI 접근 불가를 명시한다. |
| Retry paths | absent | N/A — 확인된 로그 재시도는 없고 이를 추가하면 근거 없는 안정성 주장을 시각적으로 강화한다. |
| Recovery paths | present | supported — 변경 후 시스템 로그에서 요청·응답을 추적하는 조사 경로를 제공한다. |
| Data relationships | present | supported — 동일 예약 요청에서 로그 sink만 업무 DB에서 `syslog`로 바뀐다. |
| Alternatives | absent | N/A — 선택하지 않은 도구나 저장 방식은 표시하지 않는다. |
| Time evolution | present | supported — `변경 전`과 `변경 후` 두 상태를 비교한다. |
| Existing source visual | present | supported — 본문 `<pre><code>` architecture와 동일 관계의 `textAlternative`가 있으며 작업물에는 같은 그림이 없다. |

**Visual decision: provided — 예약 요청 경로는 유지하면서 통신 로그 저장 경계만 업무
DB에서 `syslog`로 옮긴 전후 architecture를 제공한다.**

Existing visual disposition: **retain existing architecture**. 작업물 전체 순서가 아니라
로그 저장 경계만 보여 주므로 source 본문과 시각적으로 중복하지 않는다.

### 공개 검증 matrix

| Row | Status | Observed evidence |
| --- | --- | --- |
| Route response | supported | `/projects/the-siena-golf-reservation`와 `/insights/logging-decoupling-and-buffering-in-external-api-systems`를 production build port 1115에서 열고 정상 제목을 확인했다. |
| Public list entry | supported | `/insights`에서 승인 제목 링크를 keyboard focus 후 Enter로 활성화해 인사이트 route로 이동했다. |
| Source to insight | supported | 작업물 사이드바의 `로그는 남기는 것보다 조회할 수 있어야 한다: 외부 API 로그 분리기` 링크를 focus/Enter로 활성화했다. |
| Insight to source | supported | 인사이트의 `작업물 골프 예약 시스템 구축` 링크를 focus/Enter로 활성화해 source route로 돌아갔다. |
| Semantic link names | supported | source 링크는 승인된 인사이트 제목, reverse 링크는 `작업물 골프 예약 시스템 구축`으로 목적을 구분한다. |
| Keyboard focus and activation | supported | list→insight와 source↔insight 양방향 모두 focus 상태와 Enter 이동을 확인했다. |
| Responsive widths | supported | 작업물과 인사이트를 320, 768, 1024, 1440px에서 열어 document-level horizontal overflow가 1px 이하임을 확인했다. |
| Long-form duplication | supported | 작업물은 예약·마이페이지와 두 챌린지의 전체 맥락을 남기고, 인사이트는 로그 조회 가능성과 저장 경계에만 집중한다. |
| Visual duplication | supported | 작업물에는 visual이 없고 인사이트만 업무 DB→`syslog` 전후 architecture를 제공한다. |

### TDD와 기술 검증

- RED: 승인된 제목·`syslog` 구현·관찰 한계가 없고, 버퍼링·95%·클레임 문구가
  남아 focused 계약 **11건 실패 / 82건 통과**를 확인했다.
- GREEN focused: `content-quality.test.ts` + `insight-editorial-quality.test.ts` —
  **2 files / 94 tests PASS**.
- Full Vitest: `pnpm test` — **5 files / 177 tests PASS**.
- TypeScript: `pnpm exec tsc --noEmit` — PASS.
- Scoped ESLint: `features.ts`, 변경 단위·editorial·feature-detail 계약과 E2E — PASS.
- `insights.ts` 전체 lint는 편집한 더 시에나 구간 밖의 기존 Prettier baseline
  **10건**으로 실패했다. 소개 페이지는 변경 전후 모두 동일한 기존 baseline
  **111건**이었다. 관련 없는 본문이나 소개 페이지 전체를 포맷하지 않았다.
- Production build: `pnpm run build` — PASS, **38 static pages**. 기존 multiple
  lockfile workspace-root warning만 출력됐다.
- Production E2E (port 1115): 전체 permanent suite **57/57 PASS**. 앞선 실행의
  실패는 code block을 독립 exact text로 찾은 선택자와 legacy 작업물에 구조화 상세
  링크 위치를 가정한 선택자 문제였고, DOM snapshot으로 원인을 확인한 뒤 실제
  accessible 구조에 맞춰 교정했다.
- 캡처 포함 실행: **58/58 PASS**,
  `apps/front/test-results/the-siena-logging-insight-approved.png`.
- E2E용 임시 Playwright config와 캡처 spec은 실행 후 삭제했다. 포트 1104의 dev
  server와 `.next/dev` lock은 사용하거나 중단하지 않았다.
- `mise run feature:status:sync` — 저장소에 해당 task가 없어
  `no task //:feature:status:sync found`로 종료됐다. 대체 상태 전이를 추정하거나
  적용하지 않았다.
- Commit, push, merge, deploy: 수행하지 않음.

## 2026-08-27 Jenkins matrix 인사이트 후속 검증

범위는 기존 `jenkins-retirement-and-github-actions-migration` 인사이트의 승인 문안,
`codi-harness-dx-platform` 작업물과의 공개 연결, 관련 회귀 계약, 이 증빙과
ROADMAP 갱신이다. 정본은 `jenkins-matrix-insight-approved-copy.md`, 설계·공개
경계는 `jenkins-matrix-insight-design.md`, 실행 범위는
`jenkins-matrix-insight-implementation-plan.md`다. 기존 작업물의 CI/CD swimlane,
다른 인사이트 본문, slug/origin, tags, read time과 포트 1104는 변경 범위가 아니다.
이 절은 이전 Feature 007 이력을 대체하지 않는다.

### 승인 문안 동등성·사실 근거 matrix

`content-quality.test.ts`는 승인 Markdown에서 정확히 하나의 `## Excerpt`와 뒤따르는
정확히 하나의 `## Content`를 추출하고, 공개 DTO의 excerpt와 content를 각각 문자열
완전 일치로 비교한다. 따라서 아래 문안은 의역·보강이 아니라 승인 문안 그대로다.

| Project-case row | Status | Evidence class | Public fact and boundary |
| --- | --- | --- | --- |
| Role and responsibility | supported | 승인 인터뷰·승인 문안·공개 copy contract | 기존 Jenkins 구성은 작성자가 설계하거나 설정한 영역이 아니며, 여러 프로젝트의 GitHub Actions 마이그레이션과 새 workflow 설계부터 담당했다. |
| Problem and time | supported | 승인 인터뷰 + code/history inspection | slave 1개에서 다섯 호텔이 순차 실행됐고, 경로 감지·matrix는 2026-07-01, 공통 pipeline·재사용 workflow 통합은 2026-07-07 이력으로 확인했다. 공개 글의 date는 `2026-07-07`이다. |
| Constraints and criteria | supported | 승인 인터뷰·승인 문안 | 공통 코드와 호텔별 코드·환경·대상이 한 저장소에 있으므로 변경 영향 범위를 계산해야 했다. 비용·운영 판단은 보조 배경이다. |
| Considered alternatives | supported | 승인 인터뷰·승인 문안 | 다른 프로젝트부터 먼저 이전한 실제 순서만 기록한다. Jenkins slave/executor 확장은 별도로 검토하지 않았으므로 비교·기각한 대안으로 만들지 않는다. |
| Selection and implementation | supported | code/history inspection + 승인 문안 | 공통 변경은 다섯 호텔 전체, 호텔별 변경은 해당 호텔만 계산하고, 계산된 대상을 독립 matrix job으로 실행한다. |
| Outcome evidence | supported with scope | Jenkins 순차 실행 화면과 GitHub Actions matrix 실행 화면의 사용자 관찰 | 다섯 호텔 실행 화면 기준 약 15분→약 3분이다. 동일 조건의 반복 평균·통제 실험·`80% 개선` 같은 비율 일반화가 아니다. |
| Limits and retrospective | supported | 미시험 설계 의도 + 사용자 회고 | `fail-fast: false`는 다른 hotel job의 즉시 취소를 막으려는 설계 의도다. 고의 실패 시험과 실제 실패 사례의 완료 여부 대조가 없으므로 검증된 실패 격리 성과가 아니다. 대상 간 순서가 필요하거나 영향 범위를 계산할 수 없으면 이 병렬화를 적용하지 않는다. |
| Project origin | supported | public data model + E2E navigation contract | 기존 `codi-harness-dx-platform` 작업물에 연결된 `project-case`이며, 공개 source↔insight 양방향 연결을 유지했다. |

비용 문구도 공개 사실과 계산을 분리한다. 월 `$151.84`는 2026-08-20 AWS 서울 리전
Linux On-Demand `t3.large` 2대 × 월 730시간의 **공개 가격 기반 컴퓨팅 추정치**이며,
과거 실제 청구액이나 확정 절감액이 아니다. 스토리지·네트워크·세금은 제외한다. 같은
시점의 GitHub Actions 무료 티어 미초과 사용자 보고는 향후 무료 또는 비용 0을 보장하지
않는다.

### Source·insight visual 필요성 및 중복 판정

| Inventory row | Source project: existing CI/CD swimlane | Jenkins insight: before/after data-flow |
| --- | --- | --- |
| Actors and components | present / supported — 저장소, GitHub Actions, Infisical, 배포 대상의 책임 경계 | present / supported — 코드 변경, Jenkins slave, 변경 범위 계산, matrix job, 다섯 호텔 |
| Parallel paths | present / supported — 현재 병렬 배포 단계 | present / supported — 대상별 matrix job의 병렬 경로 |
| Failure and retry paths | present / supported — 품질·시크릿 실패 중단과 원인 수정 후 재실행 | absent / N/A — 실제 실패 사례·실패 시험·재시도 조사는 없으므로 그리지 않음 |
| Recovery paths | absent / N/A — 작업물은 장애 복구 절차가 아니라 배포 실행을 설명 | absent / N/A — 장애 복구는 인사이트의 질문이 아님 |
| Data relationships | absent / N/A | absent / N/A |
| Alternatives | absent / N/A — 현재 선택된 전체 실행 흐름 | absent / N/A — Jenkins 확장은 실제 비교 대안이 아님 |
| Time evolution | absent / N/A | present / supported — Jenkins 순차 대기열에서 2026년 7월 matrix 병렬 실행으로의 변화 |
| Existing source visual | present / supported — 현 작업물의 전체 CI/CD·책임 경계 | present / supported — source visual과 역할이 다름 |

작업물 visual decision은 **provided — retain existing swimlane**이다. 인사이트 visual
decision은 **provided — retain before/after data-flow**이며, 답하는 질문은 “다섯 호텔의
배포 단위를 어떻게 다시 나눴는가?”다. text alternative는 slave 1개의 A→E 순차 배포와
공통/호텔별 변경 범위를 계산한 대상별 matrix 병렬 배포를 동등하게 설명한다.

Long-form 중복과 visual 중복을 별도로 판정했다. 작업물은 변경 감지부터 품질 검사,
시크릿 조회, 배포 결과 확인까지 **현재의 전체 CI/CD 실행과 책임 경계**를 남긴다.
인사이트는 Jenkins 순차 대기열에서 변경 범위 기반 matrix로 **배포 단위가 바뀐 전후**만
비교한다. 따라서 작업물 서사나 diagram을 반복하지 않으며, `fail-fast: false`도
검증된 failure path가 아닌 설정 의도로만 보조 설명한다.

### 영구 공개 계약 coverage

- `content-quality.test.ts`: 승인 excerpt/content의 exact equality, title/date/type/origin,
  여섯 heading, 역할·비용·실패 격리·15→3 관찰 한계, 금지 주장과 visual metadata를
  고정한다.
- `insight-editorial-quality.test.ts`와 `feature-detail-quality.test.ts`: project-case
  의미 계약, source 연결, visual decision/kind/text alternative/non-duplication와
  작업물의 보존 경계를 고정한다.
- `portfolio-insight-contract.spec.ts`와 `codi-harness-portfolio-detail.spec.ts`:
  목록·상세의 공개 title/date/intro/body, source→insight→source의 semantic link와
  keyboard activation, 320/768/1024/1440px overflow 0, data-flow 가독성 및 기존 source
  route 회귀를 고정한다.

### 공개 검증 matrix

| Row | Status | Observed evidence |
| --- | --- | --- |
| Route, list, preserved identity | supported | `/insights/jenkins-retirement-and-github-actions-migration`가 승인 title·`2026.07.07`·excerpt와 함께 렌더되고, slug와 origin `codi-harness-dx-platform`을 보존했다. |
| Source ↔ insight navigation | supported | 작업물의 승인된 Jenkins link와 인사이트의 `사내 DX 하네스 v2 구축` reverse link를 semantic accessible name으로 확인했다. 양쪽 모두 keyboard focus 후 Enter로 활성화했다. |
| Approved body and boundaries | supported | 기존 Jenkins 소유권 비주장, Jenkins 확장 미검토, `fail-fast: false` 미시험 의도, 공개 가격 계산/제외/무료 티어 한계, 15→3 화면 관찰 한계와 적용·회피 조건이 렌더링됐다. |
| Responsive data-flow | supported | 320, 768, 1024, 1440px에서 document-level horizontal overflow가 0이고 before/after data-flow가 읽힌다. 좁은 화면에서 필요한 경우 `pre`의 내부 가로 스크롤도 별도 계약으로 확인했으며, page-level overflow와 혼동하지 않는다. |
| Long-form / visual non-duplication | supported | 작업물의 현재 CI/CD swimlane과 인사이트의 배포 단위 전후 data-flow를 각각 별도 역할로 검증했다. |
| Screenshot | supported | `apps/front/test-results/jenkins-matrix-insight-approved.png` (1440×3420)을 육안 확인했다. H1, 날짜, 여섯 section, 비용·관찰 한계, data-flow와 source card가 모두 보였고 clipping 또는 깨진 monospace text는 없었다. |

### RED/GREEN, 최종 명령 및 hygiene

최종 명령은 모두 `apps/front`에서 실행했다.

```bash
pnpm exec vitest run src/data/portfolio/content-quality.test.ts src/data/portfolio/insight-editorial-quality.test.ts src/data/portfolio/feature-detail-quality.test.ts
pnpm test
pnpm exec tsc --noEmit
pnpm exec eslint src/data/portfolio/insights.ts src/data/portfolio/content-quality.test.ts src/data/portfolio/insight-editorial-quality.test.ts src/data/portfolio/feature-detail-quality.test.ts e2e/portfolio-insight-contract.spec.ts e2e/codi-harness-portfolio-detail.spec.ts
pnpm exec playwright test --list
pnpm run build
pnpm exec playwright test --config=playwright.prod.config.ts --reporter=line
pnpm exec playwright screenshot --viewport-size="1440,1000" --full-page --wait-for-selector="h1" --wait-for-timeout=500 http://127.0.0.1:1116/insights/jenkins-retirement-and-github-actions-migration test-results/jenkins-matrix-insight-approved.png
lsof -nP -iTCP:1116 -sTCP:LISTEN
lsof -nP -iTCP:1104 -sTCP:LISTEN
```

- RED는 기존 title/date/`not-needed` visual/이전 copy가 새 Jenkins 계약과 불일치함을
  확인한 계약 실패였다. import·문법·fixture 오류는 RED 근거로 세지 않았다.
- GREEN focused: Jenkins 관련 3개 Vitest 파일 **153/153 PASS**.
- Full Vitest: `pnpm test` — **5 files / 175/175 PASS**.
- TypeScript: `pnpm exec tsc --noEmit` — **PASS**.
- Scoped ESLint: 실제 변경 Jenkins contract·E2E 파일 — **PASS**. `insights.ts` 전체 lint의
  기존 Prettier baseline은 이번 Jenkins 구간 밖의 정확히 10건뿐이며 447, 495, 545,
  595, 658, 702, 738, 787, 845, 895행이다. broad formatting이나 unrelated body 변경은
  하지 않았다.
- Playwright discovery: `pnpm exec playwright test --list` — **60 tests**.
- Production build: `pnpm run build` — **38/38 static pages PASS**.
- 첫 production E2E는 **59 PASS / 1 FAIL**이었다. E2E가 `2026.7.7`을 기대했지만 renderer는
  승인 seed의 정확한 날짜 `2026.07.07`을 표시한 date locator false-negative였다. production
  date와 승인 copy가 맞는 것을 확인하고, Task 2에서 article-scoped exact
  `getByText('2026.07.07', { exact: true })`로 assertion만 교체해 rerun했다. product copy는
  바꾸지 않았다.
- Final production E2E: owned `127.0.0.1:1116`에서 **60/60 PASS, 15.5s**. 임시
  production server, temporary Playwright config와 `.last-run.json`을 정리했고 1116에는
  listener가 남지 않았다. port 1104의 PID 57850과 `.next/dev` lock은 사용·중단·수정하지
  않았다.
- Whitespace/no-index diff checks: **PASS**. Commit, stage, push, merge, deploy는 수행하지
  않았다.

### 독립 검토와 상태 동기화

Task 1~3의 명세·품질 검토는 승인 문안, 설계, 구현 범위와 기존 계약을 각각 대조해
Jenkins 한 건의 replacement-only 범위와 공개 경계를 확정했다. 공개 문안을 강화하거나
Jenkins 확장을 실제 대안으로 만들지 않는 변경은 검토 결과에 없었다.

Task 4 독립 품질 검토에서는 Important 2건을 발견하고 해소했다. 첫째, 승인 문안이
permanent contract에서 부분 phrase가 아니라 excerpt/content의 exact equality로 고정돼야
했다. `content-quality.test.ts`의 승인 Markdown parser와 DTO 문자열 완전 일치 assertion으로
해결했다. 둘째, before/after data-flow가 네 viewport에서 보이고, 필요한 경우 `pre` 내부
가로 스크롤 이동·복원이 검증돼야 했다. 320/768/1024/1440px E2E 계약으로 해결했다.

Task 5 품질 검토에서는 production date/copy 자체가 아니라 `2026.7.7`을 기대한 date locator의
false-negative 1건을 확인했다. 위 article-scoped exact `2026.07.07` assertion으로 해소한 뒤
60/60 rerun을 통과했다. 최종 명세·품질 재검토 결과는 Critical 0 / Important 0 / Minor 0이다.

Root의 최종 `speckit-converge`는 처음에 F1 scope contradiction과 F2 stale visual fixture를
발견했다. Phase 9의 T053은 사용자 승인 The Siena 범위를 현재 **8 migrated / 10 preserved /
7:1**로 정합화했고, T054는 `codi-harness-dx-platform-design` visual row를 승인된
**provided / timeline**으로 맞췄다. 이 두 수정 뒤 rerun 결과는 **✅ Converged**다:
45 FR / 10 SC / 21 AC / 9 edge / 20 plan decisions / 5 constitution, finding 0건. T001~T054는
모두 checked이며 최종 `tasks.md` SHA-256은
`f3c047f870f45a83296c9c81c87c2030959aecd0e9550dae0268b63bade3b33f`다.

`mise run feature:status:sync`는 2026-08-27에 exit 1로 다음 실제 오류를 반환했다.
`mise ERROR no task //:feature:status:sync found` (available task 목록에는
`//:feature:status:sync`가 없음). 따라서 `--apply`나 대체 상태 전이를 만들지 않았고,
이 unavailable status-sync 실행으로 `status.yaml`을 바꾸지 않았다. 이후 root convergence가
T053/T054를 완료했으나, ROADMAP은 이 관찰 증거를 수동으로 반영할 뿐 자동 status transition을
주장하지 않는다.

## 2026-08-28 T055–T057 final-review convergence

- **T055 RED → GREEN:** `content-quality.test.ts`에 작업물과 Jenkins 심화 글이
  `fail-fast: false`를 설계 의도로만 설명하고, 의도적 실패 시험·운영 실패 완료 여부 대조가
  없으며 검증된 격리 성과로 확대하지 않는다는 양방향 계약을 추가했다. 기존 작업물의
  “3/5 성공이면 그 셋은 배포 완료” 주장은 제거했다.
- **T056:** project/study ↔ insight 왕복은 target 직접 `focus()` 대신 body의 알려진 시작
  상태에서 최대 80회의 실제 `Tab` 입력으로 target focus를 찾고, focus assertion 뒤 `Enter`로
  이동한다. source와 reverse 링크 모두 href·도착 URL을 확인한다.
- **T057:** `ai-dx-harness-starter-kit`의 Jenkins 읽기 링크를 승인 제목
  `GitHub Actions 전환보다 중요했던 배포 단위 재설계`와 기존 slug의 exact 조합으로 고쳤고,
  이전 제목이 남지 않는 permanent unit contract를 추가했다.

최종 실행 결과(앱 구현 변경 이후):

```bash
cd apps/front
pnpm exec vitest run src/data/portfolio/content-quality.test.ts \
  src/data/portfolio/insight-editorial-quality.test.ts \
  src/data/portfolio/feature-detail-quality.test.ts
pnpm test
pnpm exec tsc --noEmit
pnpm exec eslint src/data/portfolio/feature-details/codi-harness-dx-platform.ts \
  src/data/portfolio/studies.ts src/data/portfolio/content-quality.test.ts \
  e2e/portfolio-insight-contract.spec.ts
pnpm exec playwright test --list
pnpm run build
pnpm exec playwright test --config=playwright.prod.config.ts --reporter=line
```

- focused Vitest: **3 files / 155 tests PASS**.
- full Vitest: **5 files / 177 tests PASS**.
- TypeScript and scoped ESLint: **PASS**.
- Playwright discovery: **4 files / 60 tests listed**.
- fresh production build: **38/38 static pages PASS**.
- owned `127.0.0.1:1116` production E2E: **60/60 PASS, 18.4s**. 실제 `Tab` 탐색을
  포함한 8개 양방향 왕복과 4개 지원 폭을 모두 실행했다. 승인 스크린샷 2개를 복구한 뒤
  temporary config와 `.last-run.json`을 삭제하고 1116 listener를 종료했다. port 1104의
  기존 PID 57850은 유지했으며 generated HTML·status·stage·commit은 변경하지 않았다.
- 별도 읽기 전용 재검토: **Critical 0 / Important 0 / Minor 0**. 수정 후 재검토 대상은
  없었다.

## T053 The Siena scope reconciliation

이 reconciliation은 2026-08-26에 승인된 The Siena 로그 분리 후속을 되돌리지 않는다.
현재 적용 집합은 `logging-decoupling-and-buffering-in-external-api-systems`를
`the-siena-golf-reservation` source의 `project-case`로 포함한 **8 migrated / 10
preserved / 7:1**이다. `spec.md`의 FR-035·FR-036, SC-003~SC-006과 assumptions,
`plan.md`, D-004, data model fixture, incremental migration contract, quickstart 및
ROADMAP을 이 현재 계약으로 조정했다. Jenkins fixture row는 변경하지 않았고 T054도
수정하지 않았다.

초기 7 migrated / 11 preserved / 6:1은 첫 RED와 최초 production 실행의 실제 증거다.
그 수치를 현재 결과로 덮어쓰지 않고 verification opening inventory와 해당 실행 문단에
`initial 7/11 scope`로 남겼다. 현재 validator와 regression fixture는 Siena source,
8개 exact set, project-case 7개·technical-exploration 1개, legacy checksum 10개를
이미 강제하므로 source code나 test fixture는 수정하지 않았다.

### T053 non-live verification

2026-08-27, `apps/front`에서 실행했다.

```bash
pnpm exec vitest run src/data/portfolio/insight-editorial-quality.test.ts \
  src/data/portfolio/content-quality.test.ts \
  src/data/portfolio/feature-detail-quality.test.ts
pnpm test
```

- focused validator/fact-contract suite: **3 files / 153 tests PASS**.
- full Vitest: **5 files / 175 tests PASS**.
- Vite native config-loader future warning만 출력됐고 실패는 없었다.
- implementation source는 변경하지 않았다. 따라서 TypeScript 재실행은 필요하지
  않았으며, validator consistency는 위 focused suite와 current exact-set audit으로
  확인했다.
- 문서 대상 trailing whitespace audit: PASS. live E2E, generated HTML, status sync,
  stage, commit, push는 실행하지 않았다.
