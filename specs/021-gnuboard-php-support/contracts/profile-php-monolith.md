# Contract: php-monolith 프로필 모드

이 계약은 테스트(`tests/profile-php-monolith.test.mjs`)가 검증한다.

## CLI 계약 (`./harness profile`)

- `list` 출력에 `php-monolith: <description>` 1줄이 포함된다.
- `set php-monolith`는 `project-profile.yaml`을 렌더한다:
  - `mode: php-monolith`
  - `apps.front.enabled: false`, `apps.back.enabled: false`
    (path 필드는 기존 스키마 그대로 `apps/front`·`apps/back`)
  - `rules.php-monolith.forbidden_paths`에 `apps/front/**`·`apps/back/**`
  - `rules.php-monolith.owner_skill: codi-gnuboard`
- `check`는 위 렌더 결과에 대해 `ok: project profile php-monolith`로
  종료 코드 0. front/back enabled가 true로 바뀌면 실패한다.
- 기존 5개 모드의 `list/set/check` 출력·종료 코드는 변하지 않는다.

## 가드 계약 (`project-profile-guard.mjs`, Codex 어댑터 공유)

php-monolith 프로필에서:

| 툴 입력 | 결과 |
|---|---|
| `apps/front/**` 또는 `apps/back/**`를 대상으로 하는 Write/Edit/Bash | `decision: block` + codi-gnuboard/`apps/<mall>` 안내 문구 |
| `apps/<mall>/**` (front·back 외) 대상 | 통과 (차단 없음) |
| 읽기 전용/무관 명령 | 통과 |

기존 5개 모드의 차단/통과 행렬은 변경 없음(회귀 테스트로 고정).

## 인젝터 계약 (`skill-injector.mjs`)

- php-monolith 모드에서 `codi-backend`·`codi-frontend`는 키워드가
  매칭되어도 제안되지 않는다.
- `그누보드`/`gnuboard`/`php` 키워드 프롬프트에서 `codi-gnuboard`가
  제안된다(모드 무관 — 키워드 기반).
