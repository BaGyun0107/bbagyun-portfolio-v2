# Verification: 백엔드 중심 포트폴리오 비교 화면

## 실행 결과

| 검증 | 결과 | 근거 |
| --- | --- | --- |
| 데이터 계약 테스트 | 통과 | `pnpm --dir apps/front test --run` — 4 tests passed |
| TypeScript 타입체크 | 통과 | `pnpm --dir apps/front exec tsc --noEmit` |
| 변경 범위 ESLint | 통과 | preview 라우트·컴포넌트·데이터·테스트 대상 lint |
| Production build | 통과 | `pnpm --dir apps/front build` — 47 pages generated |
| Preview E2E | 통과 | `mise run //apps/front:e2e` — 4 tests passed |
| 8개 상세 라우트 | 통과 | E2E에서 기존 8개 slug 순회 확인 |
| 모바일 다이어그램 | 통과 | 320px에서 `.preview-diagram-scroll` 내부 horizontal scroll 확인 |
| 기존 라우트 보존 | 통과 | `/` 응답 확인 및 기존 public route 파일 미교체 |

## E2E로 확인한 사용자 흐름

- `/preview`에서 대표 작업물과 전체 8개 작업물 링크 노출
- `/preview/projects/the-siena-golf-reservation`에서 문제 상황, 아키텍처 흐름, ERD 노출
- preview에서 다크모드 전환 후 `/` 이동 시 기존 화면에 dark class가 남지 않음
- 8개 `/preview/projects/[slug]` 상세 URL 접근
- 320px에서 넓은 스윔레인 다이어그램이 페이지 전체가 아닌 artifact 영역 안에서 스크롤됨
- 768px, 1024px, 1440px에서 `/preview`의 대표 작업물 장면과 문서 폭이 유지되고 문서 전체 가로 overflow가 발생하지 않음
- 실제 브라우저 스크린샷(`/tmp/bbagyun-apple-preview.png`)으로 Apple 스타일 히어로·대표 작업물·기록 영역의 시각 결과 확인

## 남은 검증 이슈

- 전체 `pnpm --dir apps/front lint`는 기존 저장소 파일에 누적된 Prettier/import-order 오류가 약 2,400건 있어 통과하지 못합니다. 새 preview 변경 범위는 별도 lint에서 통과했습니다.
- 개발 서버는 기존 multiple lockfile workspace root 경고를 출력합니다. 기능 동작에는 영향을 주지 않지만, 이후 `apps/front`의 Next workspace root를 명시하는 정리가 필요합니다.
- Playwright viewport 검증과 실제 브라우저 스크린샷 검수를 완료했습니다. 기본 `/` 승격 여부는 콘텐츠 보강 이후 별도 결정으로 남깁니다.

## Apple 스타일 시각 개편 검증 (2026-08-19)

- `/preview`에 Apple 스타일 방향을 적용했습니다: `#f5f5f7` 히어로, 검은 대표 작업물 장면, 단일 Apple Blue 액센트, 큰 타이포그래피, 넓은 여백, pill CTA.
- 대표 작업물은 시스템 흐름 미리보기와 상세 증거 링크를 함께 제공하고, 전체 8개 작업물은 동일한 데이터 기반 목록으로 유지했습니다.
- 상세 페이지는 흰색 editorial reading surface, sticky 목차, 문제 해결 서술, 아키텍처·시퀀스·ERD 증거를 유지합니다.
- 기존 `/`, `/projects`, `/projects/[slug]` 라우트는 변경하지 않고 `/preview` 비교 라우트로만 새 스타일을 제공합니다.
- 전체 lint는 기존 저장소 오류가 누적되어 통과하지 않지만, 이번 변경 범위 targeted ESLint는 통과했습니다.

## Promotion decision

이번 기능에서는 기존 `/`, `/projects`, `/projects/[slug]`를 유지하고 새 경험을 `/preview` 아래에 둡니다. 사용자와 화면을 대조한 뒤, 콘텐츠 보강 및 시각 QA를 완료하면 기본 라우트 승격 여부를 별도 결정합니다.

## 콘텐츠 중심 전환 검증 (2026-08-19)

- Apple 전용 `data-design-system` 활성화와 Apple 스타일 레이어를 제거했습니다. 공개 라우트의 디자인과 레이아웃은 변경하지 않았습니다.
- 이후 사용자 결정에 따라 `/preview` 라우트·전용 컴포넌트·스타일·Playwright 설정/테스트·evidence DTO/데이터를 전부 삭제했습니다.
- 공부 상세 콘텐츠에 `공부 후 적용 기준`을 추가해 학습 배경·검증 결과·실무 적용 기준까지 이어지는 본문으로 보강했습니다.
- 작업물·공부·인사이트 공개 상세 라우트에서 제목, 장문 본문, 내부 콘텐츠 링크가 노출되는 회귀 검증을 추가했습니다.
- 콘텐츠 품질 테스트 3개, 전체 Vitest 7개, TypeScript, 변경 범위 ESLint, Production build 47개 페이지 생성이 통과했습니다.
