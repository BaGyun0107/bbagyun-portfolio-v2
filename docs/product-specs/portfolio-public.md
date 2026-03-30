# Portfolio Public Pages

## Overview
방문자가 포트폴리오, 블로그, 학습 기록을 열람하는 공개 페이지

## Pages

### 메인 (`/`)
- 포트폴리오 개요, 자기 소개
- 주요 프로젝트 하이라이트
- 최근 인사이트 미리보기

### Projects (`/projects`, `/projects/{slug}`)
- 프로젝트 목록 (카드 그리드)
- 상세: 기술 스택 (JSON), 설명, 스크린샷, 링크
- 정렬: displayOrder 기반

### Insights (`/insights`, `/insights/{slug}`)
- 블로그 글 목록 (published 상태만)
- 태그 필터링 (`/insights/tags`)
- 아카이브 (`/insights/archive`) — 월별 그룹핑
- 글 내비게이션 (이전/다음 글)
- Markdown 렌더링

### Study (`/study`, `/study/{slug}`)
- 학습 기록 목록
- 상세 페이지

### Contact (`/contact`)
- 문의 폼 (이름, 이메일, 메시지)
- 제출 시 `POST /api/v1/contact`

## Acceptance Criteria
- [ ] 모든 공개 페이지 SSR/RSC 렌더링
- [ ] SEO 메타 태그 적용
- [ ] 모바일 반응형
- [ ] 비공개 콘텐츠 접근 불가

<!-- MANUAL: Notes below this line are preserved on regeneration -->
