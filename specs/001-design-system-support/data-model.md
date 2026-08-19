# Data Model: 프로젝트별 디자인 시스템 지원 구조

파일 기반 기능이므로 "데이터 모델"은 각 파일의 구조 스키마다.
경로·형식 규칙의 정본은 [contracts/design-system-contract.md](./contracts/design-system-contract.md).

## 1. 토큰 파일 (tokens.css)

```text
tokens.css
├── :root { ... }        # 라이트 모드 토큰 (필수)
├── .dark { ... }        # 다크 모드 토큰 (필수, :root와 같은 키 집합)
└── @theme inline { ... } # Tailwind v4 노출 매핑
```

- **필드**: shadcn 시맨틱 토큰 (background/foreground, primary/-foreground,
  secondary/-foreground, muted/-foreground, accent/-foreground,
  destructive/-foreground, border, input, ring, radius)
- **검증 규칙**: (a) `:root`와 `.dark`의 토큰 키 집합 동일(쌍 완결성),
  (b) 모든 전경/배경 쌍 WCAG AA 통과, (c) OKLCH 값 형식,
  (d) 토큰명 개명 금지
- **상태 전이**: 템플릿(중립 기본값) → 생성 모드(브랜드 값 치환) →
  수정 모드(부분 갱신, 매번 재검증)

## 2. 원칙 문서 (design-system.md)

```text
docs/design-system.md
├── 무드/방향          # 브랜드 질문 답 + 근거
├── 색상               # 주 색상 결정, 대비 검증 결과 기록
├── 타이포그래피       # 폰트 스택 (CJK 여부 반영)
├── 라운드/밀도        # radius, 간격 감각
├── 모션               # 공용 표준 상속 여부 + 프로젝트 예외
├── 컴포넌트 규약      # composition + cva, components/ui 관리 원칙
└── 결정 기록          # 변경 이력 (수정 모드가 추가), 게이트 무시 강행 시 명시
```

- **검증 규칙**: 토큰 파일과 어긋나는 값 서술 금지(수정 모드 동기화가
  보장), 원칙/근거만 담고 토큰 값 나열은 금지(정본은 tokens.css)

## 3. 템플릿 (스킬 resources/)

- **tokens-template.css**: 위 1의 구조 + 중립 OKLCH 기본값(shadcn 기본
  팔레트 계열). 치환 지점은 값뿐 — 구조/토큰명은 고정.
- **design-system-template.md**: 위 2의 섹션 골격 + 각 섹션 작성 안내
  주석. composition + cva 원칙은 기본 내장.

## 4. 검증 스크립트 입출력 (contrast-check.mjs)

- **입력**: tokens.css 경로 (argv)
- **처리**: OKLCH → sRGB 변환 → WCAG relative luminance → 쌍별 대비율
- **출력**: 쌍별 통과/실패 목록(JSON), 실패 시 exit 1
- **검증 쌍**: background↔foreground, primary↔primary-foreground 등
  모든 `X`↔`X-foreground` 쌍 × 라이트/다크
