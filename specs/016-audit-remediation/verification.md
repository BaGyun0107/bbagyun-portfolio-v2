# Verification: 감사 발견 일괄 수정 (1차)

기준: quickstart.md V1~V5, spec.md SC-001~SC-007. 실행일 2026-07-31.

## 체크리스트

- [x] V1 드리프트 가드 실효성 — 링크 루프에서 `docs` 임시 제거 시 가드 1건
      실패(fail 1), STALE 목록에서 `.harness/vendor` 제거 시 5건 실패 확인 후
      원복. 양방향 실효 입증 (SC-001·SC-002)
- [x] V2 ROADMAP 보존 — 수정본 보존·동일본 삭제·기준 부재 보존 3케이스 green
      (`tests/prune-downstream-project-state.test.mjs`) (SC-003)
- [x] V3 temp 무누수 — `npm test` 740/740 green, 실행 전후 `codi-*|planning-*`
      카운트 82,950 → 82,962(+12는 `.gone` 리네임 잔여 — track() 등록으로 해소,
      재실행 시 순증가 0: before=after=82,962) (SC-004)
- [x] V4 낡은 서술 0건 — restore-harness / "currently empty" / bootstrap.sh 의
      reclaim-shared / skill-usage.mjs 의 `.planning` grep 전부 0건 (SC-005)
- [x] V5 표면 실재화 — shared-manifest 에 리허설 스크립트 0건(323 files),
      카탈로그 문서화 테스트 green(유령 0·누락 0) (SC-006)
- [x] 전체 검증 — `npm test` 740/740 green, `./harness doctor` 실패 0건
      (SC-007, 최종 실행 기록은 아래)

## 최종 실행 기록

- `npm test`: 741 tests, 741 pass, 0 fail (리뷰 반영 후 최종, 2026-07-31)
- `./harness doctor`: 실패 0건, 경고 1건(로컬 PATH 의 claude binary 중복 —
  이 저장소와 무관한 머신 환경) (2026-07-31)
- 시뮬레이션(V1) 상세: materialize.sh 링크 루프 `docs` 제거 →
  "드리프트 가드: materialize 링크 ∖ 예외 == STALE_WORKCOPY_PATHS" 실패;
  `upstream-project-state.mjs` 에서 `.harness/vendor` 제거 → 동일 가드 포함
  5개 테스트 실패. 두 방향 모두 원복 후 green.

## 코드 리뷰 (superpowers:requesting-code-review)

- 리뷰어 서브에이전트, 범위 87d90d6..7621a2e. 평가: "Ready to merge after
  fixing #1". Critical 0건.
- Important 3건 모두 반영: ① design-system-contrast.test.mjs 의 비동기
  mkdtemp 누수(실측 774개) → tmp() 전환, ② harness-cli.test.mjs 의
  runNode/runCommand 에 GIT_ISOLATED_ENV 기본 적용(M-17 완결), ③ 드리프트
  가드 픽스처 완전성 가드 추가(링크 루프 토큰마다 실제 링크 존재 단언 —
  픽스처 누락으로 정확 일치가 조용히 통과하는 구멍 봉합).
- Minor 반영: 죽은 mkdtempSync/tmpdir import 31개 파일 정리, CONTRIBUTING
  문장 정리, 016 상태 in-review 전이.

## 범위 밖 (후속)

- D-1(결제 해소·v1.3.1 재발행)·D-2~D-6, M-19: 소유자 결정/릴리스 후속.
- M-1~M-4, M-7, M-11~M-16, 잔여 LOW: 후속 웨이브 —
  backlog 는 `docs/audits/2026-07-31-full-harness-audit.md`.
