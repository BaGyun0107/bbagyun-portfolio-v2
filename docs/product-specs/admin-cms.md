# Admin CMS

## Overview
관리자가 콘텐츠를 관리하고 사이트 설정을 제어하는 보호된 관리 영역

## 인증
- JWT + httpOnly Cookie 기반 로그인
- Edge Middleware에서 `/admin/**` 접근 시 토큰 검증
- 역할: Admin, Editor, Viewer

## Features

### Dashboard (`/admin`)
- 콘텐츠 통계 요약 (글 수, 문의 수 등)
- 최근 접속 로그

### Insights 관리 (`/admin/insights`)
- CRUD: 제목, 슬러그, 본문 (Markdown), 썸네일, 태그
- 상태 관리: draft / published
- 태그 관리

### Studies 관리 (`/admin/studies`)
- CRUD: 제목, 슬러그, 본문, 카테고리

### Features 관리 (`/admin/features`)
- CRUD: 제목, 슬러그, 설명, 기술 스택 (JSON), 표시 순서
- 드래그앤드롭 정렬 (React DnD)

### Contact Messages (`/admin/contact`)
- 수신 문의 목록
- 상태: UNREAD → READ → REPLIED

### Users (`/admin/users`)
- 사용자 목록, 역할 변경
- 상태: Active / Inactive

### Settings (`/admin/settings`)
- 사이트 이름, SEO 설명
- 유지보수 모드 토글
- API 버전

## Acceptance Criteria
- [ ] 비인증 접근 시 로그인 페이지 리다이렉트
- [ ] 역할별 접근 제어
- [ ] 모든 CRUD 작업 즉시 반영

<!-- MANUAL: Notes below this line are preserved on regeneration -->
