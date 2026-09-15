import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { getFeatureDetailBySlug, sanitizeFeatureDetailArchifyMetadata, validateFeatureDetail } from './feature-details';
import { REAL_INSIGHTS } from './insights';
import {
  FEATURE_SWIMLANE_ARCHIFY_URLS,
  isFeatureSwimlaneArchifyTarget,
  type FeatureDetailDto,
  type FeatureRelationshipDiagram,
  type FeatureSwimlane,
  type FeatureSwimlaneEdge
} from './types/feature-detail.dto';

import { getAllFeatures, getAllInsights, getFeatureBySlug, getInsightBySlug } from '.';

type ArchifySourceEdge = {
  id: string;
  from: string;
  to: string;
  variant?: string;
  role?: string;
};

const getExpectedArchifyOutcome = (
  edge: ArchifySourceEdge,
  steps: FeatureSwimlane['steps']
): FeatureSwimlaneEdge['outcome'] => {
  switch (edge.role ?? 'main') {
    case 'return':
      return 'recover';
    case 'error':
      return steps.find(({ id }) => id === edge.to)?.shape === 'stop' ? 'stop' : 'recover';
    case 'main':
    case 'branch':
    default:
      return 'continue';
  }
};

const getArchifyEdgeTopology = (edges: Array<Pick<FeatureSwimlaneEdge, 'id' | 'from' | 'to' | 'kind'>>) =>
  edges
    .map(({ id, from, to, kind }) => ({ id, from, to, kind }))
    .sort((left, right) => left.id.localeCompare(right.id));

const getSourceArchifyEdgeTopology = (edges: ArchifySourceEdge[]) =>
  getArchifyEdgeTopology(
    edges.map(({ id, from, to, variant }) => ({
      id,
      from,
      to,
      kind: variant === 'security' || variant === 'dashed' ? 'exception' : 'normal'
    }))
  );

const splitClaimSentences = (text: string) =>
  text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

const findUnqualifiedPositiveClaims = (text: string, topic: RegExp, positiveClaim: RegExp) =>
  splitClaimSentences(text).filter(
    (sentence) =>
      topic.test(sentence) &&
      positiveClaim.test(sentence) &&
      !/(?:아니|아닌|않|못|없|제한|범위|정해진|비선택|선택하지|도입하지|검토하지|맞지|단정하지)/.test(sentence)
  );

const expectFeatureSwimlaneEdgeParity = (
  sourceEdges: ArchifySourceEdge[],
  swimlane: Pick<FeatureSwimlane, 'steps' | 'edges'>
): void => {
  expect(getArchifyEdgeTopology(swimlane.edges)).toEqual(getSourceArchifyEdgeTopology(sourceEdges));

  sourceEdges.forEach((sourceEdge) => {
    const dataEdge = swimlane.edges.find(({ id }) => id === sourceEdge.id);
    expect(dataEdge?.outcome).toBe(getExpectedArchifyOutcome(sourceEdge, swimlane.steps));
  });
};

const PRESERVED_HARNESS_INFRA_INSIGHTS = [
  {
    slug: 'jenkins-retirement-and-github-actions-migration',
    title: 'GitHub Actions 전환보다 중요했던 배포 단위 재설계',
    bodySnippet: '이 값은 기존 Jenkins의 순차 실행 화면과 GitHub Actions matrix 실행 화면을 비교한 관찰값입니다.'
  },
  {
    slug: 'infisical-centralized-secrets-and-spof-defense',
    title: '환경변수 중앙화는 저장보다 경계 설계다: Infisical Self-Hosted 도입기',
    bodySnippet:
      '중앙화로 환경변수의 소유권과 배포 실패 경계는 분리했지만, 백업의 장애 경계까지 분리한 것은 아니었습니다.'
  },
  {
    slug: 'cloudflare-tunnel-zero-trust-cicd-and-troubleshooting',
    title: 'Cloudflare Tunnel만으로는 배포 경계가 완성되지 않는다',
    bodySnippet:
      'Tunnel과 Bastion을 프로젝트마다 새로 만들지 않고 공용으로 재사용하되, 한 프로젝트의 SSH 키가 다른 서버의 배포 권한으로 이어지지 않도록'
  }
] as const;
const PRESERVED_HARNESS_INFRA_INSIGHT_SLUGS = PRESERVED_HARNESS_INFRA_INSIGHTS.map(({ slug }) => slug);

const REMOVED_HARNESS_INSIGHT_SLUGS = [
  'harness-lock-and-project-ownership-boundary',
  'harness-cli-and-doctor-productization',
  'claude-codex-policy-parity-and-regression-testing',
  'multi-session-testbed-and-context-lifecycle'
] as const;

const CANONICAL_HARNESS_INSIGHT_SLUG = 'codi-harness-dx-platform-design';

const LEGACY_FEATURE_CONTENT_FIXTURES: ReadonlyArray<{
  slug: string;
  bodySnippet: string;
  contentLength: number;
}> = [
  // integrated-reservation-platform은 Feature 015에서 구조화 상세로 이전되어 legacy 목록에서 빠졌다.
  // the-siena-golf-reservation은 Feature 014에서 구조화 상세로 이전되어 legacy 목록에서 빠졌다.
  // integrated-sso-server는 중앙 회원 서버 인터뷰와 코드 검증을 거쳐 구조화 상세로 이전되었다.
  // blackstone-belleforet-resort는 feature 006에서 구조화 상세로 이전되어 legacy 목록에서 빠졌다.
  // hanmaum-science-institute는 feature 005에서 구조화 상세로 이전되어 legacy 목록에서 빠졌다.
] as const;

const STRUCTURED_SWIMLANE_CONTENT_FIXTURES = {
  'codi-harness-dx-platform': [
    {
      id: 'design-development-verification',
      title: '설계·개발·검증',
      purpose: '사용자 의견이 승인된 계획과 테스트 우선 구현을 거쳐 검증 가능한 결과가 되는 흐름을 보여줍니다.',
      summary:
        '요청·맥락 전달에서 시작해 문제 정의, 명세·계획, 승인, 테스트·구현, 리뷰·검증 순서로 진행하며 검증을 통과하면 완료합니다.',
      lanes: [
        { id: 'user', label: '사용자' },
        { id: 'agent', label: 'AI 에이전트' },
        { id: 'delivery', label: '계획·구현' },
        { id: 'verification', label: '리뷰·검증' }
      ],
      steps: [
        {
          id: 'request',
          laneId: 'user',
          row: 0,
          shape: 'start',
          label: '요청·맥락 전달',
          description: '문제, 공개 범위와 기대 결과를 전달합니다.'
        },
        {
          id: 'define',
          laneId: 'agent',
          row: 1,
          shape: 'process',
          label: '문제 정의',
          description: '전달받은 맥락에서 문제와 모호한 요구를 정리합니다.'
        },
        {
          id: 'plan',
          laneId: 'delivery',
          row: 2,
          shape: 'process',
          label: '명세·계획',
          description: '정의한 문제의 결정, 계약, 테스트와 작업 순서를 명세와 계획에 기록합니다.'
        },
        {
          id: 'approve',
          laneId: 'user',
          row: 3,
          shape: 'decision',
          label: '승인',
          description: '구현 범위와 판단 기준을 사용자가 승인합니다.'
        },
        {
          id: 'implement',
          laneId: 'delivery',
          row: 4,
          shape: 'process',
          label: '테스트·구현',
          description: '행동 변경을 증명할 실패 테스트를 먼저 실행하고 승인된 범위를 구현합니다.'
        },
        {
          id: 'verify',
          laneId: 'verification',
          row: 5,
          shape: 'decision',
          label: '리뷰·검증',
          description: '명세 일치, 회귀, 타입, 테스트, 빌드와 사용자 흐름 증거를 확인합니다.'
        },
        {
          id: 'complete',
          laneId: 'verification',
          row: 6,
          shape: 'end',
          label: '완료',
          description: '리뷰와 검증을 통과한 결과로 작업을 완료합니다.'
        }
      ],
      edges: [
        {
          id: 'request-define',
          from: 'request',
          to: 'define',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: [
            { column: 0, row: 0.5 },
            { column: 1, row: 0.5 }
          ],
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'define-plan',
          from: 'define',
          to: 'plan',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: [
            { column: 1, row: 1.5 },
            { column: 2, row: 1.5 }
          ],
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'plan-approve',
          from: 'plan',
          to: 'approve',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: [
            { column: 2, row: 2.5 },
            { column: 0, row: 2.5 }
          ],
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'approve-implement',
          from: 'approve',
          to: 'implement',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: [
            { column: 0, row: 3.5 },
            { column: 2, row: 3.5 }
          ],
          label: '승인',
          labelAt: undefined
        },
        {
          id: 'implement-verify',
          from: 'implement',
          to: 'verify',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: [
            { column: 2, row: 4.5 },
            { column: 3, row: 4.5 }
          ],
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'verify-complete',
          from: 'verify',
          to: 'complete',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: '통과',
          labelAt: undefined
        },
        {
          id: 'ambiguity-return',
          from: 'define',
          to: 'request',
          kind: 'exception',
          outcome: 'recover',
          fromAnchor: 'left',
          toAnchor: 'left',
          waypoints: [
            { column: -0.4, row: 1 },
            { column: -0.4, row: 0 }
          ],
          label: '요구 보강',
          labelAt: undefined
        },
        {
          id: 'approval-return',
          from: 'approve',
          to: 'plan',
          kind: 'exception',
          outcome: 'recover',
          fromAnchor: 'left',
          toAnchor: 'left',
          waypoints: [
            { column: -0.4, row: 3 },
            { column: -0.4, row: 2 }
          ],
          label: '미승인',
          labelAt: undefined
        },
        {
          id: 'verification-return',
          from: 'verify',
          to: 'implement',
          kind: 'exception',
          outcome: 'recover',
          fromAnchor: 'left',
          toAnchor: 'right',
          waypoints: [
            { column: 2.7, row: 5 },
            { column: 2.7, row: 4 }
          ],
          label: '실패',
          labelAt: undefined
        }
      ],
      exceptions: [
        {
          id: 'ambiguous-requirement',
          trigger: '요구가 모호함',
          response: '사용자에게 추가 질문한 뒤 문제 정의를 다시 진행합니다.',
          edgeIds: ['ambiguity-return']
        },
        {
          id: 'unapproved-plan',
          trigger: '계획이 승인되지 않음',
          response: '명세와 계획을 보강한 뒤 다시 승인을 요청합니다.',
          edgeIds: ['approval-return']
        },
        {
          id: 'failed-verification',
          trigger: '검증 실패',
          response: '테스트·구현 단계로 돌아가 수정한 뒤 다시 검증합니다.',
          edgeIds: ['verification-return']
        }
      ]
    },
    {
      id: 'cicd-secrets-deployment',
      title: 'CI/CD·시크릿·배포',
      purpose: '코드 변경이 품질 게이트, 환경 선택, 시크릿 주입과 대상 계산을 거쳐 배포되는 책임 경계를 보여줍니다.',
      summary: '변경 감지에서 시작해 품질 검사, 환경·대상 결정, 시크릿 조회, 병렬 배포, 결과 확인 순서로 진행합니다.',
      lanes: [
        { id: 'repository', label: 'GitHub 저장소' },
        { id: 'actions', label: 'GitHub Actions' },
        { id: 'infisical', label: 'Infisical' },
        { id: 'deployment', label: '배포 대상' }
      ],
      steps: [
        {
          id: 'detect',
          laneId: 'repository',
          row: 0,
          shape: 'start',
          label: '변경 감지',
          description: '브랜치와 변경 파일을 기준으로 workflow를 시작합니다.'
        },
        {
          id: 'quality',
          laneId: 'actions',
          row: 1,
          shape: 'decision',
          label: '품질 검사',
          description: '타입, 테스트, 빌드와 보안 검사를 실행합니다.'
        },
        {
          id: 'target',
          laneId: 'actions',
          row: 2,
          shape: 'process',
          label: '환경·대상 결정',
          description: '브랜치와 플랫폼 설정으로 환경과 배포 대상을 결정합니다.'
        },
        {
          id: 'secrets',
          laneId: 'infisical',
          row: 3,
          shape: 'decision',
          label: '시크릿 조회',
          description: '선택된 환경의 시크릿을 Infisical에서 명시적으로 조회합니다.'
        },
        {
          id: 'deploy',
          laneId: 'deployment',
          row: 4,
          shape: 'process',
          label: '병렬 배포',
          description: '검증된 대상만 선택한 환경에 병렬 배포합니다.'
        },
        {
          id: 'confirm',
          laneId: 'deployment',
          row: 5,
          shape: 'end',
          label: '결과 확인',
          description: '실행 결과와 대상별 완료 상태를 확인합니다.'
        },
        {
          id: 'stopped',
          laneId: 'repository',
          row: 3,
          shape: 'stop',
          label: '배포 중단',
          description: '실패 원인이 해소될 때까지 시크릿 조회와 배포를 실행하지 않습니다.'
        }
      ],
      edges: [
        {
          id: 'detect-quality',
          from: 'detect',
          to: 'quality',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'quality-target',
          from: 'quality',
          to: 'target',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: '통과',
          labelAt: undefined
        },
        {
          id: 'target-secrets',
          from: 'target',
          to: 'secrets',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'secrets-deploy',
          from: 'secrets',
          to: 'deploy',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: '일치',
          labelAt: undefined
        },
        {
          id: 'deploy-confirm',
          from: 'deploy',
          to: 'confirm',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'quality-stop',
          from: 'quality',
          to: 'stopped',
          kind: 'exception',
          outcome: 'stop',
          fromAnchor: 'left',
          toAnchor: 'right',
          waypoints: undefined,
          label: '실패',
          labelAt: undefined
        },
        {
          id: 'secrets-stop',
          from: 'secrets',
          to: 'stopped',
          kind: 'exception',
          outcome: 'stop',
          fromAnchor: 'left',
          toAnchor: 'bottom',
          waypoints: undefined,
          label: '불일치',
          labelAt: undefined
        },
        {
          id: 'stopped-retry',
          from: 'stopped',
          to: 'detect',
          kind: 'exception',
          outcome: 'recover',
          fromAnchor: 'left',
          toAnchor: 'left',
          waypoints: [
            { column: -0.4, row: 3 },
            { column: -0.4, row: 0 }
          ],
          label: '원인 수정 후 처음부터 재실행',
          labelAt: undefined
        }
      ],
      exceptions: [
        {
          id: 'failed-quality-check',
          trigger: '품질 검사 실패',
          response: '시크릿 조회와 배포를 시작하지 않습니다.',
          edgeIds: ['quality-stop', 'stopped-retry']
        },
        {
          id: 'environment-secret-mismatch',
          trigger: '환경·시크릿 불일치',
          response: '배포를 중단하고 설정을 수정한 뒤 workflow를 처음부터 다시 실행합니다.',
          edgeIds: ['secrets-stop', 'stopped-retry']
        }
      ]
    }
  ],
  'hanmaum-science-institute': [
    {
      id: 'ingestion-and-recovery',
      title: '원문 적재와 실패 복구',
      purpose: '원문이 규칙과 어긋났을 때 데이터가 어떻게 보호되고 어떤 정보가 돌아오는지 보여줍니다.',
      summary:
        '업로드에서 시작해 문서 변환, 규칙 매칭, 트랜잭션 저장을 거쳐 매칭 누락을 검사하고, 누락이 없을 때만 커밋합니다.',
      lanes: [
        { id: 'admin', label: '관리자' },
        { id: 'parsing', label: '파싱' },
        { id: 'persistence', label: '적재' },
        { id: 'validation', label: '검증' }
      ],
      steps: [
        {
          id: 'upload',
          laneId: 'admin',
          row: 0,
          shape: 'start',
          label: '원문 업로드',
          description: '관리자가 교재 파일을 올립니다.'
        },
        {
          id: 'convert',
          laneId: 'parsing',
          row: 1,
          shape: 'process',
          label: '문서 변환',
          description: '서식 정보를 유지한 형태로 변환합니다.'
        },
        {
          id: 'match',
          laneId: 'parsing',
          row: 2,
          shape: 'process',
          label: '규칙 매칭',
          description: '카테고리와 권, 단락 식별자를 규칙으로 추출합니다.'
        },
        {
          id: 'persist',
          laneId: 'persistence',
          row: 3,
          shape: 'process',
          label: '트랜잭션 저장',
          description: '전체 적재를 하나의 트랜잭션으로 묶어 저장합니다.'
        },
        {
          id: 'verify',
          laneId: 'validation',
          row: 4,
          shape: 'decision',
          label: '매칭 누락 검사',
          description: '차례에서 추출한 제목이 모두 단락과 짝을 이뤘는지 확인합니다.'
        },
        {
          id: 'commit',
          laneId: 'persistence',
          row: 5,
          shape: 'end',
          label: '커밋 완료',
          description: '누락이 없을 때만 적재를 확정합니다.'
        },
        {
          id: 'abort',
          laneId: 'validation',
          row: 5,
          shape: 'stop',
          label: '적재 취소',
          description: '되돌리고 남은 제목을 함께 반환합니다.'
        }
      ],
      edges: [
        {
          id: 'upload-convert',
          from: 'upload',
          to: 'convert',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'convert-match',
          from: 'convert',
          to: 'match',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'match-persist',
          from: 'match',
          to: 'persist',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'persist-verify',
          from: 'persist',
          to: 'verify',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'verify-commit',
          from: 'verify',
          to: 'commit',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: '누락 없음',
          labelAt: undefined
        },
        {
          id: 'verify-abort',
          from: 'verify',
          to: 'abort',
          kind: 'exception',
          outcome: 'stop',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: '누락 항목 있음',
          labelAt: undefined
        },
        {
          id: 'abort-upload',
          from: 'abort',
          to: 'upload',
          kind: 'exception',
          outcome: 'recover',
          fromAnchor: 'right',
          toAnchor: 'right',
          waypoints: undefined,
          label: '규칙 보완 후 재실행',
          labelAt: undefined
        }
      ],
      exceptions: [
        {
          id: 'unmatched-title',
          trigger: '규칙과 어긋나 매칭되지 않은 제목이 남았습니다.',
          response: '예외가 없어도 적재를 되돌리고 남은 제목을 알려 원인 지점을 좁힙니다.',
          edgeIds: ['verify-abort']
        },
        {
          id: 'rule-refinement',
          trigger: '반환된 제목으로 어떤 표기에서 규칙이 깨졌는지 확인했습니다.',
          response: '원본 교재가 아니라 파싱 규칙을 보완한 뒤 다시 실행합니다.',
          edgeIds: ['abort-upload']
        }
      ]
    },
    {
      id: 'search-request-flow',
      title: '검색 요청 처리',
      purpose: '속도를 담당하는 단계와 정확도를 담당하는 단계가 어떻게 나뉘는지 보여줍니다.',
      summary: '검색어를 분석해 인덱스로 후보군을 좁힌 뒤, 좁혀진 범위에서만 정밀 검증을 수행해 결과를 반환합니다.',
      lanes: [
        { id: 'reader', label: '이용자' },
        { id: 'routing', label: '라우팅' },
        { id: 'storage', label: '데이터' }
      ],
      steps: [
        {
          id: 'query',
          laneId: 'reader',
          row: 0,
          shape: 'start',
          label: '검색어 입력',
          description: '찾으려는 표현을 입력합니다.'
        },
        {
          id: 'route',
          laneId: 'routing',
          row: 1,
          shape: 'process',
          label: '검색어 구성 분석',
          description: '검색어를 나눠 어느 단계에서 무엇을 맡을지 정합니다.'
        },
        {
          id: 'narrow',
          laneId: 'storage',
          row: 2,
          shape: 'process',
          label: '후보군 압축',
          description: '인덱스로 전체 단락을 검토 가능한 범위까지 좁힙니다.'
        },
        {
          id: 'refine',
          laneId: 'storage',
          row: 3,
          shape: 'process',
          label: '정밀 검증',
          description: '좁혀진 범위에서만 모든 검색어가 실제 문장에 있는지 확인합니다.'
        },
        {
          id: 'respond',
          laneId: 'reader',
          row: 4,
          shape: 'end',
          label: '결과 확인',
          description: '조건을 만족한 단락을 확인합니다.'
        }
      ],
      edges: [
        {
          id: 'query-route',
          from: 'query',
          to: 'route',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'route-narrow',
          from: 'route',
          to: 'narrow',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'narrow-refine',
          from: 'narrow',
          to: 'refine',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'refine-respond',
          from: 'refine',
          to: 'respond',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: undefined,
          labelAt: undefined
        }
      ],
      exceptions: []
    }
  ],
  'blackstone-belleforet-resort': [
    {
      id: 'payment-and-compensation',
      title: '결제·보상취소 흐름',
      purpose: '같은 결제 후 예약 미생성 현상에서 서로 다른 세 원인과 대응이 어떻게 갈리는지 보여줍니다.',
      summary:
        '결제 승인 뒤 예약·티켓 생성 결과를 확인해 성공 시 예약을 완료하고, 응답 미도달·외부 장애·timeout 오판 시 각각 자동 보상취소, 장애 구간 로그 확인, timeout 정책 보강으로 대응했습니다.',
      lanes: [
        { id: 'guest', label: '이용자' },
        { id: 'php-service', label: 'PHP 서버' },
        { id: 'payment-provider', label: '결제사' },
        { id: 'pms', label: 'PMS·티켓' }
      ],
      steps: [
        {
          id: 'submit-payment',
          laneId: 'guest',
          row: 0,
          shape: 'start',
          label: '결제 요청',
          description: '이용자가 예약·티켓 결제를 요청합니다.'
        },
        {
          id: 'approve-payment',
          laneId: 'payment-provider',
          row: 1,
          shape: 'process',
          label: '결제 승인',
          description: '결제사가 요청을 승인합니다.'
        },
        {
          id: 'persist-payment',
          laneId: 'php-service',
          row: 2,
          shape: 'process',
          label: '결제 정보 처리',
          description: 'PHP 서버가 승인 결과와 예약 요청에 필요한 정보를 처리합니다.'
        },
        {
          id: 'create-reservation',
          laneId: 'pms',
          row: 3,
          shape: 'process',
          label: '예약·티켓 생성',
          description: '외부 PMS가 예약과 티켓을 생성합니다.'
        },
        {
          id: 'evaluate-result',
          laneId: 'php-service',
          row: 4,
          shape: 'decision',
          label: '생성 결과 판단',
          description: '응답과 식별자를 확인해 완료 또는 장애 대응 경로를 결정합니다.'
        },
        {
          id: 'complete-service',
          laneId: 'guest',
          row: 5,
          shape: 'end',
          label: '예약 완료',
          description: '결제와 예약·티켓 생성이 모두 확인된 결과를 이용자에게 제공합니다.'
        },
        {
          id: 'auto-compensation',
          laneId: 'payment-provider',
          row: 5,
          shape: 'stop',
          label: '자동 보상취소',
          description: '예약 생성 실패나 응답 미도달 시 서버가 결제를 취소합니다.'
        },
        {
          id: 'pms-outage-observation',
          laneId: 'php-service',
          row: 5,
          shape: 'stop',
          label: '장애 구간 확인',
          description: '로그의 최초 발생 시각과 종료 시각을 대조해 외부 PMS 장애 구간을 확인합니다.'
        },
        {
          id: 'timeout-mismatch',
          laneId: 'pms',
          row: 5,
          shape: 'stop',
          label: '조기 실패 오판',
          description: '12초 timeout이 정상 처리 중인 요청을 실패로 판단한 지점을 종료 상태로 구분합니다.'
        }
      ],
      edges: [
        {
          id: 'submit-approve',
          from: 'submit-payment',
          to: 'approve-payment',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'approve-persist',
          from: 'approve-payment',
          to: 'persist-payment',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'persist-create',
          from: 'persist-payment',
          to: 'create-reservation',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'create-evaluate',
          from: 'create-reservation',
          to: 'evaluate-result',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'evaluate-complete',
          from: 'evaluate-result',
          to: 'complete-service',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: '예약·티켓 생성 확인',
          labelAt: undefined
        },
        {
          id: 'evaluate-compensate',
          from: 'evaluate-result',
          to: 'auto-compensation',
          kind: 'exception',
          outcome: 'stop',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: '응답 미도달·생성 실패·PHP 예외',
          labelAt: undefined
        },
        {
          id: 'evaluate-outage',
          from: 'evaluate-result',
          to: 'pms-outage-observation',
          kind: 'exception',
          outcome: 'stop',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: '외부 PMS 장애',
          labelAt: undefined
        },
        {
          id: 'evaluate-timeout',
          from: 'evaluate-result',
          to: 'timeout-mismatch',
          kind: 'exception',
          outcome: 'stop',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: '12초 timeout 조기 실패 오판',
          labelAt: undefined
        }
      ],
      exceptions: [
        {
          id: 'response-or-generation-failure',
          trigger: '결제 응답이 프론트에 도달하지 않거나 예약·티켓 생성 실패·무응답·PHP 예외가 발생했습니다.',
          response: '서버가 결제 보상취소를 수행하고 결과를 남깁니다.',
          edgeIds: ['evaluate-compensate']
        },
        {
          id: 'pms-outage-observation',
          trigger: '외부 PMS 장애가 발생했습니다.',
          response: '로그의 최초 발생 시각과 종료 시각을 대조해 장애 구간을 확인했습니다.',
          edgeIds: ['evaluate-outage']
        },
        {
          id: 'premature-timeout',
          trigger: '임의의 12초 timeout이 정상 처리 중인 요청을 실패로 오판했습니다.',
          response:
            '당시 API 문제로 약 20초까지 지연된 상태를 확인하고 30초 UX와 결제 안전성을 비교해 장애 대응값 60초를 선택했습니다. 이후 API가 수정되어 현재는 과거처럼 오래 걸리지 않습니다.',
          edgeIds: ['evaluate-timeout']
        }
      ]
    }
  ],
  'integrated-sso-server': [
    {
      id: 'central-account-auth-flow',
      title: '중앙 회원 인증과 서비스 로컬 검증',
      purpose: 'Provider 키 준비부터 로그인, 서비스의 로컬 검증, 토큰 갱신과 확인되지 않은 장애 경계를 보여줍니다.',
      summary:
        '서비스는 중앙 회원 서버에서 Provider 키를 받아 캐시하고, 로그인 응답의 UUID와 토큰을 저장한 뒤 Access Token은 로컬에서 검증하고 Refresh Token 갱신은 중앙 서버에 요청합니다.',
      lanes: [
        { id: 'user', label: '사용자' },
        { id: 'service', label: 'HiPass 서버' },
        { id: 'account', label: '중앙 회원 서버' },
        { id: 'database', label: 'HiPass DB·캐시' }
      ],
      steps: [
        {
          id: 'service-start',
          laneId: 'service',
          row: 0,
          shape: 'start',
          label: '서비스 시작',
          description: '인증 요청을 처리하기 전에 Provider 키를 준비합니다.'
        },
        {
          id: 'request-provider',
          laneId: 'service',
          row: 1,
          shape: 'process',
          label: 'Provider 정보 요청',
          description: 'Provider 식별자와 API 인증값을 담아 중앙 회원 서버에 키 정보를 요청합니다.'
        },
        {
          id: 'provider-return',
          laneId: 'account',
          row: 2,
          shape: 'process',
          label: '권한 확인과 키 반환',
          description: 'Provider와 요청 권한, 허용 서버를 확인하고 토큰·비밀번호 처리 키를 반환합니다.'
        },
        {
          id: 'cache-provider',
          laneId: 'database',
          row: 3,
          shape: 'process',
          label: 'Provider 키 캐시',
          description: '정상 응답은 JSON으로 저장하고 통신 실패 시 마지막 파일을 사용합니다.'
        },
        {
          id: 'user-login',
          laneId: 'user',
          row: 4,
          shape: 'process',
          label: '로그인 요청',
          description: '사용자가 서비스에 ID와 비밀번호를 제출합니다.'
        },
        {
          id: 'forward-login',
          laneId: 'service',
          row: 5,
          shape: 'process',
          label: '인증 요청 전달',
          description: '서비스 서버가 중앙 회원 API로 자격 증명을 전달합니다.'
        },
        {
          id: 'issue-token',
          laneId: 'account',
          row: 6,
          shape: 'process',
          label: '검증과 토큰 발급',
          description: '중앙 회원 서버가 비밀번호를 검증하고 UUID와 Access·Refresh Token을 반환합니다.'
        },
        {
          id: 'persist-session',
          laneId: 'database',
          row: 7,
          shape: 'process',
          label: '회원 연결과 토큰 저장',
          description: 'UUID·로그인 ID·토큰을 user_tokens에 저장하고 UUID로 서비스 도메인 데이터를 연결합니다.'
        },
        {
          id: 'login-stop',
          laneId: 'account',
          row: 7,
          shape: 'stop',
          label: '신규 로그인 중단',
          description: '로그인 API 장애에 대한 별도 fallback은 구현하거나 테스트하지 않았습니다.'
        },
        {
          id: 'api-request',
          laneId: 'user',
          row: 8,
          shape: 'process',
          label: '인증 API 요청',
          description: '사용자가 발급받은 토큰으로 서비스 기능을 요청합니다.'
        },
        {
          id: 'verify-token',
          laneId: 'service',
          row: 9,
          shape: 'decision',
          label: 'Access Token 검증',
          description: '캐시한 키로 토큰을 로컬 검증하고 user_tokens에서 UUID를 복원합니다.'
        },
        {
          id: 'refresh-token',
          laneId: 'account',
          row: 10,
          shape: 'process',
          label: 'Refresh Token 검증',
          description: 'Access Token이 만료되면 중앙 회원 서버가 Refresh Token을 검증하고 새 토큰을 발급합니다.'
        },
        {
          id: 'update-token',
          laneId: 'database',
          row: 11,
          shape: 'process',
          label: '로컬 토큰 갱신',
          description: '새 Access Token과 만료 정보를 서비스 DB에 반영합니다.'
        },
        {
          id: 'domain-response',
          laneId: 'database',
          row: 12,
          shape: 'end',
          label: '도메인 데이터 응답',
          description: 'UUID를 기준으로 서비스 데이터를 조회해 응답합니다.'
        }
      ],
      edges: [
        {
          id: 'start-request-provider',
          from: 'service-start',
          to: 'request-provider',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'request-provider-return',
          from: 'request-provider',
          to: 'provider-return',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'provider-return-cache',
          from: 'provider-return',
          to: 'cache-provider',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'provider-cache-fallback',
          from: 'provider-return',
          to: 'cache-provider',
          kind: 'exception',
          outcome: 'recover',
          fromAnchor: 'right',
          toAnchor: 'right',
          waypoints: undefined,
          label: 'Provider 키 조회 실패',
          labelAt: undefined
        },
        {
          id: 'cache-user-login',
          from: 'cache-provider',
          to: 'user-login',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'user-forward-login',
          from: 'user-login',
          to: 'forward-login',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'forward-issue-token',
          from: 'forward-login',
          to: 'issue-token',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'issue-persist-session',
          from: 'issue-token',
          to: 'persist-session',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'login-api-stop',
          from: 'issue-token',
          to: 'login-stop',
          kind: 'exception',
          outcome: 'stop',
          fromAnchor: 'right',
          toAnchor: 'top',
          waypoints: undefined,
          label: '로그인 API 응답 없음',
          labelAt: undefined
        },
        {
          id: 'persist-api-request',
          from: 'persist-session',
          to: 'api-request',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'api-verify-token',
          from: 'api-request',
          to: 'verify-token',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'verify-domain-response',
          from: 'verify-token',
          to: 'domain-response',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: 'Access Token 유효',
          labelAt: undefined
        },
        {
          id: 'verify-refresh-token',
          from: 'verify-token',
          to: 'refresh-token',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: '만료 + Refresh Token 있음',
          labelAt: undefined
        },
        {
          id: 'refresh-update-token',
          from: 'refresh-token',
          to: 'update-token',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: undefined,
          labelAt: undefined
        },
        {
          id: 'update-domain-response',
          from: 'update-token',
          to: 'domain-response',
          kind: 'normal',
          outcome: 'continue',
          fromAnchor: 'bottom',
          toAnchor: 'top',
          waypoints: undefined,
          label: undefined,
          labelAt: undefined
        }
      ],
      exceptions: [
        {
          id: 'provider-key-cache-fallback',
          trigger: '중앙 회원 서버에서 Provider 키를 가져오는 요청이 실패했습니다.',
          response: '서비스가 마지막으로 저장한 JSON 캐시를 읽어 토큰 검증에 사용할 키를 준비합니다.',
          edgeIds: ['provider-cache-fallback']
        },
        {
          id: 'login-api-unavailable',
          trigger: '중앙 회원 서버의 로그인 API가 응답하지 않습니다.',
          response: '신규 로그인 fallback은 구현하거나 테스트하지 않았으므로 흐름이 중단됩니다.',
          edgeIds: ['login-api-stop']
        }
      ]
    }
  ]
} as const;

const createValidDetail = (): FeatureDetailDto => ({
  role: 'DX/DevOps 단독 설계 및 구현',
  highlights: [
    {
      id: 'adoption',
      label: '적용 프로젝트',
      value: '11개',
      kind: 'reported',
      asOf: '2026-08-20',
      evidence: '사용자 인터뷰에서 확인한 적용 범위'
    }
  ],
  problem: '프로젝트마다 개발과 배포 기준이 달랐다.',
  constraints: '비공개 소스와 시크릿은 공개할 수 없다.',
  alternatives: '기존 도구 유지와 공통 하네스 도입을 비교했다.',
  implementation: '공통 정책과 프로젝트별 집행 경계를 분리했다.',
  outcomes: '검증 가능한 결과만 공개한다.',
  retrospective: '세션 수명주기 자동화는 후속 과제로 남았다.'
});

describe('Feature 015 Archify source·artifact·fallback 패리티', () => {
  const featureSlug = 'integrated-reservation-platform';
  const diagramDirectory = 'integrated-reservation-platform';

  const readArtifactSvg = (name: string): string => {
    const artifactPath = resolve(process.cwd(), `public/diagrams/${diagramDirectory}/${name}.html`);
    const artifact = readFileSync(artifactPath, 'utf8');
    const svg = artifact.match(/<svg\b[^>]*>[\s\S]*?<\/svg>/)?.[0];
    if (!svg) throw new Error(`${artifactPath}: generated SVG를 찾을 수 없습니다.`);
    return svg;
  };

  const readAttribute = (tag: string, name: string): string | null =>
    tag.match(new RegExp(`${name}="([^"]+)"`))?.[1] ?? null;

  it('UAT workflow의 lane·node·edge 의미와 생성 SVG data 속성이 fallback과 일치한다', () => {
    const source = JSON.parse(
      readFileSync(resolve(process.cwd(), `diagrams/${diagramDirectory}/uat-booking-payment-flow.json`), 'utf8')
    ) as {
      schema_version: number;
      meta: { quality_profile: string; output: string };
      lanes: Array<{ id: string; label: string }>;
      nodes: Array<{ id: string; lane: string; type: string; label: string }>;
      edges: Array<{ id: string; from: string; to: string; label?: string; variant?: string }>;
    };
    const flow = getFeatureDetailBySlug(featureSlug)?.swimlanes?.find(({ id }) => id === 'uat-booking-payment-flow');
    const artifactSvg = readArtifactSvg('uat-booking-payment-flow');
    const expectedLanes = [
      { id: 'customer-operator', label: '고객사 운영자' },
      { id: 'user', label: '사용자' },
      { id: 'nextjs-bff', label: 'Next.js BFF' },
      { id: 'nest-api-db', label: 'Nest API·DB' },
      { id: 'pg-test', label: 'PG 테스트' }
    ];
    const expectedNodes = [
      ['configure-inventory', 'customer-operator', '행사·호텔·객실·재고 등록'],
      ['browse-and-reserve', 'user', '객실 조회·예약 요청'],
      ['bff-forward', 'nextjs-bff', 'Next.js BFF 전달'],
      ['record-pending-and-decrement', 'nest-api-db', 'PAYMENT_PENDING 기록'],
      ['inventory-conflict', 'nest-api-db', '재고 version 충돌'],
      ['pg-approve', 'pg-test', 'PG 테스트 승인'],
      ['pg-failed', 'nest-api-db', 'PG 승인 실패 기록'],
      ['confirm-order-and-payment', 'nest-api-db', '주문·결제 확정'],
      ['admin-confirm-or-cancel', 'customer-operator', '관리자 예약 확인·취소']
    ];
    const expectedEdges = [
      ['configure-inventory-browse-and-reserve', 'configure-inventory', 'browse-and-reserve', null, 'normal'],
      ['browse-and-reserve-bff-forward', 'browse-and-reserve', 'bff-forward', null, 'normal'],
      ['bff-forward-record-pending-and-decrement', 'bff-forward', 'record-pending-and-decrement', null, 'normal'],
      [
        'record-pending-and-decrement-pg-approve',
        'record-pending-and-decrement',
        'pg-approve',
        '재고 차감 성공',
        'normal'
      ],
      ['pg-approve-confirm-order-and-payment', 'pg-approve', 'confirm-order-and-payment', '승인 성공', 'normal'],
      [
        'confirm-order-and-payment-admin-confirm-or-cancel',
        'confirm-order-and-payment',
        'admin-confirm-or-cancel',
        null,
        'normal'
      ],
      [
        'inventory-version-conflict-stop',
        'record-pending-and-decrement',
        'inventory-conflict',
        '조건부 갱신 0건',
        'exception'
      ],
      ['pg-approval-failed-stop', 'pg-approve', 'pg-failed', '승인 실패', 'exception']
    ];
    const artifactNodes = [...artifactSvg.matchAll(/<g\b(?=[^>]*data-node-id=")[^>]*>/g)].map(([tag]) => [
      readAttribute(tag, 'data-node-id'),
      readAttribute(tag, 'data-node-context'),
      readAttribute(tag, 'data-node-label')
    ]);
    const artifactEdges = [...artifactSvg.matchAll(/<path\b(?=[^>]*data-edge-id=")[^>]*>/g)].map(([tag]) => [
      readAttribute(tag, 'data-edge-id'),
      readAttribute(tag, 'data-edge-from'),
      readAttribute(tag, 'data-edge-to'),
      readAttribute(tag, 'data-edge-label'),
      tag.includes('a-security') || tag.includes('a-dashed') ? 'exception' : 'normal'
    ]);

    expect(source.schema_version).toBe(2);
    expect(source.meta).toMatchObject({
      quality_profile: 'showcase',
      output: 'public/diagrams/integrated-reservation-platform/uat-booking-payment-flow.html'
    });
    expect(flow?.archify).toEqual({ url: '/diagrams/integrated-reservation-platform/uat-booking-payment-flow.html' });
    expect(source.lanes).toEqual(expectedLanes);
    expect(flow?.lanes).toEqual(expectedLanes);
    expect(source.nodes.map(({ id, lane, label }) => [id, lane, label])).toEqual(expectedNodes);
    expect(flow?.steps.map(({ id, laneId }) => [id, laneId])).toEqual(expectedNodes.map(([id, lane]) => [id, lane]));
    for (const [id, , sourceLabel] of expectedNodes) {
      expect(flow?.steps.find((step) => step.id === id)?.label).toContain(sourceLabel);
    }
    expect(artifactNodes).toHaveLength(expectedNodes.length);
    expect(artifactNodes).toEqual(
      expect.arrayContaining(
        expectedNodes.map(([id, laneId, label]) => [id, expectedLanes.find((lane) => lane.id === laneId)?.label, label])
      )
    );
    expect(
      source.edges.map(({ id, from, to, label, variant }) => [
        id,
        from,
        to,
        label ?? null,
        variant === 'security' || variant === 'dashed' ? 'exception' : 'normal'
      ])
    ).toEqual(expectedEdges);
    expect(flow?.edges.map(({ id, from, to, kind }) => [id, from, to, kind])).toEqual(
      expectedEdges.map(([id, from, to, , kind]) => [id, from, to, kind])
    );
    for (const [id, , , sourceLabel] of expectedEdges) {
      if (sourceLabel) expect(flow?.edges.find((edge) => edge.id === id)?.label).toContain(sourceLabel);
    }
    expect(artifactEdges).toHaveLength(expectedEdges.length);
    expect(artifactEdges).toEqual(expect.arrayContaining(expectedEdges));
  });

  it('Core Product entity·relation ID·방향·label·cardinality와 생성 SVG data 속성이 일치한다', () => {
    const source = JSON.parse(
      readFileSync(resolve(process.cwd(), `diagrams/${diagramDirectory}/core-product-relationships.json`), 'utf8')
    ) as {
      diagram_type: string;
      meta: {
        title: string;
        output: string;
        animation: string;
        quality_profile: string;
        viewBox: [number, number];
      };
      components: Array<{ id: string; label: string; tag: string }>;
      connections: Array<{ id: string; from: string; to: string; label: string }>;
    };
    const relationshipDiagram = getFeatureDetailBySlug(featureSlug)?.relationshipDiagrams?.find(
      ({ id }) => id === 'core-product-relationships'
    );
    const artifactSvg = readArtifactSvg('core-product-relationships');
    const expectedEntities = [
      ['products', 'Products', 'parent'],
      ['product-rooms', 'ProductRooms', 'subtype'],
      ['product-tours', 'ProductTours', 'subtype'],
      ['purchase-order-items', 'PurchaseOrderItems', 'transaction'],
      ['product-room-options', 'ProductRoomOptions', 'option'],
      ['product-room-stocks', 'ProductRoomStocks', 'inventory']
    ];
    const expectedRelationships = [
      [
        'products-rooms',
        'products',
        'product-rooms',
        '1 → 0..1',
        '공통 상품이 객실 세부 모델을 선택적으로 가집니다.',
        '1 → 0..1 · 객실 세부'
      ],
      [
        'products-tours',
        'products',
        'product-tours',
        '1 → 0..1',
        '공통 상품이 관광 세부 모델을 선택적으로 가집니다.',
        '1 → 0..1 · 관광 세부'
      ],
      [
        'products-orders',
        'products',
        'purchase-order-items',
        '1 → N',
        '여러 주문 항목이 공통 productId로 상품을 참조합니다.',
        '1 → N · productId 참조'
      ],
      [
        'rooms-options',
        'product-rooms',
        'product-room-options',
        '1 → N',
        '객실 상품이 여러 객실 옵션을 가집니다.',
        '1 → N · 객실 옵션'
      ],
      [
        'rooms-stocks',
        'product-rooms',
        'product-room-stocks',
        '1 → N',
        '날짜별 객실 재고가 객실 상품을 직접 참조합니다.',
        '1 → N · 객실 직접 참조'
      ],
      [
        'options-stocks',
        'product-room-options',
        'product-room-stocks',
        '1 → N',
        '날짜별 객실 재고가 객실 옵션을 직접 참조합니다.',
        '1 → N · 옵션 직접 참조'
      ]
    ];
    const artifactEntities = [...artifactSvg.matchAll(/<g\b(?=[^>]*data-node-id=")[^>]*>/g)].map(([tag]) => [
      readAttribute(tag, 'data-node-id'),
      readAttribute(tag, 'data-node-label'),
      readAttribute(tag, 'data-node-tag')
    ]);
    const artifactRelationships = [...artifactSvg.matchAll(/<path\b(?=[^>]*data-edge-id=")[^>]*>/g)].map(([tag]) => [
      readAttribute(tag, 'data-edge-id'),
      readAttribute(tag, 'data-edge-from'),
      readAttribute(tag, 'data-edge-to'),
      readAttribute(tag, 'data-edge-label')
    ]);

    expect(source.diagram_type).toBe('architecture');
    expect(source.meta).toEqual({
      title: 'Core Product 관계도',
      output: 'public/diagrams/integrated-reservation-platform/core-product-relationships.html',
      animation: 'none',
      quality_profile: 'showcase',
      viewBox: [1040, 650]
    });
    expect(relationshipDiagram?.archify).toEqual({
      url: '/diagrams/integrated-reservation-platform/core-product-relationships.html'
    });
    expect(source.components.map(({ id, label, tag }) => [id, label, tag])).toEqual(expectedEntities);
    expect(relationshipDiagram?.entities.map(({ id, label, role }) => [id, label, role])).toEqual(expectedEntities);
    expect(artifactEntities).toHaveLength(expectedEntities.length);
    expect(artifactEntities).toEqual(expect.arrayContaining(expectedEntities));
    expect(source.connections.map(({ id, from, to, label }) => [id, from, to, label])).toEqual(
      expectedRelationships.map(([id, from, to, , , artifactLabel]) => [id, from, to, artifactLabel])
    );
    expect(
      relationshipDiagram?.relationships.map(({ id, from, to, cardinality, label }) => [
        id,
        from,
        to,
        cardinality,
        label
      ])
    ).toEqual(expectedRelationships.map(([id, from, to, cardinality, label]) => [id, from, to, cardinality, label]));
    expect(artifactRelationships).toHaveLength(expectedRelationships.length);
    expect(artifactRelationships).toEqual(
      expect.arrayContaining(
        expectedRelationships.map(([id, from, to, , , artifactLabel]) => [id, from, to, artifactLabel])
      )
    );
  });
});

describe('행사 호텔 예약·결제 통합 플랫폼 구조화 detail RED 계약', () => {
  type Feature015Detail = FeatureDetailDto & {
    relationshipDiagrams: readonly FeatureRelationshipDiagram[];
  };

  const hasRelationshipDiagrams = (value: FeatureDetailDto | null): value is Feature015Detail =>
    value !== null && 'relationshipDiagrams' in value && Array.isArray(value.relationshipDiagrams);

  it('통합 예약 feature detail이 등록되어 있다', () => {
    const detail = getFeatureDetailBySlug('integrated-reservation-platform');

    expect(detail).not.toBeNull();
  });

  it('등록된 detail은 production validator를 통과한다', () => {
    const detail = getFeatureDetailBySlug('integrated-reservation-platform');

    expect(validateFeatureDetail(detail!, 'integrated-reservation-platform')).toEqual([]);
  });

  it('등록된 detail은 승인된 근거 카드 4개를 제공한다', () => {
    const detail = getFeatureDetailBySlug('integrated-reservation-platform');

    expect(detail?.highlights, '역할·UAT·PG 테스트·보류 범위의 근거 카드 4개가 필요합니다.').toHaveLength(4);
  });

  it('등록된 detail은 UAT 스윔레인 1개를 제공한다', () => {
    const detail = getFeatureDetailBySlug('integrated-reservation-platform');
    const flow = detail?.swimlanes?.find(({ id }) => id === 'uat-booking-payment-flow');

    expect(detail?.swimlanes).toHaveLength(1);
    expect(flow?.lanes).toEqual([
      { id: 'customer-operator', label: '고객사 운영자' },
      { id: 'user', label: '사용자' },
      { id: 'nextjs-bff', label: 'Next.js BFF' },
      { id: 'nest-api-db', label: 'Nest API·DB' },
      { id: 'pg-test', label: 'PG 테스트' }
    ]);
    expect(flow?.archify?.url).toBe('/diagrams/integrated-reservation-platform/uat-booking-payment-flow.html');
    expect(
      flow?.steps.map(({ id, laneId, shape, label, description }) => ({ id, laneId, shape, label, description }))
    ).toEqual([
      {
        id: 'configure-inventory',
        laneId: 'customer-operator',
        shape: 'start',
        label: '행사·호텔·객실·재고 등록',
        description: '고객사 운영자가 행사와 판매할 호텔·객실·날짜별 재고를 설정합니다.'
      },
      {
        id: 'browse-and-reserve',
        laneId: 'user',
        shape: 'process',
        label: '객실 조회·예약 요청',
        description: '사용자가 행사 객실을 조회하고 예약과 PG 테스트 결제를 요청합니다.'
      },
      {
        id: 'bff-forward',
        laneId: 'nextjs-bff',
        shape: 'process',
        label: 'Next.js BFF 전달',
        description: 'Next.js reverse proxy가 브라우저 요청을 같은 Origin 경계에서 Nest API로 전달합니다.'
      },
      {
        id: 'record-pending-and-decrement',
        laneId: 'nest-api-db',
        shape: 'decision',
        label: 'PAYMENT_PENDING 기록·version 조건 재고 차감',
        description:
          '주문을 PAYMENT_PENDING으로 기록하고 현재 version을 조건으로 재고를 차감하며, 갱신 건수가 0이면 충돌로 처리합니다.'
      },
      {
        id: 'inventory-conflict',
        laneId: 'nest-api-db',
        shape: 'stop',
        label: '재고 version 충돌',
        description: '조건부 갱신 0건이면 PG 호출 전에 충돌 응답과 재시도 안내로 종료합니다.'
      },
      {
        id: 'pg-approve',
        laneId: 'pg-test',
        shape: 'decision',
        label: 'PG 테스트 승인',
        description: 'PG 테스트 환경이 결제 승인 또는 승인 실패를 반환합니다.'
      },
      {
        id: 'pg-failed',
        laneId: 'nest-api-db',
        shape: 'stop',
        label: 'PG 승인 실패 기록',
        description:
          '주문을 CANCELLED, 결제 이력을 ABORTED로 기록합니다. 차감 재고 자동 복구는 보류 시점에 미완성이었습니다.'
      },
      {
        id: 'confirm-order-and-payment',
        laneId: 'nest-api-db',
        shape: 'process',
        label: '주문·결제 확정',
        description: 'PG 테스트 승인 결과를 별도 내부 단계에서 주문과 결제 이력에 확정합니다.'
      },
      {
        id: 'admin-confirm-or-cancel',
        laneId: 'customer-operator',
        shape: 'end',
        label: '관리자 예약 확인·취소',
        description: '고객사 운영자가 예약을 확인하고 PG 테스트 환경에서 취소 흐름을 검증합니다.'
      }
    ]);
    expect(
      flow?.edges.map(({ id, from, to, kind, outcome, label, labelAt }) => ({
        id,
        from,
        to,
        kind,
        outcome,
        label,
        ...(labelAt ? { labelAt } : {})
      }))
    ).toEqual([
      {
        id: 'configure-inventory-browse-and-reserve',
        from: 'configure-inventory',
        to: 'browse-and-reserve',
        kind: 'normal',
        outcome: 'continue',
        label: undefined
      },
      {
        id: 'browse-and-reserve-bff-forward',
        from: 'browse-and-reserve',
        to: 'bff-forward',
        kind: 'normal',
        outcome: 'continue',
        label: undefined
      },
      {
        id: 'bff-forward-record-pending-and-decrement',
        from: 'bff-forward',
        to: 'record-pending-and-decrement',
        kind: 'normal',
        outcome: 'continue',
        label: undefined
      },
      {
        id: 'record-pending-and-decrement-pg-approve',
        from: 'record-pending-and-decrement',
        to: 'pg-approve',
        kind: 'normal',
        outcome: 'continue',
        label: '재고 차감 성공'
      },
      {
        id: 'pg-approve-confirm-order-and-payment',
        from: 'pg-approve',
        to: 'confirm-order-and-payment',
        kind: 'normal',
        outcome: 'continue',
        label: '승인 성공'
      },
      {
        id: 'confirm-order-and-payment-admin-confirm-or-cancel',
        from: 'confirm-order-and-payment',
        to: 'admin-confirm-or-cancel',
        kind: 'normal',
        outcome: 'continue',
        label: undefined
      },
      {
        id: 'inventory-version-conflict-stop',
        from: 'record-pending-and-decrement',
        to: 'inventory-conflict',
        kind: 'exception',
        outcome: 'stop',
        label: '조건부 갱신 0건: PG 호출 전 재시도 안내',
        labelAt: { column: 0.9, row: 3.5 }
      },
      {
        id: 'pg-approval-failed-stop',
        from: 'pg-approve',
        to: 'pg-failed',
        kind: 'exception',
        outcome: 'stop',
        label: 'PG 승인 실패: CANCELLED·ABORTED 기록'
      }
    ]);
    expect(flow?.exceptions).toEqual([
      {
        id: 'inventory-version-conflict',
        trigger: 'version 조건부 재고 갱신 결과가 0건인 재고 충돌입니다.',
        response: 'PG 호출 전에 충돌 응답을 반환하고 사용자에게 재시도를 안내합니다.',
        edgeIds: ['inventory-version-conflict-stop']
      },
      {
        id: 'pg-approval-failed',
        trigger: '재고 차감과 pending 기록 뒤 PG 테스트 승인 실패가 발생했습니다.',
        response:
          '주문은 CANCELLED, 결제 이력은 ABORTED로 기록합니다. 차감 재고 자동 복구는 보류 시점에 미완성이었습니다.',
        edgeIds: ['pg-approval-failed-stop']
      }
    ]);
  });

  const relationshipDetail = () => {
    const detail = getFeatureDetailBySlug('integrated-reservation-platform');
    if (!hasRelationshipDiagrams(detail))
      throw new Error('Core Product relationship diagram이 아직 등록되지 않았습니다.');
    return detail.relationshipDiagrams;
  };

  it('Core Product relationship diagram은 한 개만 등록한다', () => {
    expect(relationshipDetail()).toHaveLength(1);
    expect(relationshipDetail()[0]).toMatchObject({
      id: 'core-product-relationships',
      title: 'Core Product 관계도',
      purpose: '공통 Product와 객실·관광 세부 모델, 주문 항목, 객실 옵션·날짜별 재고의 참조 관계를 보여줍니다.',
      summary:
        'Products는 객실과 관광의 공통 상품 부모이며 PurchaseOrderItems가 공통 productId로 참조합니다. ProductRoomStocks는 조회 경로에 맞춰 객실과 객실 옵션을 직접 참조합니다.',
      textAlternative:
        'Products 하나는 ProductRooms와 ProductTours를 각각 0개 또는 1개 연결하고 PurchaseOrderItems 여러 개에서 참조됩니다. ProductRooms 하나에는 ProductRoomOptions와 ProductRoomStocks 여러 개가 연결되며, ProductRoomOptions 하나도 ProductRoomStocks 여러 개에서 직접 참조됩니다.'
    });
  });

  it('Core Product relationship diagram은 여섯 entity를 정확히 등록한다', () => {
    const relationship = relationshipDetail()[0];

    expect(relationship?.entities).toEqual([
      {
        id: 'products',
        label: 'Products',
        role: 'parent',
        description: '객실·관광 세부 모델과 주문 항목이 공유하는 공통 상품 부모입니다.'
      },
      {
        id: 'product-rooms',
        label: 'ProductRooms',
        role: 'subtype',
        description: 'Products에 연결되는 객실 상품의 세부 모델입니다.'
      },
      {
        id: 'product-tours',
        label: 'ProductTours',
        role: 'subtype',
        description: 'Products에 연결되는 관광 상품의 세부 모델입니다.'
      },
      {
        id: 'purchase-order-items',
        label: 'PurchaseOrderItems',
        role: 'transaction',
        description: '공통 productId로 Products를 참조하는 주문 항목입니다.'
      },
      {
        id: 'product-room-options',
        label: 'ProductRoomOptions',
        role: 'option',
        description: '객실 상품에서 선택할 수 있는 옵션입니다.'
      },
      {
        id: 'product-room-stocks',
        label: 'ProductRoomStocks',
        role: 'inventory',
        description: '객실과 객실 옵션을 직접 참조하는 날짜별 재고입니다.'
      }
    ]);
  });

  it('Core Product relationship diagram은 여섯 cardinality relation을 정확히 등록한다', () => {
    const relationship = relationshipDetail()[0];

    expect(
      relationship?.relationships.map(({ id, from, to, label, cardinality }) => ({ id, from, to, label, cardinality }))
    ).toEqual([
      {
        id: 'products-rooms',
        from: 'products',
        to: 'product-rooms',
        label: '공통 상품이 객실 세부 모델을 선택적으로 가집니다.',
        cardinality: '1 → 0..1'
      },
      {
        id: 'products-tours',
        from: 'products',
        to: 'product-tours',
        label: '공통 상품이 관광 세부 모델을 선택적으로 가집니다.',
        cardinality: '1 → 0..1'
      },
      {
        id: 'products-orders',
        from: 'products',
        to: 'purchase-order-items',
        label: '여러 주문 항목이 공통 productId로 상품을 참조합니다.',
        cardinality: '1 → N'
      },
      {
        id: 'rooms-options',
        from: 'product-rooms',
        to: 'product-room-options',
        label: '객실 상품이 여러 객실 옵션을 가집니다.',
        cardinality: '1 → N'
      },
      {
        id: 'rooms-stocks',
        from: 'product-rooms',
        to: 'product-room-stocks',
        label: '날짜별 객실 재고가 객실 상품을 직접 참조합니다.',
        cardinality: '1 → N'
      },
      {
        id: 'options-stocks',
        from: 'product-room-options',
        to: 'product-room-stocks',
        label: '날짜별 객실 재고가 객실 옵션을 직접 참조합니다.',
        cardinality: '1 → N'
      }
    ]);
  });

  it('Core Product relationship diagram은 typed architecture target을 가리킨다', () => {
    const relationship = relationshipDetail()[0];

    expect(relationship?.archify?.url).toBe(
      '/diagrams/integrated-reservation-platform/core-product-relationships.html'
    );
  });

  it('relationship artifact target은 workflow URL·외부 URL·다른 feature target과 교차 연결되지 않는다', () => {
    type RelationshipTargetApi = {
      isFeatureRelationshipArchifyTarget: (featureSlug: string, diagramId: string, url: string) => boolean;
    };
    const hasRelationshipTargetApi = (value: object): value is RelationshipTargetApi =>
      typeof Reflect.get(value, 'isFeatureRelationshipArchifyTarget') === 'function';

    return import('./types/feature-detail.dto').then((module) => {
      expect(hasRelationshipTargetApi(module), 'relationship artifact target guard가 아직 구현되지 않았습니다.').toBe(
        true
      );
      if (!hasRelationshipTargetApi(module)) return;

      expect(
        module.isFeatureRelationshipArchifyTarget(
          'integrated-reservation-platform',
          'core-product-relationships',
          '/diagrams/integrated-reservation-platform/core-product-relationships.html'
        )
      ).toBe(true);
      expect(
        module.isFeatureRelationshipArchifyTarget(
          'integrated-reservation-platform',
          'core-product-relationships',
          '/diagrams/integrated-reservation-platform/uat-booking-payment-flow.html'
        )
      ).toBe(false);
      expect(
        module.isFeatureRelationshipArchifyTarget(
          'hotel-reservation-platform',
          'core-product-relationships',
          '/diagrams/integrated-reservation-platform/core-product-relationships.html'
        )
      ).toBe(false);
      expect(
        module.isFeatureRelationshipArchifyTarget(
          'integrated-reservation-platform',
          'wrong-diagram',
          '/diagrams/integrated-reservation-platform/core-product-relationships.html'
        )
      ).toBe(false);
      expect(
        module.isFeatureRelationshipArchifyTarget(
          'integrated-reservation-platform',
          'core-product-relationships',
          'https://example.test/architecture.html'
        )
      ).toBe(false);
    });
  });
});

const createValidRelationshipDiagram = (): FeatureRelationshipDiagram => ({
  id: 'core-product-relationships',
  title: 'Core Product 관계도',
  purpose: '공통 Product와 객실·관광·주문·재고 관계를 설명한다.',
  summary: 'Products를 중심으로 세부 모델과 주문·재고가 연결된다.',
  textAlternative: '여섯 엔터티와 여섯 관계의 방향과 cardinality를 텍스트로 제공한다.',
  entities: [
    { id: 'products', label: 'Products', description: '공통 상품 부모다.', role: 'parent' },
    { id: 'product-rooms', label: 'ProductRooms', description: '객실 세부 모델이다.', role: 'subtype' }
  ],
  relationships: [
    {
      id: 'products-rooms',
      from: 'products',
      to: 'product-rooms',
      label: '객실 세부 모델을 연결한다.',
      cardinality: '1 → 0..1'
    }
  ],
  archify: { url: '/diagrams/integrated-reservation-platform/core-product-relationships.html' }
});

const createDetailWithRelationshipDiagram = (): FeatureDetailDto => ({
  ...createValidDetail(),
  relationshipDiagrams: [createValidRelationshipDiagram()]
});

describe('Core Product relationship diagram validator RED 계약', () => {
  it('승인된 diagram·entity·relation을 통과시킨다', () => {
    expect(validateFeatureDetail(createDetailWithRelationshipDiagram(), 'integrated-reservation-platform')).toEqual([]);
  });

  it.each([
    [
      'relationshipDiagrams',
      (detail: FeatureDetailDto) => ((detail as { relationshipDiagrams?: unknown }).relationshipDiagrams = {}),
      'relationshipDiagrams: 배열이어야 합니다.'
    ],
    [
      'entities',
      (detail: FeatureDetailDto) =>
        ((detail.relationshipDiagrams![0] as unknown as { entities: unknown }).entities = {}),
      'relationshipDiagrams[0].entities: 필수 배열이 없습니다.'
    ],
    [
      'relationships',
      (detail: FeatureDetailDto) =>
        ((detail.relationshipDiagrams![0] as unknown as { relationships: unknown }).relationships = {}),
      'relationshipDiagrams[0].relationships: 필수 배열이 없습니다.'
    ]
  ])('배열이 아닌 %s를 거부한다', (_case, mutate, expectedError) => {
    const detail = createDetailWithRelationshipDiagram();
    mutate(detail);

    expect(validateFeatureDetail(detail, 'integrated-reservation-platform')).toContain(expectedError);
  });

  it('허용되지 않은 entity role을 거부한다', () => {
    const detail = createDetailWithRelationshipDiagram();
    (detail.relationshipDiagrams![0].entities[0] as unknown as { role: string }).role = 'service';

    expect(validateFeatureDetail(detail, 'integrated-reservation-platform')).toContain(
      'relationshipDiagrams[0].entities[0].role: 허용되지 않는 entity role "service"입니다.'
    );
  });

  it.each([
    [
      'diagram',
      (detail: FeatureDetailDto) => detail.relationshipDiagrams!.push(createValidRelationshipDiagram()),
      'relationshipDiagrams: 중복 ID'
    ],
    [
      'entity',
      (detail: FeatureDetailDto) =>
        detail.relationshipDiagrams![0].entities.push({
          ...detail.relationshipDiagrams![0].entities[0],
          label: 'Products duplicate'
        }),
      'relationshipDiagrams[0].entities: 중복 ID'
    ],
    [
      'relation',
      (detail: FeatureDetailDto) =>
        detail.relationshipDiagrams![0].relationships.push({
          ...detail.relationshipDiagrams![0].relationships[0],
          label: '객실 세부 모델 중복 관계'
        }),
      'relationshipDiagrams[0].relationships: 중복 ID'
    ]
  ])('중복 %s ID를 거부한다', (_case, mutate, expectedError) => {
    const detail = createDetailWithRelationshipDiagram();
    mutate(detail);

    expect(
      validateFeatureDetail(detail, 'integrated-reservation-platform').some((error) => error.includes(expectedError))
    ).toBe(true);
  });

  it.each([
    ['from', 'from'],
    ['to', 'to']
  ] as const)('존재하지 않는 entity를 참조하는 %s를 거부한다', (_case, field) => {
    const detail = createDetailWithRelationshipDiagram();
    detail.relationshipDiagrams![0].relationships[0][field] = 'missing-entity';

    expect(
      validateFeatureDetail(detail, 'integrated-reservation-platform').some((error) =>
        error.includes(`relationshipDiagrams[0].relationships[0].${field}: 존재하지 않는 entity`)
      )
    ).toBe(true);
  });

  it.each([
    [
      'diagram id',
      (detail: FeatureDetailDto) => (detail.relationshipDiagrams![0].id = ' '),
      'relationshipDiagrams[0].id'
    ],
    [
      'diagram title',
      (detail: FeatureDetailDto) => (detail.relationshipDiagrams![0].title = ' '),
      'relationshipDiagrams[0].title'
    ],
    [
      'diagram purpose',
      (detail: FeatureDetailDto) => (detail.relationshipDiagrams![0].purpose = ' '),
      'relationshipDiagrams[0].purpose'
    ],
    [
      'diagram summary',
      (detail: FeatureDetailDto) => (detail.relationshipDiagrams![0].summary = ' '),
      'relationshipDiagrams[0].summary'
    ],
    [
      'diagram textAlternative',
      (detail: FeatureDetailDto) => (detail.relationshipDiagrams![0].textAlternative = ' '),
      'relationshipDiagrams[0].textAlternative'
    ],
    [
      'entity id',
      (detail: FeatureDetailDto) => (detail.relationshipDiagrams![0].entities[0].id = ' '),
      'relationshipDiagrams[0].entities[0].id'
    ],
    [
      'entity label',
      (detail: FeatureDetailDto) => (detail.relationshipDiagrams![0].entities[0].label = ' '),
      'relationshipDiagrams[0].entities[0].label'
    ],
    [
      'entity role',
      (detail: FeatureDetailDto) =>
        ((detail.relationshipDiagrams![0].entities[0] as unknown as { role: string }).role = ' '),
      'relationshipDiagrams[0].entities[0].role'
    ],
    [
      'entity description',
      (detail: FeatureDetailDto) => (detail.relationshipDiagrams![0].entities[0].description = ' '),
      'relationshipDiagrams[0].entities[0].description'
    ],
    [
      'relation id',
      (detail: FeatureDetailDto) => (detail.relationshipDiagrams![0].relationships[0].id = ' '),
      'relationshipDiagrams[0].relationships[0].id'
    ],
    [
      'relation from',
      (detail: FeatureDetailDto) => (detail.relationshipDiagrams![0].relationships[0].from = ' '),
      'relationshipDiagrams[0].relationships[0].from'
    ],
    [
      'relation to',
      (detail: FeatureDetailDto) => (detail.relationshipDiagrams![0].relationships[0].to = ' '),
      'relationshipDiagrams[0].relationships[0].to'
    ],
    [
      'relation label',
      (detail: FeatureDetailDto) => (detail.relationshipDiagrams![0].relationships[0].label = ' '),
      'relationshipDiagrams[0].relationships[0].label'
    ],
    [
      'relation cardinality',
      (detail: FeatureDetailDto) => (detail.relationshipDiagrams![0].relationships[0].cardinality = ' '),
      'relationshipDiagrams[0].relationships[0].cardinality'
    ],
    [
      'archify url',
      (detail: FeatureDetailDto) => ((detail.relationshipDiagrams![0].archify as { url: string }).url = ' '),
      'relationshipDiagrams[0].archify.url'
    ]
  ])('빈 %s를 거부한다', (_case, mutate, expectedError) => {
    const detail = createDetailWithRelationshipDiagram();
    mutate(detail);

    expect(validateFeatureDetail(detail, 'integrated-reservation-platform')).toContain(
      `${expectedError}: 필수 값이 비어 있습니다.`
    );
  });

  it.each([
    '/diagrams/integrated-reservation-platform/uat-booking-payment-flow.html',
    '/diagrams/integrated-reservation-platform/unapproved.html',
    '/diagrams/integrated-reservation-platform/core-product-relationships.html?feature=wrong',
    'https://example.test/core-product-relationships.html'
  ])('미승인 또는 교차 artifact URL %s를 거부한다', (url) => {
    const detail = createDetailWithRelationshipDiagram();
    (detail.relationshipDiagrams![0].archify as { url: string }).url = url;

    expect(
      validateFeatureDetail(detail, 'integrated-reservation-platform').some((error) =>
        error.includes('relationshipDiagrams[0].archify.url')
      )
    ).toBe(true);
  });

  it.each([
    ['wrong-feature', 'core-product-relationships'],
    ['integrated-reservation-platform', 'wrong-diagram']
  ])('승인 URL이어도 feature/diagram tuple %s:%s가 다르면 거부한다', (featureSlug, diagramId) => {
    const detail = createDetailWithRelationshipDiagram();
    detail.relationshipDiagrams![0].id = diagramId;

    expect(validateFeatureDetail(detail, featureSlug)).toContain(
      'relationshipDiagrams[0].archify.url: feature/diagram 대상과 일치하는 artifact 경로가 필요합니다.'
    );
  });
});

const createValidSwimlane = (): FeatureSwimlane => ({
  id: 'flow',
  title: '검증 흐름',
  purpose: '연결형 흐름을 검증한다.',
  summary: '시작한 뒤 작업을 수행하고 완료한다.',
  lanes: [
    { id: 'requester', label: '요청자' },
    { id: 'worker', label: '작업자' }
  ],
  steps: [
    {
      id: 'start',
      laneId: 'requester',
      row: 0,
      shape: 'start',
      label: '시작',
      description: '요청한다.'
    },
    {
      id: 'work',
      laneId: 'worker',
      row: 1,
      shape: 'process',
      label: '작업',
      description: '처리한다.'
    },
    {
      id: 'finish',
      laneId: 'worker',
      row: 2,
      shape: 'end',
      label: '완료',
      description: '결과를 확인한다.'
    }
  ],
  edges: [
    {
      id: 'start-work',
      from: 'start',
      to: 'work',
      kind: 'normal',
      outcome: 'continue',
      fromAnchor: 'bottom',
      toAnchor: 'top'
    },
    {
      id: 'work-finish',
      from: 'work',
      to: 'finish',
      kind: 'normal',
      outcome: 'continue',
      fromAnchor: 'bottom',
      toAnchor: 'top'
    }
  ],
  exceptions: []
});

const createDetailWithSwimlane = (): FeatureDetailDto => ({
  ...createValidDetail(),
  swimlanes: [createValidSwimlane()]
});

describe('연결형 스윔레인 validator', () => {
  it('query와 fragment가 없는 same-origin diagrams HTML 경로만 Archify embed metadata로 허용한다', () => {
    const detail = createDetailWithSwimlane();
    const swimlane = detail.swimlanes![0] as unknown as {
      archify?: { url: string };
    };
    swimlane.archify = {
      url: '/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html'
    };

    expect(validateFeatureDetail(detail)).toEqual([]);
  });

  it.each([
    ['빈 URL', ' ', 'swimlanes[0].archify.url: 필수 값이 비어 있습니다.'],
    ['외부 URL', 'https://example.com/flow.html', 'swimlanes[0].archify.url: 허용된'],
    ['허용 root 밖', '/assets/flow.html', 'swimlanes[0].archify.url: 허용된'],
    ['HTML이 아닌 경로', '/diagrams/flow.json', 'swimlanes[0].archify.url: 허용된'],
    ['query 포함', '/diagrams/flow.html?mode=edit', 'swimlanes[0].archify.url: 허용된'],
    ['fragment 포함', '/diagrams/flow.html#node', 'swimlanes[0].archify.url: 허용된'],
    ['protocol-relative URL', '//diagrams/flow.html', 'swimlanes[0].archify.url: 허용된'],
    ['상위 경로 이동', '/diagrams/../flow.html', 'swimlanes[0].archify.url: 허용된'],
    ['인코딩 구분자', '/diagrams/team%2Fflow.html', 'swimlanes[0].archify.url: 허용된'],
    ['빈 경로 구간', '/diagrams/team//flow.html', 'swimlanes[0].archify.url: 허용된']
  ])('%s Archify metadata를 차단한다', (_case, url, expectedError) => {
    const detail = createDetailWithSwimlane();
    const swimlane = detail.swimlanes![0] as unknown as {
      archify?: { url: string };
    };
    swimlane.archify = { url };

    expect(validateFeatureDetail(detail).some((error) => error.includes(expectedError))).toBe(true);
  });

  it('선언한 열 대상 외의 same-origin artifact URL은 차단한다', () => {
    const detail = createDetailWithSwimlane();
    const swimlane = detail.swimlanes![0] as unknown as { archify?: { url: string } };
    swimlane.archify = { url: '/diagrams/unapproved-flow/preview.html' };

    expect(FEATURE_SWIMLANE_ARCHIFY_URLS).toHaveLength(10);
    expect(validateFeatureDetail(detail)).toContain(
      'swimlanes[0].archify.url: 허용된 /diagrams/ 아래의 HTML 및 승인된 대상 artifact 경로가 필요합니다.'
    );
  });

  it('승인 URL도 다른 feature/swimlane에 교차 연결하면 차단하고 metadata를 제거한다', () => {
    const detail = createDetailWithSwimlane();
    const swimlane = detail.swimlanes![0] as unknown as { id: string; archify?: { url: string } };
    swimlane.id = 'design-development-verification';
    swimlane.archify = {
      url: '/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html'
    };

    expect(validateFeatureDetail(detail, 'codi-harness-dx-platform')).toContain(
      'swimlanes[0].archify.url: feature/swimlane 대상과 일치하는 artifact 경로가 필요합니다.'
    );
    expect(
      sanitizeFeatureDetailArchifyMetadata('codi-harness-dx-platform', detail).swimlanes?.[0].archify
    ).toBeUndefined();
  });

  it('anchor를 생략한 edge를 자동 방향 선택 대상으로 허용한다', () => {
    const detail = createDetailWithSwimlane();
    const edge = detail.swimlanes![0].edges[0] as Partial<FeatureSwimlaneEdge>;
    delete edge.fromAnchor;
    delete edge.toAnchor;

    expect(validateFeatureDetail(detail)).toEqual([]);
  });

  it('명시한 anchor가 네 방향 밖의 값이면 차단한다', () => {
    const detail = createDetailWithSwimlane();
    detail.swimlanes![0].edges[0].fromAnchor = 'center' as NonNullable<FeatureSwimlaneEdge['fromAnchor']>;

    expect(validateFeatureDetail(detail)).toContain(
      'swimlanes[0].edges[0].fromAnchor: 허용되지 않는 anchor "center"입니다.'
    );
  });

  it('decision에서 나가는 normal edge에도 결과 label을 요구한다', () => {
    const detail = createDetailWithSwimlane();
    const swimlane = detail.swimlanes![0];
    swimlane.steps[1].shape = 'decision';
    swimlane.edges[1].label = ' ';

    expect(validateFeatureDetail(detail)).toContain(
      'swimlanes[0].edges[1].label: decision 분기 edge에는 결과 label이 필요합니다.'
    );
  });

  it('runtime에서 허용되지 않는 edge kind를 차단한다', () => {
    const detail = createDetailWithSwimlane();
    detail.swimlanes![0].edges.push({
      id: 'legacy-failure',
      from: 'work',
      to: 'start',
      kind: 'failure' as FeatureSwimlane['edges'][number]['kind'],
      outcome: 'recover',
      fromAnchor: 'left',
      toAnchor: 'left'
    });

    expect(validateFeatureDetail(detail)).toContain(
      'swimlanes[0].edges[2].kind: 허용되지 않는 edge kind "failure"입니다.'
    );
  });

  it('필수 exceptions 배열이 없으면 TypeError 대신 path 오류를 반환한다', () => {
    const detail = createDetailWithSwimlane();
    delete (detail.swimlanes![0] as Partial<FeatureSwimlane>).exceptions;

    expect(validateFeatureDetail(detail)).toContain('swimlanes[0].exceptions: 필수 배열이 없습니다.');
  });

  it.each([
    [
      'highlights',
      (detail: FeatureDetailDto) => {
        (detail as unknown as { highlights: unknown }).highlights = null;
      },
      'highlights: 필수 배열이 없습니다.'
    ],
    [
      '제공된 swimlanes',
      (detail: FeatureDetailDto) => {
        (detail as unknown as { swimlanes: unknown }).swimlanes = {};
      },
      'swimlanes: 배열이어야 합니다.'
    ],
    [
      'lanes',
      (detail: FeatureDetailDto) => {
        (detail.swimlanes![0] as unknown as { lanes: unknown }).lanes = null;
      },
      'swimlanes[0].lanes: 필수 배열이 없습니다.'
    ],
    [
      'steps',
      (detail: FeatureDetailDto) => {
        (detail.swimlanes![0] as unknown as { steps: unknown }).steps = {};
      },
      'swimlanes[0].steps: 필수 배열이 없습니다.'
    ],
    [
      'edges',
      (detail: FeatureDetailDto) => {
        (detail.swimlanes![0] as unknown as { edges: unknown }).edges = null;
      },
      'swimlanes[0].edges: 필수 배열이 없습니다.'
    ],
    [
      'exceptions',
      (detail: FeatureDetailDto) => {
        (detail.swimlanes![0] as unknown as { exceptions: unknown }).exceptions = {};
      },
      'swimlanes[0].exceptions: 필수 배열이 없습니다.'
    ],
    [
      'exception.edgeIds',
      (detail: FeatureDetailDto) => {
        const swimlane = detail.swimlanes![0];
        swimlane.edges.push({
          id: 'retry',
          from: 'work',
          to: 'start',
          kind: 'exception',
          outcome: 'recover',
          fromAnchor: 'left',
          toAnchor: 'left',
          label: '재시도'
        });
        swimlane.exceptions.push({
          id: 'retry-copy',
          trigger: '실패',
          response: '다시 시작한다.',
          edgeIds: ['retry']
        });
        (swimlane.exceptions[0] as unknown as { edgeIds: unknown }).edgeIds = null;
      },
      'swimlanes[0].exceptions[0].edgeIds: 필수 배열이 없습니다.'
    ]
  ])('%s 배열이 malformed여도 path 오류를 수집한다', (_label, mutate, expectedError) => {
    const detail = createDetailWithSwimlane();
    mutate(detail);

    expect(validateFeatureDetail(detail)).toContain(expectedError);
  });

  it('중복 lane·step·edge·exception ID와 lane/row 위치를 모두 차단한다', () => {
    const detail = createDetailWithSwimlane();
    const swimlane = detail.swimlanes![0];
    swimlane.lanes.push({ id: 'worker', label: '중복 작업자' });
    swimlane.steps.push({
      ...swimlane.steps[1],
      id: 'work'
    });
    swimlane.edges.push({
      ...swimlane.edges[0],
      id: 'start-work'
    });
    swimlane.edges.push({
      id: 'retry',
      from: 'work',
      to: 'start',
      kind: 'exception',
      outcome: 'recover',
      fromAnchor: 'left',
      toAnchor: 'left',
      label: '재시도'
    });
    swimlane.exceptions = [
      { id: 'retry-copy', trigger: '실패', response: '다시 시작한다.', edgeIds: ['retry'] },
      { id: 'retry-copy', trigger: '재실패', response: '다시 시작한다.', edgeIds: ['retry'] }
    ];

    const errors = validateFeatureDetail(detail);

    expect(errors).toContain('swimlanes[0].lanes: 중복 ID "worker"가 있습니다.');
    expect(errors).toContain('swimlanes[0].steps: 중복 ID "work"가 있습니다.');
    expect(errors).toContain('swimlanes[0].edges: 중복 ID "start-work"가 있습니다.');
    expect(errors).toContain('swimlanes[0].exceptions: 중복 ID "retry-copy"가 있습니다.');
    expect(errors).toContain('swimlanes[0].steps: lane "worker"의 row 1 위치가 중복됩니다.');
  });

  it('없는 lane·step 참조, self-edge와 유효하지 않은 shape·anchor를 차단한다', () => {
    const detail = createDetailWithSwimlane();
    const swimlane = detail.swimlanes![0];
    swimlane.steps[1].laneId = 'missing-lane';
    swimlane.steps[1].shape = 'hexagon' as FeatureSwimlane['steps'][number]['shape'];
    swimlane.edges[0] = {
      ...swimlane.edges[0],
      from: 'missing-step',
      to: 'missing-step',
      fromAnchor: 'center' as FeatureSwimlane['edges'][number]['fromAnchor'],
      toAnchor: 'outside' as FeatureSwimlane['edges'][number]['toAnchor']
    };

    const errors = validateFeatureDetail(detail);

    expect(errors).toContain('swimlanes[0].steps[1].laneId: 존재하지 않는 lane "missing-lane"을 참조합니다.');
    expect(errors).toContain('swimlanes[0].steps[1].shape: 허용되지 않는 node shape "hexagon"입니다.');
    expect(errors).toContain('swimlanes[0].edges[0].from: 존재하지 않는 step "missing-step"을 참조합니다.');
    expect(errors).toContain('swimlanes[0].edges[0].to: 존재하지 않는 step "missing-step"을 참조합니다.');
    expect(errors).toContain('swimlanes[0].edges[0]: 같은 step을 연결할 수 없습니다.');
    expect(errors).toContain('swimlanes[0].edges[0].fromAnchor: 허용되지 않는 anchor "center"입니다.');
    expect(errors).toContain('swimlanes[0].edges[0].toAnchor: 허용되지 않는 anchor "outside"입니다.');
  });

  it.each([
    [Number.NaN, '유한한 0 이상의 정수'],
    [Number.POSITIVE_INFINITY, '유한한 0 이상의 정수'],
    [-1, '유한한 0 이상의 정수'],
    [0.5, '유한한 0 이상의 정수']
  ])('step row %s를 차단한다', (row, reason) => {
    const detail = createDetailWithSwimlane();
    detail.swimlanes![0].steps[1].row = row;

    expect(validateFeatureDetail(detail)).toContain(`swimlanes[0].steps[1].row: ${reason}여야 합니다.`);
  });

  it('waypoint와 label point의 비유한·범위 밖 좌표를 차단한다', () => {
    const detail = createDetailWithSwimlane();
    detail.swimlanes![0].edges[0].waypoints = [
      { column: Number.NaN, row: 0.5 },
      { column: -0.6, row: 1 },
      { column: 1.6, row: 3 }
    ];
    detail.swimlanes![0].edges[0].labelAt = { column: Number.POSITIVE_INFINITY, row: -0.1 };

    const errors = validateFeatureDetail(detail);

    expect(errors).toContain('swimlanes[0].edges[0].waypoints[0].column: 유한한 좌표여야 합니다.');
    expect(errors).toContain('swimlanes[0].edges[0].waypoints[1].column: -0.5 이상 1.5 이하여야 합니다.');
    expect(errors).toContain('swimlanes[0].edges[0].waypoints[2].column: -0.5 이상 1.5 이하여야 합니다.');
    expect(errors).toContain('swimlanes[0].edges[0].waypoints[2].row: 0 이상 2 이하여야 합니다.');
    expect(errors).toContain('swimlanes[0].edges[0].labelAt.column: 유한한 좌표여야 합니다.');
    expect(errors).toContain('swimlanes[0].edges[0].labelAt.row: 0 이상 2 이하여야 합니다.');
  });

  it('waypoint가 연결 대상이 아닌 step 내부를 통과하면 차단한다', () => {
    const detail = createDetailWithSwimlane();
    detail.swimlanes![0].edges[0].waypoints = [{ column: 1, row: 2 }];

    expect(validateFeatureDetail(detail)).toContain(
      'swimlanes[0].edges[0].waypoints[0]: step "finish" 내부를 통과할 수 없습니다.'
    );
  });

  it('start 단일성과 end 존재, start에서 end까지의 정상 경로를 요구한다', () => {
    const detail = createDetailWithSwimlane();
    const swimlane = detail.swimlanes![0];
    swimlane.steps[0].shape = 'process';
    swimlane.steps[2].shape = 'process';

    const missingTerminals = validateFeatureDetail(detail);

    expect(missingTerminals).toContain('swimlanes[0].steps: start node가 정확히 하나 필요합니다.');
    expect(missingTerminals).toContain('swimlanes[0].steps: end node가 하나 이상 필요합니다.');

    const disconnectedDetail = createDetailWithSwimlane();
    disconnectedDetail.swimlanes![0].edges = [disconnectedDetail.swimlanes![0].edges[0]];

    expect(validateFeatureDetail(disconnectedDetail)).toContain(
      'swimlanes[0].edges: start에서 end까지 이어지는 정상 경로가 필요합니다.'
    );
  });

  it('모든 non-stop step의 start 도달성과 end 도달성을 요구한다', () => {
    const detail = createDetailWithSwimlane();
    const swimlane = detail.swimlanes![0];
    swimlane.steps.splice(1, 0, {
      id: 'isolated',
      laneId: 'requester',
      row: 1,
      shape: 'process',
      label: '고립 단계',
      description: '정상 경로에 참여하지 않는다.'
    });

    const errors = validateFeatureDetail(detail);

    expect(errors).toContain('swimlanes[0].steps[1]: start에서 정상·복구 흐름으로 도달할 수 없습니다.');
    expect(errors).toContain('swimlanes[0].steps[1]: 정상·복구 흐름으로 end에 도달할 수 없습니다.');
  });

  it('정상 edge의 row 증가와 kind/outcome 조합을 검증한다', () => {
    const detail = createDetailWithSwimlane();
    const swimlane = detail.swimlanes![0];
    swimlane.edges[0] = { ...swimlane.edges[0], from: 'work', to: 'start', outcome: 'recover' };
    swimlane.edges[1] = { ...swimlane.edges[1], kind: 'exception', outcome: 'continue', label: '잘못된 예외' };

    const errors = validateFeatureDetail(detail);

    expect(errors).toContain('swimlanes[0].edges[0]: normal edge는 더 큰 row의 step으로 진행해야 합니다.');
    expect(errors).toContain('swimlanes[0].edges[0].outcome: normal edge는 continue여야 합니다.');
    expect(errors).toContain('swimlanes[0].edges[1].outcome: exception edge는 recover 또는 stop이어야 합니다.');
  });

  it('stop outcome과 stop target 규칙을 검증한다', () => {
    const detail = createDetailWithSwimlane();
    const swimlane = detail.swimlanes![0];
    swimlane.steps.push({
      id: 'stopped',
      laneId: 'requester',
      row: 2,
      shape: 'stop',
      label: '중단',
      description: '작업을 중단한다.'
    });
    swimlane.edges.push({
      id: 'invalid-stop',
      from: 'work',
      to: 'finish',
      kind: 'exception',
      outcome: 'stop',
      fromAnchor: 'left',
      toAnchor: 'left',
      label: '중단'
    });
    swimlane.edges.push({
      id: 'normal-stop',
      from: 'work',
      to: 'stopped',
      kind: 'normal',
      outcome: 'continue',
      fromAnchor: 'bottom',
      toAnchor: 'top'
    });
    swimlane.exceptions = [
      {
        id: 'stop-error',
        trigger: '중단 조건',
        response: '작업을 중단한다.',
        edgeIds: ['invalid-stop', 'normal-stop']
      }
    ];

    const errors = validateFeatureDetail(detail);

    expect(errors).toContain('swimlanes[0].edges[2].to: stop outcome은 stop node를 대상으로 해야 합니다.');
    expect(errors).toContain('swimlanes[0].edges[3].to: normal edge는 stop node를 대상으로 할 수 없습니다.');
  });

  it('summary·exception 설명·edge 참조와 모든 exception edge의 narrative coverage를 요구한다', () => {
    const detail = createDetailWithSwimlane();
    const swimlane = detail.swimlanes![0];
    swimlane.summary = ' ';
    swimlane.edges.push({
      id: 'retry',
      from: 'work',
      to: 'start',
      kind: 'exception',
      outcome: 'recover',
      fromAnchor: 'left',
      toAnchor: 'left',
      label: ' '
    });
    swimlane.exceptions = [
      {
        id: 'retry-copy',
        trigger: ' ',
        response: ' ',
        edgeIds: []
      },
      {
        id: 'normal-reference',
        trigger: '정상선을 잘못 참조함',
        response: '올바른 예외선을 참조해야 한다.',
        edgeIds: ['start-work', 'missing-edge']
      }
    ];

    const errors = validateFeatureDetail(detail);

    expect(errors).toContain('swimlanes[0].summary: 필수 값이 비어 있습니다.');
    expect(errors).toContain('swimlanes[0].edges[2].label: exception edge에는 조건 label이 필요합니다.');
    expect(errors).toContain('swimlanes[0].exceptions[0].trigger: 필수 값이 비어 있습니다.');
    expect(errors).toContain('swimlanes[0].exceptions[0].response: 필수 값이 비어 있습니다.');
    expect(errors).toContain('swimlanes[0].exceptions[0].edgeIds: 하나 이상의 exception edge 참조가 필요합니다.');
    expect(errors).toContain('swimlanes[0].exceptions[1].edgeIds[0]: exception edge를 참조해야 합니다.');
    expect(errors).toContain('swimlanes[0].exceptions[1].edgeIds[1]: 존재하지 않는 edge "missing-edge"를 참조합니다.');
    expect(errors).toContain('swimlanes[0].edges[2]: exception 설명에 포함되어야 합니다.');
  });
});

describe('구조화 작업물 상세 계약', () => {
  it('필수 설명이 비어 있으면 공개 가능한 상세로 취급하지 않는다', () => {
    const detail = createValidDetail();
    detail.role = '   ';

    expect(validateFeatureDetail(detail)).toContain('role: 필수 설명이 비어 있습니다.');
  });

  it('추정 지표에는 제한사항이 반드시 존재한다', () => {
    const detail = createValidDetail();
    detail.highlights[0] = {
      ...detail.highlights[0],
      kind: 'estimated'
    };

    expect(validateFeatureDetail(detail)).toContain('highlights[0].caveat: 추정값에는 제한사항이 필요합니다.');
  });

  it('데모는 검증 가능한 HTTPS 주소만 허용한다', () => {
    const detail = createValidDetail();
    detail.demo = {
      url: 'http://internal.example.test',
      label: '내부 데모',
      kind: 'portfolio',
      status: 'available'
    };

    expect(validateFeatureDetail(detail)).toContain('demo.url: 공개 가능한 HTTPS 주소가 필요합니다.');
  });

  it('스윔레인의 중복 ID와 잘못된 참조를 함께 보고한다', () => {
    const detail = createDetailWithSwimlane();
    const swimlane = detail.swimlanes![0];
    swimlane.summary = ' ';
    swimlane.lanes.push({ id: 'worker', label: '저장소' });
    swimlane.steps[1].laneId = 'missing-lane';
    swimlane.edges[0].to = 'missing-step';
    swimlane.edges[0].kind = 'exception';
    swimlane.edges[0].outcome = 'continue';
    swimlane.edges[0].label = '잘못된 연결';

    const errors = validateFeatureDetail(detail);

    expect(errors).toContain('swimlanes[0].summary: 필수 값이 비어 있습니다.');
    expect(errors).toContain('swimlanes[0].lanes: 중복 ID "worker"가 있습니다.');
    expect(errors).toContain('swimlanes[0].steps[1].laneId: 존재하지 않는 lane "missing-lane"을 참조합니다.');
    expect(errors).toContain('swimlanes[0].edges[0].to: 존재하지 않는 step "missing-step"을 참조합니다.');
    expect(errors).toContain('swimlanes[0].edges[0].outcome: exception edge는 recover 또는 stop이어야 합니다.');
  });

  it('등록되지 않은 slug에는 다른 작업물의 상세를 대신 반환하지 않는다', () => {
    expect(getFeatureDetailBySlug('not-registered')).toBeNull();
  });

  it('하네스 상세은 근거가 구분된 6개 결과만 공개하고 데모를 제공하지 않는다', () => {
    const detail = getFeatureDetailBySlug('codi-harness-dx-platform');

    expect(detail).not.toBeNull();
    expect(detail?.highlights).toEqual([
      {
        id: 'adopted-projects',
        label: '적용 프로젝트',
        value: '11개',
        kind: 'reported',
        asOf: '2026-08-20',
        evidence: '하네스 적용 저장소 현황과 사용자 인터뷰에서 확인한 누적 범위'
      },
      {
        id: 'production-projects',
        label: '실제 운영 프로젝트',
        value: '8개',
        kind: 'reported',
        asOf: '2026-08-20',
        evidence: '적용 프로젝트 중 운영 환경에서 사용 중인 프로젝트 현황'
      },
      {
        id: 'team-users',
        label: '팀 사용자',
        value: '3명',
        kind: 'reported',
        asOf: '2026-08-20',
        evidence: '실제 하네스를 사용하고 피드백을 제공한 팀원 수'
      },
      {
        id: 'jenkins-compute-estimate',
        label: 'Jenkins 컴퓨팅 비용 추정',
        value: '$151.84/월',
        kind: 'estimated',
        asOf: '2026-08-20',
        evidence: 'AWS 서울 리전 Linux On-Demand t3.large 2대 × 월 730시간 공개 가격 기준',
        caveat:
          '현재 공개 가격으로 다시 산정한 컴퓨팅 비용이며 과거 실제 청구액이 아닙니다. 스토리지, 네트워크, 세금 등 컴퓨팅 외 비용은 포함하지 않습니다.'
      },
      {
        id: 'hotel-deployment-time',
        label: '5개 호텔 배포 시간',
        value: '약 15분 → 약 3분',
        kind: 'measured',
        asOf: '2026-08-20',
        evidence: '기존 순차 배포와 변경 범위 기반 병렬 matrix의 실행 화면 시간 비교'
      },
      {
        id: 'environment-mix-recurrence',
        label: '동일 유형 환경 혼입 재발',
        value: '전환 후 미발생',
        kind: 'reported',
        asOf: '2026-08-20',
        evidence: 'Infisical 환경과 workflow 조회 경계를 분리한 뒤 운영 관찰 결과',
        caveat: '원인 전체를 Jenkins로 단정하거나 향후 발생 가능성이 0이라고 주장하지 않습니다.'
      }
    ]);
    expect(detail?.demo).toBeUndefined();
  });

  it('하네스의 현재 핵심 도구는 승인된 6개로 한정한다', () => {
    const feature = getFeatureBySlug('codi-harness-dx-platform');

    expect(feature?.techStack).toEqual([
      'Spec Kit',
      'Superpowers',
      'Playwright MCP',
      'Codi skills',
      'GitHub Actions',
      'Infisical'
    ]);
  });

  it('하네스는 참조가 유효한 두 스윔레인과 실패 이후 결과를 제공한다', () => {
    const detail = getFeatureDetailBySlug('codi-harness-dx-platform');
    const swimlanes = detail?.swimlanes ?? [];

    expect(swimlanes.map(({ title }) => title)).toEqual(['설계·개발·검증', 'CI/CD·시크릿·배포']);
    expect(new Set(swimlanes.map(({ id }) => id)).size).toBe(2);
    expect(validateFeatureDetail(detail!)).toEqual([]);
    expect(new Set(swimlanes.flatMap(({ edges }) => edges.map(({ kind }) => kind)))).toEqual(
      new Set(['normal', 'exception'])
    );

    swimlanes.forEach((swimlane) => {
      expect(swimlane.summary.trim().length).toBeGreaterThan(20);
      expect(swimlane.edges.some(({ kind }) => kind === 'normal')).toBe(true);
      const exceptionEdges = swimlane.edges.filter(({ kind }) => kind === 'exception');
      expect(exceptionEdges.length).toBeGreaterThan(0);
      expect(exceptionEdges.every(({ outcome }) => ['recover', 'stop'].includes(outcome))).toBe(true);
    });
  });

  it('설계·개발·검증 흐름은 승인된 여섯 핵심 단계와 세 예외 복귀를 제공한다', () => {
    const flow = getFeatureDetailBySlug('codi-harness-dx-platform')?.swimlanes?.find(
      ({ id }) => id === 'design-development-verification'
    );

    expect(flow).toBeDefined();
    expect(flow?.title).toBe('설계·개발·검증');
    expect(flow?.lanes).toEqual([
      { id: 'user', label: '사용자' },
      { id: 'agent', label: 'AI 에이전트' },
      { id: 'delivery', label: '계획·구현' },
      { id: 'verification', label: '리뷰·검증' }
    ]);
    expect(flow?.steps.slice(0, 6).map(({ id, laneId, row, shape, label }) => [id, laneId, row, shape, label])).toEqual(
      [
        ['request', 'user', 0, 'start', '요청·맥락 전달'],
        ['define', 'agent', 1, 'process', '문제 정의'],
        ['plan', 'delivery', 2, 'process', '명세·계획'],
        ['approve', 'user', 3, 'decision', '승인'],
        ['implement', 'delivery', 4, 'process', '테스트·구현'],
        ['verify', 'verification', 5, 'decision', '리뷰·검증']
      ]
    );
    expect(flow?.steps.slice(6).map(({ id, laneId, row, shape, label }) => [id, laneId, row, shape, label])).toEqual([
      ['complete', 'verification', 6, 'end', '완료']
    ]);
    expect(flow?.edges.filter(({ kind }) => kind === 'normal')).toEqual([
      {
        id: 'request-define',
        from: 'request',
        to: 'define',
        kind: 'normal',
        outcome: 'continue',
        fromAnchor: 'bottom',
        toAnchor: 'top',
        waypoints: [
          { column: 0, row: 0.5 },
          { column: 1, row: 0.5 }
        ]
      },
      {
        id: 'define-plan',
        from: 'define',
        to: 'plan',
        kind: 'normal',
        outcome: 'continue',
        fromAnchor: 'bottom',
        toAnchor: 'top',
        waypoints: [
          { column: 1, row: 1.5 },
          { column: 2, row: 1.5 }
        ]
      },
      {
        id: 'plan-approve',
        from: 'plan',
        to: 'approve',
        kind: 'normal',
        outcome: 'continue',
        fromAnchor: 'bottom',
        toAnchor: 'top',
        waypoints: [
          { column: 2, row: 2.5 },
          { column: 0, row: 2.5 }
        ]
      },
      {
        id: 'approve-implement',
        from: 'approve',
        to: 'implement',
        kind: 'normal',
        outcome: 'continue',
        fromAnchor: 'bottom',
        toAnchor: 'top',
        label: '승인',
        waypoints: [
          { column: 0, row: 3.5 },
          { column: 2, row: 3.5 }
        ]
      },
      {
        id: 'implement-verify',
        from: 'implement',
        to: 'verify',
        kind: 'normal',
        outcome: 'continue',
        fromAnchor: 'bottom',
        toAnchor: 'top',
        waypoints: [
          { column: 2, row: 4.5 },
          { column: 3, row: 4.5 }
        ]
      },
      {
        id: 'verify-complete',
        from: 'verify',
        to: 'complete',
        kind: 'normal',
        outcome: 'continue',
        fromAnchor: 'bottom',
        toAnchor: 'top',
        label: '통과'
      }
    ]);
    expect(flow?.edges.filter(({ kind }) => kind === 'exception')).toEqual([
      {
        id: 'ambiguity-return',
        from: 'define',
        to: 'request',
        kind: 'exception',
        outcome: 'recover',
        fromAnchor: 'left',
        toAnchor: 'left',
        label: '요구 보강',
        waypoints: [
          { column: -0.4, row: 1 },
          { column: -0.4, row: 0 }
        ]
      },
      {
        id: 'approval-return',
        from: 'approve',
        to: 'plan',
        kind: 'exception',
        outcome: 'recover',
        fromAnchor: 'left',
        toAnchor: 'left',
        label: '미승인',
        waypoints: [
          { column: -0.4, row: 3 },
          { column: -0.4, row: 2 }
        ]
      },
      {
        id: 'verification-return',
        from: 'verify',
        to: 'implement',
        kind: 'exception',
        outcome: 'recover',
        fromAnchor: 'left',
        toAnchor: 'right',
        label: '실패',
        waypoints: [
          { column: 2.7, row: 5 },
          { column: 2.7, row: 4 }
        ]
      }
    ]);
    expect(flow?.exceptions).toEqual([
      {
        id: 'ambiguous-requirement',
        trigger: '요구가 모호함',
        response: '사용자에게 추가 질문한 뒤 문제 정의를 다시 진행합니다.',
        edgeIds: ['ambiguity-return']
      },
      {
        id: 'unapproved-plan',
        trigger: '계획이 승인되지 않음',
        response: '명세와 계획을 보강한 뒤 다시 승인을 요청합니다.',
        edgeIds: ['approval-return']
      },
      {
        id: 'failed-verification',
        trigger: '검증 실패',
        response: '테스트·구현 단계로 돌아가 수정한 뒤 다시 검증합니다.',
        edgeIds: ['verification-return']
      }
    ]);
    expect(flow?.summary).toBe(
      '요청·맥락 전달에서 시작해 문제 정의, 명세·계획, 승인, 테스트·구현, 리뷰·검증 순서로 진행하며 검증을 통과하면 완료합니다.'
    );
  });

  it('CI/CD·시크릿·배포 흐름은 승인된 여섯 핵심 단계와 중단·재실행 경로를 제공한다', () => {
    const flow = getFeatureDetailBySlug('codi-harness-dx-platform')?.swimlanes?.find(
      ({ id }) => id === 'cicd-secrets-deployment'
    );

    expect(flow).toBeDefined();
    expect(flow?.title).toBe('CI/CD·시크릿·배포');
    expect(flow?.lanes).toEqual([
      { id: 'repository', label: 'GitHub 저장소' },
      { id: 'actions', label: 'GitHub Actions' },
      { id: 'infisical', label: 'Infisical' },
      { id: 'deployment', label: '배포 대상' }
    ]);
    expect(
      flow?.steps
        .filter(({ shape }) => shape !== 'stop')
        .map(({ id, laneId, row, shape, label }) => [id, laneId, row, shape, label])
    ).toEqual([
      ['detect', 'repository', 0, 'start', '변경 감지'],
      ['quality', 'actions', 1, 'decision', '품질 검사'],
      ['target', 'actions', 2, 'process', '환경·대상 결정'],
      ['secrets', 'infisical', 3, 'decision', '시크릿 조회'],
      ['deploy', 'deployment', 4, 'process', '병렬 배포'],
      ['confirm', 'deployment', 5, 'end', '결과 확인']
    ]);
    expect(
      flow?.steps
        .filter(({ shape }) => shape === 'stop')
        .map(({ id, laneId, row, shape, label }) => [id, laneId, row, shape, label])
    ).toEqual([['stopped', 'repository', 3, 'stop', '배포 중단']]);
    expect(flow?.edges.filter(({ kind }) => kind === 'normal')).toEqual([
      {
        id: 'detect-quality',
        from: 'detect',
        to: 'quality',
        kind: 'normal',
        outcome: 'continue',
        fromAnchor: 'bottom',
        toAnchor: 'top'
      },
      {
        id: 'quality-target',
        from: 'quality',
        to: 'target',
        kind: 'normal',
        outcome: 'continue',
        fromAnchor: 'bottom',
        toAnchor: 'top',
        label: '통과'
      },
      {
        id: 'target-secrets',
        from: 'target',
        to: 'secrets',
        kind: 'normal',
        outcome: 'continue',
        fromAnchor: 'bottom',
        toAnchor: 'top'
      },
      {
        id: 'secrets-deploy',
        from: 'secrets',
        to: 'deploy',
        kind: 'normal',
        outcome: 'continue',
        fromAnchor: 'bottom',
        toAnchor: 'top',
        label: '일치'
      },
      {
        id: 'deploy-confirm',
        from: 'deploy',
        to: 'confirm',
        kind: 'normal',
        outcome: 'continue',
        fromAnchor: 'bottom',
        toAnchor: 'top'
      }
    ]);
    expect(flow?.edges.filter(({ kind }) => kind === 'exception')).toEqual([
      {
        id: 'quality-stop',
        from: 'quality',
        to: 'stopped',
        kind: 'exception',
        outcome: 'stop',
        fromAnchor: 'left',
        toAnchor: 'right',
        label: '실패'
      },
      {
        id: 'secrets-stop',
        from: 'secrets',
        to: 'stopped',
        kind: 'exception',
        outcome: 'stop',
        fromAnchor: 'left',
        toAnchor: 'bottom',
        label: '불일치'
      },
      {
        id: 'stopped-retry',
        from: 'stopped',
        to: 'detect',
        kind: 'exception',
        outcome: 'recover',
        fromAnchor: 'left',
        toAnchor: 'left',
        label: '원인 수정 후 처음부터 재실행',
        waypoints: [
          { column: -0.4, row: 3 },
          { column: -0.4, row: 0 }
        ]
      }
    ]);
    expect(flow?.exceptions).toEqual([
      {
        id: 'failed-quality-check',
        trigger: '품질 검사 실패',
        response: '시크릿 조회와 배포를 시작하지 않습니다.',
        edgeIds: ['quality-stop', 'stopped-retry']
      },
      {
        id: 'environment-secret-mismatch',
        trigger: '환경·시크릿 불일치',
        response: '배포를 중단하고 설정을 수정한 뒤 workflow를 처음부터 다시 실행합니다.',
        edgeIds: ['secrets-stop', 'stopped-retry']
      }
    ]);
    expect(flow?.summary).toBe(
      '변경 감지에서 시작해 품질 검사, 환경·대상 결정, 시크릿 조회, 병렬 배포, 결과 확인 순서로 진행합니다.'
    );
  });

  it('정상 흐름과 복구 설명이 빠진 스윔레인을 게시하지 않는다', () => {
    const detail = createDetailWithSwimlane();
    detail.swimlanes![0] = {
      ...createValidSwimlane(),
      edges: [
        {
          id: 'failed-check',
          from: 'work',
          to: 'start',
          kind: 'exception',
          outcome: 'recover',
          fromAnchor: 'left',
          toAnchor: 'left',
          label: ' '
        }
      ],
      exceptions: [
        {
          id: 'failed-check-copy',
          trigger: '검사 실패',
          response: ' ',
          edgeIds: ['failed-check']
        }
      ]
    };

    expect(validateFeatureDetail(detail)).toContain(
      'swimlanes[0].edges: start에서 end까지 이어지는 정상 경로가 필요합니다.'
    );
    expect(validateFeatureDetail(detail)).toContain(
      'swimlanes[0].edges[0].label: exception edge에는 조건 label이 필요합니다.'
    );
    expect(validateFeatureDetail(detail)).toContain('swimlanes[0].exceptions[0].response: 필수 값이 비어 있습니다.');
  });

  it('모든 필수 지표·데모·스윔레인 문자열과 detail 단위 ID를 검증한다', () => {
    const detail = createValidDetail();
    detail.highlights = [
      {
        id: ' ',
        label: '적용 범위',
        value: '11개',
        kind: 'reported',
        asOf: ' ',
        evidence: '인터뷰'
      }
    ];
    detail.demo = {
      url: 'http://internal.example.test',
      label: ' ',
      kind: 'portfolio',
      status: 'unavailable'
    };
    const firstSwimlane = createValidSwimlane();
    firstSwimlane.id = 'duplicate';
    firstSwimlane.title = ' ';
    firstSwimlane.purpose = ' ';
    firstSwimlane.lanes[0].label = ' ';
    firstSwimlane.steps[0].label = ' ';
    firstSwimlane.steps[0].description = ' ';
    const secondSwimlane = createValidSwimlane();
    secondSwimlane.id = 'duplicate';
    detail.swimlanes = [firstSwimlane, secondSwimlane];

    const errors = validateFeatureDetail(detail);

    expect(errors).toContain('highlights[0].id: 필수 값이 비어 있습니다.');
    expect(errors).toContain('highlights[0].asOf: 필수 값이 비어 있습니다.');
    expect(errors).toContain('demo.label: 필수 값이 비어 있습니다.');
    expect(errors).toContain('demo.url: 공개 가능한 HTTPS 주소가 필요합니다.');
    expect(errors).toContain('swimlanes: 중복 ID "duplicate"가 있습니다.');
    expect(errors).toContain('swimlanes[0].title: 필수 값이 비어 있습니다.');
    expect(errors).toContain('swimlanes[0].purpose: 필수 값이 비어 있습니다.');
    expect(errors).toContain('swimlanes[0].lanes[0].label: 필수 값이 비어 있습니다.');
    expect(errors).toContain('swimlanes[0].steps[0].label: 필수 값이 비어 있습니다.');
    expect(errors).toContain('swimlanes[0].steps[0].description: 필수 값이 비어 있습니다.');
  });

  it('지표가 하나도 없으면 구조화 상세을 게시하지 않는다', () => {
    const detail = createValidDetail();
    detail.highlights = [];

    expect(validateFeatureDetail(detail)).toContain('highlights: 하나 이상의 공개 지표가 필요합니다.');
  });

  it('공개 정본은 중복 Feature 본문과 대표 insight 대체 장문을 허용하지 않는다', () => {
    const feature = getFeatureBySlug('codi-harness-dx-platform');
    const detail = getFeatureDetailBySlug('codi-harness-dx-platform');
    const canonicalInsight = REAL_INSIGHTS.find(({ slug }) => slug === 'codi-harness-dx-platform-design');

    expect(detail).not.toBeNull();
    expect(feature?.content).toBeUndefined();
    expect(canonicalInsight).toBeDefined();
    expect(canonicalInsight).not.toHaveProperty('legacyContent');
  });

  it('하네스 관련 insight는 대표 정본 하나와 유지 인프라 세 개만 남긴다', () => {
    const harnessInsightSlugs = REAL_INSIGHTS.filter(({ featureSlug }) => featureSlug === 'codi-harness-dx-platform')
      .map(({ slug }) => slug)
      .sort();

    expect(harnessInsightSlugs).toEqual(
      [CANONICAL_HARNESS_INSIGHT_SLUG, ...PRESERVED_HARNESS_INFRA_INSIGHT_SLUGS].sort()
    );
    expect(REAL_INSIGHTS.find(({ slug }) => slug === CANONICAL_HARNESS_INSIGHT_SLUG)).toMatchObject({
      title: 'DX 하네스 v2: 복사형 도구에서 사내 개발 운영 플랫폼까지',
      readTime: '9 min'
    });
    for (const slug of PRESERVED_HARNESS_INFRA_INSIGHT_SLUGS) {
      expect(
        REAL_INSIGHTS.some((insight) => insight.slug === slug),
        slug
      ).toBe(true);
    }
    for (const slug of REMOVED_HARNESS_INSIGHT_SLUGS) {
      expect(
        REAL_INSIGHTS.some((insight) => insight.slug === slug),
        slug
      ).toBe(false);
      expect(getInsightBySlug(slug), slug).toBeNull();
    }
  });

  it('유지 인프라 insight 세 개의 경로·제목과 현재 근거 경계를 보존한다', () => {
    for (const fixture of PRESERVED_HARNESS_INFRA_INSIGHTS) {
      const insight = REAL_INSIGHTS.find(({ slug }) => slug === fixture.slug);
      const normalizedContent = insight?.content?.replace(/\s+/g, ' ') ?? '';

      expect(insight?.title, fixture.slug).toBe(fixture.title);
      expect(normalizedContent, fixture.slug).toContain(fixture.bodySnippet);
    }
  });

  it('구조화 상세만 본문 정본으로 두고 description과 overview의 역할을 분리한다', () => {
    const feature = getFeatureBySlug('codi-harness-dx-platform');

    expect(feature?.content).toBeUndefined();
    expect(feature?.description).toBe(
      '팀원과 AI 에이전트가 프로젝트마다 다르게 수행하던 설계·검증·배포 절차를 공통 정책, CLI와 CI/CD로 집행하는 사내 개발 운영 플랫폼입니다.'
    );
    expect(feature?.overview).toContain('Jenkins 비용과 운영 부담을 줄이는 것에서 시작했지만');
    expect(feature?.overview).toContain('프로젝트가 시작되고 계획되고 검증되고 배포되는 기준');
    expect(feature?.overview).not.toContain('현재 11개 프로젝트');
    expect(feature?.description).not.toBe(feature?.overview);
  });

  it('세 책임과 세 문제 범주를 작업물 상세에서 설명한다', () => {
    const detail = getFeatureDetailBySlug('codi-harness-dx-platform');

    expect(detail?.role).toContain('하네스 아키텍처와 파일 소유권 정책');
    expect(detail?.role).toContain('프로젝트 초기화·진단과 AI 작업 규칙 자동화');
    expect(detail?.role).toContain('CI/CD·시크릿 구조와 실제 프로젝트 적용·운영 검증');
    expect(detail?.problem).toContain('저장소 구조, CI/CD workflow, 브랜치·환경 매핑과 시크릿 경로');
    expect(detail?.problem).toContain('spec 문서화, TDD, 담당 코드 영역, 스킬 선택과 위험 명령 기준');
    expect(detail?.problem).toContain('다른 호텔의 환경변수가 섞이는 문제');
  });

  it('대표 설계 네 개를 승인된 순서와 단일 대표 링크로 제공한다', () => {
    const implementation = getFeatureDetailBySlug('codi-harness-dx-platform')?.implementation ?? '';
    const designHeadings = [...implementation.matchAll(/^### (.+)$/gm)].map(([, heading]) =>
      heading.replaceAll('`', '')
    );
    const canonicalLinks = implementation.match(/\]\(\/insights\/codi-harness-dx-platform-design\)/g) ?? [];
    const removedSlugs = [
      'harness-lock-and-project-ownership-boundary',
      'harness-cli-and-doctor-productization',
      'claude-codex-policy-parity-and-regression-testing',
      'multi-session-testbed-and-context-lifecycle'
    ];

    expect(designHeadings).toEqual([
      './harness와 doctor',
      'harness.lock과 소유권 경계',
      '공통 정책과 런타임 어댑터',
      '변경 범위 기반 배포와 Infisical 경계',
      '더 깊이 읽기'
    ]);
    expect(canonicalLinks).toHaveLength(1);
    removedSlugs.forEach((slug) => expect(implementation, slug).not.toContain(`/insights/${slug}`));
  });

  it('대표 설계는 두 도구 전환 이유와 검증 근거 또는 trade-off를 연결한다', () => {
    const implementation = getFeatureDetailBySlug('codi-harness-dx-platform')?.implementation ?? '';

    expect(implementation).toContain('GSD → Spec Kit');
    expect(implementation).toContain('문서 양식 통제와 사용자 의견 반영');
    expect(implementation).toContain('GStack → Playwright MCP');
    expect(implementation).toContain('약 5주간 사용량');
    expect(implementation).toContain('browse 외 활용이 크지 않아');
    expect(implementation).toContain('업데이트 구현은 복잡해졌지만');
    expect(implementation).toContain('향후 발생 가능성이 0이라는 주장이 아니라 현재 운영 관찰 범위');
  });

  it('lock 대조를 파일 존재가 아니라 upstream 내용 비교로 설명한다', () => {
    const implementation = getFeatureDetailBySlug('codi-harness-dx-platform')?.implementation ?? '';

    expect(implementation).toContain('upstream');
    expect(implementation).toContain('내용을 직접 비교');
    expect(implementation).toContain('추적하지 않는 파일');
    expect(implementation).toContain('삭제');
    expect(implementation).toContain('manifest');
  });

  it('doctor를 존재 검사가 아니라 침묵 실패 진단으로 설명한다', () => {
    const implementation = getFeatureDetailBySlug('codi-harness-dx-platform')?.implementation ?? '';

    expect(implementation).toContain('mise.toml');
    expect(implementation).toContain('조용히');
    expect(implementation).toContain('파싱');
    expect(implementation).toContain('진단과 수정을 분리');
  });

  it('배포 시간 개선을 순차 대기열 원인과 병렬 결과로 설명한다', () => {
    const implementation = getFeatureDetailBySlug('codi-harness-dx-platform')?.implementation ?? '';

    expect(implementation).toContain('slave');
    expect(implementation).toContain('약 3분씩');
    expect(implementation).toContain('가장 오래 걸리는');
    expect(implementation).toContain('독립적으로');
  });

  it('환경 혼입은 원인 미확정과 운영 방식 변경을 함께 밝힌다', () => {
    const detail = getFeatureDetailBySlug('codi-harness-dx-platform');
    const text = `${detail?.problem ?? ''}\n${detail?.implementation ?? ''}\n${detail?.outcomes ?? ''}`;

    expect(text).toContain('재현');
    expect(text).toContain('원인을 확정하지');
    expect(text).toContain('하나씩 순차');
  });

  it('대안 기각 이유에 운영 인원 공백과 확인 절차 비용을 포함한다', () => {
    const alternatives = getFeatureDetailBySlug('codi-harness-dx-platform')?.alternatives ?? '';

    expect(alternatives).toContain('설계자');
    expect(alternatives).toContain('관리할 담당자');
    expect(alternatives).toContain('확인하기까지');
  });

  it('v1 실사용 기간과 용량·전파 비용을 함께 남긴다', () => {
    const implementation = getFeatureDetailBySlug('codi-harness-dx-platform')?.implementation ?? '';

    expect(implementation).toContain('약 2개월');
    expect(implementation).toContain('용량');
    expect(implementation).toContain('패키징');
  });

  it('작업물 본문은 transcript replay 표현을 사용하지 않는다', () => {
    const implementation = getFeatureDetailBySlug('codi-harness-dx-platform')?.implementation ?? '';

    expect(implementation).not.toContain('transcript replay');
    expect(implementation).not.toContain('transcript');
  });

  it('변경 감지 플래그와 배포 방식 다중화를 본문에 남긴다', () => {
    const implementation = getFeatureDetailBySlug('codi-harness-dx-platform')?.implementation ?? '';

    expect(implementation).toContain('backend_changed');
    expect(implementation).toContain('frontend_changed');
    expect(implementation).toContain('dependency_changed');
    expect(implementation).toContain('PM2');
    expect(implementation).toContain('Docker');
    expect(implementation).toContain('Vercel');
    expect(implementation).toContain('reusable workflow');
  });

  it('실사용 피드백이 설계를 바꾼 사례를 본문에 남긴다', () => {
    const implementation = getFeatureDetailBySlug('codi-harness-dx-platform')?.implementation ?? '';

    expect(implementation).toContain('apps/back');
    expect(implementation).toContain('skills-local');
    expect(implementation).toContain('피드백');
  });

  it('Infisical 경로 5분류는 작업물 본문이 아니라 시크릿 인사이트가 담당한다', () => {
    const implementation = getFeatureDetailBySlug('codi-harness-dx-platform')?.implementation ?? '';
    const secretsInsight = getAllInsights().find(
      ({ slug }) => slug === 'infisical-centralized-secrets-and-spof-defense'
    );
    const paths = ['/backend/github-actions', '/frontend/github-actions', '/slack', '/vercel'];

    paths.forEach((path) => expect(secretsInsight?.content, path).toContain(path));
    expect(secretsInsight?.content).toContain('Shared-Secrets');
    expect(implementation).not.toContain('/backend/github-actions');
  });

  it('결과와 회고를 네 대표 결정 및 후속 실험 경계에 연결한다', () => {
    const detail = getFeatureDetailBySlug('codi-harness-dx-platform');

    expect(detail?.outcomes).toContain('변경 범위를 계산한 병렬 matrix');
    expect(detail?.outcomes).toContain('Infisical의 환경·목적별 조회 경계');
    expect(detail?.outcomes).toContain('CLI·doctor와 공통 정책');
    expect(detail?.outcomes).toContain('월 $151.84 컴퓨팅 추정치');
    // 회고는 본문 문장을 되풀이하지 않고, 본문이 다루지 않은 교훈과 한계를 남긴다.
    expect(detail?.retrospective).toContain('존재가 아니라 작동을');
    expect(detail?.retrospective).toContain('자동화 범위를 일부러 좁혔');
    expect(detail?.retrospective).toContain('원인을 끝내 규명하지 못한');
    expect(detail?.retrospective).toContain('운영 중인 핵심 기능과 구분한 확장 실험');
  });

  it('하네스 관련 공개 인사이트는 Jenkins 비용과 현재 도구 시점을 충돌시키지 않는다', () => {
    const harnessInsights = getAllInsights().filter(({ featureSlug }) => featureSlug === 'codi-harness-dx-platform');
    const publicClaims = harnessInsights.map(({ excerpt, content }) => `${excerpt}\n${content}`).join('\n');

    expect(publicClaims).not.toMatch(/(?:월|매월)\s*(?:20|40)만 원/);
    expect(publicClaims).toContain('$151.84');
    expect(publicClaims).not.toContain('하네스에는 GSD, GStack');
  });

  it('시에나 이관은 legacy 본문을 제거하고 기존 legacy fixture는 그대로 보존한다', () => {
    const siena = getFeatureBySlug('the-siena-golf-reservation');

    expect(siena?.content).toBeUndefined();
    expect(getFeatureDetailBySlug('the-siena-golf-reservation')).not.toBeNull();

    for (const fixture of LEGACY_FEATURE_CONTENT_FIXTURES) {
      const feature = getFeatureBySlug(fixture.slug);

      expect(feature?.content, fixture.slug).toContain(fixture.bodySnippet);
      expect(feature?.content?.trim().length, fixture.slug).toBe(fixture.contentLength);
      expect(getFeatureDetailBySlug(fixture.slug), fixture.slug).toBeNull();
    }
  });

  describe('시에나 골프 예약 구조화 상세 계약', () => {
    const slug = 'the-siena-golf-reservation';
    const swimlaneId = 'reservation-request-and-exception-flow';
    const archifyUrl = '/diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.html';
    const detail = () => getFeatureDetailBySlug(slug);

    it('정확한 feature·swimlane·Archify URL tuple을 typed target validator가 승인한다', () => {
      expect(isFeatureSwimlaneArchifyTarget(slug, swimlaneId, archifyUrl)).toBe(true);
    });

    it('승인된 Archify URL은 공개 artifact를 가리킨다', () => {
      const artifactPath = resolve(
        process.cwd(),
        'public/diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.html'
      );

      expect(existsSync(artifactPath)).toBe(true);
    });

    it('fallback·Archify source·생성 artifact의 단계와 관계 계약을 동일하게 고정한다', () => {
      const flow = detail()?.swimlanes?.[0];
      const sourcePath = resolve(
        process.cwd(),
        'diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.json'
      );
      const artifactPath = resolve(
        process.cwd(),
        'public/diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.html'
      );
      const source = JSON.parse(readFileSync(sourcePath, 'utf8')) as {
        nodes: Array<{ id: string }>;
        edges: Array<ArchifySourceEdge & { label?: string }>;
      };
      const artifact = readFileSync(artifactPath, 'utf8');
      const expectedStepIds = [
        'request-reservation',
        'lock-ui',
        'check-duplicate',
        'stop-duplicate',
        'call-pms',
        'process-pms-reservation',
        'guide-retry',
        'guide-congestion',
        'complete-user-feedback'
      ];
      const expectedEdges = [
        ['request-lock-ui', 'request-reservation', 'lock-ui', 'normal', 'continue', null],
        ['lock-ui-check-duplicate', 'lock-ui', 'check-duplicate', 'normal', 'continue', null],
        ['check-duplicate-call-pms', 'check-duplicate', 'call-pms', 'normal', 'continue', '중복 아님'],
        [
          'check-duplicate-stop',
          'check-duplicate',
          'stop-duplicate',
          'exception',
          'stop',
          '같은 세션·같은 요청 2초 이내: PMS 호출 전 차단'
        ],
        ['call-pms-process-reservation', 'call-pms', 'process-pms-reservation', 'normal', 'continue', null],
        [
          'process-reservation-complete-user-feedback',
          'process-pms-reservation',
          'complete-user-feedback',
          'normal',
          'continue',
          '예약 성공 결과'
        ],
        [
          'pms-5xx-guide-retry',
          'process-pms-reservation',
          'guide-retry',
          'exception',
          'recover',
          '5xx: 잠시 후 재시도 안내'
        ],
        [
          'pms-timeout-guide-congestion',
          'call-pms',
          'guide-congestion',
          'exception',
          'recover',
          '30초 timeout: 일시적 혼잡 안내'
        ],
        ['retry-guide-complete-user-feedback', 'guide-retry', 'complete-user-feedback', 'normal', 'continue', null],
        [
          'congestion-guide-complete-user-feedback',
          'guide-congestion',
          'complete-user-feedback',
          'normal',
          'continue',
          null
        ]
      ];

      expect(flow?.steps.map(({ id }) => id)).toEqual(expectedStepIds);
      expect(source.nodes.map(({ id }) => id)).toEqual(expectedStepIds);
      expect(
        flow?.edges.map(({ id, from, to, kind, outcome, label }) => [id, from, to, kind, outcome, label ?? null])
      ).toEqual(expectedEdges);
      expect(source.edges.map(({ id, from, to, label }) => [id, from, to, label ?? null])).toEqual(
        expectedEdges.map(([id, from, to, , , label]) => [id, from, to, label])
      );
      expect(flow?.exceptions.map(({ id, edgeIds }) => [id, edgeIds])).toEqual([
        ['duplicate-request', ['check-duplicate-stop']],
        ['pms-5xx', ['pms-5xx-guide-retry']],
        ['pms-timeout', ['pms-timeout-guide-congestion']]
      ]);
      for (const stepId of expectedStepIds) expect(artifact).toContain(`data-node-id="${stepId}"`);
      for (const [edgeId, , , , , label] of expectedEdges) {
        expect(artifact).toContain(`data-edge-id="${edgeId}"`);
        if (label) expect(artifact).toContain(`data-edge-label="${label}"`);
      }
    });

    it('legacy 본문 없이 검증 가능한 structured detail과 승인된 Archify target을 제공한다', () => {
      const feature = getFeatureBySlug(slug);
      const target = detail();

      expect(feature?.period).toBe('2023.05 – 현재');
      expect(feature?.content).toBeUndefined();
      expect(target).not.toBeNull();
      expect(validateFeatureDetail(target as FeatureDetailDto, slug)).toEqual([]);
    });

    it('세 근거 지표와 예약 요청·중복 방어·외부 장애 안내 swimlane을 의미 단위로 제공한다', () => {
      const target = detail();
      const highlights = target?.highlights ?? [];
      const flow = target?.swimlanes?.[0];
      const flowText = [
        flow?.purpose,
        flow?.summary,
        ...(flow?.steps ?? []).flatMap(({ label, description }) => [label, description]),
        ...(flow?.exceptions ?? []).flatMap(({ trigger, response }) => [trigger, response])
      ].join('\n');

      const initialBuildMetric = highlights.find(({ value }) => value === '2023.05 – 2023.06');
      const observedOperationMetric = highlights.find(({ value }) => value === '2023년 오픈 – 현재');
      const trafficMetric = highlights.find(({ value }) => value === '수백만 건');

      expect(highlights).toHaveLength(3);
      expect(initialBuildMetric).toMatchObject({ kind: 'reported', asOf: '2023.06' });
      expect(observedOperationMetric).toMatchObject({ kind: 'reported', asOf: '2026-09' });
      expect(trafficMetric).toMatchObject({ kind: 'measured', asOf: '운영 유지보수 과정' });
      for (const metric of highlights) {
        expect(metric.label.trim()).not.toBe('');
        expect(metric.value.trim()).not.toBe('');
        expect(metric.kind).toMatch(/^(?:reported|measured)$/);
        expect(metric.asOf.trim()).not.toBe('');
        expect(metric.evidence.trim()).not.toBe('');
      }
      expect(trafficMetric?.caveat).toMatch(/정확.*전수.*(?:복원|재구성).*(?:않|못)/);

      expect(target?.swimlanes).toHaveLength(1);
      expect(flow?.id).toBe(swimlaneId);
      expect(flow?.title).toBe('예약 요청·중복 방어·외부 장애 안내 흐름');
      expect(flow?.archify).toEqual({ url: archifyUrl });
      expect(flow?.lanes).toEqual([
        { id: 'user', label: '예약 사용자' },
        { id: 'react', label: 'React' },
        { id: 'php-server', label: 'PHP 서버' },
        { id: 'external-pms', label: '외부 PMS' }
      ]);
      expect(flowText).toMatch(/예약.*요청/);
      expect(flowText).toMatch(/버튼.*비활성.*스피너|스피너.*버튼.*비활성/);
      expect(flowText).toMatch(/같은 세션.*같은 요청.*2초|2초.*같은 세션.*같은 요청/);
      expect(flowText).toMatch(/중복.*PMS.*호출.*차단|PMS.*호출.*전.*중복.*차단/);
      expect(flowText).toMatch(/PMS.*30초|30초.*PMS/);
      expect(flowText).toMatch(/PMS.*결과|예약.*결과/);
      expect(flowText).toMatch(/외부 PMS.*(?:예약 원천|원본).*결과|예약.*(?:원천|원본).*결과.*외부 PMS/);
      expect(flowText).toMatch(/(?:예약 )?요청.*(?:중계|전달).*안내|안내.*(?:중계|전달).*(?:예약 )?요청/);
      expect(flowText).toMatch(/5xx.*재시도/);
      expect(flowText).toMatch(/30초.*혼잡|혼잡.*30초/);
      expect(flow?.edges).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ kind: 'exception', outcome: 'stop' }),
          expect.objectContaining({ kind: 'exception', outcome: 'recover' })
        ])
      );
    });

    it('소유권·관찰 범위·syslog 개선을 구분하고 확정할 수 없는 성과를 공개하지 않는다', () => {
      const target = detail();
      const text = [
        target?.role,
        target?.problem,
        target?.constraints,
        target?.alternatives,
        target?.implementation,
        target?.outcomes,
        target?.retrospective
      ].join('\n');

      expect(text).toContain('첫 프로젝트');
      expect(text).toContain('정해진 구조');
      expect(text).toMatch(/예약 화면.*PHP.*PMS|PHP.*예약 화면.*PMS/);
      expect(text).toMatch(/FE\/BE[^.\n]*단독/);
      expect(text).toMatch(/중복 요청 방어|동일 세션.*2초/);
      expect(text).toContain('통신 로그');
      expect(text).toContain('syslog');
      expect(text).toMatch(/syslog.*(?:결정|방향).*직접 구현|(?:결정|방향).*syslog.*직접 구현/);
      expect(text).toContain('운영 유지보수 과정');
      expect(text).toContain('동일 예약의 중복 호출 이력');
      expect(text).toContain('중복 예약 관련 CS');
      expect(text).toContain('DB GUI가 다운');
      expect(text).toContain('PMS 업체');
      expect(text).toContain('요청과 응답을 직접 확인');
      expect(text).toContain('예약 기능 자체에 미친 영향은 거의 없었습니다');
      expect(text).toContain('2023년 오픈');
      expect(text).toContain('2026-09');
      expect(text).toContain('직접 관찰한 통신 로그');
      expect(text).toContain('지원 범위');
      expect(text).toContain('발견하지 못');
      expect(text).toMatch(/인증.*마스킹|개인정보.*마스킹/);
      expect(text).toContain('보존 기간');
      expect(findUnqualifiedPositiveClaims(text, /전체 아키텍처|아키텍처/, /설계|주도/)).toEqual([]);
      expect(
        findUnqualifiedPositiveClaims(
          text,
          /Redis|작업 큐|메시지 큐|queue|별도 로그 DB/,
          /도입|구축|운영|사용|적용|선택|검토|설계/
        )
      ).toEqual([]);
      expect(text).not.toMatch(
        /중복률\s*0%|영구.*정합|처리 시간.*단축|장애(?:율| 발생률).*감소|전환.*개선|20건|2초마다 flush|파일 I\/O 약 95%|인메모리 버퍼링|ELK|Loki|Datadog|Redis TTL/
      );
    });
  });

  it('구조화 작업물 네 개의 스윔레인 여섯 개가 현재 공개 문자열을 보존한다', () => {
    for (const [slug, expectedSwimlanes] of Object.entries(STRUCTURED_SWIMLANE_CONTENT_FIXTURES)) {
      const swimlanes = getFeatureDetailBySlug(slug)?.swimlanes ?? [];
      const actualSwimlanes = swimlanes.map((swimlane) => ({
        id: swimlane.id,
        title: swimlane.title,
        purpose: swimlane.purpose,
        summary: swimlane.summary,
        lanes: swimlane.lanes.map(({ id, label }) => ({ id, label })),
        steps: swimlane.steps.map(({ id, laneId, row, shape, label, description }) => ({
          id,
          laneId,
          row,
          shape,
          label,
          description
        })),
        edges: swimlane.edges.map(
          ({ id, from, to, kind, outcome, fromAnchor, toAnchor, waypoints, label, labelAt }) => ({
            id,
            from,
            to,
            kind,
            outcome,
            fromAnchor,
            toAnchor,
            waypoints,
            label,
            labelAt
          })
        ),
        exceptions: swimlane.exceptions.map(({ id, trigger, response, edgeIds }) => ({
          id,
          trigger,
          response,
          edgeIds
        }))
      }));

      expect(actualSwimlanes, slug).toStrictEqual(expectedSwimlanes);
    }
  });
});

describe('중앙 회원 관리·인증 서버 구조화 상세 계약', () => {
  const feature = () => getFeatureBySlug('integrated-sso-server');
  const detail = () => getFeatureDetailBySlug('integrated-sso-server');

  it('SSO가 아닌 중앙 회원 관리 범위와 실제 구축 기간을 공개한다', () => {
    const target = feature();
    const text = `${target?.description ?? ''}\n${target?.overview ?? ''}\n${target?.period ?? ''}`;

    expect(target?.title).toBe('중앙 회원 관리·인증 서버 설계 및 구축');
    expect(target?.period).toBe('2024.07 – 2025.06');
    expect(text).toContain('첫 운영 서비스');
    expect(text).not.toMatch(/다수의? (?:사내 )?서비스.*통합|SSO 서버/);
  });

  it('등록된 상세와 인증 흐름 스윔레인 하나가 공통 validator를 통과한다', () => {
    const target = detail();
    const flow = target?.swimlanes?.[0];

    expect(target).not.toBeNull();
    expect(validateFeatureDetail(target as FeatureDetailDto)).toEqual([]);
    expect(target?.swimlanes).toHaveLength(1);
    expect(flow?.id).toBe('central-account-auth-flow');
    expect(flow?.lanes).toHaveLength(4);
    expect(flow?.exceptions.map(({ id }) => id).sort()).toEqual(
      ['login-api-unavailable', 'provider-key-cache-fallback'].sort()
    );
    expect(flow?.edges.some(({ kind, outcome }) => kind === 'exception' && outcome === 'recover')).toBe(true);
    expect(flow?.edges.some(({ kind, outcome }) => kind === 'exception' && outcome === 'stop')).toBe(true);
  });

  it('중앙 토큰 발급·서비스 로컬 검증과 확인하지 못한 장애 경계를 분리한다', () => {
    const target = detail();
    const text = [
      target?.problem,
      target?.constraints,
      target?.alternatives,
      target?.implementation,
      target?.outcomes,
      target?.retrospective
    ].join('\n');

    expect(text).toContain('중앙 회원 서버가 Access Token과 Refresh Token을 발급');
    expect(text).toContain('user_tokens');
    expect(text).toContain('JSON');
    expect(text).toContain('Batch API');
    expect(text).toContain('운영 서비스 하나');
    expect(text).toContain('로그인 API 장애');
    expect(text).toContain('테스트하지 않았');
    expect(text).not.toMatch(/Access Token\s*\(10분\)|Refresh Token\s*\(7일\)|JWT Payload[^.\n]*UUID/);
    expect(text).not.toMatch(/Refresh Token[^.\n]*SSO DB[^.\n]*중앙 관리|다수의? (?:사내 )?서비스[^.\n]*통합/);
  });
});

describe('블랙스톤 구조화 상세 계약', () => {
  const detail = () => getFeatureDetailBySlug('blackstone-belleforet-resort');

  it('등록된 상세가 존재하고 공통 validator를 통과한다', () => {
    const target = detail();

    expect(target).not.toBeNull();
    expect(validateFeatureDetail(target as FeatureDetailDto)).toEqual([]);
  });

  it('결제·보상취소 스윔레인 하나만 제공하고 validator를 통과한다', () => {
    const target = detail();

    expect(target?.swimlanes).toHaveLength(1);
    expect(target?.swimlanes?.[0]?.id).toBe('payment-and-compensation');
    expect(validateFeatureDetail(target as FeatureDetailDto)).toEqual([]);
  });

  it('정상 완료와 확인된 세 장애 분기를 fallback 없이 exact 구조로 제공한다', () => {
    const flow = detail()?.swimlanes?.[0];
    const normalEdges = flow?.edges.filter(({ kind }) => kind === 'normal') ?? [];
    const exceptionEdges = flow?.edges.filter(({ kind }) => kind === 'exception') ?? [];
    const exceptionText = flow?.exceptions.map(({ trigger, response }) => `${trigger} ${response}`).join('\n') ?? '';
    const pmsOutage = flow?.exceptions.find(({ id }) => id === 'pms-outage-observation');

    expect(flow).toMatchObject({ id: 'payment-and-compensation' });
    expect(flow?.lanes).toHaveLength(4);
    expect(flow?.steps).toHaveLength(9);
    expect(flow?.edges).toHaveLength(8);
    expect(flow?.exceptions).toHaveLength(3);
    expect(normalEdges).toHaveLength(5);
    expect(exceptionEdges).toHaveLength(3);
    expect(exceptionEdges.every(({ outcome }) => outcome === 'stop')).toBe(true);
    expect(flow?.steps.filter(({ shape }) => shape === 'start')).toHaveLength(1);
    expect(flow?.steps.filter(({ shape }) => shape === 'end')).toHaveLength(1);
    expect(exceptionText).toContain('응답');
    expect(exceptionText).toContain('PMS 장애');
    expect(exceptionText).toContain('12초 timeout');
    expect(pmsOutage).toEqual({
      id: 'pms-outage-observation',
      trigger: '외부 PMS 장애가 발생했습니다.',
      response: '로그의 최초 발생 시각과 종료 시각을 대조해 장애 구간을 확인했습니다.',
      edgeIds: ['evaluate-outage']
    });
    expect(JSON.stringify(flow)).not.toMatch(/fallback|resvId|tid/);
  });
});

describe('한마음 스윔레인 계약', () => {
  const detail = () => getFeatureDetailBySlug('hanmaum-science-institute');

  it('스윔레인 두 개를 제공하고 validator를 통과한다', () => {
    const target = detail();

    expect(target?.swimlanes).toHaveLength(2);
    expect(validateFeatureDetail(target as FeatureDetailDto)).toEqual([]);
  });

  it('적재 흐름은 검증 실패 경로와 복구 경로를 함께 제공한다', () => {
    const flow = detail()?.swimlanes?.find(({ id }) => id === 'ingestion-and-recovery');
    const exceptionEdges = flow?.edges.filter(({ kind }) => kind === 'exception') ?? [];

    expect(flow).toBeDefined();
    expect(exceptionEdges.some(({ outcome }) => outcome === 'stop')).toBe(true);
    expect(exceptionEdges.some(({ outcome }) => outcome === 'recover')).toBe(true);
    expect(flow?.exceptions.length).toBeGreaterThanOrEqual(2);
  });

  it('검색 흐름은 단계만 제공하고 분기 임계값을 주장하지 않는다', () => {
    const flow = detail()?.swimlanes?.find(({ id }) => id === 'search-request-flow');
    const text = `${flow?.summary ?? ''}\n${flow?.steps.map(({ description }) => description).join('\n') ?? ''}`;

    expect(flow?.exceptions).toEqual([]);
    expect(text).not.toMatch(/\d+\s*글자 이상/);
  });
});

describe('하이패스 구조화 상세 데이터', () => {
  const detail = () => getFeatureDetailBySlug('hipass-b2b-platform');

  it('공통 필드와 네 근거 지표를 완전하게 제공한다', () => {
    const target = detail();

    expect(target).not.toBeNull();
    expect(target?.highlights).toHaveLength(4);
    expect(target?.demo).toBeUndefined();
    expect(validateFeatureDetail(target as FeatureDetailDto)).toEqual([]);
    expect(getFeatureBySlug('hipass-b2b-platform')?.content).toBeUndefined();
  });

  it('결제·보상 취소 스윔레인 하나에 정상·복구·중단 경로를 구분한다', () => {
    const swimlanes = detail()?.swimlanes ?? [];
    const flow = swimlanes[0];

    expect(swimlanes).toHaveLength(1);
    expect(flow?.id).toBe('order-payment-compensation');
    expect(flow?.lanes.map(({ id }) => id)).toEqual(['client', 'order-server', 'payment', 'database']);
    expect(flow?.steps.filter(({ shape }) => shape === 'start')).toHaveLength(1);
    expect(flow?.steps.filter(({ shape }) => shape === 'end')).toHaveLength(2);
    expect(flow?.steps.some(({ shape, label }) => shape === 'stop' && /취소 API 실패|복구 미구현/.test(label))).toBe(
      true
    );
    expect(flow?.steps).toContainEqual(
      expect.objectContaining({
        id: 'request-compensation',
        laneId: 'order-server',
        shape: 'process',
        label: expect.stringMatching(/rollback.*취소 요청/)
      })
    );
    expect(flow?.steps).toContainEqual(
      expect.objectContaining({ id: 'compensation-complete', shape: 'end', label: expect.stringMatching(/취소 성공/) })
    );
    expect(flow?.edges).toContainEqual(
      expect.objectContaining({ from: 'save-order', to: 'request-compensation', outcome: 'recover' })
    );
    expect(flow?.edges).toContainEqual(
      expect.objectContaining({ from: 'request-compensation', to: 'compensation-complete', outcome: 'continue' })
    );
    expect(flow?.edges).toContainEqual(
      expect.objectContaining({ from: 'request-compensation', to: 'compensation-failed', outcome: 'stop' })
    );
  });

  it('현재 권장 운영 대응을 과거 구현 노드로 만들지 않는다', () => {
    const flow = detail()?.swimlanes?.[0];
    const labels = flow?.steps.map(({ label }) => label).join('\n') ?? '';

    expect(labels).not.toMatch(/자동 재시도|자동 알림|자동 복구/);
    expect(detail()?.retrospective).toMatch(/운영자[^.\n]*알림|수동[^.\n]*(확인|취소)/);
  });
});

describe('호텔 예약 플랫폼 구조화 상세 데이터', () => {
  const detail = () => getFeatureDetailBySlug('hotel-reservation-platform');

  it('Feature 011의 Archify source와 generated HTML 식별값을 그대로 유지한다', () => {
    const sourcePath = resolve(
      process.cwd(),
      'diagrams/hotel-reservation-platform/platform-change-verification-deployment.json'
    );
    const artifactPath = resolve(
      process.cwd(),
      'public/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html'
    );
    const sourceBuffer = readFileSync(sourcePath);
    const artifactBuffer = readFileSync(artifactPath);
    const source = JSON.parse(sourceBuffer.toString('utf8')) as {
      nodes: Array<{ id: string }>;
      edges: Array<{ id: string; from: string; to: string; variant?: string }>;
    };

    expect(createHash('sha256').update(sourceBuffer).digest('hex')).toBe(
      'b5472af8952722b9b5fea87fc930f2c5880634ff8da5f17f16c6aaa4f819c419'
    );
    expect(createHash('sha256').update(artifactBuffer).digest('hex')).toBe(
      'a23ebd2219cda3bad5deccc3461e7d6522cfc90d5e34d6d4dffd5469817f49d3'
    );
    expect(statSync(sourcePath).size).toBe(4_355);
    expect(statSync(artifactPath).size).toBe(714_531);
    expect(source.nodes).toHaveLength(10);
    expect(source.edges).toHaveLength(12);
    expect(source.edges).toContainEqual(
      expect.objectContaining({
        id: 'verify-audit',
        from: 'verify-platforms',
        to: 'audit-operational-delta',
        variant: 'security'
      })
    );
    expect(source.edges).toContainEqual(
      expect.objectContaining({
        id: 'port-reverify',
        from: 'port-missing-delta',
        to: 'verify-platforms',
        variant: 'dashed'
      })
    );
  });

  it('기존 아홉 target과 신규 UAT target metadata를 각 feature/swimlane에 정확히 연결한다', () => {
    const target = detail();
    const flow = target?.swimlanes?.find(({ id }) => id === 'platform-change-verification-deployment');
    const linkedSwimlanes = getAllFeatures().flatMap(({ slug }) =>
      (getFeatureDetailBySlug(slug)?.swimlanes ?? [])
        .filter(({ archify }) => archify !== undefined)
        .map(({ id, archify }) => ({ slug, id, url: archify!.url }))
    );
    const sourcePath = resolve(
      process.cwd(),
      'diagrams/hotel-reservation-platform/platform-change-verification-deployment.json'
    );
    const artifactPath = resolve(
      process.cwd(),
      'public/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html'
    );

    expect(flow?.archify).toEqual({
      url: '/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html'
    });
    expect(linkedSwimlanes.sort((left, right) => left.url.localeCompare(right.url))).toEqual(
      [
        {
          slug: 'codi-harness-dx-platform',
          id: 'design-development-verification',
          url: '/diagrams/codi-harness-dx-platform/design-development-verification.html'
        },
        {
          slug: 'codi-harness-dx-platform',
          id: 'cicd-secrets-deployment',
          url: '/diagrams/codi-harness-dx-platform/cicd-secrets-deployment.html'
        },
        {
          slug: 'hanmaum-science-institute',
          id: 'ingestion-and-recovery',
          url: '/diagrams/hanmaum-science-institute/ingestion-and-recovery.html'
        },
        {
          slug: 'hanmaum-science-institute',
          id: 'search-request-flow',
          url: '/diagrams/hanmaum-science-institute/search-request-flow.html'
        },
        {
          slug: 'blackstone-belleforet-resort',
          id: 'payment-and-compensation',
          url: '/diagrams/blackstone-belleforet-resort/payment-and-compensation.html'
        },
        {
          slug: 'hipass-b2b-platform',
          id: 'order-payment-compensation',
          url: '/diagrams/hipass-b2b-platform/order-payment-compensation.html'
        },
        {
          slug: 'hotel-reservation-platform',
          id: 'platform-change-verification-deployment',
          url: '/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html'
        },
        {
          slug: 'integrated-sso-server',
          id: 'central-account-auth-flow',
          url: '/diagrams/integrated-sso-server/central-account-auth-flow.html'
        },
        {
          slug: 'integrated-reservation-platform',
          id: 'uat-booking-payment-flow',
          url: '/diagrams/integrated-reservation-platform/uat-booking-payment-flow.html'
        },
        {
          slug: 'the-siena-golf-reservation',
          id: 'reservation-request-and-exception-flow',
          url: '/diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.html'
        }
      ].sort((left, right) => left.url.localeCompare(right.url))
    );
    expect(
      getFeatureDetailBySlug('hipass-b2b-platform')?.swimlanes?.find(({ id }) => id === 'order-payment-compensation')
        ?.archify
    ).toEqual({ url: '/diagrams/hipass-b2b-platform/order-payment-compensation.html' });
    for (const linked of linkedSwimlanes) {
      const swimlane = getFeatureDetailBySlug(linked.slug)?.swimlanes?.find(({ id }) => id === linked.id);
      const sourceFile = linked.url.replace('/diagrams/', 'diagrams/').replace(/\.html$/, '.json');
      const artifactFile = linked.url.replace('/diagrams/', 'public/diagrams/');
      const linkedSourcePath = resolve(process.cwd(), sourceFile);
      const linkedArtifactPath = resolve(process.cwd(), artifactFile);

      expect(existsSync(linkedSourcePath), linkedSourcePath).toBe(true);
      expect(existsSync(linkedArtifactPath), linkedArtifactPath).toBe(true);
      if (!swimlane || !existsSync(linkedSourcePath)) continue;

      const source = JSON.parse(readFileSync(linkedSourcePath, 'utf8')) as {
        nodes: Array<{ id: string; type: string }>;
        edges: ArchifySourceEdge[];
      };
      const artifact = readFileSync(linkedArtifactPath, 'utf8');
      const artifactSvg = artifact.match(/<svg\b[^>]*>[\s\S]*?<\/svg>/)?.[0];
      if (!artifactSvg) throw new Error(`${linkedArtifactPath}: generated SVG를 찾을 수 없습니다.`);
      const attribute = (tag: string, name: string): string | null =>
        tag.match(new RegExp(`${name}="([^"]+)"`))?.[1] ?? null;
      const artifactNodes = [...artifactSvg.matchAll(/<g\b[^>]*data-node-id="[^"]+"[^>]*>/g)].map(([tag]) => ({
        id: attribute(tag, 'data-node-id'),
        kind: attribute(tag, 'data-node-kind')
      }));
      const artifactEdges = [...artifactSvg.matchAll(/<path\b[^>]*data-edge-id="[^"]+"[^>]*>/g)].map(([tag]) => ({
        id: attribute(tag, 'data-edge-id'),
        from: attribute(tag, 'data-edge-from'),
        to: attribute(tag, 'data-edge-to'),
        kind: tag.includes('a-security') || tag.includes('a-dashed') ? 'exception' : 'normal'
      }));

      expect(source.nodes.map(({ id }) => id)).toEqual(swimlane.steps.map(({ id }) => id));
      expect(artifactNodes.sort((left, right) => left.id!.localeCompare(right.id!))).toEqual(
        source.nodes.map(({ id, type }) => ({ id, kind: type })).sort((left, right) => left.id.localeCompare(right.id))
      );
      expectFeatureSwimlaneEdgeParity(source.edges, swimlane);
      expect(artifactEdges.sort((left, right) => left.id!.localeCompare(right.id!))).toEqual(
        getSourceArchifyEdgeTopology(source.edges)
      );
    }
    expect(existsSync(sourcePath)).toBe(true);
    expect(existsSync(artifactPath)).toBe(true);
    if (!existsSync(sourcePath) || !flow) return;

    const source = JSON.parse(readFileSync(sourcePath, 'utf8')) as {
      lanes: Array<{ id: string; label: string }>;
      nodes: Array<{ id: string; lane: string; type: string; label: string; sublabel?: string }>;
      edges: Array<{ id: string; from: string; to: string; label?: string }>;
    };
    const expectedLaneByStepId: Record<string, string> = {
      'request-change': 'requirement',
      'classify-difference': 'requirement',
      'place-core': 'code-boundary',
      'place-rsconfig': 'code-boundary',
      'delegate-platform': 'code-boundary',
      'build-platforms': 'delivery',
      'verify-platforms': 'delivery',
      'deploy-platforms': 'delivery',
      'audit-operational-delta': 'requirement',
      'port-missing-delta': 'code-boundary'
    };
    const expectedSublabelByStepId: Record<string, string> = {
      'request-change': '기능 또는 정책 변경 접수',
      'classify-difference': '변경 성격 판단',
      'place-core': '모든 플랫폼이 같은 동작',
      'place-rsconfig': '동작은 같고 값만 다름',
      'delegate-platform': '플랫폼 고유 화면 또는 로직',
      'build-platforms': 'build-time alias로 대상 선택',
      'verify-platforms': 'alias·경로 계약과 주요 흐름 확인',
      'deploy-platforms': '검증된 플랫폼별 산출물 배포',
      'audit-operational-delta': '변경 의도와 범위 비교',
      'port-missing-delta': '누락 변경을 맞는 경계로 이식'
    };

    expect(flow.steps).toHaveLength(10);
    expect(flow.edges).toHaveLength(12);
    expect(source.lanes).toEqual([
      { id: 'requirement', label: '요구사항' },
      { id: 'code-boundary', label: '코드 경계' },
      { id: 'delivery', label: '검증·배포' }
    ]);
    expect(source.nodes).toHaveLength(flow.steps.length);
    expect(source.nodes.map(({ id, label }) => ({ id, label }))).toEqual(
      flow.steps.map(({ id, label }) => ({ id, label }))
    );
    expect(Object.fromEntries(source.nodes.map(({ id, lane }) => [id, lane]))).toEqual(expectedLaneByStepId);
    expect(new Set(source.nodes.map(({ type }) => type))).toEqual(new Set(['frontend']));
    expect(Object.fromEntries(source.nodes.map(({ id, sublabel }) => [id, sublabel]))).toEqual(
      expectedSublabelByStepId
    );
    expect(source.edges).toHaveLength(flow.edges.length);
    expect(source.edges.map(({ id, from, to, label }) => ({ id, from, to, label: label ?? null }))).toEqual(
      flow.edges.map(({ id, from, to, label }) => ({ id, from, to, label: label ?? null }))
    );
  });

  it('source에 없는 data edge와 terminal stop을 recover로 바꾼 error outcome을 모두 거부한다', () => {
    const sourceEdges: ArchifySourceEdge[] = [
      { id: 'start-retry', from: 'start', to: 'retry', role: 'main' },
      { id: 'retry-stop', from: 'retry', to: 'stop', role: 'error' }
    ];
    const steps: FeatureSwimlane['steps'] = [
      {
        id: 'start',
        laneId: 'runtime',
        row: 0,
        shape: 'start',
        label: '시작',
        description: '시작합니다.'
      },
      {
        id: 'retry',
        laneId: 'runtime',
        row: 1,
        shape: 'process',
        label: '복구',
        description: '복구합니다.'
      },
      {
        id: 'stop',
        laneId: 'runtime',
        row: 2,
        shape: 'stop',
        label: '중단',
        description: '중단합니다.'
      }
    ];
    const validEdges: FeatureSwimlaneEdge[] = [
      { id: 'start-retry', from: 'start', to: 'retry', kind: 'normal', outcome: 'continue' },
      { id: 'retry-stop', from: 'retry', to: 'stop', kind: 'normal', outcome: 'stop' }
    ];

    expectFeatureSwimlaneEdgeParity(sourceEdges, { steps, edges: validEdges });
    expect(() =>
      expectFeatureSwimlaneEdgeParity(sourceEdges, {
        steps,
        edges: [...validEdges, { id: 'data-only', from: 'retry', to: 'stop', kind: 'normal', outcome: 'stop' }]
      })
    ).toThrow();
    expect(() =>
      expectFeatureSwimlaneEdgeParity(sourceEdges, {
        steps,
        edges: [validEdges[0], { ...validEdges[1], outcome: 'recover' }]
      })
    ).toThrow();
  });

  it('기존 아홉 target과 신규 UAT target 외의 작업물 data에는 Archify metadata를 추가하지 않는다', () => {
    const unexpectedLinks = getAllFeatures().flatMap(({ slug }) =>
      (getFeatureDetailBySlug(slug)?.swimlanes ?? [])
        .filter(({ archify }) => archify !== undefined)
        .map(({ id, archify }) => `${slug}:${id}:${archify!.url}`)
    );

    expect(unexpectedLinks.sort()).toEqual(
      [
        'codi-harness-dx-platform:design-development-verification:/diagrams/codi-harness-dx-platform/design-development-verification.html',
        'codi-harness-dx-platform:cicd-secrets-deployment:/diagrams/codi-harness-dx-platform/cicd-secrets-deployment.html',
        'hanmaum-science-institute:ingestion-and-recovery:/diagrams/hanmaum-science-institute/ingestion-and-recovery.html',
        'hanmaum-science-institute:search-request-flow:/diagrams/hanmaum-science-institute/search-request-flow.html',
        'blackstone-belleforet-resort:payment-and-compensation:/diagrams/blackstone-belleforet-resort/payment-and-compensation.html',
        'hipass-b2b-platform:order-payment-compensation:/diagrams/hipass-b2b-platform/order-payment-compensation.html',
        'integrated-sso-server:central-account-auth-flow:/diagrams/integrated-sso-server/central-account-auth-flow.html',
        'integrated-reservation-platform:uat-booking-payment-flow:/diagrams/integrated-reservation-platform/uat-booking-payment-flow.html',
        'hotel-reservation-platform:platform-change-verification-deployment:/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html',
        'the-siena-golf-reservation:reservation-request-and-exception-flow:/diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.html'
      ].sort()
    );
  });

  it('Archify 작성 언어와 Viewer fallback을 공개 경계 안에서 유지한다', () => {
    const target = detail();
    const sourcePath = resolve(
      process.cwd(),
      'diagrams/hotel-reservation-platform/platform-change-verification-deployment.json'
    );
    const artifactPath = resolve(
      process.cwd(),
      'public/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html'
    );
    const source = JSON.parse(readFileSync(sourcePath, 'utf8')) as {
      meta: Record<string, unknown>;
      nodes: Array<{ id: string; label: string; sublabel?: string }>;
      edges: Array<{ id: string; label?: string }>;
    };
    const artifact = readFileSync(artifactPath, 'utf8');
    const authoredText = [
      ...source.nodes.flatMap(({ label, sublabel }) => [label, sublabel ?? '']),
      ...source.edges.map(({ label }) => label ?? '')
    ].join('\n');
    const publicCopy = [
      target?.role,
      target?.problem,
      target?.constraints,
      target?.alternatives,
      target?.implementation,
      target?.outcomes,
      target?.retrospective,
      ...REAL_INSIGHTS.filter(({ featureSlug }) => featureSlug === 'hotel-reservation-platform').flatMap(
        ({ title, excerpt, content }) => [title, excerpt, content]
      )
    ].join('\n');

    expect(source.meta).not.toHaveProperty('locale');
    expect(authoredText).toMatch(/[가-힣]/);
    expect(authoredText).toContain('모든 플랫폼 공통');
    expect(authoredText).toContain('수동 이식 후 재검증');
    expect(artifact).toMatch(/<html[^>]*lang="en"/);
    expect(publicCopy).not.toMatch(/Archify/);
    expect(authoredText).not.toMatch(/고객명|예약번호|결제번호|accessToken|refreshToken|API[_ -]?KEY|SECRET|password/i);
    expect(authoredText).not.toMatch(/무중단|자동 배포|단일 산출물|무수정 신규 호텔|개선율|성공률/);
  });

  it('공통 필드와 세 근거 지표를 완전하게 제공한다', () => {
    const target = detail();

    expect(target).not.toBeNull();
    expect(target?.highlights).toHaveLength(3);
    expect(target?.demo).toBeUndefined();
    expect(validateFeatureDetail(target as FeatureDetailDto)).toEqual([]);
    expect(getFeatureBySlug('hotel-reservation-platform')?.content).toBeUndefined();
  });

  it('개발·검증·배포 스윔레인 하나에 세 배치 경계와 패리티 복구를 구분한다', () => {
    const swimlanes = detail()?.swimlanes ?? [];
    const flow = swimlanes[0];
    const labels = flow?.steps.map(({ label }) => label).join('\n') ?? '';

    expect(swimlanes).toHaveLength(1);
    expect(flow?.id).toBe('platform-change-verification-deployment');
    expect(flow?.lanes.map(({ id }) => id)).toEqual(['requirement', 'core', 'platform', 'delivery']);
    expect(labels).toMatch(/차이 분류/);
    expect(labels).toMatch(/core/);
    expect(labels).toMatch(/rsConfig/);
    expect(labels).toMatch(/platform/);
    expect(labels).toMatch(/플랫폼별 빌드/);
    expect(labels).toMatch(/계약·동작 검증/);
    expect(labels).toMatch(/호텔별 운영 폴더 배포/);
    expect(labels).toMatch(/운영 브랜치 감사/);
    expect(labels).toMatch(/수동 이식/);
    expect(flow?.edges).toContainEqual(
      expect.objectContaining({ from: 'verify-platforms', to: 'audit-operational-delta', outcome: 'recover' })
    );
    expect(flow?.edges).toContainEqual(
      expect.objectContaining({ from: 'port-missing-delta', to: 'verify-platforms', outcome: 'recover' })
    );
  });

  it('작업물 시각 자료는 전체 변경·검증·배포 질문만 답하고 NICEPAY 흐름을 중복하지 않는다', () => {
    const flow = detail()?.swimlanes?.[0];
    const visualText = JSON.stringify(flow);

    expect(flow?.purpose).toMatch(/변경[^.]*배치[^.]*검증·배포[^.]*패리티/);
    expect(visualText).not.toMatch(/NICEPAY|sessionStorage|결제 복귀/);
  });
});
