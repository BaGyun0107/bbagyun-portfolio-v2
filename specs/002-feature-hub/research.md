# Phase 0 Research: 기능 허브 + 기능정의 상태 flow

저장소 실태 조사로 Technical Context의 미해결 지점을 해소한다.

## 조사한 것

- 테스트 관례: `package.json`의 `test`는 `node --test tests/*.test.mjs`. 테스트는 루트
  `tests/`에 `*.test.mjs`로 둔다(예: `guardrails-fp-battery.test.mjs`).
- 의존성: devDependencies는 `husky`, `lint-staged`뿐. **YAML 파서 없음**, 런타임 의존성 0.
- mise 태스크: `[tasks.e2e]`, `[tasks."e2e:changed"]`가 존재하며 heredoc bash 본문을 씀.
- e2e 증거: `.harness/state/e2e-last-run`(= `git write-tree` staged tree hash),
  `.harness/state/touches-user-flow`(마커). e2e 통과 시 스탬프하고 마커를 내린다.

## 결정들

### D1. status 파일 포맷 — YAML 서브셋 (자체 파서) 대신 최소화

- **결정**: `status.yaml`은 유지하되, **평면적(flat) YAML 서브셋**만 허용하고 자체 미니
  파서로 읽는다. 중첩은 `history:` 리스트 한 곳뿐이고 형태를 고정한다. 새 의존성 도입 안 함.
- **근거**: 저장소에 YAML 파서가 없고 런타임 의존성 0 원칙(FR 제약)을 지켜야 한다. 필드가
  10개 미만이고 값이 스칼라/짧은 리스트라 완전한 YAML이 필요 없다.
- **대안 기각**:
  - `js-yaml` 추가 → 런타임 의존성 0 원칙 위반, 도구 하나 때문에 과함.
  - `status.json` → 사람이 손으로 편집하기 덜 친화적(주석 불가). YAML 서브셋이 가독성 우위.
- **파서 계약**: `key: value` 라인 파싱, `[a, b]` 인라인 리스트, `history:` 아래
  `- { at: ..., to: ... }` 라인. 허용 밖 구조는 경고하고 건너뛴다.

### D2. 테스트 위치 — 루트 `tests/`, `node:test`

- **결정**: 단위 테스트를 `tests/feature-hub-*.test.mjs`로 루트 `tests/`에 둔다. plan의
  `__tests__/` 표기를 저장소 관례에 맞춰 이렇게 조정한다.
- **근거**: `npm test`가 `tests/*.test.mjs`만 스캔한다. `.harness/scripts/docs/__tests__/`에
  두면 `npm test`에 안 잡힌다.
- **대상**: `tests/feature-hub-scan-md.test.mjs`, `-merge-registry.test.mjs`,
  `-transition.test.mjs`. lib는 `.harness/scripts/docs/lib/`에서 import.

### D3. 색인 대상 폴더 목록

- **결정**: 1차 색인 대상은 `README.md`, `docs/**/*.md`, `.harness/docs/**/*.md`,
  `specs/**/spec.md`. `node_modules`, `.git`, `archive`류는 제외.
- **근거**: 팀원이 실제로 찾는 문서가 이들이다. `.harness/docs/`에는 이미 배포/의존성/init
  가이드가 있고, `specs/`의 spec은 기능 이해 진입점.
- **확장성**: 대상 목록을 `build-hub.mjs` 상단 상수로 두어 나중에 조정 쉽게 한다.
- **카테고리 규칙**: 경로 접두어로 분류(`.harness/docs/`→"하네스 가이드", `docs/`→"프로젝트
  문서", `specs/`→"기능 명세", 루트 `README`→"진입점").

### D4. e2e 게이트 연동 방식

- **결정**: `transition.mjs`의 done 제안은 `.harness/state/e2e-last-run` 존재 + 해당 spec
  경로가 그 이후 변경 안 됨을 근거로 판단한다. 새 e2e 러너를 만들지 않고 기존 스탬프를 읽기만.
- **근거**: FR-011. 하네스가 이미 e2e 통과 시 staged tree hash를 스탬프한다. 도구는 그
  증거의 신선도만 본다.
- **주의**: 이 기능 자체는 사용자 대면 앱 플로우가 아니므로 `touches-user-flow`를 켜지 않는다.
  도구 검증은 통합 테스트(quickstart)로 한다.

### D5. mise 태스크 형식

- **결정**: `[tasks."docs:build"]`, `[tasks."feature:status"]`를 루트 `mise.toml`에 추가.
  `feature:status`는 실행 시각을 `date` 등으로 얻어 인자로 스크립트에 넘긴다(스크립트는 시각을
  직접 안 읽음 — 결정성).
- **근거**: 기존 태스크가 heredoc bash를 쓰고 `mise run <name>`으로 호출된다. 동일 패턴.

## 남은 NEEDS CLARIFICATION

없음. 모든 미해결 지점 해소됨.
