# Verification Record: 020 rules-local 보장 경로

전 항목 검증 완료 (2026-08-07). 커밋: US1 7c62948, US2 410257f,
US3 726f7de + Polish. e2e 비대상: 사용자-facing 플로우 변경 없음(하네스
내부 도구), touches-user-flow=no.

- [x] V1 링크 배선 (SC-001, SC-004) — US1 테스트 GREEN (링크·멱등·고아
  정리·지연 생성), gitignore 등재, 실레포 skills-link 실행 확인
- [x] V2 보존+안내 (SC-002) — update 회귀: 미상 파일 보존 + rules-local
  이전 안내 stderr 확인 (사고 시나리오 재현 불가)
- [x] V3 distributed-stale 삭제 유지 (SC-003) — prior manifest 실재
  파일 삭제 + manifest 부재 시 전체 생략 fail-safe GREEN
- [x] V4 기존 회귀 불변 (SC-005) — 워크트리 전체 778/778 GREEN (830
  사고 형태 핀 포함)
- [x] V5 품질 게이트 4종 — npm test 779/779, context-check 0 실패/0
  경고, rule-check ok, doctor 실패 0 (경고 4는 워크트리 환경성:
  node_modules·Spec Kit 벤더 스킬 미설치·PATH 중복 — 본 변경 무관)

## 코드 리뷰 (2026-08-07)

리뷰어 서브에이전트 판정 "With fixes" → 반영 완료, Critical/Important
잔존 0건:

- Important #1·#2 (doctor FR-006): 기술 반박 + 부분 수용 — doctor
  문맥에서 prune-stale 출력은 정의상 전부 배포 이력 없는 파일이라 별도
  대조는 항등 연산. 대신 하네스 업스트림에서 힌트가 오도적인 문제를
  수용해 `is_harness_repo` 게이트 추가, 테스트를 drift 목록·힌트 별도
  단언으로 강화.
- Minor: dead 변수 pruned_any 제거, handled_file·prior_manifest_list
  trap 등재(오류 경로 임시파일 누수 해소), 고아 링크 정리 .md 한정.
- 반박: "manifest 없는 프로젝트마다 경고 소음" 지적은 오독 — 경고는
  stale 후보 존재 시(`[ -s "$stale_file" ]` 내부)에만 발화.
- 리뷰어 확인 사항: prior manifest 를 적용 루프 이전에 읽어 mid-apply
  덮어쓰기 오염이 없음, 타 호출자(update-check·doctor·pkg-sync) 회귀
  없음, lock 모드 materialize 경유 rules 링크 동작.

## Converge (2026-08-07)

1차 converge: partial 1건(plan 명시 lock 모드 링크 테스트 부재) →
T023 추가·구현(HARNESS_ROOT_DIR 재지정 테스트). 재평가: 잔여 갭 0건 —
Converged. 최종 전체 테스트 780/780 GREEN.

## 진행 기록

- 2026-08-07 T001 베이스라인: specs/020 추가로 카탈로그 정합 RED →
  카탈로그·관계·status.yaml 등록으로 해소 (하네스 관례: 카탈로그 spec ID
  재사용). 020 등록 후 카운트 20에서 정합 확인.
- 2026-08-07 외부 요인: 병행 세션이 specs/021-gnuboard-php-support 생성
  (카탈로그 미등록) → 카운트 유도 테스트 2건이 021 사유로 RED. 020
  범위 밖 — 021 세션이 등록해야 해소. 최종 게이트에서 재확인.
