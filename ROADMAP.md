# ROADMAP

| Feature | Status | Spec |
| --- | --- | --- |
| Project design system support | done | [specs/001-design-system-support](specs/001-design-system-support/) |
| Feature hub and status flow | done | [specs/002-feature-hub](specs/002-feature-hub/) |
| 기능정의서 탭 데이터 소스 전환 | done | [specs/003-feature-definition-source](specs/003-feature-definition-source/) |
| 원클릭 온보딩 부트스트랩 (A+B 로드맵 Phase 1) | in-review | [specs/004-onboarding-bootstrap](specs/004-onboarding-bootstrap/) |
| 하네스 패키지화 — 버전 캐시·lock (Phase 2) | done | [specs/005-harness-packaging](specs/005-harness-packaging/) |
| 다운스트림 migrate + 구 동기화 은퇴 (Phase 3) | done | [specs/006-harness-migrate](specs/006-harness-migrate/) |
| 기능정의서 사이트맵 보드 + 사이트맵 선행 플로우 | done | [specs/007-sitemap-board](specs/007-sitemap-board/) |
| 연결형 기능 허브 v2 | done | [specs/008-linked-feature-hub](specs/008-linked-feature-hub/) |
| 하네스 정보구조·기능 추적성·사용자 흐름 정본화 | done | [specs/009-harness-information-architecture](specs/009-harness-information-architecture/) |
| Planning Hub 데모·동기화·기능 허브 재설계 | done | [specs/010-planning-hub-redesign](specs/010-planning-hub-redesign/) |
| 정의-후행(definition-later) 경량 경로 | done | [specs/011-definition-later-path](specs/011-definition-later-path/) |
| 하네스 카탈로그 전환 + legacy 잔재 제거 | done | [specs/012-harness-catalog-migration](specs/012-harness-catalog-migration/) |
| speckit 이름 통일 + 엔트리포인트 단일화 | done | [specs/013-unify-naming-entrypoints](specs/013-unify-naming-entrypoints/) |
| 패키징 단일화 — bootstrap 단일 표면 + copy 은퇴 예고 | in-review | [specs/014-packaging-unification](specs/014-packaging-unification/) |
| 다운스트림 잔재 정리 완결 | done | [specs/015-downstream-residue-cleanup](specs/015-downstream-residue-cleanup/) |
| 감사 발견 일괄 수정 (1차) | done | [specs/016-audit-remediation](specs/016-audit-remediation/) |
| 감사 후속 웨이브 (2차) — 결정 집행·체인 단일화·테스트 견고화 | done | [specs/017-audit-wave2](specs/017-audit-wave2/) |
| 게이트 도구 전면 제거·Playwright MCP 브라우저 QA 대체 | done | [specs/018-gstack-to-playwright-mcp](specs/018-gstack-to-playwright-mcp/) |
| 최초 프로젝트 설정 단순화 — 스킬 대화 경로·스켈레톤 시작점 | done | [specs/019-first-setup-simplification](specs/019-first-setup-simplification/) |
| 프로젝트 소유 규칙 경로(rules-local) + stale 삭제 제한 | in-review | [specs/020-rules-local-protection](specs/020-rules-local-protection/) |
| 그누보드5 PHP 쇼핑몰 지원 — codi-gnuboard 스킬 + php-monolith 프로필 | in-review | [specs/021-gnuboard-php-support](specs/021-gnuboard-php-support/) |

## 예정 작업

- 2026-08-03 이후: 스킬 사용 재측정 실행 — 계획서
  [docs/audits/2026-08-skill-usage-recheck-plan.md](docs/audits/2026-08-skill-usage-recheck-plan.md)
  (Superpowers 는 제거 대상에서 제외, 측정 도구: `docs/audits/tools/skill-usage.mjs`)
- v2.0.0: `reclaim-shared.sh` 보고 전용 wrapper 제거 (v1.3.0 은퇴 예고분)

완료: specs/015·016 `done` 전이 (2026-08-03, v1.3.2 발행 확인 후 — 감사 M-19)

## 개선 백로그 — 기능정의 흐름 분석 (2026-07-17)

상세: [docs/audits/2026-07-17-feature-definition-flow-analysis.md](docs/audits/2026-07-17-feature-definition-flow-analysis.md)

1. 실프로젝트 배선 수정 — 완료(2026-07-17): Planning 경로를 카탈로그 존재로 판정
2. 정의-후행(definition-later) 경량 경로 — [specs/011-definition-later-path](specs/011-definition-later-path/) 구현(2026-07-17): stub 명령, 미등록 버킷, featureId 역방향 링크, specs 투영
3. work item 기록의 워크플로 통합 — Stop 훅 `[workitem-reminder]` 비차단 안내 구현(2026-07-17)
4. 사이트맵 규칙 정비 — 완료(2026-07-17): 규칙 통일 + actor↔surface 힌트 + surface 단위 확인 + 걸침 분할 규칙 + 열린 결정 노출

### 2차 백로그 — 잔여·한계 승격 (2026-07-17, 실행 순서순)

5. 단일 저장소 publish 단축 — 완료(2026-07-17): planning:publish 태스크 + 문서화 (잔여 2)
6. actor 어휘 설정화 — 완료(2026-07-17): workspace actorClasses 병합 확장 (잔여 4)
7. work item 기록 명령 — 완료(2026-07-17): feature:workitem 신설 (잔여 3)
8. 비강제 정책 결정 기록 — 완료(2026-07-17): quality-gates.md 명문화 (잔여 5)
9. 하네스 카탈로그 전환 + legacy 잔재 제거 — 완료(2026-07-18): [specs/012-harness-catalog-migration](specs/012-harness-catalog-migration/) (잔여 6+1)

### 3차 백로그 — 추적성 누락 작업함 분석 (2026-07-18)

10. coverage·레지스트리 typed 관계 통합 — 완료(2026-07-18): 오탐 14건+표현 갭 24건 해소, self-match 가짜 해소 차단
11. 데모 관계 정합 — 완료(2026-07-18): needs.json 레지스트리 소스로 자동 해소
12. 사용자 흐름 step 최신화 — 완료(2026-07-18): 010/011/012 반영, 001은 정직한 잔존 갭
