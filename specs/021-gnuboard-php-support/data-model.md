# Data Model: 그누보드5 PHP 쇼핑몰 하네스 지원

파일 기반 구성 엔티티들의 필드와 관계. DB 없음.

## E1. 프로필 모드 레지스트리 항목 (`profile.mjs` modes)

| 필드 | 값 (php-monolith) |
|---|---|
| key | `php-monolith` |
| description | PHP 모놀리스(그누보드 등); Node 앱 표면 비활성, 몰 코드는 `apps/<mall>/` |
| apps.front | `{ enabled: false, owns: [] }` |
| apps.back | `{ enabled: false, owns: [] }` |
| guidance | codi-gnuboard 라우팅, apps/front·back 생성 금지, 몰 경로 안내 |

**검증 규칙**: `./harness profile check`가 front/back `enabled: false`
와 `forbidden_paths`(apps/front/**, apps/back/**)를 요구한다.

## E2. 렌더된 프로필 (`project-profile.yaml`)

- `mode: php-monolith`
- `apps.front/back`: 기존 스키마 유지(경로 고정, enabled false)
- `rules.php-monolith`: `forbidden_paths`, `owner_skill: codi-gnuboard`,
  notes(몰 코드 위치, Node 스킬 비라우팅)

**상태 전이**: `./harness profile set php-monolith`로만 전환. 전환은
ARCHITECTURE.md 또는 spec 기록이 필요(기존 정책 유지).

## E3. 공유 스킬 `codi-gnuboard`

```text
.harness/skills/codi-gnuboard/
├── SKILL.md            # frontmatter: name, description (트리거 어휘 포함)
└── resources/
    ├── docker-compose.gnuboard.yml
    ├── gitignore.gnuboard
    └── e2e-suite-example.sh
```

**관계**: skills-link가 `.claude/skills/`·`.agents/skills/`로 병합(양
런타임 노출). `skill-triggers.json`의 `codi-gnuboard` 항목이 키워드
제안을 만든다. e2e 게이트 태스크와의 관계는 참조 전용(소유는
codi-e2e).

## E4. 스킬 트리거 항목 (`skill-triggers.json`)

| 필드 | 값 |
|---|---|
| key | `codi-gnuboard` |
| keywords | 그누보드, gnuboard, 영카트, youngcart, php, `.php`, 쇼핑몰 온보딩, 몰 온보딩 |

## E5. path-scoped 룰 (`.claude/rules/php-monolith.md`)

- frontmatter `paths: ["**/*.php"]`
- 본문: codi-gnuboard 로드 지시, `apps/<mall>/` 관례, Node 전제 금지
- Codex 미러: `.codex/rules/php-monolith.rules` (상시 텍스트)

## E6. 가드 분기 (`project-profile-guard.mjs`)

| 모드 | apps/front 대상 | apps/back 대상 |
|---|---|---|
| php-monolith | block | block |
| 기존 5개 모드 | 기존 동작 불변 | 기존 동작 불변 |

인젝터(`skill-injector.mjs`): php-monolith에서 codi-backend·
codi-frontend 제안 스킵.
