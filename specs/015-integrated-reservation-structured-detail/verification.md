# Verification: 행사 호텔 예약·결제 통합 플랫폼 구조화 상세

**Feature**: `015-integrated-reservation-structured-detail`
**Date**: 2026-09-15
**Size**: Large

## 실행 기준선

- 작업 브랜치: `chore/cleanup-downstream-harness`
- 공유 worktree는 Feature 001~015와 harness 관련 사용자 변경이 함께 있는 dirty 상태다. Feature 015에 명시된 파일만 수정하며 관련 없는 변경을 stage, commit, format, reset하지 않는다.
- 별도 진행 중인 Feature 013의 미완료 항목 `T045`, `T047`, `T048`은 Feature 015 범위 밖이며 상태와 파일을 보존한다.
- `apps/back`은 이 기능의 변경 대상이 아니다.
- 사용자 소유 개발 서버는 PID 46911로 TCP 1104를 listen 중이다. 종료·재시작하거나 `.next/dev` 잠금을 제거하지 않는다.
- 최종 E2E는 production build를 별도 포트 12117에서 실행하고, 임시 Playwright 설정과 직접 시작한 process만 정리한다.

## 공개 경로 기준선

2026-09-15에 사용자 소유 1104 서버에 read-only HTTP 요청으로 확인했다.

| 경로 | 기준선 응답 | 현재 구분 |
| --- | ---: | --- |
| `/projects/integrated-reservation-platform` | 200 | legacy 작업물 본문 |
| `/insights/nestjs-middleware-vs-guard-tradeoff` | 200 | canonical 후보, 기존 제목·본문 |
| `/insights/nextjs-nestjs-domain-separation-and-bff` | 200 | BFF canonical 후보 |
| `/insights/enterprise-bff-architecture-and-cors` | 200 | 중복 BFF canonical 글 |
| `/insights/https-and-plaintext-password-transmission` | 200 | canonical 후보, 기존 본문 |

모든 경로의 문서 title 기준선은 `BbaGyun's Portfolio`다. 대상 작업물은 `features.ts`에 legacy `content`가 있고 `feature-details/index.ts`에는 구조화 detail 등록이 없다. 네 인사이트는 모두 `insights.ts`의 독립 canonical 항목이며 alias 계층과 인사이트 확대 Dialog가 없다.

## 사실·공개 경계 체크리스트

| 항목 | 분류 | 근거 | 구현 판정 기준 |
| --- | --- | --- | --- |
| 기간 `2025.12 – 2026.03` | 사용자 승인 사실 | 승인 인터뷰 | 카드와 본문에서 동일하게 사용 |
| 1인 백엔드 및 PM·PL, FE 3명 조율 | 사용자 보고값 | 승인 인터뷰 | 일시적 FE 백엔드 기여 1건을 공동 담당으로 확대하지 않음 |
| 고객사 스테이징 UAT | 사용자 보고값 | 승인 인터뷰 | 운영 검증이나 전체 기능 완성으로 확대하지 않음 |
| PG 테스트 환경 | 사용자 보고값 | 승인 인터뷰 | 실제 운영 결제로 표현하지 않음 |
| 고객사 측 사업 여건으로 보류 | 사용자 보고값 | 승인 인터뷰 | 구체적 자금 사정은 비공개, `On Hold`를 화면에 표시 |
| Core Product 관계 | 코드 확인값 | 원본 `dev`의 Prisma schema | 객실·관광·주문·재고의 확인된 관계만 공개 |
| `version + updateMany` 충돌 감지 | 코드 확인값 | 원본 `dev` 예약 service | 갱신 건수 0을 충돌로 처리한 구현까지만 공개 |
| 정상·충돌 분기 단위 테스트 경험 | 사용자 보고값 | 승인 인터뷰 | 현재 `dev`의 성공 분기 test를 충돌 test 증거로 확대하지 않음 |
| 단계형 PG 처리와 최종 확정 실패 시 취소 시도 | 코드 확인값 | 원본 `dev` 예약 service/spec | 단일 DB 트랜잭션 또는 완성된 보상 흐름으로 쓰지 않음 |
| PG 승인 실패 뒤 재고 즉시 복구 | 미완성 | 승인 인터뷰와 원본 코드 | `CANCELLED`·`ABORTED` 기록과 복구 미완성을 함께 공개 |
| 브라우저 직접 API 호출의 쿠키 실패 | 사용자 직접 관찰 | 승인 인터뷰 | `A-domain.com`, `api.A-domain.com`으로 익명화 |
| Next.js `/bff` rewrite와 cookie/CSRF 전달 | 코드 확인값 | 원본 `dev`의 Next config와 Axios client | reverse proxy 경계로 제한, 완성형 BFF로 부르지 않음 |
| Cloudflare 고정 IP 허용 대응 | 사용자 보고값 | 승인 인터뷰 | 스테이징 복구 범위로 제한, 실제 IP 비공개 |
| Middleware·권한 Guard 책임 분리 | 코드 확인값 | 원본 `dev`의 auth middleware와 level guard | 당시 구현과 현재 Global Auth Guard 회고를 분리 |
| 비밀번호 전송용 클라이언트 암호화 구현·제거 | 사용자 보고값 | 승인 인터뷰 | 현재 git history에서 확인됐다고 쓰지 않음 |
| HTTPS payload와 bcrypt 저장 | 코드 확인값 | 원본 `dev` auth service | 예약·이메일용 AES까지 모두 제거했다고 쓰지 않음 |

## 금지 주장

- 고객사의 구체적 자금 사정, 실제 회사 도메인·서버 IP, 인증값, 시크릿, 고객 거래 데이터와 비공개 소스
- 확인되지 않은 JOIN 단계 수치·성능 개선률·운영 건수·장애율·전환율
- 실제 DB 병렬 통합 테스트, 불일치 0건, 초과 예약 완전 방지와 운영 정합성
- 예약·결제·재고의 단일 원자적 트랜잭션, 고아 재고 0건 또는 완성된 보상 흐름
- 응답 가공·프론트 전용 권한·검증된 성능을 갖춘 완성형 BFF, 전 환경 정상화 또는 운영 장애 해결
- Middleware의 절대적 우위나 인증 누락 완전 제거
- 모든 클라이언트 암호화 또는 AES 제거

## 체크리스트 게이트

| Checklist | Total | Checked | Unchecked | Status |
| --- | ---: | ---: | ---: | --- |
| `requirements.md` | 16 | 16 | 0 | PASS |

## 실행 기록

- T001: branch, dirty worktree, Feature 013 잔여 상태와 Feature 015 변경 경계를 위에 기록했다.
- T002: 1104 listener를 보존하면서 작업물 1개와 인사이트 4개 경로의 기준선을 위에 기록했다.
- T003: 승인 인터뷰·원본 `dev` 코드 근거·공개 콘텐츠 계약을 대조한 분류 및 금지 주장 체크리스트를 위에 기록했다.
- T004~T010: 상태·구조화 detail·상태 badge·UAT topology·workflow/architecture target·canonical/alias·인사이트 Dialog 계약을 7개 Vitest 파일에 RED로 추가했다.
- T011: `pnpm --dir apps/front exec vitest run src/data/portfolio/content-quality.test.ts src/data/portfolio/feature-detail-quality.test.ts src/components/projects/project-detail-rendering.test.tsx src/components/projects/project-swimlane-layout.test.ts src/components/projects/archify-swimlane-embed.test.tsx src/data/portfolio/insight-editorial-quality.test.ts src/components/insights/insight-visual-rendering.test.tsx`를 fresh 실행했다. 결과는 377개 중 기존 337개 통과, Feature 015 미구현에 대응하는 40개 RED 실패였다.
- RED review: 5개 보정 라운드 뒤 spec compliance PASS, quality PASS, Critical/Important open 0건. 308 redirect, 기본 Dialog primitive 결속, 관계도 공통 embed·fallback, exact UAT topology, 17개 canonical과 editorial 분류, 금지 주장 occurrence matcher를 검토했다.
- 콘텐츠 승인: 사용자가 2026-09-15에 전체 작업물 공개 초안과 제시된 `overview`, `alternatives` 교체 문구를 명시적으로 승인했다. 구현 승인과 분리된 최종 콘텐츠 승인으로 기록한다.
- T012~T018: `On Hold` 타입·공통 상태 배지, slug별 보류 사유, 승인 메타와 근거 카드 4개, 구조화 detail, legacy 제거와 registry 등록을 구현했다. 공통 배지는 프로젝트별 사유를 추론하지 않는다.
- T018 fresh GREEN: 콘텐츠 11개, detail/validator/카드 3개, 실제 페이지·상태 회귀 6개로 총 20/20 통과했다. Vite native config loader 예정 변경 경고는 기존 환경 경고이며 테스트 실패는 없었다.
- US1 review: fix round 1 뒤 spec PASS, quality PASS WITH MINOR, Critical/Important 0건. 남은 Minor는 같은 상세 화면에서 `description`과 `overview` 첫 문장이 중복되는 점이며 최종 전체 리뷰에서 재판정한다.
- T019~T025: workflow/relationship exact 의미 계약, validator 음성 사례, typed architecture target, 공통 `ArchifyEmbed` lifecycle, 관계도 preview/Dialog·fallback transcript, 조건부 섹션 렌더링과 통합 예약 UAT/관계 데이터를 구현했다.
- US2 foundation TDD: 첫 GREEN 뒤 리뷰에서 component/controller lifecycle 결속 증거 1건이 남았고, production `ArchifyEmbed`를 hook-compatible probe로 직접 실행해 preview observer, dialog 준비, timeout, iframe load/error, theme 재적용과 cleanup을 같은 controller에 결속했다.
- US2 foundation review: fix round 2 뒤 spec PASS, quality PASS, 기존 findings 5/5 해소, 신규 finding 0건, Critical/Important/Minor 0건이다.
- T019~T025 fresh GREEN: `feature-detail-quality`, `archify-swimlane-embed`, `project-detail-rendering`, `project-swimlane-layout` 4개 파일의 250개 중 US2 관련 249개가 통과했고, 남은 1개 실패는 다음 단계 T033~T042가 소유하는 canonical insight 4→3+alias RED다.
- T026~T027: workflow schema v2·common schema·`release-delivery.workflow.json` 예제를 읽은 직후 첫 candidate를 작성했다. 첫 candidate 뒤 update checker는 `silent/current`였으며 설치본은 변경하지 않았다. 겹침 진단은 실패 노드 배치를 빈 열로 옮기고, 한글 label 폭 진단은 해당 node 폭만 늘려 해결했다.
- T028 workflow delivery: specification SHA-256 `0f49cc805d28b95b8433f749a53a20a1a661d1cf2c769e0cda2994c47b66c762`, 4,707 bytes; artifact SHA-256 `03e9ba5d7b1d16063b2230e171df12bbfc77cb39195486daf490c5fff90a4012`, 713,717 bytes. 최종 showcase validation은 9/9, composition errors 0, warnings 0이다.
- T029~T030: architecture schema·common schema·`web-app.architecture.json` 예제를 읽은 직후 Core Product candidate를 작성했다. endpoint 방향과 두 label clearance 진단만 수정한 뒤 deliver했으며 specification SHA-256은 `6b3a5c7647f37e79b26a51083d7d475cfb9b2f8e8b15b5441d1ad09c1bfaa496`(2,703 bytes), artifact SHA-256은 `42537321f26937f5ed4cba5883c5df5fc682493e544286a6d704cf0c1a47de94`(707,394 bytes)다. 최종 showcase validation은 9/9, errors 0, warnings 0이다.
- T031: delivered SVG viewBox `966×786`과 `1040×650`을 공통 embed 비율 `966/786`, `1040/650`으로 연결했다. workflow의 5 lane·9 node·8 edge와 architecture의 6 entity·6 relation ID, 방향, label, cardinality 및 SVG `data-*` 속성을 fallback과 대조하는 계약을 추가했다. controller fresh focused Vitest는 161/161 통과했다.
- T032 architecture: `visual-check`는 1440×900·1600×1000·1920×1080·2048×1320 light와 1440×900·2048×1320 dark에서 모두 containment/readability/viewer chrome을 통과했다. 실제 light/dark 이미지를 `view_image`로 확인해 node/label/route 겹침과 잘림이 없으므로 `browser_evidence: passed`, `visual_review: passed`, `correction_rounds: 0`으로 판정했다.
- T032 workflow: deterministic delivery와 readability는 통과했지만 standalone `visual-check`는 5개 lane 전체를 가로폭에 맞춰 확대하면서 1440×900에서 `scrollHeight 1227`, 1600×1000·1920×1080에서 `1355`, 2048×1320에서 `1373`이 되어 세로 containment에 실패했다. 실제 이미지는 선·라벨·노드 겹침이 없지만 1440 화면에서 하단 lane이 첫 화면 밖이므로 `browser_evidence: failed`, `visual_review: failed`, `correction_rounds: 2`다. lane 의미를 축소하지 않고 첫 보정으로 2,493px에서 1,227px까지 줄였으며, 폭 확장안은 6px 가독성 하한을 깨 즉시 기각하고 최종 source·HTML을 마지막 9/9 상태로 복원했다. 포트폴리오의 presentation preview/Dialog containment는 T043~T052 production E2E에서 별도 판정한다.
- Archify 작성 문구는 한국어이며 지원 locale이 아니므로 `meta.locale`을 생략했다. standalone Viewer 고정 UI와 `<html lang>`은 English fallback이고, 포트폴리오 embed는 공통 presentation 처리로 Viewer header·dock·Legend를 숨긴다.
- US2 artifact review: spec `CHANGES REQUESTED`, quality `PASS`, Critical 0건, Important 1건, Minor 0건이다. 유일한 Important는 workflow standalone containment 실패이며 T032를 다시 열었다. 다음 단계는 정확한 5개 lane 공개 계약을 바꾸거나, standalone overflow를 비공개 known limitation으로 수용하고 포트폴리오 preview/Dialog production E2E를 사용자 노출 acceptance gate로 삼는 사용자 결정이다.
- T032 사용자 결정(2026-09-15): 정확한 5개 lane 의미 계약을 유지하고 workflow standalone 세로 overflow를 비공개 known limitation으로 수용했다. 실패한 standalone `visual-check` 결과는 그대로 보존하며 통과로 바꾸지 않는다. 사용자에게 실제 노출되는 포트폴리오 preview/Dialog의 320·768·1024·1440px containment를 T043~T052 production E2E의 최종 acceptance gate로 확정했으므로 T032를 완료 처리한다.
- US3 콘텐츠 승인(2026-09-15): 사용자가 `insight-copy-draft.md`에 제시된 세 글의 공개 문구, Middleware·Guard 및 BFF before/after visual, HTTPS `not-needed`, legacy BFF alias의 canonical 308 redirect를 함께 승인했다.
- T033~T041: 승인 본문 hash를 고정한 canonical 세 글, canonical 17·migrated 16·project-case 15·legacy 1 inventory, 중복 BFF 제거와 alias registry, 308 permanent internal redirect, 두 before/after Dialog, HTTPS `not-needed`와 작업물 양방향 exact set을 구현했다.
- T042 RED/GREEN: 승인 fixture 보정 뒤 의도한 37 failures를 확인했다. 구현 후 `pnpm --dir apps/front exec tsc --noEmit`은 통과했고, `pnpm --dir apps/front exec vitest run src/data/portfolio/content-quality.test.ts src/data/portfolio/insight-editorial-quality.test.ts src/components/insights/insight-visual-rendering.test.tsx`는 186/186 통과했다.
- US3 review round 1: 승인 본문 hash·inventory·alias·Dialog·사실 경계는 통과했지만 공통 renderer가 상태관리 글 전용 actor 캡션을 인증·BFF visual에도 노출한 Important 1건과 controller 검증 기록 누락 Important 1건으로 spec/quality `CHANGES REQUESTED`였다.
- US3 fix round 1: 새 두 visual에 상태관리 캡션이 없다는 렌더링 RED를 먼저 재현하고 optional `showActorRoleLabels` 계약으로 두 visual에서만 숨겼다. 기존 visual은 default true를 유지한다. controller fresh 검증은 typecheck 통과, focused Vitest 187/187, full Vitest 442/442, scoped ESLint 통과다.
- US3 review round 2: spec `PASS`, quality `PASS`, Critical/Important/Minor 0건이다. 승인 원고 세 hash, canonical/alias 집합, 정확히 세 관련 글, 두 provided visual, HTTPS no-visual과 기존 상태관리 visual 보존을 확인했다.
- T043~T046: Feature 015 전용 critical-flow E2E, 기존 인사이트 양방향 연결, 하이패스 no-visual 회귀, 8개 구조화 작업물과 열 개 Archify workflow target 계약을 현재 공개 구조로 갱신했다.
- T047 E2E RED 1: page-level `permanentRedirect`는 단위 계약에서 308을 던졌지만 static production server는 alias HTML을 200으로 응답했다. `next.config.ts`에 같은 내부 경로의 permanent redirect를 추가해 실제 `curl`과 Playwright request 모두 `308 Permanent Redirect`, 정확한 relative `location`을 확인했다. page-level alias 해석과 static param은 기존 방어 계약으로 유지한다.
- T047 E2E RED 2: 첫 테스트가 vertical-scroll Dialog의 전체 `scrollHeight`를 viewport 높이로 제한해 실패했다. visual iframe 자체의 x/y containment와 document horizontal overflow는 엄격히 유지하고, Dialog는 viewport bounding box·horizontal containment·명시적 내부 `overflow-y: auto|scroll`을 확인하도록 실제 UX 계약에 맞췄다. 320px 관계 preview는 카드가 아니라 lazy embed 자체를 scroll해 load하도록 보정했다.
- T048: controller 순서 검증에서 `pnpm --dir apps/front exec tsc --noEmit` 통과, focused Vitest 187/187 통과, full Vitest 442/442 통과다. Vite native config loader 예정 변경 경고만 있었고 실패는 없었다.
- T049: Feature 015에서 실제 수정한 TS/TSX/E2E와 최소 인접 회귀 파일의 scoped ESLint가 통과했다. `pnpm --dir apps/front run build`는 두 차례 모두 성공해 38개 static page를 생성했다. workspace root의 기존 복수 lockfile 추론 경고는 baseline이며 root lockfile을 수정하지 않았다. 저장소 전역 lint는 기존 baseline 정책에 따라 실행하거나 관련 없는 파일을 포맷하지 않았다.
- T050: `apply_patch`로 임시 `apps/front/playwright.feature-015.prod.config.ts`를 만들고 사전 확인한 빈 12117에서 production server를 시작했다. 첫 `pnpm start -- -p` 호출은 argument 전달 형태가 맞지 않아 즉시 종료됐고, `pnpm --dir apps/front exec next start -p 12117`로 정상 시작했다. 사용자 소유 1104 listener와 `.next/dev` lock은 중지·삭제하지 않았다.
- T051 automated: Feature 015 전용 production E2E 최종 재실행 5/5, 공통 인사이트 계약 27/27, 하이패스 및 8개 구조화 경로 15/15, 열 개 Archify preview와 통합 예약 target 5/5가 통과했다. 320·768·1024·1440에서 workflow·relationship·두 before/after의 preview/Dialog, HTTPS no-visual, document horizontal overflow, actor/connection clipping, iframe containment, Escape와 trigger focus 복귀를 확인했다.
- T051 adjacent baseline: 첫 광역 회귀 실행은 Feature 013 전환 뒤에도 React SVG를 찾는 `codi-harness-portfolio-detail`의 stale assertion 6건과 같은 유형의 하이패스 stale assertion 4건을 드러냈다. Feature 015가 실제로 만진 legacy/target 회귀는 현재 Archify·구조화 계약으로 최소 갱신했고 위 clean focused run으로 통과했다. Feature 013의 T045/T047/T048 및 standalone containment 상태는 변경하지 않았다.
- T051 visual review: `/tmp/feature015-visuals.shjuJh`에 320·1440 작업물 workflow, 1440 관계도, 320·1440 Middleware/BFF preview와 Dialog를 캡처해 `view_image`로 확인했다. node/edge/label 겹침, visual 내부 잘림, 문서 가로 넘침은 없었다. 작은 화면은 패널을 세로로, 큰 화면은 좌우로 배치하고 Dialog는 viewport 안에서 내부 세로 스크롤을 제공했다. locator 상단 정렬 캡처에서 sticky site header가 카드 제목 일부를 덮는 현상은 캡처 위치 영향이며 visual 내부 판정과 구분했다.
- T052: 직접 시작한 12117 production process만 종료했고 임시 Playwright config를 `apply_patch`로 삭제했다. `lsof`에서 12117 listener 없음, 1104의 사용자 소유 Node listener 유지와 `temp-config-removed`를 확인했다.
- T053 editorial audit: 근거 카드 4/4가 값·근거 종류·기준 시점·설명·필요한 관찰 한계를 제공한다. 승인 인터뷰와 세 계약을 최종 대조한 결과 금지 성과 주장, 실제 민감 정보, 해결되지 않은 장문 중복과 시각 질문 중복은 각각 0건이다. 검색에 잡힌 `완성형 BFF`, `운영 장애`, `실제 운영 결제` 등의 표현은 모두 명시적 부정·한계 문장 또는 Reject 매트릭스에만 존재한다.
- T054 scope audit: `git diff --check`는 통과했다. `apps/back` 변경은 없고, 기존 workflow 9개와 신규 통합 예약 workflow 1개가 typed target과 실제 artifact에 함께 보존되며 신규 관계도는 별도 architecture target이다. 다른 작업물·인사이트의 승인 본문은 유지했고, stale E2E assertion은 현재 공개 Archify/구조화 상태에 맞춘 최소 회귀 기대값만 수정했다. Feature 013의 T045/T047/T048 체크박스와 standalone failure 기록은 그대로 미완료다.
- T055: `mise run e2e:changed`는 `no changed app with an e2e suite, skipping (no evidence stamped)`로 종료됐다. 이 명령은 staged diff만 읽지만 공유 worktree의 사용자 변경을 stage하지 않는 정책 때문에 stage 우회를 하지 않았다. 대체 증거는 별도 12117 production server에서 수행한 Feature 015 5/5, common insight 27/27, adjacent structured/Archify 15/15·5/5 clean run이다.
- T056 `$speckit-converge`: 58개 FR, 12개 SC, 18개 acceptance scenario, 15개 edge case, plan의 구조·검증 결정과 constitution 5개 원칙을 현재 코드·테스트·artifact·브라우저 증거에 대조했다. missing 0, partial 0, contradicts 0, unrequested 0; Critical/High/Medium/Low 0건이다. 새 convergence task를 append하지 않았으며 판정은 `✅ Converged — the implementation satisfies the spec, plan, and tasks.`다.
- T057: `mise run feature:status:sync`는 `no task //:feature:status:sync found`로 실행 불가했다. `--apply` 가능한 결정적 전이가 없으므로 자동 상태 전이를 주장하지 않고, `ROADMAP.md`에 Feature 015의 검증·수렴 결과와 현재 8개 작업물 구조화 이전 완료 상태를 수동 반영했다.
- 최종 독립 리뷰 round 1 정정: 위 T049·T051·T056 기록 뒤 다섯 E2E 파일을 한 번에 확장 실행한 결과 89개 중 81개만 통과했다. 7건은 Archify 전환 뒤에도 React SVG를 찾던 `codi-harness-portfolio-detail`의 오래된 기대값이었고, 1건은 통합 예약 workflow iframe 실패 시 252px 초기 fallback label 배치 예외가 페이지 전체의 client application error로 전파된 직접 회귀였다. 따라서 위의 adjacent clean 및 `Converged` 판정은 이 보정과 fresh 재검증 전까지 최종 증거로 사용하지 않는다.
- fallback RED/GREEN: 브라우저 `pageerror`에서 `inventory-version-conflict-stop` label의 252px 배치 실패를 확인했다. 실제 초기 폭 252px과 기존 320px을 함께 검사하는 회귀 fixture를 추가하고, 승인된 lane·node·edge 의미를 바꾸지 않은 채 해당 예외 label에 명시 좌표를 지정했다. focused layout Vitest 55/55와 열 개 workflow Dialog의 iframe error·timeout fallback E2E 1/1이 통과했고, fallback은 preview instance를 유지한 채 표시된다.
- 인접 E2E 보정: 하네스·Blackstone 검증이 React fallback SVG가 아니라 현재 공개 Archify iframe의 `data-node-id`, `data-edge-id`, 정상 `a-default`, 예외 `a-security`, 숨김 내부 Legend와 외부 선 의미 Legend를 검사하도록 갱신했다. 1104 listener를 재사용한 focused 실행은 첫 보정에서 21/22였고, iframe 내부에서 이미 검사한 Blackstone label의 중복 outer-document assertion을 제거했다. 최종 production 통과 수치는 아래 fresh gate에 별도로 기록한다.
- 콘텐츠·visual 정본 보정: `insight-copy-draft.md`의 27개 공개 검증 셀을 route/list/양방향 링크/실제 접근 가능한 이름/keyboard/responsive/장문·시각 중복 기준으로 `supported` 또는 의도적 `N/A`로 닫았다. `project-visual-contract.md`에는 Core Product standalone 무-overflow와 사용자 승인 UAT workflow standalone 세로 overflow known limitation을 분리하고, workflow의 실제 공개 acceptance surface를 320·768·1024·1440 preview/Dialog로 명시했다.
- 최종 fresh controller gate: `pnpm --dir apps/front exec tsc --noEmit` 통과, Feature 015 구현·테스트·다섯 E2E 파일 scoped ESLint 통과, 전체 Vitest 8파일 443/443 통과, production build 통과와 static page 38개 생성을 확인했다. build의 workspace 다중 lockfile 추론 경고는 기존 baseline이며 관련 lockfile을 수정하지 않았다.
- 최종 fresh production E2E: 첫 확장 재실행은 Blackstone Archify의 같은 `data-edge-label`이 path와 설명 group에 존재해 strict locator 1건만 실패하고 88/89가 통과했다. path를 `.first()`로 특정한 단일 RED/GREEN 1/1 뒤 다섯 계획 파일 전체를 다시 실행해 89/89가 통과했다. 이 실행에는 Feature 015 작업물·인사이트, 15개 양방향 인사이트 연결, 기존 구조화 상세, 열 개 Archify preview/Dialog의 네 viewport, iframe error·timeout fallback 전 target이 포함된다.
- 최종 환경 정리: 직접 시작한 12117 production process만 종료하고 임시 `playwright.feature-015.prod.config.ts`를 `apply_patch`로 삭제했다. 12117 listener 없음, 사용자 소유 1104 PID 11082 listener 유지, 임시 설정 없음 상태를 확인했다.
- T056 `$speckit-converge` 보정 재실행: 58개 FR, 12개 SC, 18개 acceptance scenario, 15개 edge case, plan 결정과 constitution 5개 원칙을 최신 코드·테스트·계약·공개 검증 매트릭스·production 증거에 다시 대조했다. 252px fallback 회귀는 테스트와 E2E로 닫혔고, standalone known limitation은 계약에 반영됐으며, 공개 매트릭스의 `missing` 셀은 0건이다. missing 0, partial 0, contradicts 0, unrequested 0; Critical/High/Medium/Low 0건으로 `✅ Converged — the implementation satisfies the spec, plan, and tasks.`다. 이 판정이 위의 보정 전 T056 판정을 대체한다.
- T057 상태 동기화 재확인: `mise run feature:status:sync`는 다시 `no task //:feature:status:sync found`로 종료됐다. 자동 상태 전이는 주장하지 않으며 ROADMAP의 Feature 015 검증 수치를 전체 Vitest 443/443과 production five-file E2E 89/89로 수동 정합화했다.
- 최종 독립 review: Spec PASS, Quality PASS, Critical/Important/Minor `0/0/0`이다. 이전 252px fallback, 공개 매트릭스, standalone 계약, stale Archify assertion, test title findings 5건이 모두 해소됐고 missing/partial/contradicts/unrequested는 각각 0건이다. Feature 013의 T045/T047/T048는 그대로 unchecked 상태다.
- T058: 전체 T001~T058 checked, 최종 `tasks.md` SHA-256은 `fd6437a8e1991777cad09fb27039b215911b4473a0c1ad8dff428e3c2279aa8a`다. `.harness/state/current-size`를 `Large`에서 `Small`로 되돌렸으며, 최종 임시 설정 없음·12117 listener 없음·사용자 소유 1104 PID 11082 listener 유지 상태다.
