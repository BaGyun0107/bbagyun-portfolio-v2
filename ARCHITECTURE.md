# 하네스 아키텍처

> **이 파일은 shared 하네스 파일입니다.** 다운스트림 프로젝트는 이 파일을 직접 수정하지 않습니다. copy 모드에서는 `./harness update`가 upstream 버전으로 덮어쓰고, lock 모드(`harness.lock` 존재)에서는 버전 캐시 materialize로 함께 갱신됩니다. 프로젝트별 아키텍처 결정은 해당 기능의 `specs/<NNN-feature>/` 문서에 기록합니다.

이 하네스는 thin harness, external tools, fat skills 구조를 따릅니다. 하네스 자체는 작게 유지하고, 실제 판단과 실행 규칙은 외부 Spec Kit/Superpowers, `.harness/skills`, `.harness/policies`, 커밋된 `specs/`에 둡니다.

## 핵심 모델

```text
사용자 요청
  -> 메인 오케스트레이터
      -> 필요한 phase와 외부 도구 선택
      -> specs/<NNN-feature> 상태 갱신
      -> 구현/검증/리뷰 실행
      -> 다음 phase 결정
```

메인 세션의 책임:

- 사용자의 목표와 제약을 정리합니다.
- 필요한 phase와 도구를 고릅니다.
- 여러 단계에 걸치는 상태는 `specs/<NNN-feature>/`에 남깁니다.
- 하위 실행의 결과 요약만 받아서 다음 phase로 넘깁니다.

## 도구별 책임

| 도구 | 책임 |
| --- | --- |
| Playwright MCP | 즉석 브라우저 QA(페이지 로드/스냅샷/폼 조작/스크린샷) — 사용자 레벨 등록, 버전 핀 |
| Spec Kit | 기능 spec, 구현 plan, tasks 분해, 검증 기록, 커밋된 `specs/<NNN-feature>/` + `.specify/` 런타임 상태 |
| Superpowers | TDD, systematic debugging, parallel agents, verification 습관 |
| Codi Skills | Node.js 24, npm/pnpm, Next.js, Express, NestJS, DB, CI/CD 세부 규칙 |

세 도구는 항상 동시에 실행하는 통합 스택이 아닙니다. 작업 크기와 phase 리스크에 따라 필요한 역할만 선택합니다.

## Phase Flow

```text
Phase 1 Strategy       ->  Superpowers brainstorming (창작/설계 변경 시)
Phase 2 Specify/Plan   ->  /speckit-specify -> /speckit-clarify -> /speckit-plan -> /speckit-tasks -> /speckit-analyze
Phase 3 Implementation ->  미완료 tasks.md 항목 구현 + Superpowers TDD/debugging
Phase 4 Validation     ->  /speckit-converge ("Converged"까지) + Playwright MCP 브라우저 QA(필요 시)
Phase 5 Completion     ->  converge green -> ROADMAP.md 갱신 -> PR 준비 (opt-in: /ship)
```

The phase model is a thinking flow, not a local spec-file convention.

## 컨텍스트 보존 규칙

- 중요한 결정은 `specs/<NNN-feature>/`에 기록합니다.
- acceptance 기준과 stage boundary는 spec.md/plan.md/tasks.md에 남깁니다.
- 실행 로그와 검증 결과는 phase handoff 요약에 남깁니다.
- 하위 세션은 phase 결과, 변경 파일, 실행한 명령, 남은 리스크만 반환합니다.
- 메인 세션은 다음 phase에 필요한 정보만 유지합니다.

## 배포 아키텍처 (패키징)

하네스 본체는 두 배포 모드로 소비됩니다. 판별 기준은 레포 루트의
`harness.lock` 존재 여부입니다.

- **lock 모드** (신규 기본): 공유 본체는 커밋되지 않고, `harness.lock`의
  채널 선언 → 머신 로컬 버전 캐시(`$HOME/.codi-harness/versions/`) 수신 →
  `.harness/current` 심링크 원자 교체(materialize)로 활성화됩니다. 새
  minor/patch는 세션 시작 시 수신만 하고 **다음** 세션 시작에 반영되므로
  진행 중인 세션은 불변입니다. major·고정·롤백은 항상 명시적입니다
  (`update --major`, `pin`).
- **copy 모드** (레거시): 공유 파일이 레포에 커밋되고 `./harness update`가
  소유권 계층(shared/project-owned)에 따라 파일 단위로 적용합니다.

사용자 표면은 역할로 나뉩니다 (specs/014 SC-002·감사 M-9):

- **팀원 표면은 `./harness bootstrap` 하나**입니다. bootstrap(과 그 하위
  pkg-sync)은 팀원 머신에서 **git 인덱스를 절대 바꾸지 않습니다** — 잔재는
  보고만 합니다.
- **소유자 전용 경로**는 `./harness prune-downstream --apply`(인덱스 변경
  허용)와 migrate 전환 커밋입니다. 정리 커밋은 소유자 플로우에서 1회
  수행됩니다.

정책 정본: `.harness/policies/update-policy.md`. 사용자 가이드:
`.harness/docs/packaging-guide.md`.

## 생성 페이지 파이프라인 (문서 허브·Planning Hub)

`mise run docs:build`는 사람 소유 원본(Markdown, 워크스페이스 planning
소스, specs)을 한 번 스캔해 두 생성 페이지 `docs/index.html`(문서 허브)과
`docs/planning.html`(Planning Hub — 여섯 제품 보기 + 운영·고급)을 원자적
page-set으로 함께 만듭니다. 구조 원칙:

- **소유권 분리**: 계획 원본(카탈로그·11그룹 상세·사이트맵)은 PM/PL이,
  구현 근거(FeatureWorkItem·Delivery Evidence)는 프로젝트가 소유하고, 둘은
  stable 기능 ID로만 연결됩니다. reconcile은 차이를 변경 제안으로 보여줄 뿐
  어느 원본도 자동 수정하지 않습니다.
- **자동화 2단**: Stop 훅 재생성은 fail-open(편의), 머지 전
  `planning:check`는 fail-closed(게이트)입니다. 계획 수신은
  `planning:pull` 명시 실행뿐입니다.

작성 입구는 스킬 2종(`codi-feature-definition-authoring`,
`codi-feature-definition-normalizer`), 운영은 `codi-feature-hub`가 맡습니다.
사용 가이드: `.harness/docs/feature-hub-guide.md`.

## 자동화 경계

자동화해도 되는 것:

- phase routing reminder
- Spec Kit/Superpowers 명령 안내
- 결과 요약 저장
- 테스트/빌드/doctor 실행

자동화 전에 확인해야 하는 것:

- 외부 서비스 생성
- GitHub 레포 생성과 push
- Infisical secret 등록
- 배포 workflow `push` 활성화
- 권한 상승 또는 파괴적 명령

## Team Mode

기본 구조는 여전히 단일 오케스트레이터 모델입니다.

```sh
./harness codex
./harness claude
```

세션 scrollback은 source of truth가 아닙니다. phase handoff와 검증 기록은 `.harness/policies/orchestration-loop.md`의 handoff contract를 따라 커밋된 `specs/<NNN-feature>/`, PR, verification 기록에 남깁니다. phase routing은 `codi-phase-routing`이 맡습니다.
