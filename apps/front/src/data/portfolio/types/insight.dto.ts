/**
 * 인사이트 정보에 대한 DTO 인터페이스
 */
export type InsightType = 'project-case' | 'technical-exploration';

export type InsightVisualKind =
  | 'swimlane'
  | 'sequence'
  | 'erd'
  | 'architecture'
  | 'data-flow'
  | 'state-transition'
  | 'decision-matrix'
  | 'timeline';

export type InsightVisualAssessment =
  | {
      decision: 'not-needed';
      rationale: string;
    }
  | {
      decision: 'recommended';
      kind: InsightVisualKind;
      rationale: string;
    }
  | {
      decision: 'provided';
      kind: InsightVisualKind;
      rationale: string;
      question: string;
      textAlternative: string;
      nonDuplicationReason: string;
    };

export type InsightEditorialMetadata =
  | {
      type: 'project-case';
      visualAssessment: InsightVisualAssessment;
    }
  | {
      type: 'technical-exploration';
      independentReason?: string;
      visualAssessment: InsightVisualAssessment;
    };

export type InsightDataFlowNodeRole = 'state' | 'data' | 'action' | 'terminal';
export type InsightDataFlowEdgeOutcome = 'normal' | 'success' | 'failure' | 'retry';

export interface InsightDataFlowNode {
  id: string;
  label: string;
  detail: string;
  role: InsightDataFlowNodeRole;
}

export interface InsightDataFlowEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  outcome: InsightDataFlowEdgeOutcome;
}

export type InsightArchitectureActorRole =
  | 'server'
  | 'room'
  | 'recipient'
  | 'unrelated'
  | 'source'
  | 'relay'
  | 'boundary'
  | 'consumer';

export interface InsightArchitectureActor {
  id: string;
  label: string;
  role: InsightArchitectureActorRole;
}

export type InsightArchitectureConnectionScope = 'intended' | 'overbroad' | 'indirect' | 'direct';

export interface InsightArchitectureConnection {
  id: string;
  from: string;
  to: string;
  label: string;
  scope: InsightArchitectureConnectionScope;
}

export interface InsightArchitecturePanel {
  id: 'before' | 'after';
  title: string;
  summary: string;
  actors: InsightArchitectureActor[];
  connections: InsightArchitectureConnection[];
}

interface InsightVisualBase {
  id: string;
  title: string;
  question: string;
  textAlternative: string;
}

export interface InsightDataFlowVisual extends InsightVisualBase {
  variant: 'data-flow';
  nodes: InsightDataFlowNode[];
  edges: InsightDataFlowEdge[];
}

export interface InsightBeforeAfterVisual extends InsightVisualBase {
  variant: 'before-after';
  showActorRoleLabels?: boolean;
  panels: [InsightArchitecturePanel, InsightArchitecturePanel];
}

export type InsightVisual = InsightDataFlowVisual | InsightBeforeAfterVisual;

export interface InsightDto {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: Date | string;
  /**
   * 참고: Prisma SQLite에서는 JSON 문자열로 저장되지만,
   * DTO에서는 배열 형태로 표현 및 반환됩니다.
   */
  tags: string[];
  readTime: string;
  featureSlug?: string | null;
  studySlug?: string | null;
  editorial?: InsightEditorialMetadata | null;
  visual?: InsightVisual | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * 새로운 인사이트 생성을 위한 DTO
 */
export type CreateInsightDto = Omit<InsightDto, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * 기존 인사이트 수정을 위한 DTO
 */
export type UpdateInsightDto = Partial<CreateInsightDto>;

/**
 * 인사이트 이전글, 다음글 네비게이션을 위한 DTO
 */
export interface InsightNavigationDto {
  slug: string;
  title: string;
}

/**
 * 인사이트 연도별 아카이브 데이터를 위한 DTO
 */
export interface InsightArchiveDto {
  year: string;
  insights: Pick<InsightDto, 'id' | 'slug' | 'title' | 'date' | 'tags'>[];
}

/**
 * 인사이트 태그 클라우드를 위한 DTO
 */
export interface InsightTagDto {
  tag: string;
  count: number;
}
