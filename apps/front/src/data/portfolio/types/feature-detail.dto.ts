export type FeatureMetricKind = 'measured' | 'reported' | 'estimated';

export interface FeatureMetric {
  id: string;
  label: string;
  value: string;
  kind: FeatureMetricKind;
  asOf: string;
  evidence: string;
  caveat?: string;
}

export interface FeatureDemo {
  url: string;
  label: string;
  kind: 'production' | 'portfolio';
  note?: string;
  status: 'available' | 'unavailable';
}

export interface FeatureSwimlaneLane {
  id: string;
  label: string;
}

export type FeatureSwimlaneNodeShape = 'start' | 'process' | 'decision' | 'end' | 'stop';

export type FeatureSwimlaneAnchor = 'top' | 'right' | 'bottom' | 'left';

export interface FeatureSwimlanePoint {
  column: number;
  row: number;
}

export interface FeatureSwimlaneStep {
  id: string;
  laneId: string;
  row: number;
  shape: FeatureSwimlaneNodeShape;
  label: string;
  description: string;
}

export interface FeatureSwimlaneEdge {
  id: string;
  from: string;
  to: string;
  kind: 'normal' | 'exception';
  outcome: 'continue' | 'recover' | 'stop';
  fromAnchor?: FeatureSwimlaneAnchor;
  toAnchor?: FeatureSwimlaneAnchor;
  label?: string;
  labelAt?: FeatureSwimlanePoint;
  waypoints?: FeatureSwimlanePoint[];
}

export interface FeatureSwimlaneException {
  id: string;
  trigger: string;
  response: string;
  edgeIds: string[];
}

export const FEATURE_SWIMLANE_ARCHIFY_TARGETS = [
  {
    featureSlug: 'codi-harness-dx-platform',
    swimlaneId: 'design-development-verification',
    url: '/diagrams/codi-harness-dx-platform/design-development-verification.html'
  },
  {
    featureSlug: 'codi-harness-dx-platform',
    swimlaneId: 'cicd-secrets-deployment',
    url: '/diagrams/codi-harness-dx-platform/cicd-secrets-deployment.html'
  },
  {
    featureSlug: 'hanmaum-science-institute',
    swimlaneId: 'ingestion-and-recovery',
    url: '/diagrams/hanmaum-science-institute/ingestion-and-recovery.html'
  },
  {
    featureSlug: 'hanmaum-science-institute',
    swimlaneId: 'search-request-flow',
    url: '/diagrams/hanmaum-science-institute/search-request-flow.html'
  },
  {
    featureSlug: 'blackstone-belleforet-resort',
    swimlaneId: 'payment-and-compensation',
    url: '/diagrams/blackstone-belleforet-resort/payment-and-compensation.html'
  },
  {
    featureSlug: 'hipass-b2b-platform',
    swimlaneId: 'order-payment-compensation',
    url: '/diagrams/hipass-b2b-platform/order-payment-compensation.html'
  },
  {
    featureSlug: 'hotel-reservation-platform',
    swimlaneId: 'platform-change-verification-deployment',
    url: '/diagrams/hotel-reservation-platform/platform-change-verification-deployment.html'
  },
  {
    featureSlug: 'integrated-sso-server',
    swimlaneId: 'central-account-auth-flow',
    url: '/diagrams/integrated-sso-server/central-account-auth-flow.html'
  },
  {
    featureSlug: 'integrated-reservation-platform',
    swimlaneId: 'uat-booking-payment-flow',
    url: '/diagrams/integrated-reservation-platform/uat-booking-payment-flow.html'
  },
  {
    featureSlug: 'the-siena-golf-reservation',
    swimlaneId: 'reservation-request-and-exception-flow',
    url: '/diagrams/the-siena-golf-reservation/reservation-request-and-exception-flow.html'
  }
] as const;

export type FeatureSwimlaneArchifyUrl = (typeof FEATURE_SWIMLANE_ARCHIFY_TARGETS)[number]['url'];

export const FEATURE_SWIMLANE_ARCHIFY_URLS: readonly FeatureSwimlaneArchifyUrl[] = FEATURE_SWIMLANE_ARCHIFY_TARGETS.map(
  ({ url }) => url
);

export const isFeatureSwimlaneArchifyTarget = (
  featureSlug: string,
  swimlaneId: string,
  url: string
): url is FeatureSwimlaneArchifyUrl =>
  FEATURE_SWIMLANE_ARCHIFY_TARGETS.some(
    (target) => target.featureSlug === featureSlug && target.swimlaneId === swimlaneId && target.url === url
  );

export const isFeatureSwimlaneArchifyUrlForSwimlane = (
  swimlaneId: string,
  url: string
): url is FeatureSwimlaneArchifyUrl =>
  FEATURE_SWIMLANE_ARCHIFY_TARGETS.some((target) => target.swimlaneId === swimlaneId && target.url === url);

export interface FeatureSwimlaneArchifyEmbed {
  url: FeatureSwimlaneArchifyUrl;
}

export interface FeatureSwimlane {
  id: string;
  title: string;
  purpose: string;
  lanes: FeatureSwimlaneLane[];
  steps: FeatureSwimlaneStep[];
  edges: FeatureSwimlaneEdge[];
  summary: string;
  exceptions: FeatureSwimlaneException[];
  archify?: FeatureSwimlaneArchifyEmbed;
}

export type FeatureRelationshipEntityRole = 'parent' | 'subtype' | 'transaction' | 'inventory' | 'option';

export interface FeatureRelationshipEntity {
  id: string;
  label: string;
  role: FeatureRelationshipEntityRole;
  description: string;
}

export interface FeatureRelationship {
  id: string;
  from: string;
  to: string;
  label: string;
  cardinality: string;
}

export const FEATURE_RELATIONSHIP_ARCHIFY_TARGETS = [
  {
    featureSlug: 'integrated-reservation-platform',
    diagramId: 'core-product-relationships',
    url: '/diagrams/integrated-reservation-platform/core-product-relationships.html'
  }
] as const;

export type FeatureRelationshipArchifyUrl = (typeof FEATURE_RELATIONSHIP_ARCHIFY_TARGETS)[number]['url'];

export const FEATURE_RELATIONSHIP_ARCHIFY_URLS: readonly FeatureRelationshipArchifyUrl[] =
  FEATURE_RELATIONSHIP_ARCHIFY_TARGETS.map(({ url }) => url);

export const isFeatureRelationshipArchifyTarget = (
  featureSlug: string,
  diagramId: string,
  url: string
): url is FeatureRelationshipArchifyUrl =>
  FEATURE_RELATIONSHIP_ARCHIFY_TARGETS.some(
    (target) => target.featureSlug === featureSlug && target.diagramId === diagramId && target.url === url
  );

export const isFeatureRelationshipArchifyUrlForDiagram = (
  diagramId: string,
  url: string
): url is FeatureRelationshipArchifyUrl =>
  FEATURE_RELATIONSHIP_ARCHIFY_TARGETS.some((target) => target.diagramId === diagramId && target.url === url);

export interface FeatureRelationshipArchifyEmbed {
  url: FeatureRelationshipArchifyUrl;
}

export interface FeatureRelationshipDiagram {
  id: string;
  title: string;
  purpose: string;
  summary: string;
  textAlternative: string;
  entities: FeatureRelationshipEntity[];
  relationships: FeatureRelationship[];
  archify?: FeatureRelationshipArchifyEmbed;
}

export type FeatureArchifyUrl = FeatureSwimlaneArchifyUrl | FeatureRelationshipArchifyUrl;

export interface FeatureDetailDto {
  role: string;
  highlights: FeatureMetric[];
  problem: string;
  constraints: string;
  alternatives: string;
  swimlanes?: FeatureSwimlane[];
  relationshipDiagrams?: FeatureRelationshipDiagram[];
  implementation: string;
  outcomes: string;
  retrospective: string;
  demo?: FeatureDemo;
}
