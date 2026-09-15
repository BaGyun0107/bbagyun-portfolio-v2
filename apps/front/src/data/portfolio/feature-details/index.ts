import { BLACKSTONE_BELLEFORET_RESORT_DETAIL } from './blackstone-belleforet-resort';
import { CODI_HARNESS_DX_PLATFORM_DETAIL } from './codi-harness-dx-platform';
import { HANMAUM_SCIENCE_INSTITUTE_DETAIL } from './hanmaum-science-institute';
import { HIPASS_B2B_PLATFORM_DETAIL } from './hipass-b2b-platform';
import { HOTEL_RESERVATION_PLATFORM_DETAIL } from './hotel-reservation-platform';
import { INTEGRATED_RESERVATION_PLATFORM_DETAIL } from './integrated-reservation-platform';
import { INTEGRATED_ACCOUNT_SERVER_DETAIL } from './integrated-sso-server';
import { THE_SIENA_GOLF_RESERVATION_DETAIL } from './the-siena-golf-reservation';
import { findWaypointCollisionStep } from '../swimlane-geometry';
import {
  FEATURE_RELATIONSHIP_ARCHIFY_URLS,
  FEATURE_SWIMLANE_ARCHIFY_URLS,
  isFeatureRelationshipArchifyTarget,
  isFeatureSwimlaneArchifyTarget,
  type FeatureDetailDto,
  type FeatureRelationship,
  type FeatureSwimlaneEdge,
  type FeatureSwimlanePoint
} from '../types/feature-detail.dto';

const isBlank = (value: string | undefined): boolean => !value?.trim();

const pushBlankError = (errors: string[], path: string, value: string | undefined): void => {
  if (isBlank(value)) errors.push(`${path}: 필수 값이 비어 있습니다.`);
};

const findDuplicateIds = (ids: string[]): string[] => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  ids.forEach((id) => {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  });

  return [...duplicates];
};

const NODE_SHAPES = new Set(['start', 'process', 'decision', 'end', 'stop']);
const ANCHORS = new Set(['top', 'right', 'bottom', 'left']);
const EDGE_KINDS = new Set(['normal', 'exception']);
const RELATIONSHIP_ENTITY_ROLES = new Set(['parent', 'subtype', 'transaction', 'inventory', 'option']);
const ARCHIFY_PATH_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const SWIMLANE_ARCHIFY_URLS = new Set<string>(FEATURE_SWIMLANE_ARCHIFY_URLS);
const RELATIONSHIP_ARCHIFY_URLS = new Set<string>(FEATURE_RELATIONSHIP_ARCHIFY_URLS);

const isAllowedArchifyUrl = (value: string, approvedUrls: ReadonlySet<string>): boolean => {
  if (!value.startsWith('/diagrams/') || !value.endsWith('.html') || value.includes('?') || value.includes('#')) {
    return false;
  }

  const segments = value.slice('/diagrams/'.length).split('/');
  return (
    segments.every(
      (segment) => segment !== '' && segment !== '.' && segment !== '..' && ARCHIFY_PATH_SEGMENT.test(segment)
    ) && approvedUrls.has(value)
  );
};

const getReachableSteps = (
  edges: FeatureSwimlaneEdge[],
  originIds: string[],
  reverse = false,
  includeRecovery = false
): Set<string> => {
  const adjacency = new Map<string, string[]>();

  edges
    .filter(({ kind, outcome }) => kind === 'normal' || (includeRecovery && outcome === 'recover'))
    .forEach((edge) => {
      const from = reverse ? edge.to : edge.from;
      const to = reverse ? edge.from : edge.to;
      adjacency.set(from, [...(adjacency.get(from) ?? []), to]);
    });

  const queue = [...originIds];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    queue.push(...(adjacency.get(current) ?? []));
  }

  return visited;
};

const validatePoint = (
  errors: string[],
  path: string,
  point: FeatureSwimlanePoint,
  maximumColumn: number,
  maximumRow: number
): void => {
  if (!Number.isFinite(point.column)) {
    errors.push(`${path}.column: 유한한 좌표여야 합니다.`);
  } else if (point.column < -0.5 || point.column > maximumColumn) {
    errors.push(`${path}.column: -0.5 이상 ${maximumColumn} 이하여야 합니다.`);
  }

  if (!Number.isFinite(point.row)) {
    errors.push(`${path}.row: 유한한 좌표여야 합니다.`);
  } else if (point.row < 0 || point.row > maximumRow) {
    errors.push(`${path}.row: 0 이상 ${maximumRow} 이하여야 합니다.`);
  }
};

export const validateFeatureDetail = (detail: FeatureDetailDto, featureSlug?: string): string[] => {
  const errors: string[] = [];
  const highlights = Array.isArray(detail.highlights) ? detail.highlights : [];
  const swimlanes = Array.isArray(detail.swimlanes) ? detail.swimlanes : [];
  const relationshipDiagrams = Array.isArray(detail.relationshipDiagrams) ? detail.relationshipDiagrams : [];
  const requiredDescriptions = [
    ['role', detail.role],
    ['problem', detail.problem],
    ['constraints', detail.constraints],
    ['alternatives', detail.alternatives],
    ['implementation', detail.implementation],
    ['outcomes', detail.outcomes],
    ['retrospective', detail.retrospective]
  ] as const;

  requiredDescriptions.forEach(([path, value]) => {
    if (isBlank(value)) errors.push(`${path}: 필수 설명이 비어 있습니다.`);
  });

  if (!Array.isArray(detail.highlights)) {
    errors.push('highlights: 필수 배열이 없습니다.');
  } else if (highlights.length === 0) {
    errors.push('highlights: 하나 이상의 공개 지표가 필요합니다.');
  }

  findDuplicateIds(highlights.map((metric) => metric.id)).forEach((id) => {
    errors.push(`highlights: 중복 ID "${id}"가 있습니다.`);
  });

  highlights.forEach((metric, metricIndex) => {
    const metricPath = `highlights[${metricIndex}]`;

    pushBlankError(errors, `${metricPath}.id`, metric.id);
    pushBlankError(errors, `${metricPath}.label`, metric.label);
    pushBlankError(errors, `${metricPath}.value`, metric.value);
    pushBlankError(errors, `${metricPath}.asOf`, metric.asOf);
    pushBlankError(errors, `${metricPath}.evidence`, metric.evidence);

    if (isBlank(metric.label) || isBlank(metric.value) || isBlank(metric.evidence)) {
      errors.push(`${metricPath}: 공개 지표의 값과 근거가 부족합니다.`);
    }
    if (metric.kind === 'estimated' && isBlank(metric.caveat)) {
      errors.push(`${metricPath}.caveat: 추정값에는 제한사항이 필요합니다.`);
    }
  });

  if (detail.demo) {
    pushBlankError(errors, 'demo.label', detail.demo.label);

    try {
      const demoUrl = new URL(detail.demo.url);
      if (demoUrl.protocol !== 'https:') {
        errors.push('demo.url: 공개 가능한 HTTPS 주소가 필요합니다.');
      }
    } catch {
      errors.push('demo.url: 공개 가능한 HTTPS 주소가 필요합니다.');
    }
  }

  if (detail.swimlanes !== undefined && !Array.isArray(detail.swimlanes)) {
    errors.push('swimlanes: 배열이어야 합니다.');
  }

  findDuplicateIds(swimlanes.map((swimlane) => swimlane.id)).forEach((id) => {
    errors.push(`swimlanes: 중복 ID "${id}"가 있습니다.`);
  });

  swimlanes.forEach((swimlane, swimlaneIndex) => {
    const swimlanePath = `swimlanes[${swimlaneIndex}]`;
    const lanes = Array.isArray(swimlane.lanes) ? swimlane.lanes : [];
    const steps = Array.isArray(swimlane.steps) ? swimlane.steps : [];
    const edges = Array.isArray(swimlane.edges) ? swimlane.edges : [];
    const exceptions = Array.isArray(swimlane.exceptions) ? swimlane.exceptions : [];
    const laneIds = new Set(lanes.map((lane) => lane.id));
    const stepIds = new Set(steps.map((step) => step.id));
    const stepsById = new Map(steps.map((step) => [step.id, step]));
    const edgesById = new Map(edges.map((edge) => [edge.id, edge]));
    const finiteRows = steps.map(({ row }) => row).filter(Number.isFinite);
    const maximumRow = finiteRows.length > 0 ? Math.max(0, ...finiteRows) : 0;
    const maximumColumn = lanes.length - 0.5;

    pushBlankError(errors, `${swimlanePath}.id`, swimlane.id);
    pushBlankError(errors, `${swimlanePath}.title`, swimlane.title);
    pushBlankError(errors, `${swimlanePath}.purpose`, swimlane.purpose);
    pushBlankError(errors, `${swimlanePath}.summary`, swimlane.summary);
    if (swimlane.archify) {
      pushBlankError(errors, `${swimlanePath}.archify.url`, swimlane.archify.url);
      if (!isBlank(swimlane.archify.url) && !isAllowedArchifyUrl(swimlane.archify.url, SWIMLANE_ARCHIFY_URLS)) {
        errors.push(
          `${swimlanePath}.archify.url: 허용된 /diagrams/ 아래의 HTML 및 승인된 대상 artifact 경로가 필요합니다.`
        );
      } else if (
        featureSlug &&
        !isBlank(swimlane.archify.url) &&
        !isFeatureSwimlaneArchifyTarget(featureSlug, swimlane.id, swimlane.archify.url)
      ) {
        errors.push(`${swimlanePath}.archify.url: feature/swimlane 대상과 일치하는 artifact 경로가 필요합니다.`);
      }
    }
    if (!Array.isArray(swimlane.lanes)) {
      errors.push(`${swimlanePath}.lanes: 필수 배열이 없습니다.`);
    }
    if (!Array.isArray(swimlane.steps)) {
      errors.push(`${swimlanePath}.steps: 필수 배열이 없습니다.`);
    }
    if (!Array.isArray(swimlane.edges)) {
      errors.push(`${swimlanePath}.edges: 필수 배열이 없습니다.`);
    }
    if (!Array.isArray(swimlane.exceptions)) {
      errors.push(`${swimlanePath}.exceptions: 필수 배열이 없습니다.`);
    }

    findDuplicateIds(lanes.map((lane) => lane.id)).forEach((id) => {
      errors.push(`${swimlanePath}.lanes: 중복 ID "${id}"가 있습니다.`);
    });
    findDuplicateIds(steps.map((step) => step.id)).forEach((id) => {
      errors.push(`${swimlanePath}.steps: 중복 ID "${id}"가 있습니다.`);
    });
    findDuplicateIds(edges.map((edge) => edge.id)).forEach((id) => {
      errors.push(`${swimlanePath}.edges: 중복 ID "${id}"가 있습니다.`);
    });
    findDuplicateIds(exceptions.map((exception) => exception.id)).forEach((id) => {
      errors.push(`${swimlanePath}.exceptions: 중복 ID "${id}"가 있습니다.`);
    });

    lanes.forEach((lane, laneIndex) => {
      pushBlankError(errors, `${swimlanePath}.lanes[${laneIndex}].id`, lane.id);
      pushBlankError(errors, `${swimlanePath}.lanes[${laneIndex}].label`, lane.label);
    });

    steps.forEach((step, stepIndex) => {
      pushBlankError(errors, `${swimlanePath}.steps[${stepIndex}].id`, step.id);
      pushBlankError(errors, `${swimlanePath}.steps[${stepIndex}].laneId`, step.laneId);
      pushBlankError(errors, `${swimlanePath}.steps[${stepIndex}].label`, step.label);
      pushBlankError(errors, `${swimlanePath}.steps[${stepIndex}].description`, step.description);

      if (!laneIds.has(step.laneId)) {
        errors.push(`${swimlanePath}.steps[${stepIndex}].laneId: 존재하지 않는 lane "${step.laneId}"을 참조합니다.`);
      }
      if (!Number.isFinite(step.row) || !Number.isInteger(step.row) || step.row < 0) {
        errors.push(`${swimlanePath}.steps[${stepIndex}].row: 유한한 0 이상의 정수여야 합니다.`);
      }
      if (!NODE_SHAPES.has(step.shape)) {
        errors.push(`${swimlanePath}.steps[${stepIndex}].shape: 허용되지 않는 node shape "${step.shape}"입니다.`);
      }
    });

    const occupiedPositions = new Set<string>();
    steps.forEach(({ laneId, row }) => {
      const position = `${laneId}\u0000${row}`;
      if (occupiedPositions.has(position)) {
        errors.push(`${swimlanePath}.steps: lane "${laneId}"의 row ${row} 위치가 중복됩니다.`);
      }
      occupiedPositions.add(position);
    });

    edges.forEach((edge, edgeIndex) => {
      const edgePath = `${swimlanePath}.edges[${edgeIndex}]`;
      pushBlankError(errors, `${swimlanePath}.edges[${edgeIndex}].id`, edge.id);
      pushBlankError(errors, `${swimlanePath}.edges[${edgeIndex}].from`, edge.from);
      pushBlankError(errors, `${swimlanePath}.edges[${edgeIndex}].to`, edge.to);

      if (!stepIds.has(edge.from)) {
        errors.push(`${swimlanePath}.edges[${edgeIndex}].from: 존재하지 않는 step "${edge.from}"을 참조합니다.`);
      }
      if (!stepIds.has(edge.to)) {
        errors.push(`${swimlanePath}.edges[${edgeIndex}].to: 존재하지 않는 step "${edge.to}"을 참조합니다.`);
      }
      if (edge.from === edge.to) {
        errors.push(`${edgePath}: 같은 step을 연결할 수 없습니다.`);
      }
      if (edge.fromAnchor !== undefined && !ANCHORS.has(edge.fromAnchor)) {
        errors.push(`${edgePath}.fromAnchor: 허용되지 않는 anchor "${edge.fromAnchor}"입니다.`);
      }
      if (edge.toAnchor !== undefined && !ANCHORS.has(edge.toAnchor)) {
        errors.push(`${edgePath}.toAnchor: 허용되지 않는 anchor "${edge.toAnchor}"입니다.`);
      }
      if (!EDGE_KINDS.has(edge.kind)) {
        errors.push(`${edgePath}.kind: 허용되지 않는 edge kind "${edge.kind}"입니다.`);
      }
      if (edge.kind === 'normal' && edge.outcome !== 'continue') {
        errors.push(`${edgePath}.outcome: normal edge는 continue여야 합니다.`);
      }
      if (edge.kind === 'exception' && edge.outcome !== 'recover' && edge.outcome !== 'stop') {
        errors.push(`${edgePath}.outcome: exception edge는 recover 또는 stop이어야 합니다.`);
      }
      if (edge.kind === 'exception' && isBlank(edge.label)) {
        errors.push(`${edgePath}.label: exception edge에는 조건 label이 필요합니다.`);
      }

      const fromStep = stepsById.get(edge.from);
      const toStep = stepsById.get(edge.to);
      if (edge.kind !== 'exception' && fromStep?.shape === 'decision' && isBlank(edge.label)) {
        errors.push(`${edgePath}.label: decision 분기 edge에는 결과 label이 필요합니다.`);
      }
      if (
        edge.kind === 'normal' &&
        fromStep &&
        toStep &&
        Number.isFinite(fromStep.row) &&
        Number.isFinite(toStep.row) &&
        toStep.row <= fromStep.row
      ) {
        errors.push(`${edgePath}: normal edge는 더 큰 row의 step으로 진행해야 합니다.`);
      }
      if (edge.outcome === 'stop' && toStep?.shape !== 'stop') {
        errors.push(`${edgePath}.to: stop outcome은 stop node를 대상으로 해야 합니다.`);
      }
      if (edge.kind === 'normal' && toStep?.shape === 'stop') {
        errors.push(`${edgePath}.to: normal edge는 stop node를 대상으로 할 수 없습니다.`);
      }

      edge.waypoints?.forEach((point, pointIndex) => {
        const pointPath = `${edgePath}.waypoints[${pointIndex}]`;
        validatePoint(errors, pointPath, point, maximumColumn, maximumRow);

        const blockedStep = findWaypointCollisionStep(swimlane, edge, point);
        if (blockedStep) {
          errors.push(`${pointPath}: step "${blockedStep.id}" 내부를 통과할 수 없습니다.`);
        }
      });
      if (edge.labelAt) {
        validatePoint(errors, `${edgePath}.labelAt`, edge.labelAt, maximumColumn, maximumRow);
      }
    });

    const startSteps = steps.filter(({ shape }) => shape === 'start');
    const endSteps = steps.filter(({ shape }) => shape === 'end');

    if (startSteps.length !== 1) {
      errors.push(`${swimlanePath}.steps: start node가 정확히 하나 필요합니다.`);
    }
    if (endSteps.length === 0) {
      errors.push(`${swimlanePath}.steps: end node가 하나 이상 필요합니다.`);
    }

    if (startSteps.length === 1 && endSteps.length > 0) {
      const normalReachableFromStart = getReachableSteps(edges, [startSteps[0].id]);
      const reachableFromStart = getReachableSteps(edges, [startSteps[0].id], false, true);
      const canReachEnd = getReachableSteps(
        edges,
        endSteps.map(({ id }) => id),
        true,
        true
      );

      if (!endSteps.some(({ id }) => normalReachableFromStart.has(id))) {
        errors.push(`${swimlanePath}.edges: start에서 end까지 이어지는 정상 경로가 필요합니다.`);
      }

      steps.forEach((step, stepIndex) => {
        if (step.shape === 'stop') return;
        if (!reachableFromStart.has(step.id)) {
          errors.push(`${swimlanePath}.steps[${stepIndex}]: start에서 정상·복구 흐름으로 도달할 수 없습니다.`);
        }
        if (!canReachEnd.has(step.id)) {
          errors.push(`${swimlanePath}.steps[${stepIndex}]: 정상·복구 흐름으로 end에 도달할 수 없습니다.`);
        }
      });
    }

    const coveredExceptionEdges = new Set<string>();
    exceptions.forEach((exception, exceptionIndex) => {
      const exceptionPath = `${swimlanePath}.exceptions[${exceptionIndex}]`;
      const edgeIds = Array.isArray(exception.edgeIds) ? exception.edgeIds : [];
      pushBlankError(errors, `${exceptionPath}.id`, exception.id);
      pushBlankError(errors, `${exceptionPath}.trigger`, exception.trigger);
      pushBlankError(errors, `${exceptionPath}.response`, exception.response);

      if (!Array.isArray(exception.edgeIds)) {
        errors.push(`${exceptionPath}.edgeIds: 필수 배열이 없습니다.`);
      } else if (edgeIds.length === 0) {
        errors.push(`${exceptionPath}.edgeIds: 하나 이상의 exception edge 참조가 필요합니다.`);
      }

      edgeIds.forEach((edgeId, edgeIdIndex) => {
        const edgeIdPath = `${exceptionPath}.edgeIds[${edgeIdIndex}]`;
        pushBlankError(errors, edgeIdPath, edgeId);
        const edge = edgesById.get(edgeId);
        if (!edge) {
          errors.push(`${edgeIdPath}: 존재하지 않는 edge "${edgeId}"를 참조합니다.`);
        } else if (edge.kind !== 'exception') {
          errors.push(`${edgeIdPath}: exception edge를 참조해야 합니다.`);
        } else {
          coveredExceptionEdges.add(edgeId);
        }
      });
    });

    edges.forEach((edge, edgeIndex) => {
      if (edge.kind === 'exception' && !coveredExceptionEdges.has(edge.id)) {
        errors.push(`${swimlanePath}.edges[${edgeIndex}]: exception 설명에 포함되어야 합니다.`);
      }
    });
  });

  if (detail.relationshipDiagrams !== undefined && !Array.isArray(detail.relationshipDiagrams)) {
    errors.push('relationshipDiagrams: 배열이어야 합니다.');
  }

  findDuplicateIds(relationshipDiagrams.map((diagram) => diagram.id)).forEach((id) => {
    errors.push(`relationshipDiagrams: 중복 ID "${id}"가 있습니다.`);
  });

  relationshipDiagrams.forEach((diagram, diagramIndex) => {
    const diagramPath = `relationshipDiagrams[${diagramIndex}]`;
    const entities = Array.isArray(diagram.entities) ? diagram.entities : [];
    const relationships = Array.isArray(diagram.relationships) ? diagram.relationships : [];
    const entityIds = new Set(entities.map(({ id }) => id));

    pushBlankError(errors, `${diagramPath}.id`, diagram.id);
    pushBlankError(errors, `${diagramPath}.title`, diagram.title);
    pushBlankError(errors, `${diagramPath}.purpose`, diagram.purpose);
    pushBlankError(errors, `${diagramPath}.summary`, diagram.summary);
    pushBlankError(errors, `${diagramPath}.textAlternative`, diagram.textAlternative);

    if (!Array.isArray(diagram.entities)) {
      errors.push(`${diagramPath}.entities: 필수 배열이 없습니다.`);
    }
    if (!Array.isArray(diagram.relationships)) {
      errors.push(`${diagramPath}.relationships: 필수 배열이 없습니다.`);
    }

    findDuplicateIds(entities.map(({ id }) => id)).forEach((id) => {
      errors.push(`${diagramPath}.entities: 중복 ID "${id}"가 있습니다.`);
    });
    findDuplicateIds(relationships.map(({ id }) => id)).forEach((id) => {
      errors.push(`${diagramPath}.relationships: 중복 ID "${id}"가 있습니다.`);
    });

    entities.forEach((entity, entityIndex) => {
      const entityPath = `${diagramPath}.entities[${entityIndex}]`;
      pushBlankError(errors, `${entityPath}.id`, entity.id);
      pushBlankError(errors, `${entityPath}.label`, entity.label);
      pushBlankError(errors, `${entityPath}.role`, entity.role);
      pushBlankError(errors, `${entityPath}.description`, entity.description);
      if (!RELATIONSHIP_ENTITY_ROLES.has(entity.role)) {
        errors.push(`${entityPath}.role: 허용되지 않는 entity role "${entity.role}"입니다.`);
      }
    });

    relationships.forEach((relationship: FeatureRelationship, relationshipIndex) => {
      const relationshipPath = `${diagramPath}.relationships[${relationshipIndex}]`;
      pushBlankError(errors, `${relationshipPath}.id`, relationship.id);
      pushBlankError(errors, `${relationshipPath}.from`, relationship.from);
      pushBlankError(errors, `${relationshipPath}.to`, relationship.to);
      pushBlankError(errors, `${relationshipPath}.label`, relationship.label);
      pushBlankError(errors, `${relationshipPath}.cardinality`, relationship.cardinality);
      if (!entityIds.has(relationship.from)) {
        errors.push(`${relationshipPath}.from: 존재하지 않는 entity "${relationship.from}"를 참조합니다.`);
      }
      if (!entityIds.has(relationship.to)) {
        errors.push(`${relationshipPath}.to: 존재하지 않는 entity "${relationship.to}"를 참조합니다.`);
      }
    });

    if (diagram.archify) {
      pushBlankError(errors, `${diagramPath}.archify.url`, diagram.archify.url);
      if (!isBlank(diagram.archify.url) && !isAllowedArchifyUrl(diagram.archify.url, RELATIONSHIP_ARCHIFY_URLS)) {
        errors.push(
          `${diagramPath}.archify.url: 허용된 /diagrams/ 아래의 HTML 및 승인된 relationship artifact 경로가 필요합니다.`
        );
      } else if (
        featureSlug &&
        !isBlank(diagram.archify.url) &&
        !isFeatureRelationshipArchifyTarget(featureSlug, diagram.id, diagram.archify.url)
      ) {
        errors.push(`${diagramPath}.archify.url: feature/diagram 대상과 일치하는 artifact 경로가 필요합니다.`);
      }
    }
  });

  return errors;
};

const featureDetails: Readonly<Record<string, FeatureDetailDto>> = Object.freeze({
  'codi-harness-dx-platform': CODI_HARNESS_DX_PLATFORM_DETAIL,
  'hanmaum-science-institute': HANMAUM_SCIENCE_INSTITUTE_DETAIL,
  'blackstone-belleforet-resort': BLACKSTONE_BELLEFORET_RESORT_DETAIL,
  'integrated-sso-server': INTEGRATED_ACCOUNT_SERVER_DETAIL,
  'hipass-b2b-platform': HIPASS_B2B_PLATFORM_DETAIL,
  'hotel-reservation-platform': HOTEL_RESERVATION_PLATFORM_DETAIL,
  'integrated-reservation-platform': INTEGRATED_RESERVATION_PLATFORM_DETAIL,
  'the-siena-golf-reservation': THE_SIENA_GOLF_RESERVATION_DETAIL
});

export const sanitizeFeatureDetailArchifyMetadata = (
  featureSlug: string,
  detail: FeatureDetailDto
): FeatureDetailDto => ({
  ...detail,
  swimlanes: detail.swimlanes?.map((swimlane) => {
    if (!swimlane.archify || isFeatureSwimlaneArchifyTarget(featureSlug, swimlane.id, swimlane.archify.url)) {
      return swimlane;
    }

    const fallbackSwimlane = { ...swimlane };
    delete fallbackSwimlane.archify;
    return fallbackSwimlane;
  }),
  relationshipDiagrams: detail.relationshipDiagrams?.map((diagram) => {
    if (!diagram.archify || isFeatureRelationshipArchifyTarget(featureSlug, diagram.id, diagram.archify.url)) {
      return diagram;
    }

    const fallbackDiagram = { ...diagram };
    delete fallbackDiagram.archify;
    return fallbackDiagram;
  })
});

export const getFeatureDetailBySlug = (slug: string): FeatureDetailDto | null => {
  const detail = featureDetails[slug];
  if (!detail) return null;

  const safeDetail = sanitizeFeatureDetailArchifyMetadata(slug, detail);
  const errors = validateFeatureDetail(safeDetail, slug);
  if (errors.length > 0) {
    throw new Error(`구조화 상세 "${slug}" 검증 실패:\n${errors.join('\n')}`);
  }

  return safeDetail;
};
