# Quickstart: rules-local 검증 가이드

전제: 하네스 레포 루트, Node 24 (mise), npm ci 완료.

## V1. 단위·회귀 테스트

```sh
npm test
```

기대: 전부 통과 — project-owned 정합, update 적용 회귀(보존+안내,
distributed-stale 삭제 유지, 830 사고 형태 핀), skills-link rules 링크,
doctor 감지 포함.

## V2. 링크 배선 (US1)

```sh
mkdir -p .harness/rules-local
printf '# sample rule\n' > .harness/rules-local/qs-sample.md
./harness skills-link
ls -l .claude/rules/local/qs-sample.md   # 상대경로 심링크
./harness skills-link                     # 재실행 — 멱등 확인
rm .harness/rules-local/qs-sample.md
./harness skills-link                     # 고아 링크 정리 확인
```

## V3. 보존+안내 (US2) — 테스트 하네스 경유

update 적용 회귀 테스트가 임시 다운스트림 레포를 구성해 검증한다
(tests의 update 적용 테스트 참조). 수동 확인이 필요하면 임시 레포에서:
`.claude/rules/my-rule.md` 커밋 → update 적용 → 파일 보존 + stderr 이전
안내 확인, 이전 manifest 실재 stale은 삭제 확인.

## V4. Codex 진입점 (US3)

```sh
.harness/scripts/agent/agent-preflight.sh | grep -i rules-local
grep -n "rules-local" AGENTS.md
```

## V5. 품질 게이트

```sh
./harness context-check
./harness rule-check
./harness doctor
```

기대: 전부 통과(비차단 경고 제외). e2e는 비대상
(touches-user-flow=no — 사용자 플로우 변경 없음, 근거는
verification.md에 기록).

관련 문서: [contracts/cli-behavior.md](contracts/cli-behavior.md),
[data-model.md](data-model.md).
