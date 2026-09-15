# Codex 인계 — 블랙스톤 벨포레 구조화 상세 이전

- 작성일: 2026-08-24
- 현재 브랜치: `chore/cleanup-downstream-harness`
- 다음 작업: `blackstone-belleforet-resort`를 구조화 상세로 이전 (feature 006)
- 인터뷰: **완료**. `docs/portfolio-interviews/2026-08-24-blackstone-belleforet-resort.md`

## 2026-08-25 후속 정정

이 인계 문서로 feature 006을 구현한 뒤 사용자가 사실 범위를 다시 확인했다.
아래 내용은 이 문서의 기존 highlights·timeout·fallback 지침보다 우선한다.

- PMS 약 20초·장애 약 1시간 카드는 제거하고, 운영 관찰 기간은
  `2024년 오픈 ~ 현재 진행 중`으로 바꾼다.
- 약 20초는 정상 평균 속도가 아니라 당시 API 문제로 지연된 값이다. 현재는
  해당 API가 수정되어 과거처럼 오래 걸리지 않으며, timeout 설계 교훈으로만 쓴다.
- 결제 `resvId`·`tid`·fallback은 Q&A에서 직접 확인되지 않았으므로 공개
  상세·스윔레인·회고에서 제거한다.
- WebView 제약 문단의 일반 공개 제한 문장은 제거한다.

## 지금 상태

미완료 `specs/*/tasks.md` 항목은 **0건**이다. feature 005까지 모두 완료했다.

| Feature | 내용 | 상태 |
| --- | --- | --- |
| 002 | 하네스 구조화 상세 도입 | 완료 |
| 003 | 연결형 스윔레인 재설계 | 완료 |
| 004 | 하네스 콘텐츠 통합 | 완료 |
| 005 | 한마음 구조화 상세 이전 | 완료 |
| **006** | **블랙스톤 이전** | **명세부터 시작** |

구조화 상세를 가진 작업물은 2개(`codi-harness-dx-platform`,
`hanmaum-science-institute`)이고 나머지 6개는 legacy 본문을 유지한다.

## 다음에 할 일

인터뷰가 끝났으므로 `speckit-specify`부터 시작한다. **clarify는 건너뛴다** —
사실이 인터뷰로 확정되었고 미해결 모호성이 없다.

절차는 feature 005와 동일하다.

1. `speckit-specify` → 명세 작성
2. 사용자에게 clarify 생략 사유를 보고하고 **멈춘다**
3. 사용자가 명시적으로 루프 시작을 지시하면 `codi-auto-loop` 실행
4. plan → tasks → analyze → **tasks.md 검토 게이트에서 멈춤**
5. 승인 후 구현 → 검증 → 리뷰 → converge

Size는 **Large**로 선언한다. 신규 registry 항목, 스윔레인, legacy 본문 제거,
회귀 계약 재고정이 여러 파일에 걸친다.

## 인터뷰로 확정된 사실

전문은 인터뷰 파일에 있다. 핵심만 옮긴다.

### 유지 (사실과 일치하므로 낮추지 않는다)

- **모든 설계를 혼자 했다.** "1인 백엔드로서 아키텍처 설계, 전반 주도"는
  실제와 일치한다.
- 서브도메인 분리 대안은 실제로 검토하고 CORS·쿠키 공유·SEO 문제로 기각했다.
- 결제 장애 3건의 발생 순서와 대응 내용.
- WebView 토큰을 브릿지로 전달한 구현.

### 정정 6건 (현재 본문이 사실과 다르다)

| # | 현재 본문 | 실제 |
| --- | --- | --- |
| 1 | "결제-예약 불일치 10건 미만" | **고객 컴플레인 접수** 기준이다. 시스템 집계가 아니며 실제 불일치의 하한이다 |
| 2 | "운영 중 서비스 무중단 전환" (2절·3절·대안표·결과 4곳) | **신규 구축이다.** 무중단은 달성한 성과가 아니라 해당 없는 조건이다 |
| 3 | "PMS 평균 응답이 약 20초인데 timeout을 12초로 두어" | 12초는 **임의로 정한 값**이다. 장애 후 PMS 업체가 20초를 공유했고, 업체가 60초를 요청했다 |
| 4 | 결제 대안표 (2PC·이벤트 소싱 기각) | 검토 근거 없음. **제거한다.** 실제 고민은 "Node.js에서 쓰던 ORM 트랜잭션을 PHP에서는 쓸 수 없다"였다 |
| 5 | API Key 대안표 (환경변수 난독화 기각) | 검토 근거 없음. **제거한다.** 실제는 React 환경변수가 빌드 산출물에 포함되는 것을 **몰랐다가 중간에 발견**해 프록시로 대응한 것이다 |
| 6 | WebView 세션 유실 원인 단정 | **앱 개발자에게 전달받은 내용**이며 직접 확인하지 않았다. 단정하지 않는다 |

정정 3·4·5는 현재 서술이 실수를 가려 오히려 밋밋해진 경우다. 실제 이야기가
더 강하므로 감추지 말고 그대로 쓴다.

### 보강 3건

- **관찰 기간**: 2024년 오픈 이후 **2026-08 현재까지** 유지보수 중이며 동일
  유형 문제가 없다. 본문의 "오픈 후 현재까지"를 구체적 기간으로 바꾼다.
- **60초 판단** (현재 본문에 없음, 반드시 넣을 것): PMS 업체 요청은 60초였고
  사용자 경험 측면에서는 30초가 낫다고 판단했으나, 결제에서 발생하는 문제는
  불만이 더 크게 번질 수 있어 안전한 60초를 택했다. **요청을 그대로 수용한
  것이 아니라 트레이드오프를 인지하고 고른 기록이다.**
- **결제 규모**: 평일 10건 이상, 주말 30건 이상. 다만 사용자가 정확하지
  않다고 밝혔고 총 결제 건수는 확인 불가다.

### highlights 후보

| 지표 | 값 | kind | 근거 |
| --- | --- | --- | --- |
| 컴플레인 접수 불일치 | 10건 미만 | `reported` | 시스템 집계 아님. 실제 불일치의 하한 |
| 운영 관찰 기간 | 2024년 오픈 ~ 2026-08 | `reported` | 유지보수 지속, 동일 유형 문제 미발생 |
| 외부 PMS 평균 응답 | 약 20초 | `reported` | PMS 업체가 공유한 값. 직접 측정 아님 |
| PMS 장애 지속 | 약 1시간 | `measured` | 로그에서 최초 발생~종료 시각 직접 확인 |

**금지**: 총 결제 건수를 분모로 쓰지 않는다. 비율(%) 주장 금지. 누적 결제
건수를 계산해 공개하지 않는다 (출발값이 부정확하다고 사용자가 밝혔고 리조트는
성수기 편차가 크다).

### 스윔레인

**1개**로 사용자가 확정했다 — 결제·보상취소 흐름.

라우팅·인증 흐름은 Nginx 경로 분기와 JWT 검증으로 단계가 단순해 그림으로
얻는 것이 적다. 결제는 실패 경로가 여러 갈래(응답 미도달, 외부 장애 중
보상취소 실패, timeout 오판)라 그림이 분명하게 전달한다.

## 반드시 지킬 규칙

### 1. 근거 없는 값을 만들지 않는다

인터뷰로 복원되지 않은 수치는 **생략한다.** 추정치를 만들지 않는다.
지표는 `kind`·`asOf`·`evidence`를 반드시 갖고, 불확실하면 `caveat`를 붙인다.

### 2. 회귀 계약을 원자적으로 재고정한다

블랙스톤이 구조화되면 다음이 함께 바뀐다. **assertion을 삭제하지 말고**
새 상태의 정확한 목록으로 다시 고정한다.

- `apps/front/src/data/portfolio/feature-detail-quality.test.ts`
  - `LEGACY_FEATURE_CONTENT_FIXTURES`에서 블랙스톤 제거 (6개 → 5개)
  - 구조화 목록 테스트를 3개로 갱신
- `apps/front/e2e/codi-harness-portfolio-detail.spec.ts`
  - `legacyBodyBySlug`에서 블랙스톤 제거
  - `structuredSlugs`에 블랙스톤 추가 (**중요**: feature 005 리뷰에서 이
    배열이 갱신되지 않아 8개 경로 검증이 7개만 돌던 문제가 있었다)

### 3. 연결 인사이트도 함께 확인한다

블랙스톤은 `spa-api-key-exposure-and-bff-architecture`를 링크한다.
**feature 005에서 이 문제로 Critical이 나왔다** — 상세에서 정정한 사실을
링크된 인사이트가 반대로 주장하고 있었다.

작업 전에 이 인사이트를 읽고, 위 정정 6건과 충돌하는 서술이 있는지 확인한다.
특히 API Key 관련 서술(정정 5)과 "운영 중 서비스"(정정 2) 전제를 본다.
충돌이 있으면 명세 범위에 처음부터 포함한다.

### 4. TDD

테스트를 먼저 쓰고 RED를 확인한 뒤 구현한다. feature 005에서 이 순서 덕분에
본문 결함 4건을 잡았다. assertion은 단어 단위가 아니라 **문장 단위**로
고정한다 (단어 단위는 우연히 통과할 수 있다).

### 5. 검증 체인 순서

```
pnpm exec tsc --noEmit
pnpm vitest run
pnpm exec eslint <변경 파일만>     # 전역 lint는 기존 baseline 때문에 실패한다
pnpm run build                      # static page 38개 유지 확인
<fresh 서버 E2E>                    # 아래 참고
git diff --check
```

작업 디렉터리는 `apps/front`다. 루트에서 install 하지 않는다.

## 환경 특성 (반드시 알고 시작할 것)

- **전역 lint는 실패한다.** 저장소 전반의 기존 Prettier·import-order
  기준선 때문이며 이번 작업과 무관하다. **관련 없는 파일을 일괄 포맷하지
  않는다.** 변경한 파일만 검사한다.
- **장기 실행 dev 서버가 포트 1104를 점유**하고 `.next/dev` 잠금을 쥐고 있어
  두 번째 dev 서버가 뜨지 않는다. E2E는 프로덕션 빌드를 별도 포트로 띄워
  검증한다. 임시 Playwright 설정을 만들어 쓰고 **실행 후 삭제**한다.
  `playwright.config.ts`의 `reuseExistingServer`가 stale 서버를 재사용하므로
  그대로 쓰면 안 된다.
- **`mise run feature:status:sync`는 이 저장소에 없다.** `ROADMAP.md`와 각
  `tasks.md`를 수동 상태 정본으로 사용한다.
- **작업 트리에 미커밋 변경이 다수 있다.** feature 002~005 구현이 포함되어
  있으므로 `git reset --hard`, broad restore, checkout 덮어쓰기를 하면 안 된다.
- **구현 중에는 commit·stage하지 않는다.**

## 남은 작업물

블랙스톤 이후 4개가 남는다. 각각 인터뷰를 먼저 완료한 뒤 이전한다.

1. 통합 SSO 서버
2. 하이패스 B2B 플랫폼
3. 호텔 예약 시스템 플랫폼화
4. 통합 예약 플랫폼

## 참고 파일

| 목적 | 경로 |
| --- | --- |
| 이번 인터뷰 전문 | `docs/portfolio-interviews/2026-08-24-blackstone-belleforet-resort.md` |
| 직전 완료 사례 | `specs/005-hanmaum-search-detail/` (spec·plan·research·data-model·tasks·verification) |
| 상세 계약 타입 | `apps/front/src/data/portfolio/types/feature-detail.dto.ts` |
| 상세 검증기 | `apps/front/src/data/portfolio/feature-details/index.ts` |
| 참고할 상세 예시 | `apps/front/src/data/portfolio/feature-details/hanmaum-science-institute.ts` |
| 프로젝트 헌법 | `.specify/memory/constitution.md` |
| 전체 진행 상황 | `ROADMAP.md` |

## 스윔레인 검증 규칙 (구현 시 반드시 만족)

`validateFeatureDetail`이 강제하는 조건이다.

- `start` node와 `end` node는 각각 **정확히 하나**
- `start`에서 normal edge만 따라 `end`에 도달 가능해야 함
- normal edge: `outcome: 'continue'`, 항상 **더 큰 row**로 진행,
  `stop` node를 대상으로 할 수 없음
- exception edge: `outcome`이 `recover` 또는 `stop`, **조건 label 필수**
- decision에서 나가는 모든 edge: **결과 label 필수**
- `outcome: 'stop'`인 edge는 대상이 `stop` shape여야 함
- lane / step / edge / exception ID는 각 스윔레인 내에서 유일
- 같은 lane 안에서 row 중복 불가
- `kind: 'estimated'`인 지표는 `caveat` 필수
