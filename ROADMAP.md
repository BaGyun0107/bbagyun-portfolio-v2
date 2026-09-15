# Portfolio Roadmap

## Completed

- [Codi Harness 포트폴리오 상세 개선](specs/002-codi-harness-portfolio-detail/spec.md)
  — 하네스 구조화 상세, 두 스윔레인과 네 인사이트 구현 및 수렴 완료. 기능 범위 검증은
  통과했으며 저장소 전역 lint 기준선의 기존 불일치는 검증 기록에 잔여 상태로 남겼다.
- [연결형 스윔레인 재설계](specs/003-connected-swimlane-redesign/spec.md)
  — 하네스의 설계·검증 및 변경·배포 흐름을 연결형 SVG로 재구성하고, 전체 흐름 설명,
  예외 대응, 키보드 탐색, 명암 대비와 근거별 지표 범위 계약을 구현·검증·수렴 완료했다.
  저장소 전역 lint 기준선의 기존 불일치는 기능 검증 기록에 분리해 남겼다.
- [Codi Harness 콘텐츠 보강 및 인사이트 통합](specs/004-codi-harness-content-consolidation/spec.md)
  — 작업물 상세에 네 대표 설계와 도구 전환 판단을 복원하고, 짧은 인사이트 네 개를
  하나의 8단계 발전 서사로 통합했다. 기존 스윔레인·지표·레거시 작업물과 인프라 글을
  보존했으며 제거 경로의 HTTP 404, fresh E2E 16/16과 명세 수렴을 확인했다. 저장소 전역
  lint 기준선과 장기 실행 개발 서버의 route-config 갱신 한계는 검증 기록에 분리했다.

- [한마음과학원 법문검색 구조화 상세 이전](specs/005-hanmaum-search-detail/spec.md)
  — 두 번째 작업물을 하네스와 같은 구조화 상세 계약으로 이전했다. 검색 응답
  개선을 측정 근거와 함께 표기하고, 인터뷰에서 사실과 다르다고 확인된 서술
  세 건(최소 토큰 길이 강제, 파싱 실행 위치, 외부 검색 엔진 배제 사유)을
  상세와 연결 인사이트 양쪽에서 정정했다. 적재 실패·복구와 검색 처리 두
  스윔레인을 추가했으며, legacy 목록과 구조화 목록을 새 상태로 재고정했다.
  리뷰의 Critical 1건은 명세 가정을 바꿔 이번 범위에 포함해 해소했다.

- [블랙스톤 벨포레 리조트 구조화 상세 이전](specs/006-blackstone-belleforet-resort/spec.md)
  — 기존 그누보드 자산 위의 신규 구축과 1인 백엔드 주도 사실을 유지하면서,
  인터뷰에서 바로잡은 결제·인증·API Key 서술 6종을 구조화 상세와 연결 인사이트에
  반영했다. 근거 등급이 분리된 지표 4개와 결제·보상취소 스윔레인 1개를 추가하고,
  구조화 3개·legacy 5개·전체 8개 경로 및 fresh E2E 31/31을 검증했다.

- [포트폴리오 콘텐츠 작성 규칙과 인사이트 계약](specs/007-portfolio-content-authoring/spec.md)
  — 작업물·공부 기록·인사이트를 함께 검토하는 project-owned rule/skill을 만들고,
  프로젝트 사례형 7개와 기술 탐구형 1개, 총 8개에 출처·의미·근거·시각 자료 필요성 계약을
  적용했다. 하네스·The Siena·한마음·블랙스톤·Vercel 연결 글의 사실 경계를 정정하면서 legacy
  인사이트 10개를 보존했다. The Siena 로그 분리 글은 2026-08-26 사용자 승인 후속으로
  초기 7 migrated / 11 preserved 범위를 현재 8 migrated / 10 preserved, 7:1 분포로 확장했다. 후속 인터뷰에서는 Cloudflare Tunnel 실패와 Bastion 권한
  경계를 구분하고 9개 프로젝트·5대 서버라는 사용자 보고 운영 범위를 반영했다. Jenkins
  후속에서는 기존 설정 소유권, matrix 배포 단위 재설계, 비용·실패 격리·15→3 화면 관찰의
  경계를 승인 문안과 영구 계약으로 고정했다. 고정 skill 평가 45/45와 Jenkins 후속 Vitest
  175/175, production E2E 60/60을 확인했다. 최종 후속 T055~T057에서는 작업물의
  `fail-fast: false`를 미시험 취소 경계 의도로 정정하고, 양방향 Tab 탐색 및 공부 기록의
  승인 Jenkins link 제목을 영구 계약으로 고정했다. 현재 focused Vitest 155/155, full Vitest
  177/177, TypeScript·scoped ESLint, production build 38/38 및 실제 Tab 탐색을 포함한
  production E2E 60/60을 확인했다. 최종 수렴은 F1 The Siena 범위 모순을 현재
  8 migrated / 10 preserved / 7:1로 조정하고 F2 stale visual fixture를 `provided / timeline`으로
  맞춘 뒤 **✅ Converged**(45 FR / 10 SC / 21 AC / 9 edge / 20 plan decisions / 5 constitution,
  finding 0건)를 확인했다. T001~T057은 모두 checked이고 `tasks.md` SHA-256은
  `2538f57da4fab8c6df94d44a031d17af1f008f528731cb48f768dda8a5478598`다.
  `feature:status:sync` task 부재로 자동 상태 전이는 주장하지 않는다. 기존 전역 formatting
  baseline은 검증 기록에 분리했다.

- [반응형 스윔레인 뷰어](specs/008-responsive-swimlane-viewer/spec.md)
  — 구조화 작업물 4개·스윔레인 6개의 공개 문구를 유지하면서 본문 가로 스크롤을
  제거하고 같은 데이터를 사용하는 `크게 보기` Dialog를 추가했다. 네 방향 anchor,
  둥근 직교 경로, 작은 화살촉, 긴 한글 라벨과 node 충돌 방지를 공통 기하 계약으로
  구현했다. 후속 가독성 작업에서는 inline/Dialog 각각의 실제 폭으로 node·row·label을
  다시 계산하고, 경로 길이 50% label과 충돌 시 최소 세로 track, 최대 3줄 폴백을
  적용했다. 마지막 곡률이 화살촉 앞 수직 직선 10px를 침범하지 않도록 모든 반응형
  경로의 도착 규칙도 통합했다. 사용자 화면 피드백 후에는 장애물 판정을 실제 진행 행
  구간으로 제한하고 모든 특수 경로에 비연결 node 교차 검사를 적용해 먼 행으로 역주행하며
  node 문구를 관통하던 회귀를 제거했다. 마지막 분기 가독성 보완에서는 Harness의 두
  `배포 중단` 도착 변을 승인 방향으로 교환하고, 같은 판단에서 같은 결과 행으로 갈라지는
  경로를 목적지 좌→우 순서의 별도 통로로 배치했다. 같은 lane의 경로는 수직 직선으로
  유지한다. 후속으로 시크릿 불일치선이 `배포 중단` node를 가리지 않도록 아래쪽 변으로
  정정하고, 같은 행의 가로 출발·세로 도착 경로가 target 바깥을 거쳐 진입하는 공통
  규칙을 추가했다. TypeScript·scoped ESLint, 전체 Vitest 231/231, production build 38/38,
  별도 포트 production E2E 75/75와 새 Harness·Blackstone 화면 검사를 통과했다.
  34 FR·18 SC·24 acceptance·15 research 결정과 5개 헌법 원칙의 최종 수렴 finding은
  0건이다. `feature:status:sync` task 부재로 자동 상태 전이는 주장하지 않는다.

- [하이패스 B2B 플랫폼 구조화 상세와 연결 인사이트 정정](specs/009-hipass-structured-detail/spec.md)
  — 전화·팩스·카카오톡 주문과 계좌이체에 의존하던 화훼 거래를 온라인화한 작업물의
  백엔드 단독 책임과 프론트엔드 2인 협업 범위를 구조화 상세로 이전했다. 월 주문·결제·정산
  규모에는 단위·시점·관찰 한계를 붙였고, 주문 DB 실패 뒤 서버 rollback·결제 취소 요청과
  취소 성공/실패를 구분하는 스윔레인 1개를 제공한다. 연결 인사이트 두 건은 DB 상태와 JSON
  재처리 입력, 공용 Room과 화원별 User Room의 전달 범위라는 서로 다른 질문으로 정정했다.
  독립 리뷰 Critical·Important 0건, 전체 Vitest 267/267, production build 38/38,
  하이패스 포함 7개 inline/Dialog bbox와 양방향 키보드 탐색 production E2E 50/50을 확인했다.
  최종 수렴은 31 FR·8 SC·20 acceptance·9 edge·14 plan 결정·5 constitution finding 0건이다.
  `feature:status:sync` task 부재로 상태는 수동 완료 처리했다.

- [호텔 예약 플랫폼 구조화 상세와 연결 인사이트 정정](specs/010-hotel-reservation-platform/spec.md)
  — 호텔별 조건 분기가 누적된 단일 코드베이스를 1차 설정 중심 구조와 2026년
  `core`·`rsConfig`·`platform` 경계로 발전시킨 과정을 구조화 상세로 이전했다. 3인 협업과
  사용자 책임, 플랫폼별 빌드·호텔별 배포 유지, 운영 배포 전 패리티 누락 발견과 수동 이식,
  예약 라우터 Context와 NICEPAY 복귀의 실제 범위를 과장 없이 구분했다. 작업물 스윔레인
  1개와 코드 배치 data-flow, 예약 상태 before-after를 서로 다른 질문으로 제공하며
  320·768·1024·1440px의 실제 요소 겹침을 검사한다. 전체 Vitest 291/291, production build
  38개 페이지, production E2E 60/60과 독립 리뷰 Critical·Important 0건을 확인했다. 최종
  수렴은 38 FR·9 SC·20 acceptance·9 edge·11 research 결정·5 constitution finding 0건이다.
  `feature:status:sync` task 부재로 상태는 수동 완료 처리했다.

- [Archify 스윔레인 파일럿](specs/011-archify-swimlane-pilot/spec.md)
  — 호텔 예약 플랫폼의 기존 React 미리보기와 `크게 보기`를 유지하면서, 승인된 동일
  10개 단계·12개 관계를 Archify standalone viewer로 새 탭에서 비교할 수 있게 했다.
  편집 가능한 JSON 원본과 self-contained HTML을 함께 보존하고, canonical 4개 lane을
  의미 손실 없이 3개 presentation band로 표현하는 exact parity 계약을 고정했다. Archify
  구조 검사 9/9·error 0·warning 0, 전체 Vitest 308/308, production build 38개 페이지,
  production E2E 47/47과 네 viewport 이미지 검토를 통과했다. 최종 수렴은 32 FR·11 SC·
  16 acceptance·10 edge·10 research 결정·5 constitution finding 0건이다. 기존 1104 dev
  server는 보존했고 `feature:status:sync` task 부재로 상태는 수동 완료 처리했다.

- [Archify 스윔레인 임베드 전환](specs/012-archify-swimlane-embed/spec.md)
  — 호텔 예약 플랫폼의 한 스윔레인만 실제 동결 Archify HTML로 전환했다. 작은 보기는
  10개 단계·12개 관계의 전체 topology를 유지하는 지연 MAP 구조 미리보기, 기존
  `크게 보기`는 같은 artifact의 READ 표현으로 제공하며 Viewer 기능과 새 탭 동작은
  제거했다. 1024px 미만 Dialog에는 기존 구조화 데이터에서 파생한 단계·관계 transcript를
  함께 제공해 무스크롤 topology와 문구 판독을 분리했다. layout 안정화, network·DOM·timeout
  fallback과 theme observer cleanup을 보완한 뒤 전체 Vitest 319/319, TypeScript·scoped
  ESLint, production build, 별도 포트 production E2E 24/24와 독립 리뷰 Critical·Important
  0건을 확인했다. 최종 수렴은 34 FR·12 SC·16 acceptance·12 research 결정·5 constitution,
  finding 0건이다. `feature:status:sync` task 부재로 상태는 수동 완료 처리했다.
  T001~T048은 모두 checked이고 `tasks.md` SHA-256은
  `3ff6fff62833d58411734c5740a74f1a79f76663d0bfd408c9b90e0505a5db6a`다.
  사용자 승인 후속으로 실제 embed에서 구분되는 기본색 실선과 예외색 점선의 의미를 작은 보기와
  `크게 보기`에 공통 범례로 추가하고, 모바일 transcript의 예외·복구 관계도 명시했다. 이어서
  `검증 통과` 강조 관계의 선과 라벨이 서로 다른 색상 변수를 사용하던 문제를 같은 강조색으로
  보정하고 기본·light·dark iframe computed color 일치를 확인했다.

- [전체 Archify 스윔레인 전환](specs/013-archify-all-swimlanes/spec.md)
  — 기존 8개 스윔레인의 작은 보기와 `크게 보기`를 실제 Archify artifact로 통일하고,
  승인된 단계·관계·정상·예외 의미와 React fallback을 보존했다. 후속 기술 부채로 남아 있던
  6개 standalone viewer의 세로 overflow는 canonical 책임을 추적 가능한 presentation band로
  압축하거나 SSO 4개 lane의 시간 순서와 회귀 경로를 재배치해 해소했다. 6개 source 모두
  Archify 구조 검사 9/9·오류 0·경고 0, 1440×900·2048×1320 light/dark 24장 자동·사람 검토,
  전체 Vitest 443/443, TypeScript·scoped ESLint, production build 38개 페이지와 별도 포트
  production E2E 21/21을 통과했다. 최종 수렴 finding은 0건이고 사용자 소유 1104 서버는
  유지했다. `feature:status:sync` task 부재로 상태는 수동 완료 처리했다. T001~T048은 모두
  checked이고 `tasks.md` SHA-256은
  `24b6f00ce57c135dc7c71c7f5c34489917164d3ba74cd4341cfa829895317d49`다.

- [골프 예약 시스템 구조화 상세 이전](specs/014-golf-reservation-structured-detail/spec.md)
  — 입사 후 첫 프로젝트에서 이미 정해진 구조 안의 예약 화면·PHP 요청 처리·외부 PMS 연동·
  중복 방어·통신 로그 기록을 FE/BE 범위 모두 단독 구현한 책임과, 이후 업무 DB의 통신 로그를
  `syslog`로 분리한 운영 판단을 구분해 공개했다. 최초 구축 `2023.05 – 2023.06`, 2023년 오픈
  이후 현재까지의 유지보수, 장애 조사 당시 직접 확인한 수백만 건 로그를 근거 종류·시점·한계와
  함께 고정했다. 예약 정상 경로와 2초 동일 세션 중복 차단, PMS 5xx, 30초 timeout을 한 Archify
  스윔레인으로 제공하고 기존 로그 분리 인사이트와 양방향 연결했다. 전체 Vitest 336/336,
  TypeScript·scoped ESLint, production build 38/38, 별도 포트 production E2E 50/50과 최종 정정
  대상 8/8, 320·1440px 수동 화면 검토를 통과했다. 최종 수렴은 34 FR·8 SC·16 acceptance·
  10 edge case·12 설계 결정·5 constitution finding 0건이다. `feature:status:sync` task 부재로
  자동 상태 전이는 주장하지 않는다. T001~T046은 모두 checked이고 `tasks.md` SHA-256은
  `fc696b80430b6fab0e55b29fb6add1915b2836127bd744d97843e5e50634a8a4`다.

- [행사 호텔 예약·결제 통합 플랫폼 구조화 상세 이전](specs/015-integrated-reservation-structured-detail/spec.md)
  — 1인 백엔드와 PM·PL 책임, 고객사 스테이징 UAT와 PG 테스트 결제, 정식 운영 전 보류 및
  미완성 범위를 구분해 공개했다. 고객사 UAT 예약·결제 workflow와 Core Product 관계도를
  서로 다른 질문의 Archify 자료로 제공하고, Middleware·Guard, Next.js reverse proxy·BFF,
  HTTPS 비밀번호 전송 경험을 세 canonical 인사이트로 정리했다. 기존 BFF 주소는 실제 HTTP
  308로 보존했으며 두 인사이트에는 before/after, HTTPS 글에는 승인된 무시각 판정을 적용했다.
  전체 Vitest 443/443, TypeScript·scoped ESLint, production build 38/38과 계획된 다섯 파일의
  production E2E 89/89 및 320·1440px 수동 화면 검토를 통과했다. 이 E2E에는 Feature 015,
  공통 인사이트, 기존 구조화 상세, 열 개 Archify preview/Dialog와 iframe 실패·timeout fallback이
  포함된다. 최종 수렴은 58 FR·12 SC·18 acceptance·15 edge case·5 constitution finding 0건이다.
  Spec·Quality 최종 리뷰는 모두 PASS이고 T001~T058은 전부 checked이며 `tasks.md` SHA-256은
  `fd6437a8e1991777cad09fb27039b215911b4473a0c1ad8dff428e3c2279aa8a`다.
  `feature:status:sync` task 부재로 자동 상태 전이는 주장하지 않는다.

## Next interviews

현재 목록의 작업물 8개는 모두 인터뷰와 구조화 상세 이전을 완료했다. 새로운 작업물을
추가할 때도 인터뷰를 먼저 완료하고, 공개 가능한 데모가 확인된 경우에만 데모 링크를 추가한다.

### 완료한 인터뷰

- 골프 예약 시스템 (2026-08-21) — 첫 프로젝트·정해진 구조 안 FE/BE 단독 구현과 운영 로그
  분리 판단을 구분하고, 예약 정상·예외 스윔레인 및 연결 인사이트와 함께 구조화 상세로 이전했다.
- 한마음과학원 법문검색 (2026-08-24) — 백엔드 단독 담당이 사실과 일치해 구조화
  상세로 이전했다.
- 블랙스톤 벨포레 리조트 (2026-08-24) — 모든 설계를 혼자 맡은 1인 백엔드 주도
  사실을 유지하고, 신규 구축·결제 장애·API Key 발견 순서를 정정해 구조화 상세로
  이전했다.
- 중앙 회원 관리·인증 서버 (2026-09-01) — 하나의 HiPass 서비스에 적용한 중앙 회원 관리
  범위와 UUID 기반 연결·운영 조회 한계, Provider 키 캐시 경계를 확인해 구조화 상세로 이전했다.
- 하이패스 B2B 플랫폼 (2026-09-04) — 백엔드·프론트엔드 책임, 결제 보상과 정산 재처리,
  Socket.io 전달 범위 및 2026년 6월까지의 운영 관찰을 확정해 구조화 상세로 이전했다.
- 호텔 예약 시스템 플랫폼화 및 구조 고도화 (2026-09-09) — 1차 설정 중심 구조와 2026년
  `core`·`rsConfig`·`platform` 리빌딩, 플랫폼별 빌드·배포 유지, 패리티 검증과 예약 Context,
  NICEPAY 복귀 범위를 확정해 구조화 상세로 이전했다.
- 행사 호텔 예약·결제 통합 플랫폼 (2026-09-15) — 1인 백엔드·PM/PL 역할, Core Product와
  재고·PG 경계, reverse proxy 및 인증 회고, 고객사 스테이징 UAT와 정식 운영 전 보류 범위를
  확정해 두 작업물 시각 자료와 세 연결 인사이트로 이전했다.

## Workflow note

현재 저장소에는 `feature:status:sync` mise task가 없어 자동 상태 동기화를 실행할 수 없다.
기능 상태는 이 문서와 `specs/<NNN-feature>/tasks.md`의 체크 상태를 기준으로 수동 관리한다.
