#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const args = process.argv.slice(2);

function usage() {
  console.error("usage: codex-replay-check.mjs <transcript.md> [...]");
  console.error("       cat transcript.md | codex-replay-check.mjs -");
}

function readInput(path) {
  if (path === "-") {
    return readFileSync(0, "utf8");
  }
  if (!existsSync(path)) {
    throw new Error(`${path} does not exist`);
  }
  return readFileSync(path, "utf8");
}

function normalize(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .toLowerCase();
}

function hasSplitWork(text) {
  return (
    /next\s*\+\s*nest/.test(text) ||
    /split[- ]front[- ]back/.test(text) ||
    /split\s+(front|frontend)\s*\/\s*(back|backend)/.test(text) ||
    /(front|frontend)\s*\/\s*(back|backend)/.test(text) ||
    (/apps\/front/.test(text) && /apps\/back/.test(text)) ||
    (/frontend/.test(text) && /backend/.test(text) && /nest/.test(text))
  );
}

function hasProjectProfileUse(text) {
  return /\.harness\/config\/project-profile\.yaml|project[- ]profile|project profile|mode:\s*(split-front-back|next-fullstack|frontend-only|backend-only)|split-front-back.*(?:allows|allowed|허용)/.test(
    text,
  );
}

function hasLargeDeclaration(text) {
  return /size:\s*(large|extra large|extra-large)/.test(text);
}

function hasImplementationIntent(text) {
  return /scaffold|implementation|editing implementation|write files|touching files|apply_patch|코드|구현/.test(
    text,
  );
}

function hasCodiPhaseRoutingUse(text) {
  return /codi-phase-routing|codex medium\+ checklist|spec\?\s+unchecked tasks\?\s+subagents\?/.test(
    text,
  );
}

function mentionsSpecState(text) {
  return /specs\/[^\s]*\/tasks\.md|specs\/[^\s]* exists|unchecked (tasks?|items?)|\.specify\/?\s+(state|exists)|specs\/?\s+(exists|state|있어서|존재|current state|진행 상태|상태)|specs\/(이|가) 있어서|specs\/의 현재 상태/.test(
    text,
  );
}

function hasSpecKitInvocation(text) {
  // 현행 표기는 hyphen(speckit-specify)이지만, 과거 트랜스크립트의 dotted
  // 표기도 증거로 인정한다 (replay 대상은 역사 기록일 수 있음).
  return /speckit[.-](specify|clarify|plan|tasks|analyze|implement|converge)/.test(
    text,
  );
}

function hasSpecResume(text) {
  return /resum\w+[^\n]{0,80}(unchecked|tasks\.md)|(unchecked|tasks\.md)[^\n]{0,80}resum\w+|adopt\w+[^\n]{0,60}unchecked task/.test(
    text,
  );
}

function hasSpecKitUse(text) {
  return hasSpecKitInvocation(text) || hasSpecResume(text);
}

function hasSpecSkimOnly(text) {
  return /ran (ls|cat|head|tail) [^\n]*specs\/|read specs\/[^\n]*\.md|skimm\w+ [^\n]*(spec|tasks)/.test(
    text,
  );
}

function hasSpecKitUnavailableExemption(text) {
  return /spec kit (command surface )?(is )?unavailable|speckit[^\n]{0,40}unavailable|cannot use [^\n]{0,40}spec kit|spec kit[^\n]{0,40}not (available|installed)|specify (cli|command)[^\n]{0,40}not (available|installed)/.test(
    text,
  );
}

function hasManualSpecCreation(text) {
  return /mkdir\s+-p\s+specs\/|create (the )?durable spec|write (the )?durable spec|(write|writing) specs\/[^\n]{0,80}(spec|plan|tasks)\.md/.test(
    text,
  );
}

function hasLegacyPlanningCreation(text) {
  // 폐기 결정(2026-07-07) 이후 .planning 하위는 audits 포함 전부 무효
  // 목적지다 — 감사 기록은 docs/audits/ 로 간다. 예외 lookahead 없음.
  return /mkdir\s+-p\s+\.planning|\.planning\/phases\/[^\n]*plan\.md|(create|write|record) (the )?durable \.planning/.test(
    text,
  );
}

function hasLargeDownshift(text) {
  return /small mock[- ]data scaffold|small mock data scaffold|mock[- ]data[- ]only exemption|not creating unnecessary durable files|unnecessary durable files|small scaffold[^\n]{0,60}skip (the )?spec|small scaffold[^\n]{0,60}durable/.test(
    text,
  );
}

function hasConcreteInlineFallbackReason(text) {
  return /decline|declined|denied|거절|runtime|tool limitation|tool policy|spawn.*not permitted|subagent.*not permitted|권한|제한/.test(
    text,
  );
}

function hasNoCommitInstruction(text) {
  return /do not commit|don't commit|no commit|커밋은 하지 마|커밋하지 마|커밋하지말/.test(
    text,
  );
}

function hasCommitExecution(text) {
  return /ran\s+git\s+commit|git\s+commit\s+-m|committed\s+[a-f0-9]{7,}|commit created|커밋 완료|커밋했습니다/.test(
    text,
  );
}

function hasImplementationAfterAsk(rawText) {
  const askMatch = /selected action\s*:\s*ask/i.exec(rawText);
  if (!askMatch) {
    return false;
  }

  const afterAsk = normalize(rawText.slice(askMatch.index + askMatch[0].length));
  return /(?:i'm|i am|i'll|i will|now|next|이제|다음).{0,160}(?:scaffold|edit|write|add|touch|implement|구현|작성|수정)|ran\s+mkdir\s+-p\s+(?:\.planning|specs\/)|apply_patch/.test(
    afterAsk,
  );
}

function hasPostHocPlanning(rawText) {
  const text = normalize(rawText);
  const implementationMatch =
    /(?:file_change|files? added|파일 (?:편집|추가)|구현 방식을 고정|implementation files?|apps\/back package\.json|apps\/front package\.json|pnpm --dir apps\/(?:front|back) install)/.exec(
      text,
    );
  if (!implementationMatch) {
    return false;
  }

  const afterImplementation = text.slice(
    implementationMatch.index + implementationMatch[0].length,
  );
  return /(?:specs\/|\.planning).{0,120}(?:record|handoff|summary|plan|기록|요약|차단 사유|다음 세션)|(?:record|handoff|summary|plan|기록|요약).{0,120}(?:specs\/|\.planning)/.test(
    afterImplementation,
  );
}

function checkTranscript(label, rawText) {
  const text = normalize(rawText);
  const failures = [];

  if (text.trim().length === 0) {
    failures.push("Transcript is empty.");
  }

  if (/\.\/harness progress/.test(text) || /command named\s+progress\s+is not present/.test(text)) {
    failures.push(
      "Planning state was probed through the removed repo-local ./harness progress command; resume unchecked specs/*/tasks.md items or run speckit-specify instead.",
    );
  }

  if (hasNoCommitInstruction(text) && hasCommitExecution(text)) {
    failures.push(
      "Transcript committed despite an explicit no-commit instruction.",
    );
  }

  if (/no existing specs\//.test(text) && /no[- ]spec/.test(text)) {
    failures.push(
      "Absence of specs/ was used as a no-spec signal; Medium+ app work must run speckit-specify before implementation.",
    );
  }

  if (hasLargeDeclaration(text) && hasSplitWork(text) && hasImplementationIntent(text)) {
    if (!hasProjectProfileUse(text)) {
      failures.push(
        "Large app/split work proceeded without evidence that `.harness/config/project-profile.yaml` was read or applied.",
      );
    }

    if (!hasCodiPhaseRoutingUse(text)) {
      failures.push(
        "Large split frontend/backend work proceeded without evidence that `codi-phase-routing` was loaded or applied.",
      );
    }

    if (!hasSpecKitUse(text) && !hasSpecKitUnavailableExemption(text)) {
      failures.push(
        "Large split frontend/backend scaffold proceeded without Spec Kit flow use (speckit-specify or resuming unchecked tasks.md) or an explicit Spec-Kit-unavailable exemption.",
      );
    }
  }

  if (hasLargeDeclaration(text) && hasSplitWork(text) && /subagent decision:/i.test(rawText)) {
    if (!hasProjectProfileUse(text)) {
      failures.push(
        "Split app subagent routing was decided without evidence that the project profile allowed the frontend/backend surfaces.",
      );
    }

    if (!hasCodiPhaseRoutingUse(text)) {
      failures.push(
        "Split app subagent routing was decided without evidence that `codi-phase-routing` was loaded or applied.",
      );
    }

    if (!hasSpecKitUse(text) && !hasSpecKitUnavailableExemption(text)) {
      failures.push(
        "Split app subagent routing was decided before invoking `speckit-specify` or resuming unchecked `tasks.md` items, without a Spec-Kit-unavailable exemption.",
      );
    }
  }

  if (
    hasLargeDeclaration(text) &&
    hasSplitWork(text) &&
    hasSpecSkimOnly(text) &&
    !hasSpecKitUse(text) &&
    !hasSpecKitUnavailableExemption(text)
  ) {
    failures.push(
      "Spec files were skimmed without adopting their unchecked tasks.md items; skimming spec files is not resuming the feature.",
    );
  }

  if (hasLargeDeclaration(text) && hasSplitWork(text) && mentionsSpecState(text)) {
    if (!hasSpecKitUse(text) && !hasSpecKitUnavailableExemption(text)) {
      failures.push(
        "Existing specs/ state was acknowledged for Large split work without resuming its unchecked tasks.md items or an explicit Spec-Kit-unavailable exemption.",
      );
    }
  }

  if (hasLargeDeclaration(text) && hasLargeDownshift(text)) {
    failures.push(
      "Transcript downshifted a declared Large split/scaffold task into a small/mock-data exemption to skip durable spec state.",
    );
  }

  if (hasManualSpecCreation(text) && !hasSpecKitInvocation(text)) {
    failures.push(
      "Transcript manually created specs/ artifacts without evidence of the Spec Kit flow (speckit-specify/plan/tasks).",
    );
  }

  if (hasLegacyPlanningCreation(text)) {
    failures.push(
      "Transcript created legacy .planning/ phase artifacts; .planning/ is scheduled for removal (docs/audits/2026-07-07-planning-retirement.md) — route durable planning through the Spec Kit specs/ flow.",
    );
  }

  if (hasLargeDeclaration(text) && hasSplitWork(text) && hasPostHocPlanning(rawText)) {
    failures.push(
      "The spec directory was updated only after implementation; Medium+ split app work must run the Spec Kit planning stages before code.",
    );
  }

  if (hasSplitWork(text) && hasImplementationIntent(text)) {
    if (!/subagent decision:/i.test(rawText)) {
      failures.push(
        "Split frontend/backend implementation proceeded without a `Subagent decision:` block.",
      );
    }
  }

  if (/subagent decision:/i.test(rawText)) {
    for (const [field, pattern] of [
      ["workstreams", /workstreams?\s*:/i],
      ["authorization", /authorization(?:\s+source)?\s*:/i],
      ["context boundary", /context boundar(?:y|ies)\s*:/i],
    ]) {
      if (!pattern.test(rawText)) {
        failures.push(`\`Subagent decision:\` must include \`${field}:\`.`);
      }
    }

    if (!/selected action\s*:\s*(spawn|ask|inline fallback)/i.test(rawText)) {
      failures.push(
        "`Subagent decision:` must include `selected action: spawn|ask|inline fallback`.",
      );
    }

    if (hasImplementationAfterAsk(rawText)) {
      failures.push(
        "`selected action: ask` must stop before implementation or file edits.",
      );
    }

    if (/selected action\s*:\s*inline fallback/i.test(rawText) && !hasConcreteInlineFallbackReason(text)) {
      failures.push(
        "`inline fallback` requires a user denial or concrete runtime/tool limitation.",
      );
    }
  }

  if (failures.length === 0) {
    console.log(`ok: ${label}`);
    return 0;
  }

  console.log(`fail: ${label}`);
  for (const failure of failures) {
    console.log(`- ${failure}`);
  }
  return failures.length;
}

if (args.length === 0) {
  usage();
  process.exit(2);
}

let failures = 0;
for (const path of args) {
  try {
    failures += checkTranscript(path, readInput(path));
  } catch (error) {
    failures += 1;
    console.log(`fail: ${path}`);
    console.log(`- ${error.message}`);
  }
}

if (failures > 0) {
  console.log(`\nCodex replay check complete: ${failures} failure(s)`);
  process.exit(1);
}

console.log("\nCodex replay check complete: 0 failure(s)");
