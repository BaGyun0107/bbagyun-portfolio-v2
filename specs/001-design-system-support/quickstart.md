# Quickstart: 검증 시나리오

구현이 끝났을 때 이 문서의 시나리오가 전부 통과해야 한다.
상세 구조는 [data-model.md](./data-model.md), 규칙은
[contracts/design-system-contract.md](./contracts/design-system-contract.md).

## 사전 조건

- 하네스 레포에서 구현 브랜치 체크아웃, `./harness skills-link` 실행됨
- PR #69(skills-link 외부 소유 디렉터리 fix)가 이 브랜치에 반영됨
- 임시 검증용 프로젝트: front 앱 스캐폴드(Tailwind v4 + shadcn)가 있는
  스크래치 디렉토리

## 시나리오 1: 단위 테스트 (TDD — 구현 전 작성)

```sh
npm test    # tests/design-system-contrast.test.mjs 포함 전체 그린
```

- 대비 계산: 알려진 색 쌍의 대비율이 기대값과 일치 (흰/검 = 21:1 등)
- OKLCH 변환: 대표 OKLCH 값의 sRGB 변환 정확성
- 게이트 판정: 4.5:1 미만 쌍 → 실패 목록 + exit 1
- 쌍 완결성: `.dark`에 키 누락 시 검출

## 시나리오 2: 생성 모드 e2e (수동, 임시 프로젝트)

1. 임시 프로젝트에서 `codi-design-system` 스킬 호출
2. 브랜드 질문(6개 이하)에 답변 — 일부러 저대비 색 하나 포함
3. 기대 결과:
   - 저대비 색에서 게이트가 실패 사유 + 조정안 제시, 재조정 후 통과
   - `apps/front/src/styles/tokens.css` 생성 (쌍 완결, AA 전부 통과)
   - `docs/design-system.md` 생성 (결정 + 근거 기록)
   - globals.css import 연결 확인 또는 안내 출력

## 시나리오 3: 수정 모드 동기화 (수동)

1. 시나리오 2 상태에서 스킬 재호출 → 수정 모드 진입 확인
2. 주 색상 변경
3. 기대 결과: tokens.css 갱신 + design-system.md 색상 절과 결정 기록
   동시 갱신, 재검증 통과 (불일치 0건 = SC-004)

## 시나리오 4: 에이전트 준수 (수동)

1. 시나리오 2 프로젝트에서 프론트엔드 작업 요청 (예: 버튼 있는 카드)
2. 기대 결과: 에이전트가 tokens.css + design-system.md를 먼저 읽고,
   산출물에 하드코딩 색상 0건, 시맨틱 토큰 클래스만 사용 (SC-003)

## 시나리오 5: 회귀 (하네스 레포)

```sh
npm test               # 기존 스위트 그린 유지
./harness doctor       # 실패 0
./harness skills-link  # 신규 스킬 머지 트리 반영, speckit-* 공존 유지
```

- backend-only 프로파일 프로젝트에서 스킬 호출 → 안내 후 중단(파일 생성
  0건) 확인
