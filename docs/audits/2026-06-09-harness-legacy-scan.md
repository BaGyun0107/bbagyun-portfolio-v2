# 하네스 다이어트 감사 보고서 (codi-harness-v2)

> 생성일: 2026-06-09
> 워크플로우: `harness-legacy-scan` (읽기 전용 멀티 에이전트 감사)
> 규모: 33개 에이전트 · 원시 발견 39 → 정규화 34 → 적대적 검증 27 → KEEP 강등 17
> 제약: 파일·훅·MCP·권한 미수정. 분석 리포트만 생성.

전역 컨텍스트·중복 규칙·스킬 범위·안전/권한 훅을 대상으로 한 읽기 전용 감사 결과입니다. 각 항목은 적대적 검증(adversarial verdict)을 반영하여, 검증이 무너진(challengeHolds=false) 항목은 KEEP으로 강등하거나 위험 구역으로 이동시켰습니다.

---

## A. 전역 컨텍스트(매 세션 로드) 관련

### A-1. `.claude/rules/skill-ownership.md` (Enforcement 꼬리 ~165줄)
- **경로**: `.claude/rules/skill-ownership.md`
- **현재 목적**: 새 스킬의 위치(공유 `.harness/skills` vs 프로젝트 `.harness/skills-local`)와 공유 트리 쓰기 금지를 매 세션 명시.
- **발견한 문제**: 249줄/12.9KB로 항상 로드되는 규칙 중 최대. 실제 행동 가능한 정책은 ~82줄까지이고, 나머지 `## Enforcement` 이후는 `guardrails.mjs`의 셸 파싱 내부(9단계 Bash 모델, redirect 차단, `COMMAND_MAX_LENGTH=16384`, out-of-scope 우회 클래스, known false positives)를 설명하는 유지보수 근거. 에이전트가 행동할 수도, 우회할 수도 없는 훅 구현 산문이 매 세션 토큰을 소모.
- **근거**: 행동 정책은 `## The skill-creator skill`(71줄)에서 끝남. 같은 정책이 `guardrails.md`의 `## Shared Skill Ownership`, CLAUDE.md(80줄), AGENTS.md(105줄)에도 존재 — 핵심 명령은 삼중 기술됨.
- **추천 조치**: **SPLIT**
- **옮긴다면 추천 위치**: 1~82줄(두 소스, 생성 위치, 수정 금지, 충돌, skill-creator 단계)은 얇은 항상-로드 규칙으로 유지. `## Enforcement` 에세이는 on-demand 참조(`guardrails.md` 또는 `.harness/hooks/README`)로 이동하고 한 줄 링크로 연결. **단, "훅은 navigate-by-mistake 방어일 뿐, 의존하지 말 것" 주의 한 문장은 stub에 반드시 보존.**
- **변경 시 위험도**: 낮음 / **신뢰도**: 높음 / **자동 처리 가능**: 아니오 (안전 인접 규칙, 사람 검토 필요)

### A-2. `.claude/rules/phase-routing.md` (제거된 커맨드 경고, 26~28줄)
- **경로**: `.claude/rules/phase-routing.md` (lines 26-28)
- **현재 목적**: 제거된 로컬 `./harness spec / phase-prompt / board` 사용 금지 경고.
- **발견한 문제**: 원래 DELETE 제안이었으나 적대적 검증에서 **무너짐**. 이 줄은 단순 레거시가 아니라 의도된 cross-tool mirror의 Claude 절반: `.codex/rules/phase-routing.rules`가 `forbidden` 규칙 3개로 동일 정책을 실행 강제. Claude 측엔 execpolicy가 없어 이 산문 경고가 유일한 강제 수단. 또한 27~28줄의 "GSD `.planning/`에 상태 기록" 절은 현행 라우팅 지침으로 load-bearing.
- **근거**: `agent-routing.md`의 "Native Mirrors"가 두 파일을 짝으로 명시. `doctor.sh`와 `shared-manifest.json`이 이 파일 존재를 hard-require.
- **추천 조치**: **SHRINK** (DELETE 아님 — 검증 실패로 하향)
- **옮긴다면 추천 위치**: 문장을 다듬되 Codex 규칙과 짝을 유지하거나 양쪽을 함께 제거 + `agent-routing.md` 갱신. `.planning/` 출력 절은 보존.
- **변경 시 위험도**: 중간 / **신뢰도**: 중간 / **자동 처리 가능**: 아니오 (다중 파일 cross-tool sync 편집)

### A-3. `.claude/rules/work-safety.md` (DB·민감정보 섹션, 47~85줄)
- **경로**: `.claude/rules/work-safety.md`
- **현재 목적**: 헤더가 스스로 "`guardrails.md`의 공통 안전 정책을 미러"한다고 선언. 브랜치/승인/DB/시크릿/인증 포함.
- **발견한 문제**: DB 안전(bounded WHERE, tenant scope, row-count, transaction, dry-run SELECT, DROP/TRUNCATE 승인)과 시크릿 redaction allowlist가 316줄 `guardrails.md`의 거의 전체 재진술. 매 세션 로드되나 이 하네스 레포엔 라이브 DB·앱 코드 없음(apps/* 빈 fixture). 진짜 load-bearing은 브랜치/cwd 인지가 필요한 "Protected branches" + "Explicit approval"뿐.
- **근거**: 92줄로 316줄을 미러. 73줄(Authorization/Cookie/Set-Cookie/DB URL/OAuth/session/CSRF)이 `guardrails.md` L179-181 중복. 헤더가 중복을 자인.
- **추천 조치**: **SHRINK** (검증 holds)
- **옮긴다면 추천 위치**: "Protected branches" + "Explicit approval"(never-run-gh-pr-merge 포함) 유지. DB/시크릿/인증 산문은 `guardrails.md` + `imported-rules/database.md` 한 줄 포인터로 대체. **승인 트리거 인지(L28-36)는 보존.**
- **변경 시 위험도**: 중간 / **신뢰도**: 높음 / **자동 처리 가능**: 아니오 (안전 산문)

### A-4. CLAUDE.md (Routing/Size summary, 23~37줄)
- **경로**: `CLAUDE.md` lines 23-37
- **현재 목적**: 얇은 Claude 엔트리포인트에 P1-P5 라우팅 + 크기 요약 인라인.
- **발견한 문제**: 동일 요약이 같은 세션에 자동 로드되는 `.claude/rules/phase-routing.md`(L8-22)에 이미 존재. 정전(canonical) `scenario-phase-routing.md`가 "다른 엔트리포인트는 요약/링크하라"고 자기선언. Claude 세션당 비용 2배.
- **근거**: CLAUDE.md L23/L29가 phase-routing.md L10-22와 내용 동일. AGENTS.md엔 Claude 전용 자동 로드 메커니즘이 없으므로 AGENTS.md 인라인은 **유지 필요** — 비대칭이지만 올바른 결과.
- **추천 조치**: **SHRINK** (검증 holds, CLAUDE.md만)
- **옮긴다면 추천 위치**: CLAUDE.md를 `phase-routing.md` + `scenario-phase-routing.md` 한 줄 포인터로 축소. AGENTS.md는 손대지 않음.
- **변경 시 위험도**: 낮음 / **신뢰도**: 높음 / **자동 처리 가능**: 아니오 (엔트리포인트 parity 사람 확인)

### A-5. CLAUDE.md (Skill ownership bullet, 80줄)
- **경로**: `CLAUDE.md` line 80
- **현재 목적**: 스킬 소유권 한 줄 요약 ("Full rule in .claude/rules/skill-ownership.md"로 끝남).
- **발견한 문제**: 249줄 전체 규칙이 같은 세션 자동 로드되고 `guardrails.md`에 세 번째 축약본 존재함에도 본문을 재진술. 인라인 문구가 이 하네스 레포에는 약간 부정확("skills-local에 생성"은 downstream 규칙 — 하네스 레포에선 `.harness/skills/`).
- **근거**: CLAUDE.md L80 vs skill-ownership.md L10-15 vs guardrails.md가 동일 규칙. AGENTS.md L105와 이미 verbatim 아님(Codex 규칙 추가 포인터).
- **추천 조치**: **SHRINK** (검증 holds)
- **옮긴다면 추천 위치**: 단순 포인터로 축소("Skill ownership: see .claude/rules/skill-ownership.md").
- **변경 시 위험도**: 낮음 / **신뢰도**: 높음 / **자동 처리 가능**: 아니오 (엔트리포인트 편집)

---

## B. 중복·레거시 (정책/엔트리포인트)

### B-1. 위상/크기 라우팅 5~6중 렌더링
- **경로**: `scenario-phase-routing.md` vs `agent-routing.md` vs `workflow.md` vs `.claude/rules/phase-routing.md` vs `codi-phase-routing/SKILL.md`
- **현재 목적**: GSD/GStack/Superpowers 위상·크기 라우팅을 정전 정책 + 보조 정책 2 + 항상-로드 규칙 + 라우팅 스킬에 표현.
- **발견한 문제**: 동일 위상맵/크기표가 4~6회 전체 렌더링. 정전 `scenario-phase-routing.md`가 "다른 엔트리포인트는 요약/링크하라"고 자기선언했는데도 나머지가 전체 표를 재렌더. 비-자명 anti-pattern(Non-signals, escalation)은 정전 파일에만 존재 → SHRINK가 load-bearing 절을 떨어뜨리지 않음.
- **근거**: scenario L2-6 자기선언. 위상맵 반복: scenario, workflow L40-46, agent-routing(산문), phase-routing L10-14, codi-phase-routing L23-29(L50-51 "compact reminder only" 자인).
- **추천 조치**: **SHRINK** (검증 holds)
- **옮긴다면 추천 위치**: 전체 위상맵+크기표는 `scenario-phase-routing.md`에만. 나머지 4개는 한 문단 요약 + 링크. **단 agent-routing.md L108-112 Native Mirrors, workflow.md Team Mode, codi-phase-routing Skill Routing 표는 unique이므로 보존.**
- **변경 시 위험도**: 중간 / **신뢰도**: 높음 / **자동 처리 가능**: 아니오 (4파일 의미 편집, 1개는 항상-로드)

### B-2. `codi-phase-routing/SKILL.md` 중복 위상/크기
- **경로**: `.harness/skills/codi-phase-routing/SKILL.md`
- **현재 목적**: 위상·스킬 선택 compact 라우팅.
- **발견한 문제**: Phase Map(23-29), 크기 정의(35-42)가 phase-routing.md/agent-routing.md를 거의 verbatim 재진술. L56이 agent-routing.md를 source of truth로 자인. 세 번째 사본.
- **근거**: L56 자인. 크기 산문 verbatim 중복.
- **추천 조치**: **SHRINK** (검증 holds)
- **옮긴다면 추천 위치**: 중복 크기/위상표만 포인터로 대체. **고유 컨텐츠는 보존**: imported-rules→skill 매핑(L75-82), Codex Notes(L84-87), Team Mode(L89-110), Exemptions(L112-116), Skill 선택 표.
- **변경 시 위험도**: 낮음 / **신뢰도**: 중간 / **자동 처리 가능**: 아니오 (over-delete 위험, 라인 범위 사람 확인)

### B-3. `imported-rules/backend.md` vs `codi-backend/SKILL.md`
- **경로**: `.harness/imported-rules/backend.md` ↔ `.harness/skills/codi-backend/SKILL.md`
- **현재 목적**: backend.md는 읽기 자료, SKILL.md는 백엔드 작업 시 로드되는 전문 스킬.
- **발견한 문제**: Core Rules(13), 클린아키텍처 layer, DRY/SOLID/KISS가 near-verbatim 중복 + **이미 드리프트**: SKILL rule 11이 backend.md rule 11의 codi-deferred vendor fallback을 누락. 로드되는 쪽이 약한 사본.
- **근거**: SKILL L160 == backend.md L11; 아키텍처 화살표 SKILL L142 == backend.md L55; rules 1-13 일대일. codi-deferred는 codi-frontend checklist에도 강제되는 cross-cutting 계약.
- **추천 조치**: **MOVE** (검증 holds)
- **옮긴다면 추천 위치**: SKILL.md(로드되는 파일)를 정전으로 유지하고 **누락된 codi-deferred fallback 절을 SKILL.md에 복원한 뒤** backend.md를 포인터로 축소.
- **변경 시 위험도**: 낮음 / **신뢰도**: 높음 / **자동 처리 가능**: 아니오 (정전 측 선택 + 누락 절 복원, 사람 판단)

---

## C. 스킬 범위·구조

### C-1. `nestjs-expert/SKILL.md` (561줄 모놀리스)
- **경로**: `.harness/skills/nestjs-expert/SKILL.md`
- **현재 목적**: NestJS 감지 시 로드되는 전문 스킬 + 대형 트러블슈팅 카탈로그.
- **발견한 문제**: 561줄/21.6KB 단일 파일, `resources/` 분리 없음(유일한 그런 codi 스킬). 본문 대부분이 17개 이슈 카탈로그(153-307), decision tree(406-456), 일반 perf 팁(458-476), 외부 링크(478-496) — 모델이 이미 아는 generic 지식. codi-backend가 NestJS 작업마다 561줄 전체 로드.
- **근거**: 21665 bytes/561줄, resources/ 없음. AGENTS.md/CLAUDE.md는 이름만 참조(본문 인라인 아님) → cross-tool sync 영향 없음. 모든 consumer가 스킬 이름/경로 참조 → thin router가 경로 유지하면 링크 보존.
- **추천 조치**: **SPLIT** (검증 holds)
- **옮긴다면 추천 위치**: 17-이슈 카탈로그 → `resources/troubleshooting.md`, 코드 스니펫 → `resources/patterns.md`, decision tree/perf → `resources/decision-trees.md`. SKILL.md는 thin router(invoke 조건 + 감지 + load-on-demand 참조 맵)로.
- **변경 시 위험도**: 낮음 / **신뢰도**: 높음 / **자동 처리 가능**: 아니오 (router 작성·분배 사람 판단)

### C-2. `nestjs-expert/SKILL.md` frontmatter description (3줄)
- **경로**: `.harness/skills/nestjs-expert/SKILL.md` line 3
- **현재 목적**: 스킬 트리거용 frontmatter description.
- **발견한 문제**: "Use when" gate 없는 페르소나 blurb(testing, database integration, authentication 등 broad 키워드)로 codi-backend/codi-db/일반 테스트와 충돌. 단, 적대적 검증이 정정함: 하네스 hook 트리거는 `skill-triggers.json` 키워드(이미 NestJS-gated)에서 작동하므로 **하네스 over-trigger는 발생 안 함**. 실익은 native Claude Skill 자동선택 정밀도 향상.
- **근거**: L3가 본문 H1(L12)과 verbatim 동일, gate 없음. codi-backend L3는 "Use for ... work" gate 보유.
- **추천 조치**: **SHRINK** (검증 holds, 근거는 native autoselect 정밀도)
- **옮긴다면 추천 위치**: gated "Use when working on NestJS modules/DI/guards/pipes/interceptors" 트리거로 재작성, 페르소나 제거. **NestJS auth/testing/db 범위(passport 키워드)는 유지해 recall 손실 방지.**
- **변경 시 위험도**: 낮음 / **신뢰도**: 중간 / **자동 처리 가능**: 아니오 (키워드 사람 작성)

### C-3. `codi-dev-workflow/SKILL.md` (364줄)
- **경로**: `.harness/skills/codi-dev-workflow/SKILL.md`
- **현재 목적**: 모노레포 워크플로 전문 스킬(mise, CI/CD, 마이그레이션, 릴리스).
- **발견한 문제**: 364줄(non-expert codi 스킬 중 최대)에 generic 튜토리얼 인라인: mise curl 설치(184-196), 샘플 모노레포 트리(198-214), parallel/sequential bash(270-290), env 예제(292-308), 그리고 정전 `imported-rules/dev-workflow.md` 12 규칙의 superset인 24-항목 가드레일(131-156).
- **근거**: SKILL 가드레일 1-24가 12 Core Rules 전부 포함. L184-196은 generic curl 설치. 안전성 규칙(#18 포트, #23 destructive 확인)은 같은 SKILL의 Transitions/Failure-Recovery에 독립 재진술됨 → 가드레일 리스트 축소가 unique 안전 절을 고아화하지 않음.
- **추천 조치**: **SHRINK** (검증 holds)
- **옮긴다면 추천 위치**: 설치/prereq 튜토리얼·generic env/parallel 예제는 `resources/`로 이동/제거. 24 가드레일은 `../../imported-rules/dev-workflow.md` 포인터로. **단 12-규칙 포인터가 SKILL-only 운영 규칙 ~12개를 떨어뜨리지 않도록 inline 유지 여부 사람 결정.**
- **변경 시 위험도**: 낮음 / **신뢰도**: 높음 / **자동 처리 가능**: 아니오

### C-4. 세 스킬 공유 메타-스캐폴딩
- **경로**: `codi-backend/SKILL.md` & `codi-frontend/SKILL.md` & `codi-db/SKILL.md`
- **현재 목적**: Scheduling/Structural Flow/Logical Operations 스캐폴드(SSL primitive, Resource scope, Preconditions, Effects).
- **발견한 문제**: 각 스킬이 stack 지식 전에 ~120줄의 동일-형태 house 템플릿 보유. Actions 표 헤더 `| Action | SSL primitive | Evidence |`가 세 파일에 verbatim. generic READ/WRITE/VALIDATE/NOTIFY 재기술.
- **근거**: backend 8-130, frontend 8-131, db 8-127 동일 섹션 순서·헤딩. **단 스캐폴드 안에 load-bearing 라우팅 트리거 존재**: codi-backend Entry step 4의 nestjs-expert 로드 트리거(L57), codi-frontend의 React-only vs Next.js 가드(L76), codi-db의 3NF/ISO/vector.
- **추천 조치**: **SHRINK in place** (검증 holds; "move to _shared/core" framing은 거부 — 라우팅 트리거가 스캐폴드 안에 있어 naive 추출 시 삭제됨)
- **옮긴다면 추천 위치**: 공유 reference 추출 대신 **제자리 축소**. generic 스켈레톤(빈 Goal/Intent/Scenes, generic Actions 행)만 trim, stack-specific Entry/Transitions/Actions-evidence 셀은 보존.
- **변경 시 위험도**: 중간 / **신뢰도**: 중간 / **자동 처리 가능**: 아니오

### C-5. `nestjs-expert/SKILL.md` 꼬리 When to Use/Limitations (555~561줄)
- **경로**: `.harness/skills/nestjs-expert/SKILL.md` lines 555-561
- **현재 목적**: generator-appended boilerplate.
- **발견한 문제**: generic filler("This skill is applicable to execute the workflow...") + 3개 boilerplate limitation bullet. NestJS-specific 가치 0. 트리거는 frontmatter에서 처리되며 어떤 hook/script도 이 헤딩을 파싱하지 않음. 레포 전체에서 이 파일에만 존재하는 고아 산물.
- **근거**: tail 확인 L556/L558-561. 트리거·파서 의존 없음.
- **추천 조치**: **DELETE** (검증 holds)
- **변경 시 위험도**: 낮음 / **신뢰도**: 높음 / **자동 처리 가능**: **예**

### C-6. `codi-dev-workflow/SKILL.md` 꼬리 Knowledge Reference 키워드 백 (362~364줄)
- **경로**: `.harness/skills/codi-dev-workflow/SKILL.md` lines 362-364
- **현재 목적**: trailing 콤마-구분 키워드 리스트.
- **발견한 문제**: instruction 가치 없는 키워드 stuffing. `skill-injector.mjs`는 `triggers config`에서 키워드를 읽고 SKILL.md 본문을 파싱하지 않음(existsSync만). native invocation은 frontmatter description 사용. "Knowledge Reference" 헤딩은 레포에서 이 파일에만 존재.
- **근거**: tail 확인. injector L65/L92가 별도 config 사용, L72 existsSync만.
- **추천 조치**: **DELETE** (검증 holds)
- **변경 시 위험도**: 낮음 / **신뢰도**: 높음 / **자동 처리 가능**: **예**

### C-7. `codi-frontend/SKILL.md` Server vs Client/RSC explainer (132~196줄)
- **경로**: `.harness/skills/codi-frontend/SKILL.md` lines 132-196
- **현재 목적**: Server vs Client Components, Shadcn/UI, Sources of Truth 섹션 + inline 가드레일.
- **발견한 문제**: RSC explainer(180-183)가 generic Next.js App Router 동작 재진술(L183 스스로 "Next.js 프로젝트에만 적용" hedge). 적대적 검증: RSC explainer만 제거하면 안전하나, **proxy.ts ban(가드레일 #6), components/ui read-only, SoT 경로(design-tokens OKLCH, i18n, DESIGN.md §9, >90% coverage)는 frontend.md가 대체 못 하는 unique 가드레일** — collateral 제거 금지.
- **근거**: L178-183 generic RSC, L183 hedge. 가드레일 132-138은 frontend.md와 verbatim 아니고 unique 절 포함.
- **추천 조치**: **SHRINK** (검증 holds, 단 위험 중간으로 상향)
- **옮긴다면 추천 위치**: generic RSC explainer만 제거. proxy.ts/components-ui/SoT 프로젝트 규칙 보존.
- **변경 시 위험도**: 중간 / **신뢰도**: 중간 / **자동 처리 가능**: 아니오

---

## D. 안전·권한

### D-1. `.harness/hooks/decision-notifier.mjs`
- **경로**: `.harness/hooks/decision-notifier.mjs`
- **현재 목적**: Stop hook이 마지막 어시스턴트 메시지를 NL regex로 매칭해 osascript 알림 발사.
- **발견한 문제**: CLAUDE.md의 의도적 경로(`./harness notify-decision`)와 중복. Stop-hook 버전은 brittle NL regex(`/should I proceed/i`, `/진행해도/`)로 추측 → false-positive(수사 질문)/false-negative. 순수 notifier로 power 부여 없음. 단 guardrails.md L297-299가 보완적 fallback으로 명시 → DELETE 아닌 SHRINK.
- **근거**: L79-94 휴리스틱 매치. notify()(L20-31)는 알림만, 차단 0. settings.json L106-114 wired.
- **추천 조치**: **SHRINK** (검증 holds)
- **변경 시 위험도**: 낮음 / **신뢰도**: 중간 / **자동 처리 가능**: 아니오 (wired hook, doctor 재실행 필요)

### D-2. `.claude/settings.local.json` (permissions.allow)
- **경로**: `.claude/settings.local.json`
- **현재 목적**: 특정 Bash 호출 pre-approve + WebSearch.
- **발견한 문제**: 대부분 올바르게 scoped(read-only/idempotent)이나 두 항목이 느슨: `Bash(./harness codex *)`가 모든 codex 서브커맨드/인자 wildcard 허용(가장 넓은 grant), `Bash(chmod +x .../generate-manifest.mjs)`는 standing pre-approval로 부적절한 one-off. allow-list는 prompt 억제일 뿐 enforcement 아님 → 실제 가드레일(hook)은 독립 작동, 축소해도 안전 검사 0 제거.
- **근거**: allow에 두 wildcard + chmod 존재, deny/ask 블록 없음. `./harness codex`는 `exec codex "$@"`.
- **추천 조치**: **SHRINK** (검증 holds)
- **옮긴다면 추천 위치**: `./harness codex *`를 실제 사용하는 서브커맨드로 좁히고 one-off chmod grant 제거.
- **변경 시 위험도**: 낮음 / **신뢰도**: 중간 / **자동 처리 가능**: 아니오 (권한 경계, 사람 적용)

---

# MANDATORY CLOSING SECTIONS

## 1. 전체 요약

이 하네스 레포는 안전 훅 코어(`guardrails.mjs`의 dangerous-command 안전망, shared-skills write guard, tool-permission-guard, project-profile-guard)가 견고하고 비례적으로 작동하므로 **모두 유지(KEEP)**합니다. 진짜 다이어트 대상은 **(a) 매 세션 로드되는 전역 규칙의 중복·근거 산문**, **(b) 위상/크기 라우팅의 5~6중 렌더링**, **(c) 스킬 본문의 generic 튜토리얼·트레일링 boilerplate**입니다.

적대적 검증 결과 다수의 SHRINK/MOVE/CONVERT 제안이 **무너졌습니다(challengeHolds=false)**: CLAUDE.md↔AGENTS.md CONVERT, monorepo-packages SHRINK, dangerous-ops 5중 통합 SHRINK, frontend.md/database.md MOVE, codi-backend SKILL SHRINK, skill-creator SPLIT, update-check SHRINK는 모두 **cross-tool mirror 손상·always-loaded 신호 제거·정전 소스 오인** 때문에 KEEP으로 강등되었습니다. 이들은 7번 위험 구역으로 이동했습니다.

자동 처리 안전(autoDietSafe AND challengeHolds) 항목은 **단 2개의 트레일링 boilerplate 삭제**뿐입니다.

## 2. 유지해야 할 항목 (KEEP)

원래 KEEP + 적대적 검증으로 KEEP 강등된 항목 전체:

- `.harness/skills/karpathy-style/SKILL.md` — thin wrapper지만 실질 트리거 제공.
- `codi-db/SKILL.md` description/When-to-use — 키워드 overlap 있으나 각 스킬 angle 상이.
- `guardrails.mjs:950-1019` dangerous-command 안전망 — 최고 가치, 절대 자동 손대지 않음.
- `tool-permission-guard.mjs:197-308` guardMcp — inert지만 forward-looking 스캐폴딩.
- `project-profile-guard.mjs` — 올바르게 scoped, downstream load-bearing.
- `guardrails.mjs:77-119` isHarnessRepo — brittle하나 load-bearing.
- MCP configuration (absent) — informational.
- **CLAUDE.md↔AGENTS.md 엔트리포인트** (CONVERT 무너짐) — thin/fat 비대칭은 의도된 설계, context-check.mjs가 이미 강제.
- **monorepo-packages.md** (SHRINK 무너짐) — 빈 apps 레포에선 항상-로드 규칙이 유일한 라이브 보호층, Codex-specific AGENTS.md 컨텐츠 보존 필요.
- **dangerous-ops 5중 리스트** (SHRINK 무너짐) — 각 사본이 distinct load surface, always-loaded·엔트리포인트에서 inline 필요.
- **frontend.md ↔ codi-frontend** (MOVE 무너짐) — frontend.md가 이미 단일 정전, Codex AGENTS.md consumer가 직접 읽음.
- **database.md 통합** (MOVE 무너짐) — 안전 미러는 정책-mandated parity.
- **codi-backend SKILL Core Rules** (SHRINK 무너짐) — 진짜 결함은 rule-11 한 절 드리프트뿐, 삭제+포인터 아닌 reconciliation이 정답.
- **skill-creator/SKILL.md** (SPLIT 무너짐) — upstream verbatim vendored, ORIGIN.md가 in-place 편집 금지.
- **guardrails.mjs:69-862 shared-skills guard** (SHRINK 무너짐) — ~60케이스 테스트 매트릭스가 강제, Codex backstop 없음, 위험 high.
- **settings.json update-check** (SHRINK 무너짐) — 내부 throttle로 비용 저렴, UserPromptSubmit가 day/week rollover mid-session 포착.
- **Codex-no-hook boundary / Native Mirrors** (SHRINK 무너짐) — 증거 miscount, AGENTS.md가 Codex 로드 파일이라 명시 보존 필요.

## 3. 줄여야 할 항목 (SHRINK) — challengeHolds=true

- A-3 `work-safety.md` DB/민감정보 → 브랜치+승인만 유지, 나머지 포인터 (중간)
- A-4 CLAUDE.md Routing/Size summary → 포인터 (낮음)
- A-5 CLAUDE.md Skill ownership bullet → 포인터 (낮음)
- B-1 위상/크기 5~6중 → scenario에만 전체, 나머지 요약+링크 (중간)
- B-2 codi-phase-routing 중복 위상/크기 → unique만 남기고 trim (낮음)
- C-2 nestjs-expert description → gated 트리거 (낮음)
- C-3 codi-dev-workflow → 튜토리얼 제거 + 가드레일 포인터 (낮음)
- C-4 세 스킬 메타-스캐폴딩 → 제자리 축소 (중간)
- C-7 codi-frontend RSC explainer → generic만 제거 (중간)
- D-1 decision-notifier NL 휴리스틱 → trim (낮음)
- D-2 settings.local.json codex wildcard/chmod → narrow (낮음)

> 주의: A-2 `phase-routing.md`는 DELETE→SHRINK로 하향(cross-tool mirror).

## 4. 전역 지침에서 Skill로 옮길 항목 (MOVE/CONVERT to skill)

- **없음 (실행 가능).** CONVERT 제안(CLAUDE.md↔AGENTS.md 템플릿 생성)은 적대적 검증에서 무너져 KEEP. backend.md→codi-backend MOVE(B-3)는 "imported-rules→skill" 방향이지만 전역 지침이 아닌 reading-material↔skill 중복 정리이며, codi-deferred 절 복원이 선행돼야 하므로 **7번 위험 구역**에서 다룹니다.

## 5. Skill에서 reference.md / examples.md로 분리할 항목 (SPLIT)

- **C-1 `nestjs-expert/SKILL.md`** → `resources/troubleshooting.md`, `resources/patterns.md`, `resources/decision-trees.md` + thin router SKILL.md. (위험 낮음, 검증 holds, 단 router 작성은 사람)
- **A-1 `skill-ownership.md`** → Enforcement 에세이를 on-demand 참조로 분리, stub에 주의 문장 1개 보존. (위험 낮음, 검증 holds)

> skill-creator SPLIT은 upstream vendored로 KEEP.

## 6. 삭제 후보 (DELETE)

- **C-5 `nestjs-expert/SKILL.md` 555-561** trailing When to Use/Limitations boilerplate. (autoDietSafe=true)
- **C-6 `codi-dev-workflow/SKILL.md` 362-364** Knowledge Reference 키워드 백. (autoDietSafe=true)

## 7. 사람이 직접 승인해야 하는 위험한 변경 (high risk OR 검증 실패)

**적대적 검증 실패로 KEEP 강등 — 자동 실행 금지, 진행 시 사람 검토 필수:**

- `guardrails.mjs:69-862` shared-skills guard SHRINK — **위험 high**, 60케이스 테스트·Codex backstop 없음.
- CLAUDE.md↔AGENTS.md CONVERT — secret/branch 규칙 제거 위험, 기존 CI check와 충돌.
- monorepo-packages SHRINK — 빈 apps 레포에서 유일 라이브 보호층 제거 위험.
- dangerous-ops 5중 통합 — always-loaded/엔트리포인트 inline 제거 위험.
- frontend.md MOVE — Codex AGENTS.md consumer 고아화.
- database.md 통합 — 정책-mandated 안전 미러 desync, hook 미포착 read-time 가드레일 약화.
- codi-backend SKILL SHRINK — 삭제+포인터 대신 rule-11 reconciliation만.
- skill-creator SPLIT — upstream 분기.
- settings.json update-check SHRINK — long-lived 세션 update 감지 손실.
- Codex-no-hook/Native Mirrors SHRINK — cross-tool sync 약화.

**검증 holds이나 안전·다중파일이라 사람 검토 필요:**

- A-1 skill-ownership SPLIT, A-2 phase-routing SHRINK(cross-tool mirror), A-3 work-safety SHRINK, B-1 위상/크기 통합(4파일), B-3 backend.md MOVE(codi-deferred 복원 선행), C-4 메타-스캐폴딩, C-7 frontend RSC, D-2 권한 narrow.

## 8. /harness-diet로 넘겨도 되는 low-risk 변경 목록 (autoDietSafe=true AND challengeHolds=true)

1. **`.harness/skills/nestjs-expert/SKILL.md` 555~561줄 삭제** — trailing "When to Use"/"Limitations" generic boilerplate. 트리거·파서 의존 없음, 안전 손실 없음.
2. **`.harness/skills/codi-dev-workflow/SKILL.md` 362~364줄 삭제** — trailing "Knowledge Reference" 키워드 백. injector가 본문 미파싱, native invocation은 frontmatter 사용.

이 둘만 자동 처리 안전입니다. 그 외 모든 항목은 사람 검토가 필요합니다.

## 9. /harness-diet 실행용 추천 프롬프트

```
/harness-diet 를 read-only 우선 원칙으로 실행해줘. 아래 2개의 low-risk 트레일링 boilerplate 삭제만 범위로 한정하고, 다른 어떤 파일도 수정하지 마.

대상:
1) .harness/skills/nestjs-expert/SKILL.md 의 끝부분 555~561줄 — "### When to Use" / "## Limitations" generic boilerplate 블록 (마지막 줄까지). NestJS-specific 내용 없는 generator 산물.
2) .harness/skills/codi-dev-workflow/SKILL.md 의 끝부분 362~364줄 — "### Knowledge Reference" 헤딩과 그 아래 콤마-구분 키워드 리스트 (instruction 가치 없는 키워드 백).

진행 절차:
- 먼저 두 파일의 해당 꼬리 블록을 Read 로 확인해 라인 범위가 정확한지 검증하고, 삭제할 정확한 텍스트를 보여줘.
- 두 블록이 각각 파일의 trailing 블록이며 그 아래에 다른 컨텐츠가 없는지 확인해줘.
- skill-injector.mjs / 어떤 hook·script 도 이 두 섹션("Knowledge Reference", "When to Use", "Limitations")을 파싱하지 않는다는 점을 grep 으로 재확인해줘 (파싱 의존이 발견되면 즉시 중단하고 보고).
- 이 두 파일은 upstream-vendored 가 아닌 codi 자체 스킬이고 이 레포가 canonical 하네스 레포이므로 .harness/skills/ 직접 편집이 허용됨을 확인해줘.
- 확인이 끝나면 제거할 정확한 diff 를 제시하고, 내 명시적 승인을 받은 뒤에만 Edit 로 삭제해.
- 삭제 후 ./harness doctor 와 관련 테스트(tests/harness-cli.test.mjs)를 실행해 그린인지 확인해줘.

이 범위 밖의 SHRINK/MOVE/SPLIT/CONVERT 항목(전역 규칙 중복, 위상 라우팅 통합, 스킬 본문 축소, 권한·훅 변경)은 이번 실행에서 절대 건드리지 마. 그것들은 사람 검토가 필요한 별도 작업이야.
```
