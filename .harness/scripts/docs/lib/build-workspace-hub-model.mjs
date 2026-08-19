import { buildLinkedHubModel } from './build-linked-hub-model.mjs';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SERVICE_DEFINITION_COLUMNS, catalogAsLegacyRows, isCatalogRecord } from './feature-definition-schema.mjs';
import { aggregateAllFeatures } from './aggregate-feature-work-items.mjs';
import { normalizeFeatureWorkItems } from './normalize-feature-work-items.mjs';
import { scanFeatureDetails } from './scan-feature-details.mjs';
import { scanSpecs } from './scan-specs.mjs';
import { reconcilePlanningDelivery } from './reconcile-planning-delivery.mjs';

const SPEC_BASE_STATUSES = new Set(['planned', 'in-progress', 'in-review', 'done']);

// 원본 가용성 문제(진짜 고장)만 source.health를 invalid로 만든다 (012 US1).
// 정의 품질·연결 품질·work item 품질 코드는 advisory — 모델에 남아 계속
// 노출되지만 source 상태를 바꾸지 않는다. 분류 밖 신규 코드는 advisory.
const SOURCE_HEALTH_CODES = new Set([
  'workspace-source-invalid',
  'workspace-reconcile-failed',
  'workspace-config-invalid',
  'workspace-root-unsafe',
  'delivery-source-symlink',
]);

function hasSourceHealthIssue(health = []) {
  return (Array.isArray(health) ? health : []).some(
    (issue) => issue && SOURCE_HEALTH_CODES.has(issue.code),
  );
}

// 열린 결정 소비 루프 (백로그 항목 4): status가 'open'인 결정을 요약해
// 빌드 힌트와 planning:check 경고가 공용으로 쓴다.
export function openDecisionSummary(decisions = []) {
  const ids = [];
  for (const decision of Array.isArray(decisions) ? decisions : []) {
    if (decision && typeof decision === 'object' && decision.status === 'open'
      && typeof decision.id === 'string' && decision.id.trim()) {
      ids.push(decision.id);
    }
  }
  return { count: ids.length, ids };
}

// spec 디렉터리형 deliverySource의 보충 투영 (011 US4). 명시 evidence가
// 있는 기능은 건드리지 않는다. 연결은 spec featureId > ID 동일성.
// 스캔 경고는 빌드 수준에서 이미 출력되므로 여기서는 items만 보탠다
// (workspace health에 넣으면 source.health가 invalid로 뒤집힌다).
function projectSpecDelivery({ specFeatures, features, coveredFeatureIds }) {
  const featureIds = new Set(
    features.filter((feature) => typeof feature?.id === 'string').map((feature) => feature.id),
  );
  const items = [];
  const seenFeatureIds = new Set();
  for (const spec of specFeatures) {
    const reverseId = typeof spec.featureId === 'string' && featureIds.has(spec.featureId)
      ? spec.featureId
      : null;
    const featureId = reverseId || (featureIds.has(spec.id) ? spec.id : null);
    if (!featureId || coveredFeatureIds.has(featureId) || seenFeatureIds.has(featureId)) continue;
    seenFeatureIds.add(featureId);
    const item = {
      id: `WORK-${featureId}-SPEC`,
      featureDefinitionId: featureId,
      title: spec.title || spec.id,
      workType: 'unspecified',
      releaseId: 'unassigned',
      status: SPEC_BASE_STATUSES.has(spec.status) ? spec.status : 'planned',
      taskRefs: [spec.spec_link],
      evidenceRefs: [],
      source: 'spec-scan',
    };
    if (spec.progress) item.tasks = { done: spec.progress.done, total: spec.progress.total };
    if (spec.status === 'on-hold') {
      item.hold = { active: true, reason: 'spec on-hold', releaseCondition: 'spec 상태 전이로 해제' };
    }
    // spec 축의 검증 체크리스트 완료는 work item 축의 acceptance 근거로 투영한다.
    const verification = spec.delivery?.verification;
    if (verification?.recorded && verification.total > 0 && verification.done === verification.total) {
      item.requiredAcceptanceCriterionIds = ['SPEC-VERIFICATION'];
      item.acceptanceResults = [{ criterionId: 'SPEC-VERIFICATION', status: 'passed' }];
      item.evidenceRefs = [`${spec.spec_link}/verification.md`];
    }
    items.push(item);
  }
  return items;
}

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

export function buildWorkspaceHubModel({
  id,
  title,
  kind,
  badge = '',
  source = {},
  features = [],
  serviceDefinition = { sourcePath: '', columns: [], rows: [], warning: '' },
  sitemap = null,
  traceability = null,
  userFlows = null,
  featureDetails = [],
  decisions = [],
  needs = [],
  verificationIds = [],
  planningManifest = null,
  deliveryEvidence = null,
  featureWorkItems = [],
  featureRollups = {},
  workItemHealth = [],
  changeProposals = [],
  syncResult = null,
  health = [],
} = {}) {
  const safeFeatures = clone(features) || [];
  const safeServiceDefinition = clone(serviceDefinition);
  const safeSitemap = clone(sitemap);
  const safeTraceability = clone(traceability);
  const safeUserFlows = clone(userFlows);
  const linkedHub = buildLinkedHubModel({
    features: safeFeatures,
    rows: safeServiceDefinition.rows || [],
    sitemap: safeSitemap,
    traceability: safeTraceability,
    userFlows: safeUserFlows,
    needs,
    verificationIds,
  });
  return {
    id,
    title,
    kind,
    badge,
    source: clone(source),
    features: safeFeatures,
    serviceDefinition: safeServiceDefinition,
    featureDetails: clone(featureDetails) || [],
    decisions: clone(decisions) || [],
    needs: clone(needs) || [],
    sitemap: safeSitemap,
    traceability: safeTraceability,
    userFlows: safeUserFlows,
    linkedHub,
    planningManifest: clone(planningManifest),
    deliveryEvidence: clone(deliveryEvidence),
    featureWorkItems: clone(featureWorkItems) || [],
    featureRollups: clone(featureRollups) || {},
    workItemHealth: clone(workItemHealth) || [],
    changeProposals: clone(changeProposals) || [],
    syncResult: clone(syncResult),
    health: clone(health) || [],
  };
}

function readJson(path, fallback, health) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    health.push({ code: 'workspace-source-invalid', source: path, message: error.message, action: '원본 JSON을 수정하세요.' });
    return fallback;
  }
}


// planningSource가 신형 카탈로그를 갖고 있으면 planning 전체 경로 대상이다.
// 레거시 21필드 행만 있는 파일과 파싱 불가 파일은 false — 기존 spec 경로 유지.
export function hasPlanningCatalog(workspace) {
  if (!workspace?.rootPath) return false;
  const path = join(workspace.rootPath, workspace.planningSource || 'planning', 'feature-definitions.json');
  if (!existsSync(path)) return false;
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'));
    return Array.isArray(parsed) && parsed.some(isCatalogRecord);
  } catch {
    return false;
  }
}

export function loadPlanningWorkspace(workspace) {
  const health = [];
  const planningRoot = join(workspace.rootPath, workspace.planningSource || 'planning');
  const deliveryRoot = join(workspace.rootPath, workspace.deliverySource || 'downstream');
  const features = readJson(join(planningRoot, 'feature-definitions.json'), [], health);
  const detailScan = scanFeatureDetails(readJson(join(planningRoot, 'feature-details.json'), [], health), { catalog: features });
  health.push(...detailScan.health);
  const serviceDefinition = {
    sourcePath: join(planningRoot, 'feature-definitions.json'),
    columns: SERVICE_DEFINITION_COLUMNS,
    rows: catalogAsLegacyRows(features),
    warning: '',
  };
  const decisions = readJson(join(planningRoot, 'decisions.json'), [], health);
  const needs = readJson(join(planningRoot, 'needs.json'), [], health);
  const planningManifest = readJson(join(planningRoot, 'planning-manifest.json'), null, health);
  const planningLock = readJson(join(deliveryRoot, 'planning.lock.json'), null, health);
  const deliveryEvidence = readJson(join(deliveryRoot, 'delivery-evidence.json'), null, health);
  const normalizedWorkItems = normalizeFeatureWorkItems({ features, evidence: deliveryEvidence });
  const coveredFeatureIds = new Set(normalizedWorkItems.items.map((item) => item.featureDefinitionId));
  const existingItemIds = new Set(normalizedWorkItems.items.map((item) => item.id));
  const { features: specFeatures } = scanSpecs(deliveryRoot);
  const specProjectedItems = projectSpecDelivery({ specFeatures, features, coveredFeatureIds })
    .filter((item) => !existingItemIds.has(item.id));
  const verificationIds = specFeatures
    .filter((spec) => spec.delivery?.verification?.recorded)
    .map((spec) => spec.id);
  const workItems = [...normalizedWorkItems.items, ...specProjectedItems];
  const featureRollups = aggregateAllFeatures({ features, items: workItems });
  const aggregationHealth = Object.values(featureRollups).flatMap((rollup) => rollup.health || []);
  const workItemHealth = [...normalizedWorkItems.health, ...aggregationHealth];
  health.push(...workItemHealth);
  const declaredProposals = readJson(join(deliveryRoot, 'change-proposals.json'), [], health);
  const sitemap = readJson(join(planningRoot, 'sitemap.json'), null, health);
  const traceability = readJson(join(planningRoot, 'feature-relations.json'), null, health);
  const userFlows = readJson(join(planningRoot, 'user-flows.json'), null, health);
  let syncResult = null;
  if (planningManifest && planningLock && deliveryEvidence) {
    const generatedAt = deliveryEvidence.collectedAt ?? null;
    try {
      syncResult = reconcilePlanningDelivery({
        workspaceId: workspace.id,
        manifest: planningManifest,
        lock: planningLock,
        evidence: deliveryEvidence,
        generatedAt,
      });
    } catch (error) {
      syncResult = reconcilePlanningDelivery({
        workspaceId: workspace.id,
        manifest: planningManifest,
        lock: planningLock,
        evidence: deliveryEvidence,
        collectionError: error,
        generatedAt,
      });
      health.push({ code: 'workspace-reconcile-failed', source: deliveryRoot, message: error.message, action: 'Planning Lock과 Delivery Evidence를 확인하세요.' });
    }
  }
  const source = {
    root: workspace.root,
    planningSource: workspace.planningSource,
    deliverySource: workspace.deliverySource,
    health: hasSourceHealthIssue(health) ? 'invalid' : 'available',
  };
  return buildWorkspaceHubModel({
    ...workspace,
    source,
    features,
    serviceDefinition,
    featureDetails: detailScan.details,
    decisions,
    needs,
    verificationIds,
    sitemap,
    traceability,
    userFlows,
    planningManifest,
    deliveryEvidence,
    featureWorkItems: workItems,
    featureRollups,
    workItemHealth,
    changeProposals: declaredProposals.length ? declaredProposals : syncResult?.proposals || [],
    syncResult,
    health,
  });
}
