# Portfolio Content Contract

## Public project detail

Route: `/projects/codi-harness-dx-platform`

- 공통 `h2` 읽기 순서 10개를 유지한다.
- 제목 아래 설명은 사내 개발 운영 플랫폼이라는 가치를 먼저 말한다.
- `핵심 설계와 구현` 아래에 다음 `h3`가 순서대로 정확히 존재한다.
  1. `./harness와 doctor`
  2. `harness.lock과 소유권 경계`
  3. `공통 정책과 런타임 어댑터`
  4. `변경 범위 기반 배포와 Infisical 경계`
  5. `더 깊이 읽기`
- 대표 설계 본문은 문제 → 선택한 구조 → 검증 근거 또는 trade-off를 연결한다.
- `GSD → Spec Kit`, `GStack → Playwright MCP` 전환 이유를 공통 정책과 런타임 어댑터 구간에 둔다.
- 내부 대표 링크는 `/insights/codi-harness-dx-platform-design` 하나이며 같은 탭에서 열린다.
- 제거 대상 네 insight 링크는 0개다.
- 두 swimlane, 여섯 highlight와 demo CTA 0개를 유지한다.

## Canonical insight

Route: `/insights/codi-harness-dx-platform-design`

- 제목은 `DX 하네스 v2: 복사형 도구에서 사내 개발 운영 플랫폼까지`다.
- 읽기 시간은 `9 min`이다.
- `data-model.md`의 8개 본문 구간이 정확한 순서로 보인다.
- 현재 운영 구조와 실제 결과를 설명한 뒤 멀티 세션을 약 2주의 `운영 확장 실험`으로 구분한다.
- Jenkins·Infisical·Cloudflare의 더 깊은 내용은 별도 기존 글에 남긴다.
- `legacyContent` 또는 다른 대체 장문은 존재하지 않는다.

## Removed routes

아래 경로는 redirect 없이 HTTP 404를 반환한다.

- `/insights/harness-lock-and-project-ownership-boundary`
- `/insights/harness-cli-and-doctor-productization`
- `/insights/claude-codex-policy-parity-and-regression-testing`
- `/insights/multi-session-testbed-and-context-lifecycle`

## Preserved public behavior

- 독립 인프라 insight 3개는 기존 경로에서 성공 응답한다.
- 8개 작업물 경로는 모두 성공 응답한다.
- 하네스 외 7개 작업물의 기존 본문 snippet이 유지된다.
- 외부 AWS 가격 근거 링크는 `target="_blank"`, `rel="noopener noreferrer"`와 새 창 접근성 이름을 유지한다.
- 320px·768px·1024px·1440px에서 문서 overflow는 1px 이하다.
- 320px에서 두 diagram region은 각각 한 번의 tab stop으로 focus되며 ArrowRight로 내부 가로 이동한다.

## Evidence language

- 배포 시간: 실행 화면 기준 측정 결과
- 환경변수 혼입 재발 없음: 전환 후 현재까지의 관찰 범위
- Jenkins 비용: 2026-08-20 AWS 서울 리전 t3.large 2대의 공개 가격 기반 월 `$151.84` 컴퓨팅 산정; 스토리지·네트워크·세금 제외
- 멀티 세션: 약 2주의 제한된 운영 확장 실험
- 위 범위를 넘어선 성공률·미래 무결점·공개 데모를 주장하지 않는다.
