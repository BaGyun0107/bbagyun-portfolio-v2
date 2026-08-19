# 가드레일 과잉 & Size 라우팅 모호성 감사 (2026-06-10)

## 1. 핵심 결론

가드레일은 **위험 차단 측면에서는 정확하지만(false-negative 0건), 정당한 읽기/텍스트 명령을 과도하게 막는 over-tuned 상태**다. 위험 단어를 텍스트로 포함한 16개 명령 중 14개(실측 재현분 13/13)가 차단되어 판별 대상(A+B) 기준 **오버블록률 88%**였고, 이번 세션에서 사용자가 실제로 부딪힌 2건(규칙 파일 `grep`, never-merge 규칙을 적은 PR 본문)이 그대로 재현됐다. Size 라우팅은 **10개 시나리오 중 1개(S10)에서만 3분류자가 갈려 불일치율 10%**로 비교적 안정적이지만, 그 불일치와 다수의 "낮은 신뢰도(low)" 판정은 모두 **동일한 모호 절(외부 인프라/secrets 트리거를 "명시" vs "추론"으로 적용하는 규칙, "inspect-before-deciding=최소 Medium" 임계)**에서 비롯된다. 즉 가드는 즉시 손봐야 할 고임팩트 문제, 라우팅은 소수 경계 절만 보강하면 되는 저위험 문제다.

## 2. 가드레일 실측 결과

### 2.1 오버블록률

- 판별 대상(danger 단어를 명령줄에 포함, 카테고리 A+B) = 16건 중 **false-positive 14건 → 88%**.
- 일반 안전 쓰기(카테고리 C, danger 단어 없음) = 9건 중 over-block **0건**.
- 직접 재현 배터리(22개 probe, `/tmp/probe-driver.mjs` → `node .harness/hooks/guardrails.mjs`): **FP=13, FN=0**. (재현분은 A/B 13건 + 위험 7건 + 대조 2건으로, 입력 INPUT 1의 14건 중 13건을 직접 재현. 나머지 1건은 동일 클래스의 변형으로 메커니즘 동일.)
- 결론: 과잉 차단은 전적으로 "**명령줄에 위험 문구가 텍스트/검색인자로 들어간**" 클래스에 집중. 평범한 안전 쓰기는 단 한 건도 오탐 없음.

실측 차단 사유(가드 원문 그대로):

| probe | 명령(요지) | 차단 사유(가드 출력) |
| --- | --- | --- |
| A1 | `grep -rn '<gh pr merge>' .claude/rules` | `Guardrails blocked PR merge.` |
| A2 | `grep -rn '<rm -rf>' .harness/policies/guardrails.md` | `Guardrails blocked recursive force delete.` |
| A5 | `rg -n '<DROP TABLE>' .harness/hooks/guardrails.mjs` | `Guardrails blocked DROP statement.` |
| A6 | `grep -n '<git reset --hard>' .claude/rules/work-safety.md` | `Guardrails blocked hard reset.` |
| A7 | `git log --grep="<kubectl delete>" --oneline` | `Guardrails blocked kubernetes delete.` |
| A8 | `rg -n '<TRUNCATE>' db/migrations` | `Guardrails blocked TRUNCATE statement.` |
| A9 | `grep -rn '<docker system prune>' scripts/` | `Guardrails blocked docker system prune.` |
| B4 | `git log -S '<git push --force>' --oneline` | `Guardrails blocked force push.` |
| B5 | `echo 'Never run <terraform destroy> without approval.'` | `Guardrails blocked terraform destroy.` |
| B6 | `gh pr create --title docs --body 'AI must never run <gh pr merge>.'` | `Guardrails blocked PR merge.` |

대조군(정상 통과): `git log --oneline -20`, `cat .harness/policies/guardrails.md` → 둘 다 allow. 즉 위험 단어가 **파일 내용**에만 있고 명령줄엔 없으면 통과하지만, **명령줄 텍스트**에 들어가면 무조건 차단된다.

### 2.2 FP 클래스별 표

| 클래스 | 대표 probe | 무엇이 잘못되나 | 근본 원인 |
| --- | --- | --- | --- |
| (1) search-pattern-as-argument | A1,A2,A5,A6,A7,A8,A9,B4 | `grep`/`rg`/`git log --grep`/`git log -S`가 **검색 문자열**로 넘긴 위험 문구가 차단됨. 규칙 파일을 그 규칙이 금지한 문구로 감사하는 행위가 막힘 — 이번 세션 사용자를 문 클래스. | 위험 정규식이 명령 위치를 모르고 명령줄 전체에 substring 매칭 |
| (2) danger-phrase-in-emitted-text | B1,B2,B3,B5,B6 | `echo`/`printf`/`git commit -m`/`gh pr create --body`의 **인자 텍스트**(PR 본문·커밋 메시지·설명문)에 금지 문구가 있으면 차단. 가장 치명적: **명시적으로 허용된** `gh pr create`가 never-merge 규칙을 문서화하면 막힘. | 동일 — 따옴표 안 리터럴/메시지 본문을 구분하지 못함 |
| (3) substring-match-anywhere (위 둘의 근본 원인) | 위 전부 | 위험 명령 검사들이 명령 위치·따옴표·인용 리터럴 개념 없이 명령줄 전체에 테스트되는 평면 정규식 | `guardrails.mjs:1013` `checks.find(c => c.pattern.test(command))` |

### 2.3 이번 세션 실제 오탐 2건 위치 확인

- **오탐 #1 (규칙 파일 grep)** = 배터리 **A1** `grep -rn '<gh pr merge>' .claude/rules`. 직접 재현: 차단, 사유 `Guardrails blocked PR merge.`
- **오탐 #2 (never-merge 규칙을 적은 PR 본문)** = 배터리 **B6** `gh pr create --title docs --body 'AI must never run <gh pr merge>.'`. 직접 재현: 차단, 사유 `Guardrails blocked PR merge.`
- 두 건 모두 클래스 (1)/(2)에 정확히 해당하며, 메커니즘은 `gh pr merge` 패턴 `/\bgh\s+pr\s+merge\b/`이 `gh pr create`의 본문 텍스트와 grep 검색인자에 그대로 매칭된 것.

### 2.4 false-negative (과허용) 여부

- **없음.** 위험 probe 12건(D1–D6, D8–D13) 전부 정확히 차단. 직접 재현분 7건(D1–D5, D11, D12)도 전부 block.
- D7(이 repo에서 `.harness/skills/`로 redirect)은 **의도된 allow**: `package.json` name=`codi-harness-v2`, origin=canonical harness이므로 `isHarnessRepo()`=true. 시뮬레이션 downstream(`/tmp/fake-downstream`)에서는 동일 명령이 차단됨(D7b) — 공유 스킬 가드는 구조적으로 정확.
- 공유 스킬 가드(경로 정규화 + 읽기전용 allow-list + redirect 탐지 + simple-command 분할)는 이 배터리에서 FP/FN 0건. **즉 "올바른 설계"의 레퍼런스가 같은 파일 안에 이미 있다.**

### 2.5 발견별 정리

#### 발견 G-1 — 위험 명령 테이블이 읽기전용 allow-list를 전혀 참조하지 않음 (핵심)

- **경로:** `.harness/hooks/guardrails.mjs:950–1019` (`const checks = [...]` 테이블, `checks.find(...)` at line 1013)
- **현재 목적:** `rm -rf`, `git push --force`, `gh pr merge`, `DROP/TRUNCATE`, `kubectl delete`, `docker system prune`, `terraform destroy`, 비밀 출력, prod 배포 등 파괴적 명령을 실행 전에 차단.
- **발견한 문제:** 이 테이블은 평면 정규식을 **명령줄 전체 문자열**에 테스트한다(`check.pattern.test(command)`). 명령 위치, 따옴표, 검색 인자/메시지 본문 구분이 없어 위험 문구가 어디에 있든(검색어, PR 본문, 커밋 메시지, echo 텍스트) 차단된다.
- **근거(실측):**
  - `node -e`로 테이블 영역을 추출해 확인: `checks table references SHARED_SKILLS_READONLY_TOOLS? false`, `checks table references firstToken? false`. 즉 같은 파일에 존재하는 `SHARED_SKILLS_READONLY_TOOLS`(line 198: ls/cat/head/tail/grep/egrep/fgrep/rg/wc/stat 등)와 `firstToken()`(line 523)·`commandWords()`(line 530)를 **위험 테이블은 하나도 쓰지 않는다.**
  - 공유 스킬 가드(line 563 `evaluateSimpleCommand`)는 같은 도구로 `firstToken(...) ∈ READONLY ⇒ false`(line 569), redirect만 별도 차단(line 565)으로 FP 0건을 달성 중. 인프라는 이미 검증돼 있고 위험 테이블만 안 쓴다.
  - 배터리 A1–B6 13건 직접 재현 차단, 대조군 2건 통과.
- **추천 조치:** **SHRINK(차단 범위 축소, 안전 불변)**. `checks.find` 호출 전에 명령을 simple-command로 분할하고 각 simple-command의 `firstToken`이 읽기전용 텍스트-방출 allow-list(`grep/egrep/fgrep/rg`, `git log`/`git show`의 `--grep`·`-S`·`-G`, `echo/printf`, `git commit -m`의 메시지 인자, `gh pr create/edit`의 `--body/--title` 인자)일 때 위험 테이블 매칭을 건너뛰도록 위치 인식(command-position) 검사를 추가. 인프라(`firstToken`, `commandWords`, prefix-strip, simple-command 분할)는 이미 존재하므로 신규 파서 불필요.
- **변경 시 위험도:** **HIGH (안전 영향).** 위험 명령 차단 로직을 직접 건드리므로, allow-list를 너무 넓히면 진짜 위험 명령(`psql -c "DROP TABLE"` 등, firstToken=`psql`은 allow-list에 없으므로 영향 없음)이 빠질 수 있다. 반드시 (a) firstToken 기준으로만 예외, (b) redirect/compound는 기존처럼 simple-command별 독립 평가 유지, (c) 회귀 배터리(D1–D13 전부 여전히 block) 통과를 조건으로 적용.
- **신뢰도:** **높음.** 근본 원인을 소스 라인·실측·테이블 추출로 3중 확인.

#### 발견 G-2 — `gh pr create`(명시적 허용 작업)가 본문 때문에 차단

- **경로:** `.harness/hooks/guardrails.mjs:958` `/\bgh\s+pr\s+merge\b/` + line 1013 전체-문자열 매칭
- **현재 목적:** `gh pr merge`만 차단(AI는 PR 머지 금지). `gh pr create`는 정책상 허용.
- **발견한 문제:** `gh pr create --body '...gh pr merge...'`가 머지 패턴에 매칭되어 차단(B6). 정책이 권장하는 행위(never-merge 규칙을 PR 본문에 문서화)가 가드에 막힌다.
- **근거(실측):** B6 직접 재현 차단, 사유 `Guardrails blocked PR merge.` 명령의 firstToken은 `gh`이고 서브커맨드는 `pr create`이지 `pr merge`가 아님.
- **추천 조치:** **SHRINK.** G-1 수정에 포함. `gh pr` 서브커맨드를 토큰 단위로 보고 `create/edit/view/list/diff/checkout`은 머지 패턴 대상에서 제외. `--body/--title` 인자 텍스트는 매칭 비대상.
- **변경 시 위험도:** **MEDIUM-HIGH.** `gh pr merge`는 절대 허용하면 안 되므로(D4 유지) 서브커맨드 화이트리스트는 정확히 `merge`만 차단으로 한정해야 함.
- **신뢰도:** 높음.

## 3. Size 라우팅 모호성 실측 결과

### 3.1 시나리오별 3분류자 판정 표

| ID | A(cautious) | B(pragmatic) | C(literalist) | 합의? |
| --- | --- | --- | --- | --- |
| S1 (typo, 테스트 있음) | Small (high) | Small (high) | Small (high) | **합의** |
| S2 (신규 REST 엔드포인트, 패턴 복제) | Large (med) | Large (med) | Large (med) | **합의** |
| S3 (결제 금액 계산 + 외부 결제 API) | XL (high) | XL (high) | XL (high) | **합의** |
| S4 (공유 design-tokens 토큰 1개 변경) | Medium (low) | Medium (med) | Medium (low) | **합의** |
| S5 (인증 미들웨어 rate-limit, 다중 라우트) | XL (high) | XL (high) | XL (high) | **합의** |
| S6 (로그 문구 3곳 수정, 동작 변화 없음) | Small (high) | Small (high) | Small (high) | **합의** |
| S7 (컬럼 추가 마이그레이션, prod 배포) | XL (high) | XL (high) | XL (high) | **합의** |
| S8 (간헐 실패, 원인 미상 조사) | Medium (med) | Medium (med) | Medium (med) | **합의** |
| S9 (의존성 minor 범프, lockfile, CI green) | Medium (low) | Medium (low) | Medium (low) | **합의** |
| S10 (파일 업로드: front+back, S3, 썸네일) | **XL (low)** | **Large (med)** | **Large (med)** | **불일치** |

### 3.2 불일치율 및 가장 갈린 시나리오

- **불일치율 = 1/10 = 10%** (3분류자 완전 합의 9건, 갈림 1건).
- 다만 "**낮은 신뢰도(low) 판정**"이 분리된 잠재 모호 지점: S4(A,C가 low), S9(셋 다 low), S10(A가 low). 즉 명목 불일치는 1건이지만 **합의했어도 신뢰가 낮은 경계 = 실질 모호 후보 3건(S4·S9·S10)**.

가장 갈린 Top 3 + 원인 정책 절:

1. **S10 — front+back 파일 업로드 + S3 + 썸네일 (유일한 명시적 불일치).**
   - 원인 절: XL 기준의 **"infrastructure" / "secrets" / "security" 트리거를 "명시"해야 하는가, "추론"해도 되는가**.
   - 분류자 A: "S3 storage = infrastructure이고 본질적으로 storage credential(secrets)과 untrusted-upload(security)를 수반" → 추론으로 XL.
   - 분류자 B/C: "시나리오가 production/deploy/auth/secret을 **명시하지 않음**" → 엄격 텍스트 독해로 Large, "S3 자격증명/배포가 스코프에 들어오면 escalate"라는 단서 부착.
   - 핵심: **외부 스토리지 연동이 자동으로 secrets/security XL 트리거를 켜는가**에 대한 결정 규칙이 없음.

2. **S4 — 공유 design-tokens 토큰 1개 변경 (합의하나 신뢰 low).**
   - 원인 절: **"low blast radius" + "localized edits"의 주관성**. 리터럴 값 1개 변경(=Small 신호)인데, 공유 패키지라 모든 consumer로 전파(=Small 탈락). Medium/Large 사이 타이브레이커(line 81–82 "reversible/local/directly-verifiable면 작은 쪽")를 적용해 Medium에 안착했으나, "공유 패키지 = 별도 ownership boundary/subsystem"으로 읽으면 Large도 방어 가능.

3. **S9 — 의존성 minor 범프, lockfile-only, CI green (합의하나 셋 다 low).**
   - 원인 절: **"need to inspect before deciding ⇒ 최소 Medium" 임계가 너무 쉽게 발동**. CI green + lockfile-only + revertible은 타이브레이커상 Small을 지지하는데, "의존성 상태 변경은 blast radius가 비국소"라는 이유로 Medium. 셋 다 "Small도 방어 가능"이라고 명시 — 임계가 모호.

### 3.3 에이전트가 더 필요로 하는 근거 (구체적으로 무엇이 부족한가)

1. **외부 인프라/스토리지 → XL 트리거 결정 트리 (S10).** "S3/object storage/외부 큐/CDN 연동은 (a) 새 자격증명(secrets)을 도입하거나 (b) 신규 prod 배포 경로를 만들 때만 XL, 그렇지 않고 기존 자격증명·기존 배포 경로를 재사용하는 multi-subsystem 기능이면 Large"와 같은 **"명시 vs 추론" 경계 규칙**과 worked example이 필요. 현재는 "infrastructure"라는 단어만 있고 어떤 인프라가 자동 XL인지가 없음.

2. **untrusted file upload = security 트리거인지 명문화 (S10).** "외부 사용자 업로드(파일/이미지/멀티파트)는 그 자체로 security 표면 → 최소 Large, 인증·결제·prod 저장과 결합되면 XL" 같은 임계. 지금은 "security"가 XL 리스트에 있지만 업로드가 거기 해당하는지 예시가 없음.

3. **"inspect-before-deciding ⇒ 최소 Medium"의 하한 예외 (S9).** "단, 변경이 lockfile-only이고 CI가 이미 green이며 revert가 lockfile 되돌리기로 끝나는 minor/patch 범프는, 검토 부담이 있어도 Small로 둘 수 있다(단 major 범프·런타임/엔진 변경·보안 패치는 최소 Medium)"는 **반례 임계**. 현재 규칙은 "검토 필요=Medium"이 너무 광범위해 routine 범프까지 끌어올림.

4. **공유 패키지 blast-radius의 정량 임계 (S4).** "shared/design-system/공용 util 패키지의 값 변경은 consumer 수와 무관하게, 동작 의미가 바뀌지 않고(렌더 값만) 되돌리기 쉬우면 Medium; 동작/계약(컴포넌트 API, 토큰 의미)이 바뀌면 Large"처럼 **'blast radius'를 '파일 수'가 아니라 '계약 변경 여부'로 환원**하는 결정 규칙.

5. **결제/auth/schema/prod 자동 XL은 이미 잘 작동.** S3·S5·S7에서 3분류자 high 합의 — **명시적 키워드 리스트(payments/auth/database schema/production)는 모호하지 않다.** 모호함은 전부 **"키워드가 명시되지 않고 추론해야 하는" 경계(인프라·security·blast-radius·inspect 임계)**에 집중. 따라서 보강은 이 4개 절에만 worked example/임계/결정 트리를 붙이면 충분.

### 3.4 발견별 정리

#### 발견 R-1 — 외부 인프라/스토리지의 XL 트리거 적용 규칙 부재

- **경로:** `.harness/policies/scenario-phase-routing.md` (XL criteria/Size Decision Rules의 "infrastructure"/"secrets"/"security" 절)
- **현재 목적:** prod/배포/auth/결제/schema/secrets/security 같은 고위험 표면을 XL로 라우팅.
- **발견한 문제:** "infrastructure"/"secrets"/"security"가 단어로만 있고, **명시되지 않은 위험을 추론해서 적용할지** 기준이 없어 S10에서 A(XL)와 B/C(Large)가 갈림.
- **근거:** S10 3분류자 splits — A "S3=infrastructure이며 secrets/security를 본질적으로 수반(추론)→XL", B/C "production/auth/secret 미명시→Large". 결제/auth/schema가 명시된 S3·S5·S7은 high 합의로 대조됨.
- **추천 조치:** **CONVERT(서술 → 결정 트리/worked example).** "외부 스토리지/인프라 연동 시: 신규 secrets 도입 또는 신규 prod 경로면 XL, 기존 자격증명·경로 재사용 multi-subsystem 기능이면 Large" 규칙 + S10을 worked example로 추가.
- **변경 시 위험도:** **LOW** (문서/라우팅 보강, 코드 무영향).
- **신뢰도:** 높음(splits가 단일 절에 수렴).

#### 발견 R-2 — "inspect-before-deciding=최소 Medium" 임계가 routine 변경까지 과대 분류

- **경로:** `.harness/policies/scenario-phase-routing.md` Size Decision Rules ("need to inspect before deciding makes the work at least Medium")
- **현재 목적:** 원인 미상·검토 필요 작업을 최소 Medium으로 끌어올려 신중 라우팅.
- **발견한 문제:** lockfile-only minor 범프(CI green, revertible)까지 Medium으로 올라가며, S9에서 3분류자 모두 "Small도 방어 가능"이라 신뢰 low.
- **근거:** S9 셋 다 confidence=low, ambiguityNote에 "defensible as Small"/"Small is defensible" 명기.
- **추천 조치:** **CONVERT.** "단, lockfile-only + CI green + revert=lockfile 되돌리기인 minor/patch 범프는 Small 허용; major/엔진/보안 패치는 최소 Medium" 반례 임계 추가.
- **변경 시 위험도:** **LOW.**
- **신뢰도:** 중간(임계 위치는 정책 작성자 합의 필요).

#### 발견 R-3 — "blast radius"가 파일 수/공유 여부로 해석돼 S4 신뢰 저하

- **경로:** `.harness/policies/scenario-phase-routing.md` Small Decision Rule("low blast radius")
- **현재 목적:** 광범위 영향 변경을 Small에서 제외.
- **발견한 문제:** 공유 패키지 토큰 1개 변경에서 "consumer가 많다=blast radius 큼"으로 읽혀 Medium/Large 사이에서 신뢰 low.
- **근거:** S4 A·C confidence=low, "Small/Large 둘 다 방어 가능" 명기.
- **추천 조치:** **CONVERT.** "blast radius는 파일 수가 아니라 '계약/동작 의미 변경 여부'로 판정 — 렌더 값만 바뀌고 되돌리기 쉬우면 공유 패키지여도 Medium, 컴포넌트 API/토큰 의미가 바뀌면 Large" 규칙 + S4 worked example.
- **변경 시 위험도:** **LOW.**
- **신뢰도:** 중간.

## 4. 권고 (우선순위순)

### P1 (HIGH-RISK, 안전 영향) — 가드 위험 테이블에 명령-위치 인식 추가
- **무엇:** `guardrails.mjs:1013`의 `checks.find` 직전에, 명령을 simple-command로 분할하고 각 simple-command의 `firstToken`이 읽기전용/텍스트-방출 allow-list일 때 위험 테이블 매칭을 스킵.
- **왜 통과 못 했나(핵심 질문에 대한 실측 답):** read-only allow-list(`SHARED_SKILLS_READONLY_TOOLS`)와 `firstToken()`은 **이미 같은 파일에 존재하고 공유-스킬 가드에서 쓰이지만**, 위험 테이블은 이를 **전혀 참조하지 않는다**(실측: `checks table references SHARED_SKILLS_READONLY_TOOLS? false`, `firstToken? false`). 즉 "이미 되어 있지 않아서"가 아니라 "되어 있는 걸 위험 테이블이 안 써서" 통과 못 함.
- **적용 시 안전 가드:** (a) firstToken 기준으로만 예외 — `psql`/`docker`/`kubectl`/`vercel`/`gh pr merge` 등 실행형 firstToken은 절대 allow-list에 넣지 않음. (b) redirect(`>`/`>>`)와 compound(`;|&&||`)는 기존 공유-스킬 가드처럼 simple-command별 독립 평가. (c) 회귀 게이트: D1–D13 전부 여전히 block, A1–B6 전부 allow를 CI 또는 hook 자체 테스트로 고정.
- **`gh pr` 처리:** 서브커맨드 토큰화로 `merge`만 차단, `create/edit/view/list/diff`는 본문 텍스트 매칭 비대상.
- **기대 효과:** 오버블록 13건 → 0건, false-negative 0건 유지.

### P2 (LOW-RISK) — 라우팅 모호 절 4곳에 worked example/임계/결정 트리
- 외부 인프라/스토리지 XL 결정 트리 + S10 예시 (R-1).
- "inspect=최소 Medium"에 lockfile-only minor 범프 반례 임계 + S9 예시 (R-2).
- "blast radius = 계약 변경 여부"로 환원 + S4 예시 (R-3).
- untrusted file upload = security 표면 명문화 (S10 보강).
- **위험도 LOW** — 문서/라우팅만 변경, 코드·안전 무영향. 명시적 키워드 절(payments/auth/schema/prod)은 이미 high 합의이므로 손대지 말 것.

## 5. 한 줄 요약 + 다음 액션 후보

- **한 줄 요약:** 가드는 위험은 100% 잡지만(FN 0) 정당한 읽기/텍스트 명령을 판별대상 기준 88% 과차단(이번 세션 2건 = A1·B6 재현) — 같은 파일에 이미 있는 read-only allow-list를 위험 테이블만 안 써서 생긴 문제이고, Size 라우팅은 10%(1/10)만 갈리며 그 모호함은 전부 "키워드 미명시 → 추론" 경계 4개 절에 집중된다.
- **다음 액션 후보:**
  1. (HIGH) `guardrails.mjs` 위험 테이블에 firstToken 기반 명령-위치 인식 도입 + D1–D13/A1–B6 회귀 배터리 고정 — **사용자 승인 후 별도 작업 브랜치에서.**
  2. (LOW) `scenario-phase-routing.md`에 R-1/R-2/R-3 worked example·임계·결정 트리 추가.
  3. (LOW) `skill-ownership-enforcement.md`의 "Known false positives"에 **danger-command 테이블의 substring 매칭 FP 클래스**를 추가 문서화(현재는 `.harness/skills` 리터럴 정규화 FP와 16KB cap만 적혀 있고 이 클래스는 누락).
