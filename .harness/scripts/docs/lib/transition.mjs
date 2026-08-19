// 상태 전이 판정 + 비차단 자동 힌트 (FR-009~011, data-model 상태머신).

import { STATUSES, FORWARD_ORDER } from './constants.mjs';

// 유효 전이 판정. { ok, reason?, warning? } 반환.
export function validateTransition(from, to, opts = {}) {
  if (!STATUSES.includes(to)) {
    return { ok: false, reason: `잘못된 대상 상태: ${to}` };
  }
  if (from === to) {
    return { ok: false, reason: `이미 ${to} 상태입니다` };
  }
  if (to === 'on-hold' || from === 'on-hold') {
    return { ok: true }; // 어디서든 보류 진입 / 보류에서 복귀
  }
  if (opts.force) {
    return { ok: true };
  }

  const fi = FORWARD_ORDER.indexOf(from);
  const ti = FORWARD_ORDER.indexOf(to);
  if (fi === -1 || ti === -1) {
    return { ok: false, reason: `정의되지 않은 전이: ${from} → ${to}` };
  }
  if (ti === fi + 1) {
    return { ok: true }; // 인접 정방향
  }
  if (ti < fi) {
    return { ok: true, warning: `역방향 전이(${from} → ${to}) — 되돌리기로 진행합니다` };
  }
  return { ok: false, reason: `정의되지 않은 점프: ${from} → ${to} (--force로 강제 가능)` };
}

// 비차단 자동 힌트 (FR-010). specFeatures는 scan-specs 결과. 파일 자동 변경 없음.
export function collectHints(specFeatures, root) {
  const hints = [];

  for (const f of specFeatures || []) {
    // 조건 A: tasks 전부 완료인데 아직 in-progress → in-review 제안
    if (f.status === 'in-progress' && f.progress && f.progress.total > 0 && f.progress.done === f.progress.total) {
      hints.push(`${f.id}: 작업 완료됨. in-review로 전이하려면 \`mise run feature:status ${f.id} in-review\``);
    }
    // 조건 B: in-review는 durable delivery evidence 전체가 충족될 때만 done 제안
    if (f.status === 'in-review' && f.delivery?.doneEligible) {
      hints.push(`${f.id}: 작업 완료 · 검증 100% · 열린 결정 0건. done으로 전이 제안 — \`mise run feature:status ${f.id} done\``);
    } else if (f.status === 'in-review' && f.delivery) {
      const gaps = [];
      if (!f.progress || f.progress.total === 0 || f.progress.done !== f.progress.total) {
        gaps.push(`작업 ${f.progress?.done || 0}/${f.progress?.total || 0}`);
      }
      const verification = f.delivery.verification;
      if (!verification?.recorded) gaps.push('검증 기록 없음');
      else if (verification.done !== verification.total) gaps.push(`검증 ${verification.done}/${verification.total}`);
      if (f.delivery.openDecisionCount > 0) gaps.push(`열린 결정 ${f.delivery.openDecisionCount}건`);
      if (gaps.length) hints.push(`${f.id}: done 근거 보완 필요 — ${gaps.join(' · ')}`);
    }
  }
  return hints;
}
