# Verification: 감사 후속 웨이브 (2차)

실행일 2026-08-03. 최종 수치는 Polish(T029)에서 확정한다.

## 체크리스트

- [x] US1 결정 집행 — 010 done 전이(철회 기록 보존), DEC-HARNESS-DETAIL-BACKFILL
      resolved(카탈로그-only), 설계 초안 git rm + 인용 교체, project-owned
      4경로 확장(3경로 정합성), manifest 323→319
- [x] US2 갱신 체인 — apply-version 단일 진입점(호출부 5곳), manifest 고아 0건
      회귀 신설 + docs 가이드 3건 링크 등재, update --check 문구 실동작화,
      init fallback 제거(명시 실패)
- [x] 실버그 수정 — node -e argv 전달로 migrate-plan isMain 오판 →
      keep-committed 목록 공백(조용한 무동작). env 전달로 교체
- [x] US3 테스트 견고화 — M-11(통합 real:true + 구버전 특성 고정),
      M-12(스킬 실디렉터리·skills-local 경계), M-13(유도 불변식 — 017 미등재를
      즉시 검출, 리터럴 수정 0개로 등재 해소), M-14(행위 검증 전환),
      M-15/16(prune 13개 테스트 분할 + cli-fixture 추출 + git init 격리 통일)
- [x] US4 LOW 마감 — L-1(테이블화+공용 fallback+기계 대조), L-2, L-6, L-7/8,
      L-10(스킬↔트리거 양방향 완전성), L-11, L-13, L-14, L-15
- [x] 전체 검증 — `npm test` 746/746 green(46.6s — 016 시점 ~48s 대비 비악화,
      SC-005), `./harness doctor` 실패 0(경고 1 = 머신 PATH 의 claude 중복,
      저장소 무관), manifest 321 files (2026-08-03)

## 잔여분 정리 (2026-08-03 추가 반영)

- [x] M-7: quality-gates 의 Planning Hub 강제 수준 절과 skill-ownership
      Enforcement 절을 영어로 이전, AGENTS.md 의 영어 규칙 대상 열거에
      `.claude/rules/`(references 포함)·`.codex/rules/` 추가, 레퍼런스 파일
      도입부 영어화. e2e 절에 잘못 밀려 있던 불릿 1건 원위치.
- [x] M-9 잔여: ARCHITECTURE 배포 절과 update-policy lock 항목에 팀원 표면
      (bootstrap, 인덱스 불변) vs 소유자 표면(prune --apply) 경계 명시.
- [x] M-15 잔여: init-project 테스트 10건을 tests/init-project.test.mjs 로
      분할 — 전체 스위트 46.6s → 44.0s. describe 그룹핑은 채택하지 않음:
      파일 분할 + `--test-name-pattern` 으로 선택 실행이 이미 가능해
      대규모 들여쓰기 churn 대비 실익이 없다 (의도적 미채택).

## 범위 메모
- harness.lock.example 의 "주석 포함 두 형태"(specs/005 T002 원문)는 JSON 이
  주석을 지원하지 않아 채택 불가 — repo 필드 반영 + packaging-guide 병기로
  갈음 (감사 L-13 주의사항 준수).
- D-6(temp 5.3GB)은 레포 밖 머신 정리로 기집행: 83,735개 삭제, 약 5GB 회수.
