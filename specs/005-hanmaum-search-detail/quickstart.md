# Quickstart: 한마음과학원 구조화 상세 검증

**Date**: 2026-08-24

이 문서는 구현 결과가 명세를 만족하는지 확인하는 실행 가이드다.
구현 코드는 포함하지 않는다. 계약 세부는 [data-model.md](./data-model.md),
결정 근거는 [research.md](./research.md)를 참조한다.

## 사전 조건

- 작업 디렉터리: `apps/front`
- 패키지 매니저: `pnpm` (루트 설치 금지)
- 장기 실행 중인 개발 서버가 있으면 route 설정 변경을 반영하지 못한다.
  E2E는 반드시 새 서버로 검증한다.

## 검증 체인 (순서 고정)

```bash
# 1. 타입
pnpm exec tsc --noEmit

# 2. 단위·계약 테스트
pnpm vitest run

# 3. 변경 범위 lint (저장소 전역 lint는 기존 기준선 때문에 실패한다)
pnpm exec eslint <변경한 파일 경로들>

# 4. 프로덕션 빌드
pnpm run build

# 5. 신선한 서버 E2E
#    기존 dev 서버가 .next/dev 잠금을 점유하므로 프로덕션 산출물을
#    별도 포트로 띄워 검증한다.
pnpm exec playwright test --config=<임시 fresh config>

# 6. 공백 오류 확인
git diff --check
```

## 시나리오별 확인 항목

### SC-001 — 형식 통일

```bash
pnpm vitest run src/data/portfolio/feature-detail-quality.test.ts
```

기대: 구조화 상세 보유 목록이 `codi-harness-dx-platform`과
`hanmaum-science-institute` 두 개로 고정되고, 두 상세 모두 동일한 공통 제목
집합을 제공한다.

브라우저 확인:

```bash
pnpm exec next start -p <미사용 포트>
curl -s http://127.0.0.1:<포트>/projects/hanmaum-science-institute | \
  grep -o '<h2[^>]*>[^<]*</h2>'
```

기대: 하네스와 동일한 10개 제목이 승인된 순서로 나타난다.

### SC-002 — 근거 표기 100%

기대: 한마음 상세의 모든 지표가 근거 종류·기준 시점·근거 설명을 갖는다.
검색 응답 지표의 근거 설명에는 측정 대상이 브라우저 네트워크 응답임이
드러나야 한다.

### SC-003 — 사실 오류 0건

```bash
pnpm vitest run src/data/portfolio/content-quality.test.ts
```

기대: 공개 본문에 다음이 존재하지 않는다.

- 최소 토큰 길이를 버전이 강제했다는 서술
- 서버 업로드 처리를 기각했다는 대안 비교
- 외부 검색 엔진을 검토 후 기각했다는 서술

### SC-004 — 회귀 없음

```bash
pnpm exec playwright test --config=<fresh config>
```

기대: 전체 작업물 경로가 성공하고, 이전하지 않은 6개 작업물의 본문 snippet이
그대로 노출된다. 하네스의 지표·스윔레인·연결 인사이트 계약이 유지된다.

### SC-005 — 데모 요소 없음

기대: 한마음 상세에 데모 링크, 비활성 버튼, "준비 중" 문구가 0개다.

### SC-006 — 반응형

기대: 320 / 768 / 1024 / 1440px에서 문서 전체 가로 넘침이 없다.
스윔레인은 다이어그램 영역 내부에서만 가로 스크롤한다.

## 알려진 환경 특성

- 저장소 전역 `pnpm run lint`는 기존 Prettier·import-order 기준선 때문에
  실패한다. 관련 없는 파일을 일괄 포맷하지 않는다. 변경 범위만 검사한다.
- 장기 실행 개발 서버는 route 설정을 즉시 반영하지 않는다. 소스 결함과
  stale 프로세스를 구분한다.
- `mise run feature:status:sync`는 이 저장소에 존재하지 않는다.
  `ROADMAP.md`와 각 `tasks.md`를 수동 상태 정본으로 사용한다.

## 완료 판정

모든 항목이 아래를 만족해야 한다.

- 타입·단위·변경 범위 lint·빌드·신선한 E2E 전부 통과
- `tasks.md`의 모든 항목이 완료 표시
- `speckit-converge`가 Converged 보고
- 리뷰에 Critical·Important 잔여 없음
- 증거를 `verification.md`에 기록
