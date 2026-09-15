# Quickstart: 전체 스윔레인 Archify 임베드 전환 검증

## 사전 조건

- 저장소 루트에서 실행한다.
- `apps/front` 의존성이 설치되어 있어야 한다. Next.js 프로젝트 규칙에 따라 설치·실행은 `apps/front`에서 한다.
- Archify skill은 `/Users/codiworks_dev/.agents/skills/archify`에 존재해야 한다.
- 사용자가 관리하는 1104 dev server는 종료하지 않는다. 브라우저 최종 검증은 별도 production 포트(예: 12114)를 사용한다.

## 1. Source 생성과 구조 검증

각 신규 source에 대해 다음을 실행한다.

```bash
node /Users/codiworks_dev/.agents/skills/archify/bin/archify.mjs validate workflow \
  apps/front/diagrams/<feature>/<swimlane>.json --quality showcase --json
```

검증 receipt에서 9개 artifact check, composition error 0, warning 0을 확인한다. 진단이 있으면 해당 source만 수정하고 다시 검증한다.

## 2. HTML delivery와 freeze

```bash
node /Users/codiworks_dev/.agents/skills/archify/bin/archify.mjs deliver workflow \
  apps/front/diagrams/<feature>/<swimlane>.json \
  apps/front/public/diagrams/<feature>/<swimlane>.html \
  --quality showcase --json
```

delivery 성공 후 source·HTML의 SHA-256과 byte count를 `verification.md`에 기록한다. 같은 파일에 대해 추가 편집이나 재생성을 하지 않는다.

## 3. 동결 HTML의 브라우저 evidence

```bash
node /Users/codiworks_dev/.agents/skills/archify/bin/archify.mjs visual-check \
  apps/front/public/diagrams/<feature>/<swimlane>.html --json
```

1440×900, 1600×1000, 1920×1080을 확인하고, 큰 화면을 대상으로 한 구성은 2048×1320도 확인한다. 이 검사는 동결된 HTML을 수정하지 않는다. 결과 screenshot은 자동 측정과 사람의 이미지 검토를 구분해 기록한다.

## 4. 앱 정적 검사와 단위·통합 검사

```bash
pnpm --dir apps/front exec vitest run \
  src/components/projects/archify-swimlane-embed.test.tsx \
  src/components/projects/project-detail-rendering.test.tsx \
  src/components/projects/project-swimlane-layout.test.ts \
  src/data/portfolio/feature-detail-quality.test.ts
pnpm --dir apps/front exec tsc --noEmit
pnpm --dir apps/front exec eslint \
  src/components/projects/ArchifySwimlaneEmbed.tsx \
  src/components/projects/ProjectSwimlane.tsx \
  src/components/projects/archify-swimlane-embed.test.tsx \
  src/components/projects/project-detail-rendering.test.tsx \
  src/components/projects/project-swimlane-layout.test.ts \
  src/data/portfolio/feature-detail-quality.test.ts
pnpm --dir apps/front build
```

변경하지 않은 파일의 baseline lint 오류는 결과에 섞지 않는다.

## 5. 실제 브라우저 검증

production build를 별도 포트에서 실행한 뒤 Playwright로 다음을 각 8개 대상에 반복한다.

1. 320px, 768px, 1024px, 1440px에서 페이지·카드·Dialog의 document scrollWidth가 viewport width를 넘지 않는지 확인한다.
2. preview가 MAP 밀도로 표시되고 세부 설명·관계 label·Viewer chrome이 보이지 않는지 확인한다.
3. `크게 보기`를 mouse·touch·keyboard로 열고 READ 밀도·공통 범례·transcript·Escape·trigger focus 복귀를 확인한다.
4. 밝은/어두운 theme 전환이 iframe reload 없이 반영되고, 일반 실선·예외 점선과 라벨 색이 일치하는지 확인한다.
5. 잘못된 URL, 필수 DOM 부재, load error, 준비 timeout에서 빈 영역 없이 React fallback으로 전환되는지 확인한다.
6. 비대상 또는 legacy 작업물의 공개 문구·renderer·동작이 바뀌지 않았는지 확인한다.

1104 포트를 사용하는 dev server를 건드리지 않으며, production 실행을 위해 만든 임시 설정은 검증 종료 후 삭제한다.

## 6. Parity와 수동 검토 기록

각 대상에 대해 다음을 `verification.md`에 기록한다.

- source JSON과 generated HTML 경로·SHA-256·byte count
- canonical lane→presentation band 매핑과 node/edge stable ID·방향·kind·outcome·label parity
- Archify validate/deliver/visual-check receipt
- Vitest, typecheck, targeted lint, build와 실제 브라우저 결과
- 지원 viewport screenshot의 자동 측정 결과와 사람의 이미지 검토 결과
- 남은 위험, fallback 재현 조건, 승인되지 않은 후속 범위
