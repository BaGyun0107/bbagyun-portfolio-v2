// prisma/data/insights.ts
// 실제 인사이트(Insight) 데이터를 이 파일에서 관리합니다.
// 새 글 추가 시 아래 배열에 객체를 추가하세요.

// 제목
// 요약 (excerpt, 1~2문장)
// 본문 내용 (마크다운 가능)
// 날짜
// 태그 (예: Backend, Architecture)
// 예상 읽기 시간
// featureSlug

import type { InsightEditorialMetadata, InsightVisual } from './types/insight.dto';

export type SeedInsight = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: Date;
  tags: string[];
  readTime: string;
  featureSlug?: string;
  studySlug?: string;
  editorial?: InsightEditorialMetadata;
  visual?: InsightVisual;
};

export const REAL_INSIGHTS: SeedInsight[] = [
  {
    slug: 'codi-harness-dx-platform-design',
    title: 'DX 하네스 v2: 복사형 도구에서 사내 개발 운영 플랫폼까지',
    excerpt:
      'Jenkins 제거에서 시작한 하네스가 파일 복사의 한계를 넘어 소유권 경계, CLI 진단, AI 정책 집행과 멀티 세션 실험을 갖춘 사내 개발 운영 플랫폼으로 발전한 과정입니다.',
    date: new Date('2026-06-08'),
    tags: ['DevOps', 'DX', 'GitHub Actions', 'Infisical', 'AI Agent', 'CI/CD'],
    readTime: '9 min',
    featureSlug: 'codi-harness-dx-platform',
    editorial: {
      type: 'project-case',
      visualAssessment: {
        decision: 'provided',
        kind: 'timeline',
        rationale:
          '하네스가 Jenkins 제거에서 복사형 v1, CLI와 패리티 검증, 계획 정본화, 패키징과 멀티 세션 실험으로 발전한 단계를 시간 순서로 제공합니다.',
        question: '하네스는 Jenkins 제거에서 검증 가능한 사내 개발 운영 플랫폼까지 어떻게 발전했는가?',
        textAlternative:
          'Jenkins 제거에서 출발해 v1 복사, CLI와 doctor, Claude Code·Codex 패리티, Spec Kit 계획 정본화, harness.lock 패키징, 감사·릴리스 게이트, 멀티 세션 실행 격리 실험으로 발전했습니다.',
        nonDuplicationReason:
          '작업물은 현재 설계·개발·검증과 CI/CD·시크릿·배포 스윔레인을 보여 주고, 인사이트는 하네스가 단계별로 발전한 시간 관계를 보여 줍니다.'
      }
    },
    content: `## 규칙 문서가 아니라 같은 행동을 만드는 하네스

공통 정책과 소유권 경계, \`./harness\` CLI와 doctor, Claude Code·Codex의 규칙 집행 방식, 회귀 검증과 패키징 구조까지 직접 설계하고 구현했습니다.

Spec Kit·Superpowers·Playwright MCP는 제가 만든 도구가 아닙니다. 각 도구의 역할을 구분하고, 하나의 작업 흐름과 검증 기준 안에서 동작하도록 선택하고 통합했습니다.

하네스를 만들며 가장 중요하게 본 질문은 다음과 같았습니다.

> 규칙이 문서에 존재하는 것을 넘어, 어떤 AI 에이전트와 세션을 사용하더라도 같은 지점에서 멈추고 같은 검증을 수행하게 만들 수 있는가?

결론부터 말하면 같은 규칙을 여러 파일에 복사하는 것만으로는 충분하지 않았습니다. Claude Code와 Codex는 규칙을 읽는 위치, hook을 호출하는 시점, 명령을 해석하는 방식이 달랐습니다. 그래서 규칙의 완성 기준을 문서의 동일성이 아니라 같은 상황에서 같은 행동이 검증되는 상태로 바꿨습니다.

## Jenkins 제거에서 반복 가능한 개발 운영으로

처음 목적은 Jenkins 서버와 플러그인을 직접 관리해야 하는 부담을 줄이는 것이었습니다. 여러 프로젝트가 같은 서버와 배포 대기열을 사용했고, 환경변수도 Jenkins UI에 모여 있어 어떤 프로젝트와 환경의 값이 실제 배포에 사용되는지 추적하기 어려웠습니다.

GitHub Actions와 Infisical로 옮기면서 서버 운영과 시크릿 관리 문제는 줄일 수 있었습니다. 그러나 workflow와 설정 파일을 프로젝트마다 복사하고, 저장소 구조·브랜치·환경·시크릿 경로를 사람이 다시 판단한다면 Jenkins만 제거됐을 뿐 반복 작업은 그대로 남습니다.

그래서 목표를 CI 도구 교체에서 확장했습니다. 프로젝트를 시작하고, 계획하고, 구현하고, 검증하고, 배포하는 과정을 같은 기준으로 반복할 수 있는 운영 구조를 만들기로 했습니다. Jenkins 전환과 Infisical의 상세 구성은 각각의 별도 심화 인사이트에서 다루고, 이 글은 그 이후 하네스 구조가 어떻게 발전했는지에 집중합니다.

## 하네스는 어떻게 발전했는가

\`\`\`text
Jenkins 제거와 배포 자동화
  → v1 공통 파일 복사·동기화
  → ./harness CLI와 doctor
  → Claude Code·Codex 규칙 집행과 패리티 검증
  → Spec Kit·Feature Hub 기반 계획 정본화
  → harness.lock·버전 캐시·소유권 경계
  → 감사·회귀 테스트·릴리스 게이트
  → 멀티 세션 실행 격리 실험
\`\`\`

초기에는 배포 자동화에서 시작했지만, 실제 프로젝트에 반복 적용하면서 설치·업데이트·규칙 집행·계획 상태·검증·세션 운영까지 범위가 확장됐습니다. 마지막 멀티 세션 단계는 모든 프로젝트에 적용되는 핵심 기능이 아니라 제한된 프로젝트에서 검증한 운영 실험입니다.

## v1: 파일을 복사하면 시작은 쉽지만 변경을 전파하기 어렵다

v1에서는 공통 정책과 skill을 각 프로젝트 저장소에 복사했습니다. 프로젝트 하나를 처음 준비할 때는 필요한 파일이 저장소 안에 모두 있어 이해하기 쉬웠습니다.

하지만 약 2개월 동안 사용하면서 프로젝트마다 공통 파일의 버전이 달라지는 문제가 생겼습니다. 규칙을 개선해도 이미 만들어진 프로젝트에는 자동으로 전달되지 않았고, 같은 변경을 여러 저장소에 다시 복사하고 커밋해야 했습니다.

이 경험을 통해 재사용의 기준을 바꿨습니다. 재사용은 같은 파일을 여러 프로젝트에 복사하는 것이 아니라, 공통 변경을 각 프로젝트의 소유권을 침범하지 않고 안전하게 전파할 수 있는 구조여야 했습니다.

## CLI와 doctor: 사람이 기억하던 절차를 실행 가능한 계약으로

파일을 배치하는 것만으로는 신규 프로젝트와 기존 프로젝트를 같은 상태로 만들 수 없었습니다. 프로젝트 구조, 패키지 매니저, 브랜치와 환경 매핑, 시크릿 연결, AI 규칙과 skill 경로를 사람이 직접 확인하면 작업자와 세션에 따라 순서와 결과가 달라질 수 있었습니다.

\`./harness\` CLI는 이 절차를 하나의 진입점으로 묶습니다. 프로젝트 profile에 따라 허용 경로, 패키지 매니저, 앱 구조와 필요한 규칙을 구성합니다. 외부 저장소나 시크릿처럼 실제 상태를 바꾸는 작업은 자동화 뒤에 숨기지 않고 사용자 판단이 필요한 단계로 드러냅니다.

초기화 명령이 성공했다고 해서 올바르게 설치됐다고 판단하지도 않았습니다. \`./harness doctor\`가 필수 파일, 버전 상태, skill link, hook과 profile을 다시 읽어 현재 상태를 진단합니다.

CLI가 원하는 상태를 만든다면 doctor는 실제 상태가 그 계약과 일치하는지 확인합니다. 내부 도구로서 중요한 것은 명령 수가 아니라 사람이 기억하던 절차를 반복 실행하고 다시 진단할 수 있게 만드는 것이었습니다.

## 같은 문장을 복사해도 Claude Code와 Codex는 다르게 행동했다

패리티 문제를 실제로 확인한 사례가 있었습니다.

제가 기대한 작업 흐름은 명세를 작성한 뒤 \`clarify\`가 필요한지 판단하고, 그 결과를 사용자에게 보고한 다음 명시적인 \`codi-auto-loop\` 요청이 있을 때까지 멈추는 것이었습니다.

Claude Code에서는 이 흐름대로 동작했지만 Codex가 사용자 확인 지점에서 멈추지 않고 다음 계획 단계까지 진행한 사례가 있었습니다.

이를 특정 에이전트가 한 번 지시를 잘못 이해한 문제로만 보지 않았습니다. Claude Code와 Codex는 규칙 주입 시점과 command·skill 호출 방식이 다르기 때문에 같은 내용을 적어 두더라도 행동이 달라질 수 있다고 판단했습니다.

이후 다음 handoff를 양 런타임의 공통 계약으로 고정했습니다.

\`\`\`text
명세 작성
  → clarify 필요성 판단
  → 필요 여부와 생략 사유를 사용자에게 보고
  → 사용자의 명시적인 codi-auto-loop 요청 대기
  → 승인 후 계획·작업 분해 진행
\`\`\`

공통 원칙은 \`.harness/policies\`에 두고, Claude Code에는 rules·settings·hook, Codex에는 AGENTS·rules·preflight·PreToolUse hook으로 각 런타임에 맞게 연결했습니다.

여기서 끝내지 않고 같은 상황에서 양쪽이 동일한 handoff를 노출하는지 회귀 테스트로 검증했습니다. 위험 명령과 보호 브랜치 차단도 동일한 guardrail 구현과 실제 hook payload fixture를 통해 확인했습니다.

이 경험을 통해 규칙은 작성돼 있는가보다 실제 행동으로 반복 검증되는가가 더 중요하다는 결론을 내렸습니다.

## 채팅이 아니라 spec을 작업 상태의 정본으로

여러 단계에 걸친 작업을 대화 기록에만 남기면 새로운 세션이나 다른 에이전트가 코드베이스 전체를 다시 살펴보고 이전 판단을 복원해야 합니다. 대화가 길어질수록 현재 결정과 과거에 폐기된 선택을 구분하기도 어려워집니다.

그래서 중간 규모 이상의 작업은 \`spec.md\`, \`plan.md\`, \`tasks.md\`, \`verification.md\`에 목표·결정·작업 상태·검증 결과를 남기도록 했습니다. 작업 중인 기능은 미완료 task를 기준으로 이어서 진행하고, Feature Hub와 \`ROADMAP.md\`는 기능 간 상태를 보여 주는 진입점으로 사용했습니다.

Spec Kit을 도입한 이유도 문서를 많이 만들기 위해서가 아닙니다. 설계 단계에서는 사용자와 질의응답을 통해 방향을 확정하고, 실행 단계에서는 승인된 문서와 미완료 작업을 기준으로 진행하기 위해서였습니다.

규칙과 결정이 문서에 남아 있으면 새로운 에이전트나 세션이 코드베이스 전체를 반복해서 탐색하고 이전 판단을 다시 복원해야 하는 범위를 줄일 수 있다고 판단했습니다.

## 운영에서 발견한 마찰을 다시 규칙과 검증으로 돌려보내다

하네스의 규칙은 처음부터 완성된 것이 아닙니다. 실제 프로젝트와 대화 기록에서 반복되는 마찰을 확인하고, 재현 가능한 문제는 정책·hook·테스트·릴리스 게이트로 되돌려 보냈습니다.

예를 들어 사용 중인 도구가 실제 작업 흐름에서 얼마나 호출되는지 대화 기록을 기준으로 측정했습니다. 약 5주간의 초기 감사와 후속 재측정을 거쳐 GStack을 유지할 필요성을 다시 판단했고, 브라우저 검증은 Claude Code와 Codex 양쪽에서 사용할 수 있는 Playwright MCP로 대체했습니다.

코드 주석에 기능 번호나 문서 출처를 반복해서 적어 사람에게 필요한 설명보다 작업 이력이 더 많이 노출되는 문제도 있었습니다. 이를 계기로 주석은 사람에게 필요한 이유·제약·기술 부채를 설명하고, 작업 provenance는 spec과 Git 이력에 남기도록 규칙을 분리했습니다.

다운스트림에 전달해야 하는 변경이 CHANGELOG에서 반복적으로 누락된 문제는 주의 문구를 하나 더 추가하는 것으로 끝내지 않았습니다. 다운스트림에 영향을 주는 변경은 CHANGELOG와 릴리스 검증을 함께 통과하도록 게이트를 보강했습니다.

이런 과정을 통해 하네스는 규칙 파일을 배포하는 도구에서 실제 운영 편차를 다시 검증 가능한 계약으로 바꾸는 내부 제품으로 발전했습니다.

## harness.lock: 공통 변경과 프로젝트 소유권을 분리하다

복사형 배포의 한계를 해결하기 위해 공유 본체와 프로젝트 소유 파일을 분리했습니다.

공통 정책, hook, shared skill과 검증 규칙은 하네스가 관리합니다. 앱 코드, 프로젝트 profile, local skill과 프로젝트 전용 규칙은 각 프로젝트가 소유합니다.

다운스트림 프로젝트는 \`harness.lock\`으로 사용할 버전을 선언하고, 머신의 버전 캐시에서 해당 버전을 받아 사용합니다. 진행 중인 세션의 버전은 바꾸지 않고 다음 세션 시작 시점에 반영하며, 필요하면 특정 버전으로 고정하거나 되돌릴 수 있도록 했습니다.

프로젝트가 작성한 파일을 공통 업데이트가 덮어쓰지 않도록 소유권 경계도 검증합니다. 하네스가 실제로 배포했던 파일만 오래된 공통 파일로 판단하고, 배포 이력이 없는 파일은 프로젝트 파일로 보고 보존합니다.

업데이트 로직과 검증 항목은 복사 방식보다 복잡해졌습니다. 그럼에도 공통 변경을 빠르게 전파한다는 이유로 진행 중인 프로젝트 설정이나 팀 규칙을 잃지 않는 것이 더 중요하다고 판단했습니다.

## 멀티 세션: 규칙 통일 다음에는 실행 환경 격리가 필요했다

단일 세션의 작업 흐름을 정리한 뒤에는 여러 세션이 같은 목표를 나누어 수행하는 방식을 실험했습니다.

이 테스트는 모든 하네스 프로젝트의 기본 기능이 아닙니다. PHP 그누보드 데이터베이스 마이그레이션 프로젝트에서 약 2주 동안 진행한 운영 확장 실험입니다.

planner는 사용자와 설계·우선순위·승인 경계를 정하고, worker는 독립된 작업을 구현하고 검증하며, shipper는 작업 결과와 남은 위험을 모으는 구조를 사용했습니다.

처음에는 worktree를 분리하면 충분할 것으로 봤지만 실제 실행에서는 브라우저 테스트 데이터, container, database schema와 port까지 격리해야 했습니다. 코드 경로가 다르더라도 실행 자원을 공유하면 한 worker의 상태가 다른 worker의 검증에 영향을 줄 수 있기 때문입니다.

세션 간 전달도 채팅만으로 처리하지 않았습니다. 목표, 결정, 테스트 명령과 결과, 남은 작업을 spec과 handoff 기록에 남기고 다음 세션이 필요한 상태만 읽어 이어서 진행하도록 했습니다.

아직 자동화하지 못한 부분도 있습니다. 언제 context를 compact하거나 clear할지 자동으로 판단하는 문제는 해결하지 못했습니다. 너무 이른 전환은 판단 근거를 잃게 하고, 너무 늦은 전환은 현재 작업과 관련 없는 기록을 계속 유지하게 만듭니다.

현재까지의 결론은 에이전트나 세션 수 자체보다 실행 자원의 격리, 명시적인 역할 경계와 durable handoff의 품질이 병렬 작업의 신뢰도를 결정한다는 것입니다.

## 적용 범위와 비용

2026-08-20 기준 하네스는 11개 프로젝트에 적용됐고, 그중 8개가 실제 운영 중이며 팀원 3명이 사용하고 있습니다. 하네스의 전체 구성과 설계·구현은 제가 혼자 담당했지만, 실제 사용 과정에서 팀원과 여러 프로젝트가 보여 준 편차를 다시 규칙과 검증에 반영했습니다.

저는 여러 사람이 함께 작업하는 프로젝트라면 처음부터 규칙 검증 구조를 두는 편이 좋다고 생각합니다. 어떤 에이전트를 사용하더라도 코드와 문서, 아키텍처, 커밋·PR·주석 규칙이 같은 방향으로 유지돼야 하기 때문입니다.

과거 여러 사람의 손을 거쳐 규칙이 일정하지 않았던 프로젝트에 AI 에이전트를 처음 적용했을 때, 기존 코드마다 다른 기준이 오히려 에이전트의 판단을 혼란스럽게 만든 경험도 있었습니다.

개인 프로젝트도 이후 팀원이 합류하거나 여러 세션이 이어서 작업할 가능성이 있다면 처음부터 최소한의 규칙과 검증 구조를 두는 편이 좋다고 생각합니다.

물론 비용도 있습니다. 파일 삭제와 위험 작업에 확인 절차가 생기고, PR 생성이 완전히 자동화되지 않으며, 작업 규모에 따라 문서가 늘어나고 사용자에게 판단을 묻는 지점도 많아집니다.

그래서 모든 작업에 같은 무게의 절차를 적용하지 않고 작업 크기와 위험도에 따라 필요한 단계와 검증 수준을 다르게 선택하도록 했습니다. 번거로움을 없애는 것이 목적이 아니라, 사용자의 판단이 필요한 지점과 자동으로 처리해도 되는 지점을 명확히 구분하는 것이 목적입니다.

## 회고

가장 중요한 교훈은 규칙이 문서에 존재하는 것보다 Claude Code와 Codex가 같은 행동을 하도록 검증되는 것이 중요하다는 점입니다.

재사용 역시 파일을 복사하는 것이 아니었습니다. 공통 변경을 프로젝트 소유권을 침범하지 않고 안전하게 전파하고, 문제가 생기면 특정 버전으로 돌아갈 수 있어야 실제 운영에서 재사용할 수 있었습니다.

마지막으로 내부 도구의 가치는 기능 수보다 팀이 같은 방식으로 반복할 수 있는 일을 얼마나 늘렸는가에 있다고 생각합니다.

Jenkins 제거는 시작점이었습니다. 하네스가 최종적으로 관리하게 된 것은 파일이나 명령 목록이 아니라, 사람과 AI 에이전트가 같은 기준으로 계획하고 구현하고 검증하는 반복 가능한 작업 방식이었습니다.`
  },
  {
    slug: 'logging-decoupling-and-buffering-in-external-api-systems',
    title: '로그는 남기는 것보다 조회할 수 있어야 한다: 외부 API 로그 분리기',
    excerpt:
      '외부 PMS 연동 로그가 업무 DB에 수백만 건 쌓이면서, 정작 예약 장애를 조사해야 할 때 로그 테이블에 접근할 수 없었습니다. 로그 저장 경로를 syslog로 분리해 당사 기록으로 요청과 응답을 추적할 수 있게 만든 경험입니다.',
    date: new Date('2026-02-27'),
    tags: ['Backend', 'Logging', 'PHP', 'Operations'],
    readTime: '5 min',
    featureSlug: 'the-siena-golf-reservation',
    editorial: {
      type: 'project-case',
      visualAssessment: {
        decision: 'provided',
        kind: 'architecture',
        rationale:
          '예약 요청 경로는 유지하면서 통신 로그의 저장 경계만 업무 DB에서 syslog로 옮긴 전후 관계를 본문의 architecture 비교로 제공합니다.',
        question: '예약 요청 흐름을 유지하면서 로그 조회 경계는 어떻게 분리했는가?',
        textAlternative:
          '변경 전에는 React에서 PHP Proxy와 PMS로 이어지는 예약 요청의 통신 로그를 업무 DB에 저장해 장애 조사 시 DB GUI 접근이 어려웠습니다. 변경 후에는 같은 요청 흐름의 로그를 syslog로 보내 서버 시스템 로그에서 요청과 응답을 추적했습니다.',
        nonDuplicationReason:
          '작업물은 골프 예약 프로젝트의 전체 구현과 운영 맥락을 요약하고, 인사이트의 시각 자료는 업무 DB와 syslog 사이에서 달라진 로그 저장 경계만 비교합니다.'
      }
    },
    content: `외부 PMS와 연동하는 예약 시스템에서는 당사 서버가 정상적으로 요청을 보냈는지, PMS가 어떤 응답을 반환했는지를 확인할 수 있어야 합니다. 이 프로젝트에서도 외부 API의 요청과 응답을 기록하고 있었지만, 운영 과정에서 **로그를 남기는 것과 장애 시점에 로그를 조회할 수 있는 것은 다른 문제**라는 점을 경험했습니다.

## 로그는 있었지만 확인할 수 없었다

초기에는 예약·회원 데이터와 외부 API 통신 로그를 같은 업무 DB에 저장했습니다. 운영이 이어지면서 로그가 수백만 건까지 증가했고, 문제가 발생한 예약 건을 조사하기 위해 로그 테이블에 접근하자 DB GUI가 다운됐습니다.

예약 기능 자체에 미친 영향은 거의 없었습니다. 실제 문제는 당사에 로그가 존재하는데도 필요한 시점에 조회할 수 없었다는 점이었습니다. 결국 해당 예약 요청과 응답을 직접 확인하지 못해 PMS 업체에 확인을 요청해야 했습니다.

## 업무 DB에서 시스템 로그로 분리하다

프로젝트 전체에서는 이미 정해진 구조 안에서 기능을 구현하는 역할이었지만, 이 운영 문제에 대해서는 로그 저장 경로를 분리하는 방향을 정하고 직접 구현했습니다.

외부 API 통신 로그를 업무 DB에 적재하는 대신 PHP Proxy에서 \`syslog()\`로 전달하도록 변경했습니다. 요청 시각과 호출 대상, 응답 상태, 요청·응답 내용을 시스템 로그에서 확인할 수 있도록 구성해 업무 데이터와 통신 로그가 같은 저장소에 쌓이지 않도록 분리했습니다.

이 변경의 목적은 예약 처리 속도를 높이거나 파일 쓰기 횟수를 줄이는 것이 아니었습니다. **업무 DB의 상태와 무관하게 외부 연동 기록을 확인할 수 있는 경로를 확보하는 것**이 핵심이었습니다.

## 예약 요청 흐름과 로그 저장 경계의 변화

\`\`\`text
변경 전
React → PHP Proxy → PMS
              └→ 업무 DB 통신 로그
                   └→ 수백만 건 누적
                        └→ 장애 조사 시 DB GUI 접근 불가

변경 후
React → PHP Proxy → PMS
              └→ syslog
                   └→ 서버 시스템 로그에서 요청·응답 추적
\`\`\`

예약 요청이 React에서 PHP Proxy를 거쳐 PMS로 전달되는 흐름은 바꾸지 않았습니다. 통신 로그의 저장 위치만 업무 DB에서 시스템 로그로 옮겨, 업무 데이터와 장애 조사 기록의 경계를 분리했습니다.

## 당사 기록으로 예약 흐름을 추적하다

변경 후 예약 문제가 발생했을 때 서버의 시스템 로그에서 해당 요청과 응답을 직접 확인할 수 있었습니다. 이전처럼 PMS 업체에 먼저 확인을 부탁하지 않아도 당사 요청이 어떻게 전달됐고 어떤 응답을 받았는지부터 조사할 수 있게 됐습니다.

처리 시간 단축이나 장애 감소율을 별도로 측정하지는 않았습니다. 이 작업에서 확인한 결과는 **외부 시스템에 의존하는 예약 흐름을 당사 로그로 추적할 수 있게 됐다**는 운영 범위까지입니다.

## 지금 다시 구현한다면

이 경험을 통해 외부 API 연동 로그는 단순히 많이 남기는 것이 아니라, 장애가 발생했을 때 실제로 검색하고 책임 범위를 확인할 수 있어야 한다고 생각하게 됐습니다.

현재 다시 구현한다면 검증했던 \`syslog\` 기반 분리 구조는 유지하되 요청과 응답 전체를 그대로 기록하지는 않겠습니다. 인증값과 개인정보를 마스킹하고 장애 추적에 필요한 정보만 남기며, 로그 보존 기간도 함께 관리하겠습니다.

외부 API 연동에서 로그의 목적은 모든 데이터를 축적하는 것이 아닙니다. 당사 요청과 외부 응답을 안전하게 연결해 문제가 어느 경계에서 발생했는지 확인할 수 있도록 만드는 것입니다.`
  },

  {
    slug: 'optimizing-770k-text-search-in-rdbms',
    title: 'LIKE에서 FULLTEXT·토큰 검증까지: RDBMS 검색을 단계적으로 개선한 과정',
    excerpt:
      '약 77만 자의 교재를 기존 MySQL 환경에서 검색해야 했습니다. 2023년 LIKE 기반 검색의 응답을 약 1500ms에서 약 400ms로 줄인 뒤, 유지보수 과정에서 FULLTEXT의 한국어 토큰화 한계를 확인하고 토큰별 LIKE 검증을 결합한 구조로 발전시킨 기록입니다.',
    date: new Date('2026-02-27'),
    tags: ['Backend', 'Performance', 'MySQL', 'Node.js'],
    readTime: '9 min',
    featureSlug: 'hanmaum-science-institute',
    editorial: {
      type: 'project-case',
      visualAssessment: {
        decision: 'provided',
        kind: 'timeline',
        rationale:
          '검색 구조가 2023년 LIKE, 2025년 FULLTEXT, 2026년 토큰별 FULLTEXT·LIKE 조합으로 발전한 시간 관계를 본문의 타임라인으로 제공합니다.',
        question: '검색 구조는 2023년부터 2026년까지 어떻게 변했는가?',
        textAlternative:
          '2023년에 LIKE 기반 검색을 개선했고, 2025년에 FULLTEXT를 도입한 뒤, 2026년에 두 글자 이상 FULLTEXT와 모든 토큰의 LIKE 검증을 결합했습니다.',
        nonDuplicationReason:
          '작업물은 한 번의 검색 요청 처리 흐름을 보여 주고, 인사이트는 검색 구조의 시간적 변화를 보여 줍니다.'
      }
    },
    content: `한마음과학원의 백엔드와 검색 구조를 혼자 담당하며 최대 454페이지, 약 77만 자의 교재를 단락 단위로 검색하는 기능을 만들었습니다. 별도의 검색 엔진을 운영하는 비용과 인프라 복잡성을 추가하기보다 기존 MySQL 환경 안에서 검색을 개선해야 했습니다.

검색 구조는 한 번에 완성되지 않았습니다. 2023년 최초 구축에서는 LIKE 기반 검색을 개선해 응답 시간을 줄였고, 유지보수 과정에서 2025년 FULLTEXT 도입, 2026년 FULLTEXT와 토큰별 LIKE 검증의 결합으로 발전했습니다. 각 단계의 목적과 검증 근거가 다르므로 하나의 성과처럼 묶지 않고 시간 순서대로 정리합니다.

## 검색 구조는 한 번에 완성되지 않았다

초기 목표는 제한된 환경에서 실제 사용자가 기다리는 시간을 줄이는 것이었습니다. 이후에는 한글 검색의 정확성과 누락 문제를 보완하는 일이 중심이 됐습니다. 성능 개선 수치는 2023년 LIKE 기반 개선에서 관찰한 값이며, 이후 FULLTEXT 도입의 효과로 돌려 말하지 않습니다.

## 2023년: LIKE 기반 검색의 응답을 줄이다

초기 검색은 입력한 검색어를 공백 기준으로 다듬고, 각 단어가 본문에 포함되는지 LIKE 조건으로 확인하는 방식이었습니다. 여기에 불필요한 조인과 필터 구조를 정리하고 검색 쿼리를 개선했습니다.

77만 자를 전량 적재한 환경에서 같은 검색어를 사용해 구버전과 신규 기능 도메인을 비교했습니다. 날짜를 달리해 브라우저 네트워크 응답을 여러 차례 관찰했을 때 약 1500ms에서 약 400ms로 줄었습니다. 이 값은 서버 처리와 전송을 포함한 엔드투엔드 관찰값이며 데이터베이스 실행 시간만을 측정한 값은 아닙니다. 정확한 표본 수와 평균은 복원되지 않았으므로 개선 비율이나 평균 응답 시간으로 확장하지 않습니다.

## 2025년: FULLTEXT를 도입했지만 토큰화 한계가 남았다

유지보수 과정에서 MySQL BOOLEAN MODE FULLTEXT를 도입했습니다. FULLTEXT는 문장을 매번 처음부터 훑는 대신 미리 생성한 역인덱스에서 토큰과 문서의 관계를 찾을 수 있고, 관련도 점수를 활용할 수 있다는 장점이 있습니다.

그러나 한국어에서는 기본 토큰화 방식의 한계가 드러났습니다. 공백과 구두점을 기준으로 토큰을 만들기 때문에 조사가 붙은 단어와 한 글자 검색어를 기대한 방식으로 찾지 못할 수 있었습니다. 처음에는 FULLTEXT의 최소 인덱싱 길이 설정만 바꾸면 한글 한 글자 검색도 해결될 것이라고 생각했습니다. 유지보수 과정에서 최소 길이는 이미 잘라낸 토큰 중 무엇을 인덱싱할지를 정하고, 토큰화 방식은 문장을 어떻게 자를지를 정하는 별개의 문제라는 점을 이해했습니다.

## 2026년: FULLTEXT와 토큰별 LIKE를 하나의 조건으로 결합하다

현재 구현은 검색어를 공백 기준으로 토큰화한 뒤 길이에 따라 조건을 구성합니다.

- 두 글자 이상인 토큰은 \`+token*\` 형태의 BOOLEAN MODE FULLTEXT 조건에 사용합니다.
- 모든 토큰은 \`%token%\` LIKE 조건으로 다시 확인하고, 여러 토큰은 AND로 묶습니다.
- 두 글자 이상인 토큰이 하나라도 있으면 FULLTEXT와 LIKE 검증을 하나의 SQL 안에서 함께 적용합니다.
- 검색어가 한 글자 토큰으로만 구성되면 LIKE-only로 조회합니다.

이 구조는 FULLTEXT로 별도 후보 목록을 먼저 가져온 뒤 애플리케이션에서 두 번째 쿼리를 실행하는 방식이 아닙니다. 하나의 SQL 안에서 역인덱스 검색과 실제 문자열 포함 조건을 함께 사용해, FULLTEXT가 놓칠 수 있는 한 글자와 부분 문자열을 보완합니다.

## 관련도와 문서 순서를 함께 유지하다

검색 결과는 단순히 FULLTEXT 점수만으로 정렬하지 않습니다. 정확히 일치하는 결과, 검색어로 시작하는 결과, 검색어를 포함하는 결과에 서로 다른 가중치를 주고 FULLTEXT 관련도 점수를 더합니다. 동시에 문서·부제목·제목의 기존 순서를 먼저 유지한 뒤 같은 그룹 안에서 관련도를 적용합니다.

이렇게 한 이유는 검색 점수만 높다고 해서 교재의 읽기 순서를 깨뜨리는 것이 사용자에게 항상 좋은 결과는 아니기 때문입니다. 검색 정확도와 원문의 구조를 함께 보존하는 것이 이 서비스의 기준이었습니다.

## LIKE에서 하이브리드 검색까지의 발전

\`\`\`text
2023년 — LIKE 기반 검색 개선
공백 처리, LIKE 조회와 조인·필터 구조 개선
브라우저 네트워크 응답 약 1500ms → 약 400ms 관찰
        │
        ▼
2025년 — BOOLEAN MODE FULLTEXT 도입
역인덱스와 관련도 기반 검색 적용
최소 인덱싱 길이와 토큰화 방식의 차이 확인
        │
        ▼
2026년 — FULLTEXT와 토큰별 LIKE 결합
두 글자 이상 토큰은 +token* FULLTEXT
모든 토큰은 LIKE AND 검증
한 글자 토큰만 있으면 LIKE-only
\`\`\`

텍스트로 풀면 2023년에는 LIKE 기반 검색과 조인·필터 구조를 개선해 브라우저 응답을 줄였습니다. 2025년에는 FULLTEXT를 도입해 역인덱스와 관련도를 활용했고, 2026년에는 두 글자 이상 토큰의 FULLTEXT 조건과 모든 토큰의 LIKE 검증을 결합해 한국어 토큰화의 빈틈을 보완했습니다.

## 현재의 적용 기준

지금이라면 검색 요구를 먼저 나눈 뒤 도구를 선택합니다.

- 데이터 규모와 검색 요구가 단순하고, 정확한 포함 검색이 중심이라면 LIKE를 검토합니다.
- 역인덱스와 기본 관련도 검색이 필요하지만 별도 검색 인프라의 운영 비용과 복잡성을 감당하기 어렵다면 MySQL FULLTEXT와 보완 조건을 검토합니다.
- 오타 허용, 검색 순위 정확도, 고도화된 한국어 형태소 분석이 핵심 요구라면 Elasticsearch 같은 전문 검색 엔진을 후보로 올립니다.

Elasticsearch는 아직 직접 사용해 보지 않았습니다. 따라서 이 프로젝트에 도입하면 더 나았다고 단정하지 않고, 실제 요구와 운영 비용을 기준으로 PoC를 거쳐 판단해야 할 다음 선택지로 남겨 둡니다.

## 회고

이 경험에서 가장 크게 바뀐 것은 특정 기술에 대한 선호가 아니라 검색 문제를 나누는 방식입니다. 2023년에는 사용자 대기 시간을 줄이는 쿼리 개선이 필요했고, 이후에는 FULLTEXT가 한국어를 어떻게 토큰화하는지 이해하고 검색 누락을 보완하는 일이 필요했습니다.

설정 하나로 해결될 것이라고 생각했던 문제를 실제 코드와 검색 결과로 다시 확인하면서, 인덱스의 최소 길이와 토큰화 방식이 서로 다른 계층의 문제라는 점을 배웠습니다. 지금의 기준은 단순합니다. 성능 수치와 검색 정확도를 같은 성과로 섞지 않고, 현재 환경에서 필요한 검색 품질을 먼저 정의한 뒤 LIKE, FULLTEXT, 전문 검색 엔진의 경계를 선택합니다.
`
  },
  {
    slug: 'spa-api-key-exposure-and-bff-architecture',
    title: 'React API Key 노출을 서버 경계로 옮기며 배운 BFF의 필요성',
    excerpt:
      '개발계 테스트 중 React 빌드 산출물에 API Key가 포함될 수 있음을 확인하고 모든 요청을 PHP Proxy 뒤로 옮겼습니다. 당시의 단순 Proxy 구현과 지금 생각하는 BFF의 적용 기준을 구분해 정리합니다.',
    date: new Date('2026-02-26'),
    tags: ['Architecture', 'Security', 'React', 'BFF'],
    readTime: '6 min',
    featureSlug: 'blackstone-belleforet-resort',
    editorial: {
      type: 'project-case',
      visualAssessment: {
        decision: 'recommended',
        kind: 'architecture',
        rationale:
          '브라우저, PHP 미들웨어·Proxy, 내부·외부 API 사이의 인증 정보와 책임 경계를 비교하려면 architecture가 유용합니다.'
      }
    },
    content: `PHP와 React를 함께 사용하는 신규 리조트 서비스를 구축하면서 한 가지 경계를 잘못 이해했습니다. React 환경변수에 넣은 값은 브라우저에서 확인할 수 없다고 생각해 외부 API를 직접 호출했고, 개발계 테스트 중 빌드 산출물에 API Key가 포함될 수 있다는 사실을 발견했습니다.

이 글에서 다루는 질문은 브라우저가 외부 API를 호출할 때 어디까지 직접 알아도 되고, 언제 서버 Proxy나 BFF가 경계를 맡아야 하는가입니다.

## 개발계 테스트에서 발견한 서버 경계 오해

문제는 운영 사고나 침해로 발견된 것이 아닙니다. 프로젝트 중간 개발계 테스트에서 브라우저에 전달되는 빌드 결과를 확인하다가 API Key가 포함될 수 있음을 알았습니다. 제3자가 키를 악용한 일은 없었습니다.

실수의 원인은 환경변수라는 이름을 서버의 비공개 설정과 동일하게 생각한 데 있었습니다. 클라이언트 사이드에서 사용하는 값은 빌드 과정에서 코드에 포함될 수 있고, 브라우저에 전달된 값은 더 이상 Secret이 아닙니다. 중요한 것은 변수 이름이나 파일 위치가 아니라 최종적으로 그 값이 어느 실행 경계에 도달하는가였습니다.

## 당시에는 모든 요청을 PHP Proxy 뒤로 옮겼다

발견 직후 API Key가 브라우저에 머물지 않도록 모든 요청을 PHP Proxy로 보내도록 변경했습니다. JWT 쿠키 검증은 PHP 미들웨어에서 처리했고, Proxy는 요청을 확인해 외부 API로 보낼지 내부 API로 보낼지 판단했습니다. 외부 요청에 필요한 API Key와 인증 헤더는 PHP 서버에서 붙였습니다.

당시 Proxy의 역할은 여기까지였습니다. 외부 API의 원본 응답을 그대로 React에 전달했고, 화면에 필요한 형태로 가공하는 일은 프론트엔드에서 처리했습니다. 따라서 당시 구현을 BFF였다고 소급해 부르지는 않습니다. API Key를 붙여 요청을 대신 전달하는 단순 Proxy에 가까웠습니다.

이 수정으로 API Key가 React 빌드 결과에 포함되는 경로를 서버 쪽으로 옮겼습니다. 다만 개발계에서 발견한 구조 수정이므로 실제 침해를 차단했다거나 운영 보안 사고를 해결했다는 성과로 확대하지 않습니다.

## 외부 API라면 모두 BFF가 필요한가

이 경험 뒤에는 모든 외부 API 요청을 서버로 보내야 한다고 생각하기도 했습니다. 지금의 기준은 API가 외부에 있는지가 아니라 브라우저가 알아도 되는 정보와 서버가 책임져야 하는 처리가 있는지입니다.

- 클라이언트 사이드 렌더링 기반의 React·Next.js에서 API Key·Secret·인증 헤더가 필요한 요청은 반드시 서버를 거칩니다.
- 공개 정보이고 별도 인증 정보가 없다면 브라우저의 직접 호출도 허용할 수 있습니다.
- 사용자 권한 통제, 응답 조합·가공, 여러 API 취합이 필요하면 단순 Proxy보다 BFF를 선택합니다.
- 백엔드 API를 설계할 때는 브라우저가 직접 사용할 수 있는 public API와 인증·권한이 필요한 private API의 경계를 구분합니다.

외부 서버 URL을 보이지 않게 만드는 것만으로 보안이 생기지는 않습니다. 핵심은 자격 증명과 권한 검증을 서버에 두는 것입니다. 다만 브라우저가 알 필요 없는 외부 엔드포인트와 헤더 형식을 서버 구현 세부사항으로 감추면 클라이언트와 외부 API의 결합도 함께 낮출 수 있습니다.

## Proxy에서 BFF로 확장되는 지점

블랙스톤에서는 JWT 쿠키 인증이 필요했고 모든 요청이 PHP Proxy를 통과했지만, 응답은 그대로 전달하고 React에서 가공했습니다. 지금 돌아보면 처음부터 BFF로 설계했다면 다음 책임을 한 경계에서 다룰 수 있었습니다.

- PHP 미들웨어의 JWT 검증 결과에 따른 요청 권한 통제
- 외부 API의 URL·인증 헤더와 화면에 불필요한 필드의 서버 측 격리
- 화면이 필요한 형태로 응답을 조합하고 가공하는 계약
- 여러 내부·외부 API 호출이 필요할 때의 취합과 오류 형식 통일

이 내용은 당시 구현한 기능 목록이 아니라 현재의 회고입니다. 당시에는 노출 경로를 즉시 닫는 것이 먼저였고, BFF를 대안으로 비교해 선택한 것은 아닙니다.

## 현재의 적용 기준

로그인과 JWT 검증이 있고 외부 응답을 화면 계약에 맞게 바꿔야 하는 프로젝트라면 BFF를 기본 후보로 검토합니다. 이런 조건에서는 단순 전달 Proxy로 시작해도 인증, 권한, 응답 가공이 흩어지면서 결국 서버 책임이 커질 가능성이 높기 때문입니다.

반대로 인증 정보가 없는 공개 API를 그대로 표시하고 서버가 가공하거나 통제할 이유가 없다면 브라우저의 직접 호출도 가능합니다. BFF는 모든 외부 API 앞에 세우는 의무 계층이 아니라, 브라우저에 넘기지 말아야 할 책임이 생겼을 때 선택하는 경계입니다.

## 회고

이 경험의 핵심은 API Key를 잘못 넣었다는 사실보다, 잘못된 이해를 개발계에서 발견한 뒤 즉시 서버 경계로 수정하고 그 경계가 맡아야 할 책임을 다시 정의한 데 있습니다.

그때는 PHP Proxy로 노출 경로를 닫는 데 집중했습니다. 지금은 같은 요구를 만나면 시크릿 은닉만 보지 않고 쿠키 인증, 권한 통제, 응답 계약, 외부 API 결합도를 함께 살펴 Proxy로 충분한지 BFF가 필요한지 처음부터 결정합니다.`
  },
  {
    slug: 'sso-authentication-and-soft-fk',
    title: 'UUID Soft FK만으로는 부족했다: 분리된 회원 데이터의 조회 경계',
    excerpt:
      '중앙 회원 서버의 UUID를 서비스 데이터와 연결했지만, 관리자 화면과 장애 추적에서는 사람이 식별할 수 있는 별도의 읽기 경계가 필요하다는 점을 운영 과정에서 확인했습니다.',
    date: new Date('2026-02-26'),
    tags: ['Backend', 'Authentication', 'Architecture', 'Data Modeling'],
    readTime: '5 min',
    featureSlug: 'integrated-sso-server',
    editorial: {
      type: 'project-case',
      visualAssessment: {
        decision: 'provided',
        kind: 'data-flow',
        rationale:
          'UUID만 저장한 초기 단계와 로그인 ID 읽기 모델·Batch API를 보완한 이후 단계의 데이터 관계가 핵심이므로 전·후 데이터 흐름을 제공합니다.',
        question: 'UUID 기반 Soft FK만으로 부족했던 운영 조회 경계를 어떻게 보완했는가?',
        textAlternative:
          '초기에는 중앙 회원 DB의 UUID만 서비스 데이터와 연결했지만, 이후 조회용 로그인 ID를 서비스에 저장하고 UUID Batch API를 추가해 원본과 운영 읽기 모델의 역할을 분리했습니다.',
        nonDuplicationReason:
          '작업물은 중앙 회원 인증 흐름 전체를 보여 주고, 인사이트는 UUID 관계 이후 운영 조회 경계가 바뀐 전후만 비교합니다.'
      }
    },
    content: `중앙 회원 서버와 개별 서비스의 데이터베이스를 분리하면서, 서비스에는 중앙 회원의 UUID를 저장해 논리적으로 연결했습니다. 이 선택으로 회원 원본과 서비스 도메인 데이터의 소유권은 나눌 수 있었지만, 운영 과정에서 UUID만으로는 해결되지 않는 조회 문제가 드러났습니다.

이 글은 중앙 회원 서버의 전체 인증 흐름을 반복하지 않습니다. 물리적으로 분리된 데이터베이스에서 UUID Soft FK를 사용한 뒤, 관리자와 개발자가 회원을 조회하고 추적할 경계를 어떻게 보완했는지에 집중합니다.

## UUID로 데이터 소유권을 분리했다

ID·비밀번호·UUID의 원본은 중앙 회원 서버가 관리하고, 서비스는 주문이나 업무 정보처럼 자신의 도메인에 필요한 회원 데이터만 보유했습니다. 물리적으로 다른 데이터베이스 사이에 Foreign Key를 만들 수 없었기 때문에, 서비스는 중앙 회원의 UUID를 자신의 데이터에 저장해 Soft FK로 사용했습니다.

이 구조의 장점은 분명했습니다. 서비스가 중앙 회원 DB를 직접 공유하지 않아도 회원과 도메인 데이터를 연결할 수 있었고, 인증 원본과 서비스 데이터의 책임도 섞이지 않았습니다. 다만 시스템이 관계를 찾을 수 있다는 사실과 운영자가 그 관계를 이해할 수 있다는 사실은 같지 않았습니다.

## 시스템 식별자와 운영 식별자는 달랐다

UUID는 시스템이 충돌 없이 관계를 연결하기에는 적합했지만 사람이 보고 회원을 식별하기는 어려웠습니다. 관리자 목록에서 회원을 확인하거나 장애 로그와 서비스 DB를 대조할 때, UUID만 보고 어떤 로그인 계정인지 바로 추적할 수 없었습니다. 개발자가 데이터베이스만 살펴보는 상황에서도 같은 문제가 생겼습니다.

처음에는 중앙 회원 서버를 다시 조회하면 된다고 생각할 수 있습니다. 그러나 목록의 각 행이나 로그를 확인할 때마다 개별 조회를 반복하면 운영 화면과 중앙 API의 결합이 커지고 요청 수도 늘어납니다. 반대로 로그인 ID를 서비스의 새 원본처럼 다루면 중앙 회원 데이터와 불일치할 수 있습니다.

## 로그인 ID를 운영 읽기 모델로 사용했다

첫 운영 서비스에서는 로그인 응답으로 받은 UUID와 로그인 ID, 토큰 정보를 로컬 \`user_tokens\` 테이블에 함께 저장했습니다. UUID는 서비스 도메인 데이터와 중앙 회원을 연결하는 시스템 식별자로 유지하고, 로그인 ID는 관리자 화면과 로그에서 사람을 찾기 위한 운영 읽기 모델로 사용했습니다.

여러 회원을 관리자 목록에 표시할 때는 중앙 회원 서버에 UUID 배열을 보내 로그인 정보를 한 번에 가져오는 Batch API도 추가했습니다. 서비스 DB의 읽기 모델만으로 충분한 화면은 로컬 값을 사용하고, 중앙 원본의 최신 정보가 필요한 목록은 Batch API로 보완했습니다.

로그인 ID처럼 변경될 수 있는 값을 복제한다면 동기화 경계가 필요합니다. 이 프로젝트에서는 회원 조회·변경 API를 후속으로 추가했지만, 모든 변경 상황에서 로컬 읽기 모델의 즉시 일관성을 검증한 것은 아닙니다. 따라서 로그인 ID 복제를 완성된 동기화 체계로 주장하지 않습니다.

## UUID Soft FK와 읽기 모델을 함께 설계해야 한다

\`\`\`text
초기
중앙 회원 DB(ID·비밀번호·UUID)
            │ UUID Soft FK
            ▼
서비스 DB(UUID·도메인 데이터)
            └─ 관리자·개발자가 UUID만으로 회원을 추적하기 어려움

보완 이후
중앙 회원 DB(ID·비밀번호·UUID)
      ├─ UUID Soft FK ──> 서비스 도메인 데이터
      └─ UUID Batch API ─> 관리자 목록
                           ▲
서비스 user_tokens(UUID·로그인 ID) ─ 운영 읽기 모델
\`\`\`

초기에는 중앙 회원 DB의 UUID만 서비스 데이터와 연결했습니다. 이후에는 서비스의 \`user_tokens\`에 조회용 로그인 ID를 함께 두고, 여러 UUID의 중앙 정보를 한 번에 조회하는 Batch API를 추가했습니다. 원본의 소유권은 중앙에 유지하면서도 운영 조회에 필요한 경계를 별도로 만든 변화입니다.

## 적용 기준

물리적으로 분리된 서비스가 중앙 회원을 참조한다면 식별자 선택만으로 설계를 끝내지 않습니다. 시스템이 관계를 연결하는 키, 운영자가 사람을 식별하는 읽기 모델, 원본의 최신 값이 필요한 조회 경로를 각각 구분해야 합니다.

복제 값이 자주 바뀌거나 즉시 일관성이 중요하다면 변경 이벤트나 명시적인 동기화 계약이 필요합니다. 반대로 운영 조회에 필요한 최소 정보가 안정적이라면 서비스에 제한된 읽기 모델을 두고, 상세·최신 정보는 중앙 API로 조회하는 방식이 실용적일 수 있습니다. 핵심은 UUID Soft FK가 데이터 관계를 해결해도 운영 조회 문제까지 자동으로 해결하지는 않는다는 점입니다.`
  },
  {
    slug: 'json-outbox-pattern-for-settlement',
    title: '정산 상태는 DB에, 재처리 입력은 JSON에 둔 이유',
    excerpt:
      '하이패스 정산에서 지급 여부는 DB 상태로 판단하고, 복잡한 쿼리로 계산한 지급 입력과 실패 항목만 JSON에 남겼습니다. 단일 서버·단일 스케줄러 범위에서 성공 제거와 실패 보존, 재시도를 어떻게 운영했는지 설명합니다.',
    date: new Date('2026-09-04'),
    tags: ['Backend', 'Architecture', 'Settlement', 'Node.js', 'Operations'],
    readTime: '6 min',
    featureSlug: 'hipass-b2b-platform',
    editorial: {
      type: 'project-case',
      visualAssessment: {
        decision: 'provided',
        kind: 'data-flow',
        rationale:
          'DB의 지급 판단 상태와 JSON의 재처리 입력, 지급 성공·실패 이후의 서로 다른 변경을 한 흐름에서 구분합니다.',
        question: '지급 판단 상태와 재처리 입력은 어디에 있고 성공·실패 뒤 어떻게 바뀌는가?',
        textAlternative:
          'DB의 PROCESSING 상태를 확인한 뒤 JSON 지급 입력으로 지급대행 API를 호출하고, 성공하면 DB를 COMPLETED로 바꾸고 JSON 항목을 제거하며, 실패하면 JSON에 남겨 매일 10시·14시에 DB 상태를 다시 확인한 뒤 재시도합니다.',
        nonDuplicationReason:
          '작업물의 스윔레인은 주문 결제와 보상 취소를 다루고, 이 인사이트는 별도 정산 과정에서 DB 상태와 JSON 재처리 입력이 어떻게 나뉘는지만 보여 줍니다.'
      }
    },
    visual: {
      id: 'settlement-state-and-retry-input',
      variant: 'data-flow',
      title: '정산 상태와 재처리 입력의 흐름',
      question: '지급 판단 상태와 재처리 입력은 어디에 있고 성공·실패 뒤 어떻게 바뀌는가?',
      textAlternative:
        'DB의 PROCESSING 상태를 확인한 뒤 JSON 지급 입력으로 지급대행 API를 호출하고, 성공하면 DB를 COMPLETED로 바꾸고 JSON 항목을 제거하며, 실패하면 JSON에 남겨 매일 10시·14시에 DB 상태를 다시 확인한 뒤 재시도합니다.',
      nodes: [
        {
          id: 'db-processing',
          label: 'DB PROCESSING',
          detail: '지급 여부를 결정하는 상태 기준',
          role: 'state'
        },
        {
          id: 'json-input',
          label: 'JSON 지급 입력',
          detail: '계산 결과와 실패 후 재처리할 입력',
          role: 'data'
        },
        {
          id: 'payout-request',
          label: '지급대행 API',
          detail: 'PROCESSING인 건의 지급을 요청',
          role: 'action'
        },
        {
          id: 'payout-success',
          label: 'DB COMPLETED·JSON 제거',
          detail: '지급 성공 항목을 완료 처리',
          role: 'terminal'
        },
        {
          id: 'payout-failure',
          label: 'JSON 실패 항목 보존',
          detail: '다음 스케줄에서 다시 사용할 입력',
          role: 'terminal'
        }
      ],
      edges: [
        {
          id: 'verify-state',
          from: 'db-processing',
          to: 'json-input',
          label: '상태 재확인',
          outcome: 'normal'
        },
        {
          id: 'request-payout',
          from: 'json-input',
          to: 'payout-request',
          label: '지급 입력 사용',
          outcome: 'normal'
        },
        {
          id: 'complete-payout',
          from: 'payout-request',
          to: 'payout-success',
          label: '지급 성공',
          outcome: 'success'
        },
        {
          id: 'preserve-failure',
          from: 'payout-request',
          to: 'payout-failure',
          label: '지급 실패',
          outcome: 'failure'
        },
        {
          id: 'retry-schedule',
          from: 'payout-failure',
          to: 'db-processing',
          label: '매일 10시·14시 재시도',
          outcome: 'retry'
        }
      ]
    },
    content: `## 지급 판단 기준은 DB 상태였습니다

하이패스의 백엔드와 정산 구조를 혼자 담당하면서 가장 중요하게 본 질문은 **실패한 지급을 다시 시도할 때 무엇을 기준으로 이미 처리된 건을 구분할 것인가**였습니다.

정산 상태는 DB에서 \`PENDING → PROCESSING → COMPLETED\`로 바뀌었습니다. 지급 요청 직전에도 UUID로 DB 상태를 다시 조회했고, \`PROCESSING\` 상태인 건만 지급대행사에 보냈습니다. 이미 \`COMPLETED\`인 건은 다시 지급하지 않았습니다. 지급 여부를 결정하는 기준은 JSON 파일이 아니라 DB 상태였습니다.

## JSON에는 계산 결과와 재처리 입력을 남겼습니다

정산 금액과 대상을 만들려면 여러 조건을 결합한 복잡한 쿼리와 계산이 필요했습니다. JSON 파일에는 그 결과인 정산 대상·금액·지급 입력을 저장했습니다. 실패 뒤 같은 계산 결과를 다시 사용할 수 있게 하는 보조 저장소였고, 정산 상태의 원본은 아니었습니다.

이 분리는 두 저장소가 같은 책임을 갖는다는 뜻이 아닙니다. DB는 지급 가능 상태를 판단하고, JSON은 지급 호출에 필요한 계산 결과를 전달했습니다. 재시도에서도 JSON만 믿지 않고 DB 상태를 다시 확인했습니다.

## 성공은 제거하고 실패는 보존했습니다

지급 성공 시 DB 상태를 \`COMPLETED\`로 바꾼 뒤 해당 항목을 JSON에서 제거했습니다. 지급 실패 시에는 JSON에 실패 항목을 남겼습니다. 남은 항목은 매일 10시·14시 스케줄에서 재시도하며, 호출 전에 DB 상태를 다시 확인했습니다.

따라서 파일이 남아 있다는 사실만으로 지급하지 않았습니다. \`PROCESSING\`인 건만 다시 호출했고, 이미 \`COMPLETED\`라면 건너뛰었습니다.

## 실행 주체는 단일 PM2 프로세스로 분리했습니다

정산 스케줄러는 웹 서버와 별도인 단일 PM2 프로세스로 실행했습니다. 다중 웹 워커마다 스케줄이 실행되어 중복 실행되는 것을 막고, 정산 작업의 오류와 자원 사용을 웹 요청 처리에서 분리하기 위한 선택이었습니다.

이 구조는 한 서버 안에서 실행 주체를 하나로 제한한 것입니다. 여러 서버가 같은 로컬 파일을 공유하거나 분산 잠금을 제공하는 구조는 아니었습니다.

## 운영에서 확인한 범위

정산은 월 2회 실행됐습니다. 운영팀은 월말 보고서를 만들 때 내부 정산 내역과 지급대행사의 실제 지급 내역을 대조했습니다. 2026년 6월까지 반복한 대사 범위에서는 정산 금액 불일치와 중복 지급을 확인하지 못했습니다.

같은 기간에 JSON 파일 유실·손상·중복 실행 문제도 확인하지 못했습니다. 다만 이는 단일 서버의 실제 운영과 월말 대사에서 관찰한 범위이며, 모든 장애 상황을 자동 검증했거나 무결성을 보장한다는 의미는 아닙니다.

## 적용할 조건과 피해야 할 조건

로컬 JSON을 재처리 입력으로 두는 방식은 단일 서버·단일 스케줄러·작은 정산 규모처럼 파일의 소유권과 실행 주체가 분명할 때 적용할 수 있습니다.

반대로 로드밸런싱이나 스케일 아웃이 필요한 환경에는 로컬 JSON을 그대로 적용하지 않습니다. 서버마다 파일이 갈라질 수 있고 어느 실행 주체가 처리할지 별도 경계가 필요하기 때문입니다.

## 지금 다시 본다면

현재는 실패 입력을 Redis에 둘지, DB만으로 관리할지, 스케줄러 실행 구조를 바꿀지 고민하고 있습니다. 아직 세 방식을 비교하거나 검증하지 않았으므로 어느 하나를 정답이나 확정 계획으로 공개하지 않습니다. 먼저 파일 유실, 중복 실행, 여러 서버의 실행 주체처럼 해결하려는 조건을 명확히 한 뒤 선택해야 한다고 봅니다.`
  },
  {
    slug: 'config-driven-architecture-react',
    title: 'Config 이후의 경계: 멀티플랫폼 React를 core·rsConfig·platform으로 나눈 이유',
    excerpt:
      '설정으로 값의 차이를 흡수한 뒤에도 남는 공통 동작과 화면·로직 차이를 core·rsConfig·platform 중 어디에 둘지 정한 기준을 설명합니다.',
    date: new Date('2026-09-09'),
    tags: ['Frontend', 'Architecture', 'React', 'Config-driven'],
    readTime: '6 min',
    featureSlug: 'hotel-reservation-platform',
    editorial: {
      type: 'project-case',
      visualAssessment: {
        decision: 'provided',
        kind: 'data-flow',
        rationale:
          'Config 이후에 남는 차이를 core·rsConfig·platform으로 분류하는 기준은 세 갈래 관계를 한눈에 비교할 때 가장 명확합니다.',
        question: '공통 동작, 값 차이, 화면·로직 차이는 각각 어디에 배치할 것인가?',
        textAlternative:
          '변경 요구를 분류해 모든 플랫폼의 공통 동작은 core, 값 차이는 rsConfig, 화면·로직 차이는 platform에 배치합니다.',
        nonDuplicationReason:
          '작업물은 플랫폼화의 전체 연혁과 검증·배포 흐름을 보여 주고, 이 인사이트는 변경의 성격에 따른 코드 배치 기준만 설명합니다.'
      }
    },
    visual: {
      id: 'platform-code-placement',
      variant: 'data-flow',
      title: 'Config 이후의 코드 배치 기준',
      question: '공통 동작, 값 차이, 화면·로직 차이는 각각 어디에 배치할 것인가?',
      textAlternative:
        '변경 요구를 분류해 모든 플랫폼의 공통 동작은 core, 값 차이는 rsConfig, 화면·로직 차이는 platform에 배치합니다.',
      nodes: [
        { id: 'change', label: '변경 요구', detail: '새 기능·정책·표현 차이', role: 'data' },
        { id: 'classify', label: '차이 분류', detail: '동작·값·화면과 로직 판단', role: 'action' },
        { id: 'core', label: 'core', detail: '모든 플랫폼의 공통 동작', role: 'terminal' },
        { id: 'rsconfig', label: 'rsConfig', detail: '플랫폼마다 다른 값', role: 'terminal' },
        { id: 'platform', label: 'platform', detail: '플랫폼 고유 화면·로직', role: 'terminal' }
      ],
      edges: [
        { id: 'change-classify', from: 'change', to: 'classify', label: '변경 성격 확인', outcome: 'normal' },
        { id: 'classify-core', from: 'classify', to: 'core', label: '모든 플랫폼 공통', outcome: 'normal' },
        { id: 'classify-rsconfig', from: 'classify', to: 'rsconfig', label: '값만 다름', outcome: 'normal' },
        { id: 'classify-platform', from: 'classify', to: 'platform', label: '화면·로직 차이', outcome: 'normal' }
      ]
    },
    content: `## Config가 해결한 것과 남긴 것

설정은 호텔마다 달라지는 값과 기능 사용 여부를 컴포넌트 안의 조건 분기에서 꺼내는 데 유효했습니다. 하지만 플랫폼별 배포 브랜치가 계속 수정되면 같은 설정 구조를 사용하더라도 공통 코드의 구현이 서로 달라질 수 있습니다.

그래서 다음 질문이 필요했습니다.

> 공통 동작, 값 차이, 화면·로직 차이는 각각 어디에 배치할 것인가?

## 세 종류의 차이를 서로 다른 경계에 둡니다

모든 플랫폼에서 같은 동작은 \`core\`에 둡니다. 예약 단계 전환이나 공통 API 호출처럼 호텔이 달라도 같은 규칙을 따라야 하는 코드가 여기에 해당합니다. 공통 수정은 기준 소스의 core에서 한 번 다룹니다.

동작은 같고 값만 다르면 \`rsConfig\`에 둡니다. 문구, 기능 사용 여부와 호텔별 설정처럼 데이터로 표현할 수 있는 차이를 코드 구현과 분리합니다.

화면 구성이나 처리 로직 자체가 다르면 \`platform\`에 둡니다. 공통 계약으로 표현하기 어려운 호텔 고유 구현을 확장 영역에 남기되, 공통 동작까지 통째로 위임하지 않도록 범위를 좁힙니다.

\`\`\`text
모든 플랫폼의 공통 동작 → core
값만 다른 차이           → rsConfig
화면·로직 자체의 차이    → platform
\`\`\`

## 기준 소스와 배포 단위는 같은 개념이 아닙니다

이 구조는 하나의 기준 소스에서 세 경계를 관리하지만 런타임 tenant 전환 구조는 아닙니다. build-time alias로 대상 platform을 선택하고, 플랫폼별 빌드와 호텔별 운영 폴더 배포를 계속 수행합니다.

따라서 기준 코드가 하나라는 사실을 전체 호텔이 한 번에 배포된다는 뜻으로 확대할 수 없습니다. 공유하는 것은 소스의 기준이고, 빌드와 운영 반영은 플랫폼 단위입니다.

## 적용할 조건과 그대로 적용하지 않을 조건

공통 예약 흐름을 공유하면서 호텔별 설정과 일부 화면·로직 차이를 유지해야 하고, 플랫폼별 빌드·배포가 필요한 경우에 이 경계를 적용할 수 있습니다. 차이의 성격을 세 범주로 설명할 수 있어야 합니다.

반대로 런타임에 tenant를 전환해야 하거나 플랫폼들이 공유하는 도메인 흐름이 거의 없다면 이 구조를 그대로 적용하지 않습니다. 전자는 runtime 설정·격리 설계가 더 필요하고, 후자는 공통 core가 억지 결합이 될 수 있습니다.

## 위임 경계에는 검증 비용이 남습니다

platform이 전체 화면 구현을 대신할 수 있으면 예외를 빠르게 수용할 수 있지만, core의 공통 변경을 빠뜨리기도 쉽습니다. 그래서 값 차이와 작은 행동 차이는 좁은 contract로 표현하고 전체 구현 위임은 꼭 필요한 범위에 제한해야 합니다.

디렉터리와 import 경로가 맞고 빌드가 성공하는지만 확인해서는 행동 패리티를 증명할 수 없습니다. 공통 contract 검사와 플랫폼별 주요 행동 검증을 함께 두어야 세 경계가 시간이 지나도 같은 의미를 유지합니다.`
  },
  {
    slug: 'context-api-encapsulation-and-router-level-isolation',
    title: 'Props Drilling을 줄이기 위해 예약 Context의 생명주기를 라우터에 둔 이유',
    excerpt:
      '예약 단계 사이에서 쓰는 상태를 중간 컴포넌트가 계속 전달하던 문제를, 예약 라우터 범위의 ReservationProvider와 useReservation으로 줄인 판단을 설명합니다.',
    date: new Date('2026-09-09'),
    tags: ['Frontend', 'React', 'Context API', 'State Management'],
    readTime: '5 min',
    featureSlug: 'hotel-reservation-platform',
    editorial: {
      type: 'project-case',
      visualAssessment: {
        decision: 'provided',
        kind: 'architecture',
        rationale:
          '사용하지 않는 중간 컴포넌트의 간접 props 전달과 예약 라우터 Provider의 직접 소비는 변경 전후 구조를 나누어 볼 때 차이가 명확합니다.',
        question: '예약 단계가 공유하는 상태의 소유 범위와 전달 경로를 어디에 둘 것인가?',
        textAlternative:
          '변경 전에는 상위 상태 소유자가 중간 컴포넌트를 거쳐 예약 단계 화면에 props를 전달했고, 변경 후에는 예약 라우터의 ReservationProvider를 하위 단계가 useReservation으로 직접 소비합니다.',
        nonDuplicationReason:
          '작업물과 첫 인사이트는 플랫폼 코드 경계와 배포 흐름을 설명하고, 이 글은 예약 라우터 안의 상태 전달 경로와 생명주기만 비교합니다.'
      }
    },
    visual: {
      id: 'reservation-context-lifecycle',
      variant: 'before-after',
      title: '예약 상태 전달 구조의 변경 전후',
      question: '예약 단계가 공유하는 상태의 소유 범위와 전달 경로를 어디에 둘 것인가?',
      textAlternative:
        '변경 전에는 상위 상태 소유자가 중간 컴포넌트를 거쳐 예약 단계 화면에 props를 전달했고, 변경 후에는 예약 라우터의 ReservationProvider를 하위 단계가 useReservation으로 직접 소비합니다.',
      panels: [
        {
          id: 'before',
          title: '변경 전: 중간 컴포넌트를 거치는 전달',
          summary: '상태를 사용하지 않는 중간 컴포넌트도 예약 상태와 setter를 다음 단계로 전달했습니다.',
          actors: [
            { id: 'owner', label: '상위 상태 소유자', role: 'source' },
            { id: 'relay', label: '중간 컴포넌트', role: 'relay' },
            { id: 'step', label: '예약 단계 화면', role: 'consumer' }
          ],
          connections: [
            { id: 'owner-relay', from: 'owner', to: 'relay', label: 'props 전달', scope: 'indirect' },
            { id: 'relay-step', from: 'relay', to: 'step', label: 'props 재전달', scope: 'indirect' }
          ]
        },
        {
          id: 'after',
          title: '변경 후: 예약 라우터 범위에서 직접 소비',
          summary: '예약 라우터가 Provider 생명주기를 소유하고 하위 단계가 필요한 상태를 Hook으로 읽습니다.',
          actors: [
            { id: 'provider', label: 'ReservationProvider', role: 'boundary' },
            { id: 'step', label: '예약 단계 화면', role: 'consumer' }
          ],
          connections: [
            {
              id: 'provider-step',
              from: 'provider',
              to: 'step',
              label: 'useReservation 직접 소비',
              scope: 'direct'
            }
          ]
        }
      ]
    },
    content: `## 직접 문제는 Props Drilling이었습니다

객실 선택부터 정보 입력과 예약 확인까지 여러 화면이 같은 예약 상태를 사용했습니다. 상위 컴포넌트가 상태를 소유한 채 아래로 내려주면서, 중간 컴포넌트는 값을 직접 사용하지 않아도 예약 상태와 setter를 props로 받아 다음 컴포넌트에 전달해야 했습니다.

질문은 전역 상태 도구를 무엇으로 바꿀지가 아니라 다음과 같았습니다.

> 예약 단계가 공유하는 상태의 소유 범위와 전달 경로를 어디에 둘 것인가?

## Redux 대신 예약 라우터 범위의 Context를 선택했습니다

Redux도 대안으로 검토했습니다. 여러 route가 함께 쓰는 전역 상태를 중앙에서 관리해야 한다면 적합할 수 있지만, 당시 예약 상태는 하나의 예약 흐름 안에서 여러 단계가 함께 쓰는 값이었습니다. 기존 코드를 Redux store로 옮기는 전환 비용까지 고려해 이번 범위에는 도입하지 않았습니다.

예약 라우터에 \`ReservationProvider\`를 배치하고 그 아래 단계 화면들이 \`useReservation\`으로 필요한 상태를 직접 소비하게 했습니다. 그 결과 중간 컴포넌트가 사용하지 않는 props를 받아 재전달하는 구간을 줄였습니다.

\`\`\`text
변경 전: 상위 상태 소유자 → 중간 컴포넌트 → 예약 단계 화면
변경 후: 예약 라우터 ReservationProvider → useReservation을 사용하는 예약 단계 화면
\`\`\`

## Provider 위치가 상태의 생명주기를 정합니다

Provider를 예약 라우터에 두면 사용자가 예약 흐름에 들어올 때 상태가 만들어지고 그 흐름을 벗어날 때 함께 정리됩니다. App 전체가 아니라 실제로 상태를 공유하는 화면들의 공통 상위가 소유 범위가 됩니다.

이 선택의 결과는 중간 props 전달 감소와 예약 흐름에 맞춘 생명주기 경계입니다. Context를 사용했다는 사실만으로 예약 단계의 실행 순서를 강제하거나 다른 설계 문제까지 해결한 것은 아닙니다.

## 적용할 조건과 피해야 할 조건

서로 관련된 여러 화면이 한 route subtree 안에서 같은 클라이언트 상태를 공유하고, 그 흐름을 벗어날 때 상태도 끝나야 한다면 route-scoped Context를 적용할 수 있습니다.

반대로 관계없는 여러 route가 함께 써야 하는 전역 상태라면 더 넓은 소유 경계가 필요합니다. 최신 서버 응답이 기준인 데이터도 Context만으로 관리하기보다 서버 상태의 조회·동기화 방식을 별도로 정해야 합니다.

## Hook은 사용 계약이지 권한 경계가 아닙니다

\`useReservation\`이 Provider 밖에서 오류를 내도록 한 것은 개발 중 잘못된 사용 위치를 빠르게 발견하기 위한 계약입니다. 이것을 상태 접근 권한을 통제하는 보안 경계로 볼 수는 없습니다.

Context는 성능을 자동으로 보장하지도 않습니다. 값의 구성과 변경 빈도, consumer 범위에 따라 렌더링 영향은 달라질 수 있으므로 필요하면 별도로 측정하고 Provider 또는 상태를 더 나눠야 합니다.`
  },
  {
    slug: 'nestjs-middleware-vs-guard-tradeoff',
    title: 'NestJS 인증은 Middleware와 Guard 중 하나를 고르는 문제가 아니었다',
    excerpt:
      'Express에 익숙했던 당시에는 인증과 쿠키 갱신을 Middleware에, 관리자 등급 확인을 Guard에 나눴습니다. 구현 당시의 선택을 합리화하지 않고, 지금 다시 설계한다면 Global Auth Guard와 별도 권한 Guard로 책임을 나누겠다는 판단까지 정리했습니다.',
    date: new Date('2026-03-01'),
    tags: ['Backend', 'NestJS', 'Authentication', 'Architecture', 'Retrospective'],
    readTime: '5 min',
    featureSlug: 'integrated-reservation-platform',
    editorial: {
      type: 'project-case',
      visualAssessment: {
        decision: 'provided',
        kind: 'architecture',
        rationale:
          '당시 Middleware와 등급 Guard의 책임 배치, 현재 Global Auth Guard와 별도 권한 Guard의 책임 배치를 같은 요청 순서에서 비교해야 하므로 before/after 시각 자료를 제공합니다.',
        question: '당시 인증·권한 책임과 현재의 개선 판단은 요청 생명주기에서 어떻게 다른가?',
        textAlternative:
          '당시 요청은 AdminAuthMiddleware에서 토큰·쿠키·CSRF 확인과 req.user 주입을 거친 뒤 AdminLevelGuard에서 관리자 등급을 확인하고 Controller로 전달됐습니다. 현재 다시 설계한다면 요청은 공개 경로를 제외한 Global Auth Guard에서 기본 인증을 거친 뒤 별도 Permission Guard에서 관리자 등급을 확인하고 Controller로 전달됩니다.',
        nonDuplicationReason:
          '작업물의 UAT workflow는 예약·결제의 사용자·시스템 순서를, Core Product 관계도는 데이터 관계를 설명합니다. 이 시각 자료는 관리자 요청에서 인증과 권한 책임이 놓이는 위치만 비교합니다.'
      }
    },
    visual: {
      id: 'nestjs-auth-boundary-before-after',
      variant: 'before-after',
      showActorRoleLabels: false,
      title: '관리자 요청의 인증·권한 책임 비교',
      question: '당시 인증·권한 책임과 현재의 개선 판단은 요청 생명주기에서 어떻게 다른가?',
      textAlternative:
        '당시 요청은 AdminAuthMiddleware에서 토큰·쿠키·CSRF 확인과 req.user 주입을 거친 뒤 AdminLevelGuard에서 관리자 등급을 확인하고 Controller로 전달됐습니다. 현재 다시 설계한다면 요청은 공개 경로를 제외한 Global Auth Guard에서 기본 인증을 거친 뒤 별도 Permission Guard에서 관리자 등급을 확인하고 Controller로 전달됩니다.',
      panels: [
        {
          id: 'before',
          title: '당시 구현',
          summary: 'Express 경험에서 출발해 인증과 요청 객체 준비를 Middleware에, 등급 확인을 Guard에 나눴습니다.',
          actors: [
            { id: 'before-request', label: '관리자 요청', role: 'source' },
            { id: 'before-middleware', label: 'AdminAuthMiddleware', role: 'boundary' },
            { id: 'before-level-guard', label: 'AdminLevelGuard', role: 'boundary' },
            { id: 'before-controller', label: 'Controller', role: 'consumer' }
          ],
          connections: [
            {
              id: 'before-request-middleware',
              from: 'before-request',
              to: 'before-middleware',
              label: '토큰·쿠키·CSRF 확인',
              scope: 'direct'
            },
            {
              id: 'before-middleware-guard',
              from: 'before-middleware',
              to: 'before-level-guard',
              label: 'req.user 주입 후 등급 확인',
              scope: 'direct'
            },
            {
              id: 'before-guard-controller',
              from: 'before-level-guard',
              to: 'before-controller',
              label: '권한 확인 후 전달',
              scope: 'direct'
            }
          ]
        },
        {
          id: 'after',
          title: '현재 개선 판단',
          summary: '인증을 Global Auth Guard의 기본값으로 두고 공개 경로와 세부 등급 권한을 분리합니다.',
          actors: [
            { id: 'after-request', label: '요청', role: 'source' },
            { id: 'after-auth-guard', label: 'Global Auth Guard', role: 'boundary' },
            { id: 'after-permission-guard', label: 'Permission Guard', role: 'boundary' },
            { id: 'after-controller', label: 'Controller', role: 'consumer' }
          ],
          connections: [
            {
              id: 'after-request-auth',
              from: 'after-request',
              to: 'after-auth-guard',
              label: '기본 인증·공개 경로 제외',
              scope: 'direct'
            },
            {
              id: 'after-auth-permission',
              from: 'after-auth-guard',
              to: 'after-permission-guard',
              label: '인증 후 관리자 등급 확인',
              scope: 'direct'
            },
            {
              id: 'after-permission-controller',
              from: 'after-permission-guard',
              to: 'after-controller',
              label: '권한 확인 후 전달',
              scope: 'direct'
            }
          ]
        }
      ]
    },
    content: `## 익숙한 실행 지점에서 인증을 시작했습니다

행사 호텔 예약·결제 플랫폼의 관리자 인증을 구현할 당시 저는 Node.js와 Express에는 익숙했지만 NestJS의 요청 생명주기와 권장 패턴을 충분히 비교해 본 상태는 아니었습니다. 그래서 Access·Refresh 토큰과 CSRF 값을 확인하고, 필요할 때 토큰과 쿠키를 갱신하며, 이후 로직에서 사용할 \`req.user\`를 주입하는 책임을 \`AdminAuthMiddleware\`에 두었습니다.

관리자 등급은 별도 \`AdminLevelGuard\`에서 확인했습니다. 즉, 당시 구현은 인증과 요청 객체 준비를 Middleware가 맡고 엔드포인트별 등급 권한을 Guard가 맡는 구조였습니다.

## 동작한 구조와 권장 구조는 같은 질문이 아니었습니다

이 책임 분리는 실제 코드에 반영됐지만, Middleware를 Guard보다 우선하는 대안을 충분히 비교한 뒤 선택한 것은 아니었습니다. 기존 글처럼 “Middleware가 더 견고했다”거나 “Guard 선언 누락을 없앴다”고 결론 내리면 당시 판단을 사후에 합리화하게 됩니다.

프로젝트에서 확인한 사실은 Middleware와 Guard를 함께 사용해 인증과 등급 권한을 나눴다는 데까지입니다. 고객사 스테이징 UAT를 진행했지만, 그것을 인증 구조의 운영 안전성이나 권한 누락 없음에 대한 검증으로 확대하지 않습니다.

## 지금 다시 설계한다면 인증을 기본값으로 둡니다

현재의 판단은 다릅니다. 다시 구성한다면 Global Auth Guard로 인증을 기본 적용하고 공개 경로만 명시적으로 제외하겠습니다. 로그인한 사용자의 세부 관리자 등급은 별도의 권한 Guard로 분리하겠습니다.

핵심은 Middleware와 Guard 중 하나를 절대적인 정답으로 고르는 것이 아니라, 인증과 권한 확인의 책임을 어디에서 기본 적용하고 어디에서 세분화할지 정하는 것입니다. 이 프로젝트의 회고에서는 기본 인증과 세부 권한을 Guard 계층에서 드러내는 편이 NestJS 구조를 읽는 사람에게 더 명확하다고 판단했습니다.

## 당시 구현과 현재 판단의 경계를 남깁니다

Global Auth Guard 구조는 이 프로젝트에서 다시 구현하거나 운영으로 검증한 결과가 아니라, 보류 이후의 개선 판단입니다. 반대로 당시 Middleware 구조가 동작했다는 사실도 그 방식이 모든 NestJS 인증에 더 적합하다는 근거는 아닙니다.

따라서 이 사례에서 가져갈 기준은 “Middleware 대신 무조건 Guard”가 아닙니다. 인증의 기본 적용, 공개 경로 예외와 관리자 등급 권한을 서로 다른 책임으로 명시하고, 프레임워크 안에서 그 경계가 가장 잘 드러나는 위치를 선택하는 것입니다.`
  },
  {
    slug: 'nextjs-nestjs-domain-separation-and-bff',
    title: '[Next.js x NestJS] 프론트엔드와 백엔드의 도메인 분리와 BFF 설계',
    excerpt:
      'A-domain.com의 브라우저가 api.A-domain.com을 직접 호출할 때 인증 쿠키의 저장·전달 실패를 확인했습니다. Next.js reverse proxy로 요청 Origin을 맞춘 뒤 새로 드러난 Cloudflare 서버 요청 경계까지, 실제 구현과 스테이징 검증 범위로 정리했습니다.',
    date: new Date('2026-03-01'),
    tags: ['Architecture', 'Next.js', 'NestJS', 'Authentication', 'BFF'],
    readTime: '6 min',
    featureSlug: 'integrated-reservation-platform',
    editorial: {
      type: 'project-case',
      visualAssessment: {
        decision: 'provided',
        kind: 'architecture',
        rationale:
          '브라우저 직접 호출과 Next.js reverse proxy 이후에는 요청 주체, Origin과 Cloudflare 경계가 달라지므로 두 네트워크 구성을 before/after로 비교합니다.',
        question: '브라우저 직접 호출에서 reverse proxy 경계로 바뀌며 쿠키와 Cloudflare 문제는 어떻게 분리됐는가?',
        textAlternative:
          '변경 전에는 A-domain.com의 브라우저가 api.A-domain.com을 직접 호출했고 인증 쿠키의 저장·전달 실패를 확인했습니다. 변경 후에는 브라우저가 A-domain.com의 /bff를 호출하고 Next.js reverse proxy가 Cloudflare를 거쳐 NestJS API로 요청했습니다. 서버 요청 차단은 BFF 서버의 고정 IP를 허용해 스테이징에서 복구했습니다.',
        nonDuplicationReason:
          '작업물의 UAT workflow는 행사 설정부터 예약·PG 테스트 결제까지의 업무 순서를 보여 줍니다. 이 시각 자료는 브라우저 Origin, Next.js 서버 중계와 Cloudflare 허용이라는 네트워크 경계만 비교합니다.'
      }
    },
    visual: {
      id: 'nextjs-nestjs-origin-boundary-before-after',
      variant: 'before-after',
      showActorRoleLabels: false,
      title: '브라우저 직접 호출과 reverse proxy 경계 비교',
      question: '브라우저 직접 호출에서 reverse proxy 경계로 바뀌며 쿠키와 Cloudflare 문제는 어떻게 분리됐는가?',
      textAlternative:
        '변경 전에는 A-domain.com의 브라우저가 api.A-domain.com을 직접 호출했고 인증 쿠키의 저장·전달 실패를 확인했습니다. 변경 후에는 브라우저가 A-domain.com의 /bff를 호출하고 Next.js reverse proxy가 Cloudflare를 거쳐 NestJS API로 요청했습니다. 서버 요청 차단은 BFF 서버의 고정 IP를 허용해 스테이징에서 복구했습니다.',
      panels: [
        {
          id: 'before',
          title: '브라우저의 API 직접 호출',
          summary: '같은 기본 도메인의 서로 다른 Origin을 직접 오가며 인증 쿠키 저장·전달 실패를 확인했습니다.',
          actors: [
            { id: 'before-browser', label: 'Browser · A-domain.com', role: 'source' },
            { id: 'before-api-origin', label: 'api.A-domain.com', role: 'server' },
            { id: 'before-nest-api', label: 'NestJS API', role: 'consumer' }
          ],
          connections: [
            {
              id: 'before-browser-api-origin',
              from: 'before-browser',
              to: 'before-api-origin',
              label: '직접 호출 · 쿠키 저장·전달 실패 확인',
              scope: 'direct'
            },
            {
              id: 'before-origin-nest-api',
              from: 'before-api-origin',
              to: 'before-nest-api',
              label: 'API 요청',
              scope: 'direct'
            }
          ]
        },
        {
          id: 'after',
          title: 'Next.js reverse proxy 이후',
          summary: '브라우저 Origin을 프론트엔드로 맞추고 서버 요청의 Cloudflare 허용 경계를 분리했습니다.',
          actors: [
            { id: 'after-browser', label: 'Browser', role: 'source' },
            { id: 'after-next-bff', label: 'A-domain.com · /bff', role: 'relay' },
            { id: 'after-cloudflare', label: 'Cloudflare', role: 'boundary' },
            { id: 'after-nest-api', label: 'NestJS API', role: 'consumer' }
          ],
          connections: [
            {
              id: 'after-browser-bff',
              from: 'after-browser',
              to: 'after-next-bff',
              label: '프론트 Origin으로 요청',
              scope: 'direct'
            },
            {
              id: 'after-bff-cloudflare',
              from: 'after-next-bff',
              to: 'after-cloudflare',
              label: '서버 요청 · 고정 IP 허용',
              scope: 'direct'
            },
            {
              id: 'after-cloudflare-nest-api',
              from: 'after-cloudflare',
              to: 'after-nest-api',
              label: '스테이징 통신 복구',
              scope: 'direct'
            }
          ]
        }
      ]
    },
    content: `## 같은 기본 도메인에서도 브라우저의 호출 Origin은 달랐습니다

행사 호텔 예약·결제 플랫폼에서 프론트엔드는 \`A-domain.com\`, API는 \`api.A-domain.com\`에 배치했습니다. 두 주소는 같은 기본 도메인을 사용하지만 브라우저 기준으로는 서로 다른 Origin이었습니다.

처음에는 브라우저가 API Origin을 직접 호출했습니다. 이 구조에서 인증 쿠키가 저장되거나 다음 요청에 전달되지 않는 상황을 실제로 확인했습니다. 다만 당시 브라우저 설정과 네트워크 조건을 모두 분리해 정확한 실패 원인까지 기록한 것은 아니므로, 특정 브라우저 정책 하나를 원인으로 단정하지 않습니다.

## Next.js reverse proxy로 브라우저 경계를 바꿨습니다

브라우저가 API Origin을 직접 호출하는 대신 프론트엔드의 \`/bff\` 경로를 호출하도록 바꾸고, Next.js rewrite가 NestJS API로 요청을 전달하게 했습니다. 브라우저가 보는 요청 Origin을 프론트엔드에 맞추면서 인증 쿠키와 CSRF 값을 사용하는 요청도 이 경계를 통과하도록 구성했습니다.

당시 구현은 요청을 대신 전달하는 reverse proxy가 중심이었습니다. 응답 조합, 프론트엔드 전용 데이터 가공과 별도의 권한 정책까지 갖춘 완성형 BFF를 구현했다고 확대하지 않습니다.

## 프록시 뒤에서는 Cloudflare 경계가 새로 드러났습니다

호출 주체가 브라우저에서 Next.js 서버로 바뀐 뒤, BFF 서버가 NestJS API로 보내는 요청이 Cloudflare 봇 차단에 걸렸습니다. 저는 이 원인을 확인하고 BFF 서버의 고정 IP를 Cloudflare 허용 규칙에 등록했습니다. 그 결과 고객사 스테이징에서 서버 요청과 인증 흐름을 다시 확인할 수 있었습니다.

이 대응은 스테이징 범위에서 확인한 결과입니다. 실제 IP와 설정값은 공개하지 않으며, 전 환경 정상화나 운영 장애 해결로 표현하지 않습니다. 이 프로젝트는 정식 운영 전에 보류됐기 때문에 운영 트래픽과 성능 결과도 없습니다.

## 지금의 판단은 이름보다 실제 책임을 먼저 확인하는 것입니다

당시에 별도의 대안을 체계적으로 비교한 기록은 없습니다. 브라우저 직접 호출에서 확인한 문제를 Next.js reverse proxy로 옮기고, 그 뒤의 Cloudflare 서버 요청 경계를 해결한 구현 순서가 남아 있을 뿐입니다.

현재 이 구조를 설명할 때는 “BFF를 도입했다”는 이름보다 실제로 어디까지 책임졌는지를 먼저 밝히는 편이 정확하다고 판단합니다. 이 프로젝트의 BFF 경계는 브라우저의 Origin을 맞추고 서버가 API 요청을 중계한 범위입니다. 이 사례만으로 모든 외부 API 호출에 BFF가 필수라고 일반화하지 않습니다.

인증 쿠키와 서버 요청 경계를 함께 다뤄야 하는 이 프로젝트에서는 reverse proxy가 문제를 분리하는 데 필요했습니다. 반면 응답 조합·가공이나 프론트 전용 권한까지 수행하지 않았다면, 그 기능까지 완성한 BFF처럼 설명해서는 안 됩니다.`
  },
  {
    slug: 'https-and-plaintext-password-transmission',
    title: '구글과 네이버는 왜 비밀번호를 평문으로 보낼까? (개발자 도구의 착시와 HTTPS의 진실)',
    excerpt:
      '개발자 도구의 Request Payload를 네트워크 평문으로 오해해 비밀번호 전송용 클라이언트 암호화를 구현했다가 제거했습니다. 애플리케이션 Payload, TLS 전송과 서버 bcrypt 저장의 서로 다른 경계를 실제 경험 범위로 정리했습니다.',
    date: new Date('2026-03-01'),
    tags: ['Security', 'HTTPS', 'Authentication', 'Frontend', 'Backend'],
    readTime: '5 min',
    featureSlug: 'integrated-reservation-platform',
    editorial: {
      type: 'project-case',
      visualAssessment: {
        decision: 'not-needed',
        rationale:
          '개발자 도구의 애플리케이션 Payload, HTTPS의 TLS 전송과 서버 bcrypt 저장은 짧은 순서형 문장으로 경계를 충분히 설명할 수 있습니다. 별도 보안 다이어그램은 이 프로젝트에서 검증하지 않은 공격 방어 범위까지 시각적으로 강화하거나 정당화할 수 있어 추가하지 않습니다.'
      }
    },
    content: `## 개발자 도구에 보인 값을 네트워크 평문으로 오해했습니다

로그인 기능을 구현하면서 브라우저 개발자 도구의 Request Payload에 입력한 비밀번호가 그대로 보이는 것을 확인했습니다. 당시에는 이 화면이 실제 네트워크 구간에서도 같은 값이 노출된다는 뜻이라고 오해했습니다.

그 오해에서 출발해 비밀번호를 브라우저에서 한 번 암호화한 뒤 서버에서 복호화하는 로직을 직접 구현했습니다. 그러나 구현을 검토하면서 개발자 도구가 보여 주는 애플리케이션 내부의 요청 데이터와 HTTPS의 TLS가 보호하는 네트워크 전송 구간은 서로 다른 경계라는 점을 이해했습니다.

## 프론트엔드에 함께 배포되는 키는 비밀이 아니었습니다

비밀번호를 클라이언트에서 복호화 가능한 방식으로 암호화하려면 브라우저 코드에도 그 처리 로직과 키 정보가 포함됩니다. 이 프로젝트에서 시도한 구조에서는 사용자가 내려받는 프론트엔드 코드에서 키를 확인할 수 있어, 비밀번호 전송에 별도의 비밀 경계를 추가했다고 보기 어려웠습니다.

구글과 네이버의 로그인 요청도 개발자 도구에서 직접 확인했습니다. 두 서비스 역시 HTTPS 위에서 비밀번호를 별도의 클라이언트 암호화 없이 요청 본문에 담아 보냈습니다. 이 관찰은 외부 서비스의 전체 보안 구조를 분석했다는 뜻이 아니라, 개발자 도구에 Payload가 보이는 것과 네트워크 구간의 보호가 같은 문제가 아니라는 점을 확인한 계기였습니다.

## 비밀번호 전송용 암호화만 제거했습니다

이후 비밀번호 전송을 위해 추가했던 클라이언트 암호화를 제거했습니다. 서버에서는 전달받은 비밀번호를 bcrypt로 해시해 저장하는 구현을 사용했습니다. 전송 구간은 HTTPS, 저장 구간은 서버의 단방향 해시라는 서로 다른 책임으로 정리했습니다.

이 결정은 클라이언트 암호화를 모두 없앴다는 뜻이 아닙니다. 현재 코드에도 예약 임시 데이터와 이메일을 \`sessionStorage\`에 보관할 때 사용하는 AES 유틸리티가 남아 있습니다. 제거 범위는 비밀번호 전송을 위해 별도로 추가했던 로직으로 한정합니다.

## 보이지 않게 만드는 것과 보호하는 것을 구분합니다

현재의 판단은 개발자 도구에서 값이 보이는지보다 데이터가 어느 경계를 지날 때 어떤 보호를 받는지 먼저 확인해야 한다는 것입니다. 이 프로젝트에서는 HTTPS가 적용된 전송 구간과 서버 bcrypt 저장을 기준으로 삼았고, 브라우저에 함께 배포되는 키로 비밀번호를 한 번 더 감싸는 방식은 유지하지 않았습니다.

다만 이 경험만으로 모든 애플리케이션 계층 암호화가 불필요하다고 일반화하지 않습니다. 여기서 확인하고 제거한 것은 브라우저에 키가 함께 배포되던 비밀번호 전송용 추가 암호화입니다. 과거 구현 이력은 사용자 경험에 근거한 보고값이며 현재 저장소에서는 제거 전 커밋을 다시 확인하지 못했습니다.`
  },
  {
    slug: 'ai-vibe-coding',
    title: 'AI 에이전트로 포트폴리오 구축하기: 아키텍트의 역할과 검증 기준',
    excerpt:
      '최근 개발 생태계의 뜨거운 감자인 AI 에이전트 기반 개발. 실무에서 복잡한 트랜잭션을 다루던 백엔드 개발자인 저는, 상대적으로 도메인 로직이 가벼운 개인 포트폴리오 웹사이트 구축을 기회 삼아 **AI 에이전트 중심의 개발 워크플로우**를 실험해 보았습니다. 이 실험을 통해 깨달은 AI 시대 개발자의 역할과, 아키텍처 설계의 중요성에 대한 회고입니다.',
    date: new Date('2026-03-03'),
    tags: ['AI-Driven Development', 'Clean Architecture', 'Antigravity', 'TDD', 'Vibe Coding'],
    readTime: '10 min',
    content: `## The Problem: AI 도구의 한계와 통제 기준의 부재

바이브 코딩을 시도하기 위해 Cursor, Claude Code 등 유명한 AI 에디터들을 사용해 보았지만, 금세 한계에 부딪혔습니다.
프로젝트의 규모가 커질수록 AI가 기억하는 토큰이 부족해져 엉뚱한 코드를 내뱉거나, 기존의 맥락을 잃어버리는 일이 잦았습니다. 또한, AI가 내부적으로 어떤 생각을 거쳐 코드를 짜고 있는지 가시적으로 확인하기 어려워 명확한 통제 기준이 필요했습니다.

결국 단순히 AI에게 "포트폴리오 만들어줘"라고 던지는 방식으로는 제가 원하는 수준의 견고한 결과물을 얻을 수 없음을 깨달았고, **AI를 단순한 '코드 생성기'가 아닌, 각자의 역할을 가진 '개발팀'으로 세팅하여 제가 직접 지휘하는 방식**으로 전략을 수정했습니다.

## The Solution: Antigravity와 에이전트 오케스트레이션

인프라는 가비아(도메인)와 AWS EC2를 활용하고, 디자인은 Figma Make로 뼈대를 잡은 뒤, 본격적인 개발 환경으로는 토큰 용량이 넉넉하고 Agent Manager를 통해 여러 에이전트의 상태를 한눈에 볼 수 있는 **Antigravity**를 선택했습니다.

**1. 3인의 AI 에이전트 팀 구축과 초기 세팅 (Rules & Skills)**
가장 공을 들인 부분은 코딩이 아니라 '초기 세팅'이었습니다. AI가 짜는 코드의 파편화를 막기 위해 \`rules\`, \`skills\`, \`workflows\`를 엄격하게 정의하는 프롬프트 엔지니어링에 집중했습니다. 그리고 AI를 세 개의 페르소나로 나누었습니다.

- **기획 Agent:** 요구사항을 분석하고 작업 전 반드시 구현 계획을 문서화
- **Front Agent:** React/Next.js 기반의 UI/UX 및 클라이언트 로직 담당
- **Back Agent:** 서버 아키텍처 및 API 통신 담당

**2. Clean Architecture와 TDD 강제화**
AI가 편한 대로 스파게티 코드를 짜는 것을 막기 위해, 시스템 구조는 **클린 아키텍처(Clean Architecture)**를 따르도록 강제했습니다.
또한 주요 기능을 작업할 때 **TDD(테스트 주도 개발) 기반의 RED - GREEN - REFACTOR 워크플로우**를 거치도록 룰을 세팅했습니다. 테스트 코드를 먼저 작성하게 한 뒤, 이를 통과하는 코드를 짜고, 마지막으로 아키텍처 룰에 맞게 리팩토링하는 과정을 AI가 반복하게 만들었습니다.

**3. 나의 역할: 코더에서 디렉터로**
저는 코드를 한 글자도 치지 않았습니다. 대신 에이전트들이 가져온 계획서와 결과물을 보고 **"이 아키텍처가 재사용성이 높은가?", "사용자 친화적인 UX인가?", "예외 처리는 제대로 되었는가?"**를 끊임없이 질문하고 리뷰하며, 수정 방향을 제시하는 '아키텍트'이자 'QA' 역할에만 매진했습니다.

## The Result & Retrospective

결과는 인상적이었습니다. 명확한 규칙과 TDD 기반으로 AI가 작성한 코드는 일관된 구조를 유지했고, 기능적 버그도 적었습니다. 오히려 AI가 작성한 패턴을 보며 "이 로직은 이렇게 풀 수도 있구나" 하고 배운 점도 많았습니다.

이 AI 에이전트 기반 개발 경험은 저에게 **"AI 시대에 개발자는 무엇을 준비해야 하는가?"**에 대한 구체적인 고민을 남겼습니다.

1. **How to Code 보다 What & Why가 중요한 시대:** 코드를 타이핑하는 행위 자체의 가치는 점점 낮아질 것이라고 생각합니다. 대신 어떤 기술을 선택하는 게 적합한지, 요구사항을 충족하기 위한 시스템 설계는 어때야 하는지를 통찰하는 능력이 핵심 경쟁력이 됩니다.
2. **다각화된 시선과 디테일의 차이:** AI가 아무리 뛰어나도, 결국 결과물의 한계선을 결정하는 것은 사람의 '디테일한 통제력'이었습니다. 똑같은 AI를 써도, 개발자가 시스템을 바라보는 시야의 깊이에 따라 결과물은 하늘과 땅 차이로 벌어집니다.

코드를 '잘 치는' 능력보다 **"왜 이 구조로 가야 하는가?", "어떤 아키텍처가 미래를 대비할 수 있는가?"**를 먼저 묻는 것이 AI 시대에 더 중요해졌다고 느낍니다.

---

### 💡 [Bonus Insight] Certbot은 어떻게 명령 한 줄로 SSL을 평생 자동 갱신할까?

이번 포트폴리오를 배포하며 \`sudo certbot --nginx -d bbagyun.com -d www.bbagyun.com\` 명령어 한 줄로 HTTPS를 적용했습니다. Let's Encrypt의 인증서는 90일 단위로 만료되는데, 저는 갱신 스크립트를 짠 적이 없음에도 어떻게 '자동 갱신'이 이루어지는지 문득 궁금해져 그 원리를 파헤쳐 보았습니다.

**동작 원리: OS 백그라운드 스케줄러 (Cron / Systemd Timer)**
Certbot 패키지를 리눅스(Ubuntu/Rocky 등)에 설치하는 순간, 패키지 매니저(apt, snap 등)가 OS 백그라운드에 **자동으로 스케줄러를 등록**합니다.

1. **타이머 등록:** OS 내부(예: \`/etc/cron.d/certbot\` 또는 \`systemctl list-timers\`)에 Certbot이 하루에 두 번씩 몰래 실행되도록 스케줄이 등록됩니다.
2. **만료일 체크:** 백그라운드에서 실행된 Certbot은 인증서의 남은 기간을 확인합니다. 만약 만료일이 30일 미만으로 남았다면 갱신 프로세스를 시작하고, 넉넉히 남았다면 아무 일도 하지 않고 조용히 종료됩니다.
3. **ACME 챌린지와 Nginx Reload:** 갱신이 필요해지면, Certbot은 Let's Encrypt 서버와 통신(ACME 프로토콜)하여 "이 도메인 내 거 맞다"는 것을 임시 챌린지 파일을 통해 증명합니다. 증명이 완료되어 새 인증서를 다운로드받으면, Certbot이 알아서 \`systemctl reload nginx\`를 쳐서 웹 서버를 재시작 없이 깔끔하게 갱신해 줍니다.

결국, 명령어 한 줄을 쳤을 뿐이지만 그 안에는 **[인증서 발급 + 웹 서버 환경설정 파일 자동 수정 + 백그라운드 갱신 스케줄러 등록]**이라는 거대한 데브옵스 파이프라인이 한 번에 동작했던 것입니다. 블랙박스처럼 보이던 인프라 명령어의 내부를 뜯어보니 시스템 아키텍처에 대한 흥미가 더욱 깊어집니다`
  },
  {
    slug: 'socketio-realtime-architecture-and-reliability',
    title: '공용 Room에서 화원별 User Room으로: 전달 범위와 전달 보장은 다르다',
    excerpt:
      '하이패스 신규 구축에서 Socket.io의 공용 Room이 관계없는 사용자에게도 주문 이벤트를 보낼 수 있음을 발견해 화원별 User Room으로 바꿨습니다. 수신 대상을 제한한 결과와 메시지 도달을 보장하지 못한 범위를 분리해 설명합니다.',
    date: new Date('2026-09-04'),
    tags: ['Backend', 'Architecture', 'Socket.io', 'Real-time', 'Operations'],
    readTime: '7 min',
    featureSlug: 'hipass-b2b-platform',
    editorial: {
      type: 'project-case',
      visualAssessment: {
        decision: 'provided',
        kind: 'architecture',
        rationale: '공용 Room과 화원별 User Room에서 이벤트 수신 대상이 어떻게 달라지는지 전후 구조로 비교합니다.',
        question: '공용 Room에서 화원별 User Room으로 바꾸자 주문 이벤트의 수신 대상은 어떻게 달라졌는가?',
        textAlternative:
          '변경 전에는 서버가 공용 Room을 통해 주문·수주 화원뿐 아니라 관계없는 사용자에게도 주문 이벤트를 보낼 수 있었고, 변경 후에는 주문 화원과 수주 화원의 화원별 User Room에만 이벤트를 보냈습니다.',
        nonDuplicationReason:
          '작업물은 주문 결제와 보상 취소의 서버 흐름을 보여 주고, 이 인사이트는 Socket.io Room 변경 전후의 전달 대상만 비교합니다.'
      }
    },
    visual: {
      id: 'socket-room-scope-before-after',
      variant: 'before-after',
      title: 'Socket.io Room 전달 범위 변화',
      question: '공용 Room에서 화원별 User Room으로 바꾸자 주문 이벤트의 수신 대상은 어떻게 달라졌는가?',
      textAlternative:
        '변경 전에는 서버가 공용 Room을 통해 주문·수주 화원뿐 아니라 관계없는 사용자에게도 주문 이벤트를 보낼 수 있었고, 변경 후에는 주문 화원과 수주 화원의 화원별 User Room에만 이벤트를 보냈습니다.',
      panels: [
        {
          id: 'before',
          title: '공용 Room',
          summary: '주문과 관계없는 사용자도 같은 Room에서 이벤트를 받을 수 있었습니다.',
          actors: [
            { id: 'before-server', label: 'Socket.io 서버', role: 'server' },
            { id: 'common-room', label: '공용 Room', role: 'room' },
            { id: 'before-orderer', label: '주문 화원', role: 'recipient' },
            { id: 'before-receiver', label: '수주 화원', role: 'recipient' },
            { id: 'before-unrelated', label: '관계없는 사용자', role: 'unrelated' }
          ],
          connections: [
            {
              id: 'broadcast-common-room',
              from: 'before-server',
              to: 'common-room',
              label: '주문 이벤트 브로드캐스트',
              scope: 'overbroad'
            },
            {
              id: 'common-to-orderer',
              from: 'common-room',
              to: 'before-orderer',
              label: '수신',
              scope: 'intended'
            },
            {
              id: 'common-to-receiver',
              from: 'common-room',
              to: 'before-receiver',
              label: '수신',
              scope: 'intended'
            },
            {
              id: 'common-to-unrelated',
              from: 'common-room',
              to: 'before-unrelated',
              label: '불필요한 수신 가능',
              scope: 'overbroad'
            }
          ]
        },
        {
          id: 'after',
          title: '화원별 User Room',
          summary: '주문 화원과 수주 화원의 Room만 이벤트 대상으로 선택했습니다.',
          actors: [
            { id: 'after-server', label: 'Socket.io 서버', role: 'server' },
            { id: 'orderer-room', label: '주문 화원 User Room', role: 'room' },
            { id: 'receiver-room', label: '수주 화원 User Room', role: 'room' },
            { id: 'after-orderer', label: '주문 화원', role: 'recipient' },
            { id: 'after-receiver', label: '수주 화원', role: 'recipient' }
          ],
          connections: [
            {
              id: 'target-orderer-room',
              from: 'after-server',
              to: 'orderer-room',
              label: '관련 Room 지정',
              scope: 'intended'
            },
            {
              id: 'target-receiver-room',
              from: 'after-server',
              to: 'receiver-room',
              label: '관련 Room 지정',
              scope: 'intended'
            },
            {
              id: 'orderer-room-to-user',
              from: 'orderer-room',
              to: 'after-orderer',
              label: '수신',
              scope: 'intended'
            },
            {
              id: 'receiver-room-to-user',
              from: 'receiver-room',
              to: 'after-receiver',
              label: '수신',
              scope: 'intended'
            }
          ]
        }
      ]
    },
    content: `## 신규 구축에서 Polling과 Socket.io를 비교했습니다

하이패스 백엔드를 혼자 맡아 신규 구축할 때 주문 상태를 어떻게 전달할지 정해야 했습니다. 주기적으로 상태를 확인하는 Polling과 즉시 상태를 전달하는 Socket.io를 비교했고, 주문 변화를 바로 알려 주기 위해 Socket.io를 선택했습니다. 이미 운영하던 Polling을 제거한 작업은 아니었습니다.

## 공용 Room은 관계없는 사용자까지 포함했습니다

초기에는 주문 화면 사용자들이 하나의 공용 Room에 들어가는 구조였습니다. 개발 중 코드를 재검토하면서 관계없는 사용자도 다른 화원의 주문 이벤트를 받을 수 있다는 점을 발견했습니다. 운영 사고나 트래픽 시뮬레이션으로 발견한 문제가 아니었습니다.

이 문제의 핵심은 성능 수치가 아니라 전달 대상이었습니다. 특정 주문과 관계없는 사용자에게 이벤트를 보낼 이유가 없었고, 서버에서 수신 범위를 구분해야 했습니다.

## 화원별 User Room으로 수신 대상을 제한했습니다

주문 화원과 수주 화원의 \`user_<gardenId>\` Room에만 이벤트를 보내도록 변경했습니다. 개발 환경에서 서로 다른 화원 계정으로 확인했고, 관련 사용자에게만 이벤트가 전달되어 화면 갱신이 일어나는 것을 브라우저에서 확인했습니다. 전환 전후의 트래픽이나 성능 감소량은 측정하지 않았습니다.

## 전달 범위와 전달 보장은 다른 문제였습니다

공용 Room을 사용하던 때 서버 송신 기록은 있었지만 브라우저가 이벤트를 수신하지 못한 사례를 확인했습니다. 정확한 유실 원인은 규명하지 못했습니다.

User Room으로 바꾼 뒤에는 같은 유실 조건을 재현하는 방법을 찾지 못했습니다. 따라서 Room 변경으로 유실을 해결했거나 메시지 도달을 보장했다고 주장하지 않습니다. 전달 범위를 올바른 사용자로 좁히는 것과 네트워크 단절 중에도 이벤트 도달을 보장하는 것은 서로 다른 문제입니다.

## 운영에서는 동작을 확인했지만 내부 전달은 검증하지 못했습니다

운영 서버에는 PM2 3개 워커와 Socket.io cluster adapter 구성을 적용했습니다. 브라우저에서 소켓 이벤트와 화면 갱신이 정상 동작하는 것은 확인했습니다.

다만 다중 워커 사이의 이벤트 전달 구조를 정확히 이해하지 못했고, 워커 간 이벤트 전달만 분리해 검증하지도 않았습니다. 운영 화면에서 동작했다는 관찰을 클러스터 전달 보장으로 확대하지 않습니다.

## 적용 기준

특정 사용자·조직의 상태를 다루는 이벤트는 사용자별 Room으로 제한합니다. 반대로 모두에게 같은 정보가 필요한 공지성 이벤트라면 공용 Room을 사용할 수 있습니다.

어떤 Room을 선택하든 수신 대상 설계와 메시지 도달 보장은 별도로 검토해야 합니다. 이 프로젝트에서 확인한 것은 관련 화원만 수신하도록 범위를 바꾼 결과까지이며, 연결 단절과 재연결 사이의 복구 방식은 구현하거나 검증하지 않았습니다.`
  },
  {
    slug: 'vercel-team-plan-bypass-and-serverless-cost-analysis',
    title: 'Vercel Developer Seat 비용 조건과 Custom CI 배포 검증',
    excerpt:
      '2026-08 Vercel Pro의 Developer Seat·Viewer·usage credit 공개 조건과 GitHub Actions + Vercel CLI 직접 실험을 분리해, Custom CI가 맞는 범위와 사용량 비용을 더 검증해야 하는 조건을 정리했습니다.',
    date: new Date('2026-04-23'),
    tags: ['DevOps', 'Vercel', 'GitHub Actions', 'Cost Optimization', 'Serverless'],
    readTime: '8 min',
    studySlug: 'ai-dx-harness-starter-kit',
    editorial: {
      type: 'technical-exploration',
      visualAssessment: {
        decision: 'not-needed',
        rationale:
          'Vercel 가격 조건과 Custom CI 선택 기준은 본문의 비용 표로 비교할 수 있어 별도 시각 자료를 추가하지 않습니다.'
      }
    },
    content: `DX 하네스 v1 PoC에서 확인하려던 질문은 단순했습니다. Vercel 프로젝트 권한이 필요한 사람과 코드만 기여하는 사람을 구분했을 때, 모든 기여자를 유료 Developer Seat로 초대하지 않고도 일관된 배포 흐름을 만들 수 있는가였습니다. 동시에 BFF처럼 서버 실행이 포함된 구조에서는 정액 플랜만 보고 비용을 판단해도 되는지 확인해야 했습니다.

## 2026-08 공식 조건과 직접 실험을 먼저 분리했다

2026-08 기준 Vercel 공개 가격에서 Pro는 월 $20이며 개발자 seat 1개와 월 $20 usage credit이 포함됩니다. 추가 개발자 seat는 월 $20이고 viewer는 무료입니다. 이 조건은 [Vercel Pro plan](https://vercel.com/docs/plans/pro-plan), [pricing documentation](https://vercel.com/docs/pricing), [pricing page](https://vercel.com/pricing)에서 확인했습니다.

이 공개 가격은 현재 플랜 조건을 설명할 뿐, 당시 실제 청구 비용이나 과거 절감액을 뜻하지 않습니다. 또한 workload별 사용량 계산에는 요청, 전송, 컴퓨트 같은 입력과 산식이 필요합니다. 이 글에서는 그 입력을 복원하지 못했으므로 고정 총액을 계산하지 않았고 네트워크 전송, 세금과 환율도 계산에서 제외했습니다.

직접 확인한 범위는 배포 방식입니다. v1 PoC에서 Git Integration 대신 **GitHub Actions와 Vercel CLI를 결합한 Custom CI 파이프라인**을 구축했습니다.

**1. Infisical을 통한 인증 정보 동적 주입**

Vercel에 접근하기 위한 \`VERCEL_TOKEN\` 등을 GitHub Secrets에 하드코딩하지 않고, 실행 시 중앙 환경변수 서버인 Infisical에서 동적으로 주입받아 시크릿 노출면을 줄였습니다.

**2. GitHub Actions 러너에서 빌드 위임**

\`\`\`yaml
- name: Pull Vercel environment info
  run: vercel pull --yes --environment=\${{ steps.env.outputs.vercel_env }} --token=\${{ steps.vercel-creds.outputs.token }}

- name: Build with Vercel
  run: vercel build \${{ steps.env.outputs.prod_flag }} --token=\${{ steps.vercel-creds.outputs.token }}
\`\`\`

Vercel 서버의 빌드 리소스를 쓰지 않고, GitHub Actions 환경에서 \`vercel pull\`과 \`build\`를 수행하여 산출물(\`.vercel/output\`)을 생성합니다.

**3. 사전 빌드된 결과물만 Vercel로 전송**

\`\`\`yaml
- name: Deploy to Vercel
  run: |
    vercel deploy --prebuilt \${{ steps.env.outputs.prod_flag }} \\
      --token=\${{ steps.vercel-creds.outputs.token }} \\
      --meta githubCommitAuthor="\${{ github.actor }}" \\
      --meta githubCommitSha="\${{ github.sha }}" ...
\`\`\`

이 파이프라인의 핵심입니다. \`--prebuilt\` 옵션으로 GitHub Actions에서 완성된 산출물만 쏘아 올립니다. Vercel 대시보드에 커밋 로그를 살리기 위해 \`--meta\` 태그로 GitHub의 메타데이터를 직접 매핑해 주었습니다.

결과적으로 Vercel 프로젝트 권한이 필요하지 않은 기여자는 저장소에 push하고, 권한을 가진 배포 주체가 토큰 기반 workflow로 배포하는 흐름을 검증했습니다. 이는 유료 seat를 기술적으로 우회했다는 뜻이 아닙니다. 프로젝트 설정을 변경하거나 Vercel 안에서 협업해야 하는 사람은 역할에 맞는 Developer Seat가 필요합니다.

## 어떤 조건에서 Custom CI가 맞는가

| 판단 항목 | Custom CI가 맞는 조건 | 다시 검토할 조건 |
| --- | --- | --- |
| 프로젝트 권한 | 소수의 배포 주체만 Vercel 권한 필요 | 여러 사람이 프로젝트 설정·운영을 함께 담당 |
| 배포 흐름 | GitHub Actions가 검증과 배포의 단일 진입점 | Git Integration의 preview·권한 흐름이 더 중요 |
| 사용량 비용 | 실제 요청·전송·컴퓨트 사용량을 관찰 가능 | BFF 지연이나 트래픽 편차가 크고 비용 입력이 불명확 |

BFF가 외부 API 응답을 기다리는 시간은 컴퓨트 사용량 판단에 영향을 줄 수 있습니다. 그러나 과거의 호출 수와 응답 시간 가정을 현재 가격에 대입해 실제 비용처럼 제시할 근거는 없습니다. 운영에 적용할 때는 [limits and pricing](https://vercel.com/docs/limits)의 현재 metric을 기준으로 실제 사용량을 먼저 수집해야 합니다.

## Result & Retrospective

직접 실험으로 확인한 결론은 Custom CI가 배포 권한을 소수 주체에 모을 수 있다는 점입니다. 반면 공개 문서에서 확인한 plan·seat·credit 조건만으로 workload 비용까지 결론 내릴 수는 없었습니다. 따라서 권한이 필요한 인원, preview 협업 방식, 요청·전송·컴퓨트 사용량을 함께 측정한 뒤 Vercel과 다른 실행 환경을 비교하는 것이 적용 기준입니다.`
  },
  {
    slug: 'infisical-centralized-secrets-and-spof-defense',
    title: '환경변수 중앙화는 저장보다 경계 설계다: Infisical Self-Hosted 도입기',
    excerpt:
      '여러 호텔 프로젝트의 환경변수가 Jenkins UI·로컬 .env·Slack에 흩어져 있던 구조에서 다른 호텔의 값이 운영 배포에 섞이는 장애가 발생했습니다. Infisical을 프로젝트·환경·실행 목적별 단일 원천으로 구성하고, 배포와 복구의 장애 경계를 나눈 경험입니다.',
    date: new Date('2026-04-23'),
    tags: ['DevOps', 'Infisical', 'Security', 'SSOT', 'High-Availability'],
    readTime: '7 min',
    featureSlug: 'codi-harness-dx-platform',
    editorial: {
      type: 'project-case',
      visualAssessment: {
        decision: 'provided',
        kind: 'architecture',
        rationale:
          '도입 전 분산된 시크릿, Infisical의 소유권 경계, 검증한 배포 실패 격리와 아직 분리하지 못한 백업 복구 경계를 하나의 architecture로 제공합니다.',
        question: '환경변수를 중앙화하면서 소유권, 배포 실패와 복구 경계를 어떻게 나눴는가?',
        textAlternative:
          '도입 전의 분산된 관리에서 도입 후의 Infisical 단일 원천으로 전환하고, 새 배포 실패와 기존 서비스의 동작을 분리했지만 백업은 같은 인스턴스에 남아 있습니다.',
        nonDuplicationReason:
          '작업물의 CI/CD 스윔레인은 변경 감지부터 배포 확인까지의 실행 순서를 보여 주고, 인사이트의 architecture는 환경변수 소유권과 배포·복구 실패 경계만 비교합니다.'
      }
    },
    content: `## 다른 호텔의 환경변수가 운영 배포에 섞였다

Infisical을 도입하기 전에는 데이터베이스 접속 정보, 외부 API 인증값과 배포용 시크릿을 Jenkins UI·로컬 \`.env\`·Slack을 통해 나누어 관리했습니다.

가장 큰 문제는 보관 장소가 여러 곳이라는 사실 자체가 아니었습니다. 여러 호텔을 배포하는 과정에서 다른 호텔의 환경변수가 포함된 상태로 운영 배포가 완료되는 문제가 발생했습니다.

배포 직후 운영 사이트를 직접 점검하면서 예약·조회 요청이 실패하고, 화면과 기능 설정도 다른 호텔 기준으로 표시되는 것을 확인했습니다. 환경변수를 바로잡고 다시 배포해 정상화하기까지 약 10분이 걸렸으며, 이 시간은 운영 서비스 장애로 판단했습니다.

다만 환경변수가 섞인 정확한 원인은 끝까지 규명하지 못했습니다. 여러 배포가 같은 Jenkins 대기열에 있던 상황에서 발생했지만 Jenkins 자체 오류라고 단정할 근거는 없었고, 사람이 다른 프로젝트의 값을 잘못 등록했을 가능성도 배제할 수 없었습니다.

이 장애를 계기로 다음 세 문제를 순서대로 해결해야 한다고 판단했습니다.

1. 프로젝트 간 환경변수가 섞이지 않아야 한다.
2. 어떤 값이 최신이고 누가 어떤 목적으로 관리하는 값인지 확인할 수 있어야 한다.
3. 새 프로젝트나 팀원이 생길 때 시크릿 원문을 다시 전달하지 않아야 한다.

## 한곳에 모으는 것보다 책임을 나눴다

하네스의 시크릿 구조와 CI/CD 조회 흐름을 직접 설계하고 구현하면서 Infisical을 환경변수의 단일 원천으로 도입했습니다.

Infisical Cloud와 Self-Hosted를 정식 비교한 뒤 선택한 것은 아니었습니다. 비용 부담도 고려했지만, 사내 시크릿을 외부 Cloud에 보관하는 것에 대한 개인적인 우려가 더 컸기 때문에 사내 서버에 직접 구축하는 방향으로 진행했습니다.

환경변수를 하나의 폴더에 모두 넣지는 않았습니다. 최초 도입 단계부터 프로젝트, 환경과 실행 목적에 따라 경계를 나눴습니다.

| 경로 | 책임 |
| --- | --- |
| \`/frontend\` | 프론트엔드 런타임 환경변수 |
| \`/backend\` | 백엔드 런타임 환경변수 |
| \`/frontend/github-actions\` | 프론트엔드 배포 전용 값 |
| \`/backend/github-actions\` | 백엔드 배포 전용 값 |
| \`Shared-Secrets/slack\` | 여러 프로젝트가 공통으로 사용하는 Slack 값 |
| \`Shared-Secrets/vercel\` | 여러 프로젝트가 공통으로 사용하는 Vercel 값 |

각 프로젝트 안에서는 \`dev\`와 \`prod\` 환경을 분리했습니다. GitHub Secrets에는 Infisical에 접근하기 위한 Client ID와 Client Secret만 남기고, 실제 런타임·배포 변수의 원본은 Infisical에서 관리했습니다.

공용 Slack·Vercel 키는 \`Shared-Secrets\` 한곳에서 갱신하면 이를 사용하는 프로젝트들이 같은 원본을 조회합니다. 신규 프로젝트는 정해진 경로와 Machine Identity를 연결해 시크릿 원문을 다시 전달하지 않고 구성할 수 있습니다.

## 로컬 개발과 배포의 조회 시점을 다르게 두었다

로컬 개발에서는 하네스 래퍼를 통해 Infisical CLI로 값을 조회하는 방식을 기본으로 두고, Infisical에 연결할 수 없는 경우에만 로컬 \`.env\`로 대체할 수 있게 했습니다.

배포 구조를 정할 때는 애플리케이션 서버가 실행 중에 Infisical과 직접 통신하는 방식도 검토했습니다. 하지만 Infisical 서버가 중단되면 새 인스턴스의 시작이나 재시작에 필요한 환경변수를 가져오지 못할 수 있다고 판단했습니다.

그래서 GitHub Actions가 배포 단계에서 환경별 값을 조회해 \`.env\` 파일을 만들고, 이를 애플리케이션 서버에 배치하도록 설계했습니다.

\`\`\`text
로컬 개발
개발자 → 하네스 래퍼 → Infisical
                      └─ 연결 불가 시 로컬 .env

배포
GitHub Actions → Infisical에서 환경별 값 조회
               → .env 파일 생성
               → 애플리케이션 서버에 배치

운영
실행 중인 서비스 → 마지막 배포의 .env 사용
                 → Infisical 런타임 통신 없음
\`\`\`

이 구조에서는 Infisical 조회가 실패하면 새 배포가 중단됩니다. 이미 실행 중인 서비스는 마지막 배포의 \`.env\`를 사용하므로 Infisical의 현재 상태에 직접 의존하지 않습니다.

## 중단 테스트로 배포 실패 경계를 확인했다

이 경계가 의도대로 동작하는지 확인하기 위해 별도의 테스트 프로젝트와 서버에서 Infisical을 의도적으로 중단한 뒤 배포를 실행했습니다.

GitHub Actions는 시크릿 조회 단계에서 실패해 새 배포가 진행되지 않았습니다. 반면 기존에 실행 중이던 테스트 서비스는 정상적으로 동작했고, 이전 배포의 \`.env\`를 계속 사용했습니다.

이 테스트로 확인한 범위는 배포 시점의 조회 실패와 기존 프로세스의 동작 여부까지입니다. 운영 장애 복구, 서비스 재시작이나 스케일 아웃 상황까지 검증한 결과로 확대하지 않습니다.

## 분리한 경계와 아직 분리하지 못한 경계

\`\`\`text
도입 전
Jenkins UI ─┐
로컬 .env ─┼─ 프로젝트 간 값 혼입 → 약 10분 운영 장애
Slack ──────┘

도입 후
Infisical SSOT
├─ 프로젝트
│  ├─ dev / prod
│  ├─ frontend / backend
│  └─ runtime / github-actions
└─ Shared-Secrets
   ├─ slack
   └─ vercel

배포 실패 경계
Infisical 중단 → 새 배포 중단
               └─ 기존 서비스는 마지막 .env로 동작

남은 복구 경계
Infisical DB + 같은 인스턴스의 백업 파일
               └─ 함께 손실되면 현재 복구 불가
\`\`\`

연결된 작업물의 CI/CD 스윔레인은 변경 감지부터 배포 확인까지의 실행 순서를 다룹니다. 이 인사이트의 architecture는 같은 흐름을 반복하지 않고, 환경변수의 소유권과 배포·복구 실패 경계를 비교합니다.

## 동일 유형의 혼입은 다시 발견하지 못했다

Infisical로 전환한 뒤 2026년 8월 현재까지 유지보수하는 동안 환경변수가 다른 호텔의 운영 배포에 섞이는 동일 유형 문제는 다시 발견하지 못했습니다.

이는 시스템 전수 집계나 장애율 통계가 아닙니다. 운영 과정에서 관찰한 범위이며, 배포 시간 단축이나 온보딩 시간 개선처럼 측정하지 않은 효과도 주장하지 않습니다.

실제로 확인한 변화는 공용 Slack·Vercel 키를 한곳에서 갱신하고, 신규 프로젝트가 정해진 경로와 Machine Identity를 통해 같은 원본을 사용하게 된 점입니다.

## 중앙화했다고 복구 가능성이 생기는 것은 아니다

현재 Self-Hosted Infisical은 데이터베이스 백업 파일을 만들지만 그 파일도 같은 인스턴스 서버에 있습니다. 자동 장애 조치나 다중 인스턴스 구성도 없습니다. 따라서 데이터베이스와 백업 파일이 함께 삭제되면 현재 구조로는 복구할 방법이 없습니다.

중앙화로 환경변수의 소유권과 배포 실패 경계는 분리했지만, 백업의 장애 경계까지 분리한 것은 아니었습니다. 외부 저장소로 백업을 분리하고 실제 복구 훈련까지 확인하는 개선은 앞으로의 과제입니다. 아직 구현하지 않은 고도화나 DX 개선은 완료된 기능처럼 공개하지 않습니다.

운영 부담을 감수하더라도 사내 시크릿의 Self-Hosted 선택은 유지하는 편이 낫다고 판단합니다. 다만 Self-Hosted를 선택하는 것과 동일 인스턴스 백업 구조를 유지하는 것은 다른 결정입니다. 중앙화, 배포 격리와 복구 가능성은 각각 별도의 경계로 설계하고 검증해야 합니다.`
  },
  {
    slug: 'cloudflare-tunnel-zero-trust-cicd-and-troubleshooting',
    title: 'Cloudflare Tunnel만으로는 배포 경계가 완성되지 않는다',
    excerpt:
      'GitHub Actions에서 사내 서버로 배포하기 위해 Cloudflare Tunnel을 도입했지만, WAF 차단과 같은 hostname의 connector 혼선을 겪었습니다. 실패 단계를 직접 분리해 확인한 뒤, 공용 진입점과 서버별 권한을 나눈 Bastion 구조로 발전시킨 기록입니다.',
    date: new Date('2026-04-23'),
    tags: ['DevOps', 'Security', 'Cloudflare Tunnel', 'Zero Trust', 'GitHub Actions', 'Troubleshooting'],
    readTime: '10 min',
    featureSlug: 'codi-harness-dx-platform',
    editorial: {
      type: 'project-case',
      visualAssessment: {
        decision: 'provided',
        kind: 'data-flow',
        rationale:
          '2026년 4월의 WAF·connector 실패에서 5월의 공용 Bastion과 서버별 권한 분리로 발전한 관계를 하나의 data-flow로 제공합니다.',
        question: '초기 실패 뒤 외부 진입 인증과 내부 배포 대상 권한을 어떻게 분리했는가?',
        textAlternative:
          '2026년 4월에는 GitHub Actions 요청이 WAF에서 차단되고 같은 hostname의 connector가 의도하지 않은 방향으로 연결돼 SSH 단계에서 실패했습니다. 2026년 5월부터는 Cloudflare Access와 Bastion을 공용 진입점으로 두고 PermitOpen과 프로젝트×서버 SSH 키로 대상을 분리했으며, 2026-08-27 기준 9개 프로젝트가 5대 서버로 배포됩니다.',
        nonDuplicationReason:
          '작업물의 CI/CD 스윔레인은 현재 배포 실행 순서를 보여 주고, 인사이트 data-flow는 초기 실패에서 외부 인증과 내부 대상 권한 경계로 발전한 과정만 비교합니다.'
      }
    },
    content: `## 22번 포트를 열지 않는 것만으로는 충분하지 않았다

사내 하네스의 PM2·Docker 배포에서 Cloudflare Tunnel 기반 접근 경로와 Bastion
구조를 직접 설계하고 구현했습니다.

GitHub Actions에서 사내 서버로 바로 SSH 연결하려면 두 가지 부담이 있었습니다.
인바운드 22번 포트를 외부에 넓게 열거나, GitHub Actions runner의 IP 허용 범위를
계속 확인해 방화벽에 반영해야 했습니다.

당시 비교한 대안은 direct SSH와 Cloudflare Tunnel이었습니다. Self-hosted GitHub
Actions runner까지 검토한 것은 아니었습니다.

사내 서버처럼 GitHub Actions가 배포를 위해 접근해야 하지만 외부 인바운드 22번
포트를 열고 싶지 않은 경우에는 Cloudflare Tunnel을 사용하는 편이 낫다고
판단했습니다. 반면 Vercel처럼 배포 접근을 관리형 플랫폼이 담당하는 환경에는 이
구조가 필요하지 않습니다.

다만 Tunnel을 연결하는 것만으로 안전한 배포 경로가 완성되는 것은 아니었습니다.
외부에서 Bastion까지 들어오는 인증과, Bastion 이후 어느 서버에 접근할 수 있는지는
별도의 경계로 설계해야 했습니다.

## 이벤트 로그로 WAF 차단을 확인했다

2026년 4월 초기 구성에서 로컬 연결은 가능했지만 GitHub Actions workflow는
Cloudflare 접근 단계에서 실패했습니다.

오류 메시지만으로 원인을 단정하지 않고 Cloudflare 이벤트 로그를 확인했습니다.
해당 GitHub Actions 요청이 WAF에서 차단된 기록을 찾았고, 배포용 hostname에 예외를
적용한 뒤 같은 workflow를 다시 실행했습니다. 이전에 막히던 Cloudflare 접근 단계가
통과하는 것을 직접 비교해 확인했습니다.

현재 WAF 예외는 Bastion hostname을 조건으로 이후 WAF 규칙을 건너뜁니다. WAF 규칙
자체가 Service Token까지 검사하는 구조는 아닙니다. WAF 예외를 통과한 뒤 Cloudflare
Access의 Service Token 인증과 SSH 인증 계층이 실제 접근을 제한합니다.

이 경험을 통해 제품 내부 동작을 먼저 추측하기보다, 이벤트 로그와 workflow 재실행
결과를 대조해 어느 단계에서 요청이 막혔는지 분리해야 한다는 기준을 세웠습니다.

## 같은 hostname의 connector가 배포 대상을 흐렸다

WAF 문제를 해결한 뒤에는 배포 대상을 특정하는 문제가 남았습니다.

초기에는 같은 hostname을 서로 다른 서버의 Tunnel connector에 연결했습니다. 이
상태에서 요청이 의도하지 않은 connector 또는 서버 방향으로 전달되면서 SSH 연결
단계에서 실패했습니다.

실제 파일 전송이나 배포 명령 실행 전의 실패였기 때문에 잘못된 서버에 서비스가
배포되지는 않았습니다. 또한 Cloudflare가 내부에서 어떤 알고리즘으로 connector를
선택했는지는 직접 확인하지 못했으므로 특정 라우팅 방식으로 단정하지 않습니다.

당시에는 배포 대상별로 hostname을 분리했습니다. 같은 workflow를 다시 실행해 의도한
서버로 연결되고 배포가 정상 완료되는 것을 확인했습니다.

## 대상별 hostname은 해결책이면서 다음 운영 부담이 됐다

배포 대상별 hostname 분리는 어느 요청이 어느 서버로 가는지 명시적으로 구분할 수
있는 해결책이었습니다.

하지만 서버가 늘어날 때마다 Tunnel connector, hostname, Access Application과 WAF
예외도 함께 관리해야 했습니다. 개별 서버의 연결 문제는 해결했지만, 배포 대상이
늘수록 Cloudflare 설정도 반복되는 구조가 됐습니다.

그래서 2026년 5월경 Cloudflare 진입점은 공용으로 재사용하고, 실제 배포 대상은
Bastion 이후에 명시적으로 선택하는 구조로 변경했습니다.

## 공용 진입점과 내부 대상 권한을 분리했다

현재 배포 흐름은 다음과 같습니다.

\`\`\`text
2026년 4월 초기 구성

GitHub Actions
    ├─ Cloudflare WAF 차단
    │      └─ 이벤트 로그 확인
    │             └─ hostname 예외 적용 후 접근 단계 통과
    │
    └─ 같은 hostname
           ├─ connector A
           └─ connector B
                  └─ 의도하지 않은 방향으로 연결
                         └─ SSH 단계 실패
                                └─ 실제 배포 없음


2026년 5월 이후

GitHub Actions
    │
    ├─ Bastion hostname WAF 예외
    │
    ├─ Cloudflare Access
    │      └─ Service Token 인증
    │
    ├─ Cloudflare Tunnel
    │
    └─ Bastion
           ├─ 배포 전용 사용자 shell 실행 차단
           ├─ SSH 키 인증
           └─ PermitOpen 대상 제한
                  │
                  └─ ProxyJump
                         └─ 배포 서버
                                └─ 프로젝트 × 배포 서버별 SSH 키 인증
\`\`\`

GitHub Actions의 \`ProxyCommand\`는 Cloudflare Access를 거쳐 Bastion에 연결합니다.
이후 \`ProxyJump\`가 실제 배포 서버로 연결하며, Bastion의 \`PermitOpen\`은 접근할 수
있는 서버와 포트를 제한합니다.

공용으로 재사용하는 것과 대상별로 분리하는 것은 다음처럼 구분했습니다.

| 구분 | 관리 범위 |
| --- | --- |
| 공용 진입점 | Cloudflare Tunnel, Bastion, hostname, Access Application, WAF 예외 |
| Bastion 접근 | Service Token과 Bastion SSH 인증 |
| 내부 대상 제한 | 배포 서버별 \`PermitOpen\` |
| 최종 서버 인증 | 프로젝트×배포 서버별 SSH 키 |
| 프로젝트 설정 | 배포 대상과 환경에 맞는 Infisical 경로 |

Tunnel과 Bastion을 프로젝트마다 새로 만들지 않고 공용으로 재사용하되, 한 프로젝트의
SSH 키가 다른 서버의 배포 권한으로 이어지지 않도록 최종 권한은 프로젝트와 배포 서버
조합별로 분리했습니다.

## 9개 프로젝트를 5대 서버에 배포하고 있다

2026-08-27 기준 9개 프로젝트가 하나의 Bastion을 경유해 5대 서버로 배포됩니다.
하나의 서버에 여러 서비스가 배포되는 경우가 있어 프로젝트 수와 서버 수는 다릅니다.

Bastion 구조로 전환한 뒤 현재까지 요청이 의도하지 않은 connector 또는 서버 방향으로
연결되는 동일 유형 문제는 다시 발견하지 못했습니다.

이는 운영 과정에서 확인한 사용자 보고값과 관찰 범위입니다. 시스템 전체의 장애율을
집계한 결과나 Cloudflare Tunnel의 보안·가용성을 보장하는 수치는 아닙니다.

## Bastion도 새로운 운영 경계가 됐다

Cloudflare 설정을 공용 진입점으로 줄였지만 Bastion 자체가 9개 프로젝트의 배포
가용성 경계가 됐습니다.

Bastion이 중단되면 연결된 프로젝트의 새 배포가 함께 막힙니다. 실행 중인 서비스는
Bastion과 런타임 통신을 하지 않지만, 실제 Bastion 중단이나 장애 상황을 테스트해
확인한 결과는 아닙니다. 현재 구조를 근거로 판단한 영향 범위입니다.

보안 운영 부담도 남아 있습니다. Bastion hostname은 WAF의 이후 규칙을 건너뛰므로
Cloudflare Access Token, Bastion SSH 인증, \`PermitOpen\`과 서버별 SSH 키 경계를
계속 정확하게 관리해야 합니다.

현재 가장 먼저 개선하고 싶은 부분은 새 프로젝트와 서버가 추가될 때 반복되는
\`PermitOpen\`, 공개키 등록과 Infisical 경로 연결을 자동화하는 것입니다. 그다음
Bastion 이중화, 대체 배포 경로와 실제 복구 절차를 검증하려고 합니다.

아직 구현하지 않은 자동화와 가용성 개선을 현재 성과로 기록하지는 않습니다. 이번
경험에서 얻은 기준은 Tunnel이라는 도구를 도입하는 데서 멈추지 않고, 외부 진입
인증과 내부 배포 대상 권한을 각각 설계하고 운영해야 한다는 점입니다.`
  },
  {
    slug: 'jenkins-retirement-and-github-actions-migration',
    title: 'GitHub Actions 전환보다 중요했던 배포 단위 재설계',
    excerpt:
      'Jenkins에서 GitHub Actions로 도구를 옮기는 데서 멈추지 않고, 공통 코드와 호텔별 변경 범위를 계산해 다섯 배포 대상을 matrix job으로 분리했습니다. 단일 slave의 순차 대기열을 대상별 병렬 실행으로 바꾸며 배포 화면 기준 약 15분에서 약 3분으로 줄인 과정입니다.',
    date: new Date('2026-07-07'),
    tags: ['DevOps', 'CI/CD', 'GitHub Actions', 'Jenkins', 'Cost Optimization', 'Refactoring'],
    readTime: '7 min',
    featureSlug: 'codi-harness-dx-platform',
    editorial: {
      type: 'project-case',
      visualAssessment: {
        decision: 'provided',
        kind: 'data-flow',
        rationale:
          'Jenkins slave 1개의 순차 대기열에서 변경 범위 기반 matrix 병렬 실행으로 배포 단위가 바뀐 관계를 before/after data-flow로 제공합니다.',
        question: '배포 단위를 순차 대기열에서 대상별 matrix로 어떻게 다시 설계했는가?',
        textAlternative:
          'Jenkins에서는 slave 1개가 다섯 호텔을 순차 배포했지만, GitHub Actions에서는 공통 코드와 호텔별 코드의 변경 범위를 계산해 선택된 대상을 matrix job으로 병렬 배포합니다.',
        nonDuplicationReason:
          '작업물의 swimlane은 현재 전체 CI/CD 실행과 책임 경계를 보여 주고, 인사이트 data-flow는 Jenkins 순차 대기열에서 대상별 matrix로 배포 단위가 바뀐 전후만 비교합니다.'
      }
    },
    content: `## 기존 Jenkins는 제가 설계한 영역이 아니었다

기존 Jenkins 구성은 제가 설계하거나 설정한 영역이 아니었습니다. 여러 프로젝트를 Jenkins에서 GitHub Actions로 이전하는 작업과 새로운 workflow 설계부터 담당했습니다.

당시 \`codi-rs-module\` 배포는 하나의 Jenkins slave에서 호텔별로 순차 실행됐습니다. 호텔 한 곳의 React 빌드와 배포가 끝나야 다음 호텔을 시작할 수 있는 구조였습니다.

Jenkins slave나 executor를 늘리는 방안은 별도로 검토하지 않았습니다. 기존 Jenkins 설정을 직접 담당하지 않았던 데다, 다른 프로젝트의 마이그레이션을 진행하면서 비용과 운영 측면에서 GitHub Actions가 더 적합하다고 판단한 뒤에는 Jenkins 확장을 대안으로 두지 않았습니다.

전환 배경에는 Jenkins 서버를 별도로 유지하는 비용도 있었습니다. 포트폴리오에서 사용하는 월 \`$151.84\`는 과거 실제 청구액이 아니라, 2026-08-20 AWS 서울 리전 Linux On-Demand \`t3.large\` 2대와 월 730시간의 공개 가격으로 다시 계산한 컴퓨팅 추정치입니다. 스토리지·네트워크·세금은 포함하지 않습니다. 같은 시점의 사용자 보고에서는 GitHub Actions 무료 티어를 초과하지 않았지만, 앞으로도 비용이 발생하지 않는다는 의미는 아닙니다.

## 구조가 복잡한 프로젝트를 거의 마지막에 이전했다

GitHub Actions 마이그레이션은 다른 프로젝트부터 먼저 진행했습니다. \`codi-rs-module\`은 공통 코드와 다섯 호텔별 코드, 환경변수와 배포 대상이 하나의 저장소에 함께 있어 단순한 프로젝트보다 전환 구조를 결정하기 어려웠습니다.

그래서 다른 프로젝트의 전환을 먼저 진행한 뒤 \`codi-rs-module\`을 거의 마지막에 이전했습니다. 이 프로젝트에서는 Jenkins를 GitHub Actions로 바꾸는 것만으로는 기존 순차 대기열을 해결할 수 없었습니다. 어떤 변경이 어느 호텔에 영향을 주는지 먼저 계산하고, 그 결과를 실제 배포 단위로 만들어야 했습니다.

## 도구가 아니라 배포 단위를 바꿨다

2026년 7월, 변경 파일을 기준으로 배포 대상 플랫폼을 계산하는 구조를 추가했습니다.

- 공통 코드가 변경되면 다섯 호텔 전체를 배포 대상으로 선택합니다.
- 특정 호텔의 코드만 변경되면 해당 호텔만 선택합니다.
- 계산된 호텔 목록을 GitHub Actions matrix에 전달합니다.
- 각 호텔은 독립된 matrix job에서 빌드와 배포를 실행합니다.

\`\`\`text
Jenkins

코드 변경
   ↓
slave 1개
   ↓
호텔 A → 호텔 B → 호텔 C → 호텔 D → 호텔 E
                  약 15분


GitHub Actions matrix

코드 변경
   ↓
변경 범위 계산
   ├─ 공통 코드 → 호텔 A·B·C·D·E
   └─ 호텔 코드 → 해당 호텔
                      ↓
              대상별 matrix job
        ┌─────┬─────┬─────┬─────┬─────┐
        A     B     C     D     E
        └─────┴─────┴─────┴─────┴─────┘
                  약 3분
\`\`\`

작업물의 기존 CI/CD 스윔레인은 변경 감지부터 품질 검사, 시크릿 조회와 배포 결과 확인까지 현재의 전체 실행 흐름을 보여 줍니다. 이 인사이트의 데이터 흐름은 그 내용을 반복하지 않고, Jenkins 순차 대기열에서 대상별 matrix로 배포 단위가 바뀐 부분만 비교합니다.

## 병렬 실행과 취소 경계를 함께 나눴다

matrix에는 \`fail-fast: false\`를 적용했습니다. 특정 호텔 job이 실패하더라도 아직 실행 중인 다른 호텔 job을 GitHub Actions가 즉시 취소하지 않도록 하기 위한 설계였습니다.

다만 이 동작을 확인하기 위해 특정 호텔의 배포를 의도적으로 실패시키지는 않았고, 운영 중 실제 실패 사례로 다른 호텔의 완료 여부를 대조한 기록도 없습니다. 따라서 실패 격리는 설정과 실행 구조의 의도로만 설명하며, 검증된 장애 격리 성과로 확대하지 않습니다.

## 다섯 호텔 배포 화면에서 약 15분이 약 3분이 됐다

기존 Jenkins에서는 호텔별 배포가 약 3분씩 순차 실행돼 다섯 호텔 전체에 약 15분이 필요했습니다. GitHub Actions matrix에서는 다섯 호텔 job이 병렬로 실행됐고, 전체 배포 화면에서 약 3분이 걸리는 것을 확인했습니다.

이 값은 기존 Jenkins의 순차 실행 화면과 GitHub Actions matrix 실행 화면을 비교한 관찰값입니다. 동일한 조건에서 여러 번 실행해 계산한 평균이나 통제된 성능 실험은 아닙니다. 따라서 \`80% 개선\` 같은 비율로 일반화하지 않습니다.

## 병렬화 전에 배포 단위를 분리할 수 있어야 한다

이 방식은 여러 배포 대상이 서로 독립적이고, 코드 변경이 어느 대상에 영향을 주는지 계산할 수 있을 때 적합합니다.

반대로 공통 데이터 마이그레이션이나 선행 서비스 배포처럼 대상 사이에 순서가 필요하거나, 변경 코드가 어느 대상에 영향을 주는지 정확히 구분할 수 없다면 같은 방식으로 병렬화해서는 안 됩니다.

이번 전환에서 얻은 결론은 Jenkins와 GitHub Actions 중 어느 도구가 항상 더 낫다는 것이 아닙니다. CI 도구를 교체하는 것만으로는 기존 배포 병목이 사라지지 않았고, 공통 코드와 호텔별 코드의 영향 범위를 나눈 뒤 실제 배포 단위를 다시 설계해야 병렬화의 효과를 얻을 수 있었습니다.`
  }
];
