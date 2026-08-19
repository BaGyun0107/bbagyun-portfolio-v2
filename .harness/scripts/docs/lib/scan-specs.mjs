// specs/*/status.yaml을 읽고 tasks.md 진행률을 계산 (FR-006/007/016).
// 잘못된/누락 파일은 경고하고 건너뛴다.

import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseYamlLite } from './yaml-lite.mjs';
import { STATUSES, PHASES } from './constants.mjs';
import { parseSpecDetail } from './parse-spec-detail.mjs';

function inspectChecklist(path) {
  if (!existsSync(path)) return { recorded: false, done: 0, total: 0, firstOpen: null };
  let text = '';
  try {
    text = readFileSync(path, 'utf8');
  } catch {
    return { recorded: false, done: 0, total: 0, firstOpen: null };
  }
  let done = 0;
  let total = 0;
  let firstOpen = null;
  for (const line of text.split('\n')) {
    if (/^\s*- \[[ xX]\]/.test(line)) {
      total += 1;
      if (/^\s*- \[[xX]\]/.test(line)) done += 1;
      else if (!firstOpen) firstOpen = line.replace(/^\s*- \[ \]\s*/, '').trim();
    }
  }
  return { recorded: total > 0, done, total, firstOpen };
}

function deliveryEvidence(dir, data, specMarkdown) {
  const tasks = inspectChecklist(join(dir, 'tasks.md'));
  const verification = inspectChecklist(join(dir, 'verification.md'));
  const openDecisions = Array.isArray(data.open_decisions) ? data.open_decisions.length : 0;
  const clarificationMarkers = (specMarkdown.match(/\[NEEDS CLARIFICATION:/g) || []).length;
  const openDecisionCount = openDecisions + clarificationMarkers;
  const history = Array.isArray(data.history) ? data.history : [];
  const last = history.length > 0 ? history[history.length - 1] : null;
  const progress = tasks.total > 0 ? { done: tasks.done, total: tasks.total } : null;
  const verificationModel = verification.recorded
    ? {
      recorded: true,
      done: verification.done,
      total: verification.total,
      percent: Math.round((verification.done / verification.total) * 100),
    }
    : { recorded: false, done: 0, total: 0, percent: 0 };
  return {
    progress,
    delivery: {
      nextAction: tasks.firstOpen,
      lastTransition: last && last.at && last.to ? { at: last.at, to: last.to } : null,
      openDecisionCount,
      verification: verificationModel,
      doneEligible: Boolean(
        progress
        && progress.total > 0
        && progress.done === progress.total
        && verificationModel.recorded
        && verificationModel.done === verificationModel.total
        && openDecisionCount === 0
      ),
    },
  };
}

function readMarkdown(path) {
  if (!existsSync(path)) return '';
  try {
    return readFileSync(path, 'utf8').slice(0, 50000);
  } catch {
    return '';
  }
}

export function scanSpecs(specsDir) {
  const features = [];
  const warnings = [];

  let dirs;
  try {
    dirs = readdirSync(specsDir);
  } catch {
    return { features, warnings }; // specs 경로 없음
  }

  for (const name of dirs) {
    const dir = join(specsDir, name);
    let st;
    try {
      st = statSync(dir);
    } catch {
      continue;
    }
    if (!st.isDirectory()) continue;

    const statusPath = join(dir, 'status.yaml');
    if (!existsSync(statusPath)) continue; // status 없는 spec은 대시보드 대상 아님

    const { data, warnings: pw } = parseYamlLite(readFileSync(statusPath, 'utf8'));
    for (const w of pw) warnings.push(`${name}: ${w}`);

    // 필수 필드 + enum 검증 (FR-016)
    if (!data.id || !data.title) {
      warnings.push(`${name}: id 또는 title 누락 — 건너뜀`);
      continue;
    }
    if (!STATUSES.includes(data.status)) {
      warnings.push(`${name}: 잘못된 status '${data.status}' — 건너뜀`);
      continue;
    }
    if (data.phase && !PHASES.includes(data.phase)) {
      warnings.push(`${name}: 잘못된 phase '${data.phase}'`);
    }
    if (!Array.isArray(data.owner_roles) || data.owner_roles.length === 0) {
      warnings.push(`${name}: owner_roles 비어 있음 — 담당 미정으로 표시`);
    }
    // 선택 필드 featureId — spec→기능 역방향 연결 (011). 빈 값/비문자열은 무시.
    if (data.featureId !== undefined && (typeof data.featureId !== 'string' || !data.featureId.trim())) {
      warnings.push(`${name}: featureId는 비어 있지 않은 문자열이어야 함 — 무시`);
      delete data.featureId;
    }

    const specMarkdown = readMarkdown(join(dir, 'spec.md'));
    const { progress, delivery } = deliveryEvidence(dir, data, specMarkdown);
    features.push({
      ...data,
      spec_link: `specs/${data.id}`,
      progress,
      delivery,
      spec_markdown: specMarkdown,
      spec_detail: parseSpecDetail(specMarkdown),
    });
  }

  return { features, warnings };
}
