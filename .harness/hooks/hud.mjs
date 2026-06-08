#!/usr/bin/env node
import { readFileSync } from "node:fs";

const dim = (value) => `\x1b[2m${value}\x1b[22m`;
const bold = (value) => `\x1b[1m${value}\x1b[22m`;
const green = (value) => `\x1b[32m${value}\x1b[39m`;
const yellow = (value) => `\x1b[33m${value}\x1b[39m`;
const red = (value) => `\x1b[31m${value}\x1b[39m`;
const cyan = (value) => `\x1b[36m${value}\x1b[39m`;

function colorByThreshold(value, text) {
  if (value >= 85) return red(text);
  if (value >= 70) return yellow(text);
  return green(text);
}

function readInput() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return {};
  }
}

function shortModel(model) {
  const name = model?.display_name || model?.id || "";
  if (!name) return "";

  const claudeMatch = name.match(/(Opus|Sonnet|Haiku)[\s.]*([\d.]*)/i);
  if (claudeMatch) {
    return `${claudeMatch[1]}${claudeMatch[2] ? ` ${claudeMatch[2]}` : ""}`;
  }

  const gptMatch = name.match(/(gpt[-\s]?\d(?:\.\d)?(?:[-\s]?\w+)?)/i);
  if (gptMatch) return gptMatch[1].replace(/\s+/g, "-");

  return name.split("/").pop()?.slice(0, 18) || "";
}

function formatCountdown(resetsAt) {
  const remaining = new Date(resetsAt).getTime() - Date.now();
  if (remaining <= 0) return "";
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  return hours > 0 ? `${hours}h${minutes}m` : `${minutes}m`;
}

function formatRateLimit(label, rateLimit) {
  if (!rateLimit || rateLimit.used_percentage == null) return null;
  const percentage = Math.round(rateLimit.used_percentage);
  const countdown = rateLimit.resets_at ? formatCountdown(rateLimit.resets_at) : "";
  const text = countdown
    ? `${label}:${percentage}%(${countdown})`
    : `${label}:${percentage}%`;
  return colorByThreshold(percentage, text);
}

function main() {
  const input = readInput();
  const parts = [bold(cyan("[CODI]"))];

  const model = shortModel(input.model);
  if (model) parts.push(dim(model));

  const contextPercentage = input.context_window?.used_percentage;
  if (contextPercentage != null) {
    parts.push(colorByThreshold(contextPercentage, `ctx:${Math.round(contextPercentage)}%`));
  }

  const cost = input.cost?.total_cost_usd;
  if (cost != null && cost > 0) {
    parts.push(dim(`$${cost.toFixed(2)}`));
  }

  const fiveHour = formatRateLimit("5h", input.rate_limits?.five_hour);
  const sevenDay = formatRateLimit("7d", input.rate_limits?.seven_day);
  if (fiveHour || sevenDay) {
    parts.push([fiveHour, sevenDay].filter(Boolean).join(dim(" ")));
  }

  const added = input.cost?.total_lines_added;
  const removed = input.cost?.total_lines_removed;
  if (added || removed) {
    const diffParts = [];
    if (added) diffParts.push(green(`+${added}`));
    if (removed) diffParts.push(red(`-${removed}`));
    parts.push(diffParts.join(dim("/")));
  }

  process.stdout.write(parts.join(dim(" │ ")));
}

main();
