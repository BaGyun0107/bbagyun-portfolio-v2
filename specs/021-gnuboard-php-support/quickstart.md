# Quickstart: 검증 가이드

이 기능이 끝까지 동작함을 증명하는 실행 시나리오. 계약 세부는
[contracts/](contracts/) 참조.

## 사전 조건

- 이 레포(codi-harness-v2), 브랜치 `feat/gnuboard-php-support`
- `mise` 활성(Node 24)

## 1. 단위·계약 테스트

```sh
npm test                      # 신규 2개 + 기존 전체 회귀 (SC-004)
./harness rule-check
./harness context-check
./harness doctor
```

기대: 전부 통과. 특히 `profile-php-monolith.test.mjs`,
`codi-gnuboard-skill-contract.test.mjs`가 실행 목록에 보여야 한다.

## 2. 프로필 모드 실동작

```sh
./harness profile list        # php-monolith 줄 확인
```

임시 디렉터리에 프로필을 렌더해 check까지 통과하는지는 테스트가
검증한다(작업 레포의 프로필은 바꾸지 않는다).

## 3. 스킬 병합·제안

```sh
./harness skills-link         # .claude/skills/codi-gnuboard 링크 생성
echo '{"prompt":"그누보드 스킨 수정"}' | node .harness/hooks/skill-injector.mjs
```

기대: 인젝터 출력에 `codi-gnuboard` 제안 포함 (SC-005).

## 4. 다운스트림 시나리오 (수동, 파일럿 아님)

새 임시 레포에서: `apps/<mall>/`에 그누보드 사본 배치 →
`gitignore.gnuboard` 적용 → `git status`에 `data/`·`*.sql` 미노출
(SC-001) → compose 템플릿 기동 → 브라우저에서 초기 화면 확인
(SC-002). 도커 실행이 필요한 이 단계는 구현 후 검증 기록에 결과를
남긴다.
