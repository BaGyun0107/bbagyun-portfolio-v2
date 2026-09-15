# Quickstart: 블랙스톤 벨포레 리조트 구조화 상세 검증

**Date**: 2026-08-24

구현 결과가 명세를 만족하는지 확인하는 실행 가이드다. 상세 값과 스윔레인
제약은 [data-model.md](./data-model.md), 결정 근거는
[research.md](./research.md)를 참조한다.

## 사전 조건

- 작업 디렉터리: `apps/front`
- 패키지 매니저: `pnpm` (저장소 루트 설치 금지)
- Node.js: 앱·저장소가 선언한 24 유지
- 포트 1104의 기존 dev 서버와 `.next/dev` 잠금을 재사용하지 않는다.
- E2E용 임시 Playwright 설정은 별도 프로덕션 포트를 사용하고 실행 후 삭제한다.

## 검증 체인 (순서 고정)

```bash
# 1. 타입
pnpm exec tsc --noEmit

# 2. 단위·콘텐츠·데이터 계약
pnpm vitest run

# 3. 변경 범위 lint
# 저장소 전역 lint는 기존 기준선 때문에 실패하므로 관련 없는 파일을 포맷하지 않는다.
pnpm exec eslint <변경한 파일 경로들>

# 4. 프로덕션 빌드
pnpm run build

# 5. 신선한 프로덕션 서버 E2E
pnpm exec playwright test --config=<임시 fresh config>

# 6. 공백 오류
git diff --check
```

구현 완료 시 임시 Playwright 설정 파일이 남아 있지 않은지도 확인한다.

## 시나리오별 확인 항목

### SC-001 — 구조화 형식 통일

```bash
pnpm vitest run src/data/portfolio/feature-detail-quality.test.ts
```

기대:

- 구조화 상세 목록이 하네스, 한마음, 블랙스톤 3개로 정확히 고정된다.
- 블랙스톤 legacy `content`가 제거된다.
- 세 상세가 공통 10개 제목 순서를 제공한다.

### SC-002 — 지표 근거와 금지 수치

```bash
pnpm vitest run src/data/portfolio/content-quality.test.ts
```

기대:

- 지표 ID가 정확히 두 개다.
- 모든 지표에 `kind`, `asOf`, `evidence`가 있다.
- 컴플레인 지표는 고객 접수 기준·시스템 집계 아님·실제 불일치 하한을 밝힌다.
- 운영 관찰 기간은 `2024년 오픈 ~ 현재 진행 중`이며 회고 범위임을 밝힌다.
- PMS 약 20초와 장애 약 1시간 카드는 없다.
- 총 결제 건수·누적 결제 건수·비율·퍼센트 주장이 없다.

### SC-003 — 사실 오류 6종과 연결 인사이트 정정

```bash
pnpm vitest run src/data/portfolio/content-quality.test.ts
```

기대:

- 역할 주도 표현은 유지된다.
- 신규 구축이 명시되고 무중단 전환 성과는 없다.
- 12초 임의 설정, 당시 API 문제로 발생한 약 20초 지연, 장애 대응의 60초 선택,
  이후 API 수정과 timeout 교훈이 실제 순서로 존재한다.
- 2PC·이벤트 소싱 대안표와 환경변수 난독화 대안표가 없다.
- PHP에서 ORM 트랜잭션을 그대로 쓰기 어려웠던 배경과 API Key 오해 발견이 존재한다.
- WebView 원인은 전달받은 내용으로 한정하고 브릿지 구현은 유지한다.
- 연결 인사이트는 프로젝트 중간 발견을 밝히고 운영 중 핫픽스·무중단을 주장하지 않는다.

### SC-004 — 결제·보상취소 흐름

```bash
pnpm vitest run src/data/portfolio/feature-detail-quality.test.ts
```

기대:

- 스윔레인이 정확히 1개이고 `validateFeatureDetail`을 통과한다.
- lane 4, step 9, edge 8, exception 3의 정확한 구조다.
- 정상 경로가 start에서 end까지 이어진다.
- 응답 미도달, 외부 PMS 장애, 12초 timeout 오판 분기가 각각 설명된다.
- 공개 상세·스윔레인·회고에 `resvId`·`tid`·결제 fallback 주장이 없다.

### SC-005 — 전체 경로와 legacy 본문 회귀 보호

```bash
pnpm exec playwright test --config=<임시 fresh config>
```

기대:

- 구조화 3개와 legacy 5개를 합친 8개 경로가 모두 성공한다.
- 아직 이전하지 않은 5개 작업물의 본문 snippet이 유지된다.
- 하네스와 한마음의 기존 지표·스윔레인·연결 인사이트 계약이 유지된다.

### SC-006 — 데모 요소 없음

기대: 블랙스톤 상세에 데모 링크, 비활성 버튼, "준비 중" 문구가 0개다.

### SC-007 — 반응형과 접근성

기대:

- 320/768/1024/1440px에서 문서 전체 가로 넘침이 없다.
- 결제 스윔레인은 자체 region 안에서만 가로 이동하고 키보드로 접근할 수 있다.
- 정상·예외 경로는 색상 외 선 스타일과 텍스트 label로도 구분된다.
- 스윔레인의 전체 흐름 텍스트와 예외 설명을 읽을 수 있다.

## 빌드·서버 환경 주의

- 프로덕션 빌드 결과 static page가 38개인지 확인한다.
- 기존 `playwright.config.ts`의 `reuseExistingServer`로 포트 1104 서버를 재사용하지 않는다.
- 임시 fresh config의 `webServer`는 `pnpm exec next start -p <별도 포트>`를 사용한다.
- 검증 뒤 서버 프로세스를 종료하고 임시 config를 삭제한다.

## 완료 판정

- 타입·단위·변경 범위 lint·build·fresh E2E·공백 검사가 모두 통과한다.
- `tasks.md`의 모든 항목이 완료 표시다.
- `speckit-converge`가 `Converged`를 보고한다.
- 리뷰에 Critical·Important 잔여가 없다.
- 명령, 핵심 출력, TDD RED/GREEN, 리뷰, 잔여 위험을 `verification.md`에 기록한다.
- 이 저장소에는 `mise run feature:status:sync`가 없으므로 `ROADMAP.md`와
  `tasks.md`를 수동 상태 정본으로 갱신한다.
