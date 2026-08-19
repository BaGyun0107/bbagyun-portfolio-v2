#!/usr/bin/env node
// Playwright MCP 등록·버전 핀 패리티 점검 (Claude ~/.claude.json + Codex ~/.codex/config.toml)
// 기본 실행은 비차단(항상 exit 0, 경고 출력), --strict는 미충족 시 exit 1.
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { isMain } from '../docs/lib/is-main.mjs';

export const PINNED_MCP_VERSION = '0.0.79';
const PIN_SPEC = `@playwright/mcp@${PINNED_MCP_VERSION}`;

function checkArgs(command, args) {
  const registered = command === 'npx' && Array.isArray(args)
    && args.some((a) => typeof a === 'string' && a.startsWith('@playwright/mcp'));
  const pinnedOk = registered && args.includes(PIN_SPEC);
  return { registered, pinnedOk };
}

function checkClaude(configPath) {
  try {
    if (!existsSync(configPath)) return { registered: false, pinnedOk: false };
    const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
    const entry = cfg?.mcpServers?.playwright;
    if (!entry) return { registered: false, pinnedOk: false };
    return checkArgs(entry.command, entry.args);
  } catch {
    return { registered: false, pinnedOk: false };
  }
}

function checkCodex(configPath) {
  try {
    if (!existsSync(configPath)) return { registered: false, pinnedOk: false };
    const text = readFileSync(configPath, 'utf8');
    // TOML 전체 파서 대신 [mcp_servers.playwright] 섹션만 라인 단위로 읽는다
    const lines = text.split('\n');
    const start = lines.findIndex((l) => l.trim() === '[mcp_servers.playwright]');
    if (start < 0) return { registered: false, pinnedOk: false };
    let command = null;
    let args = [];
    for (let i = start + 1; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (line.startsWith('[')) break;
      const cm = line.match(/^command\s*=\s*"([^"]*)"/);
      if (cm) command = cm[1];
      const am = line.match(/^args\s*=\s*\[(.*)\]/);
      if (am) args = [...am[1].matchAll(/"([^"]*)"/g)].map((m) => m[1]);
    }
    return checkArgs(command, args);
  } catch {
    return { registered: false, pinnedOk: false };
  }
}

export function checkMcpRegistration({ claudeConfigPath, codexConfigPath } = {}) {
  const claude = checkClaude(claudeConfigPath ?? join(homedir(), '.claude.json'));
  const codex = checkCodex(codexConfigPath ?? join(homedir(), '.codex', 'config.toml'));
  const ok = claude.registered && claude.pinnedOk && codex.registered && codex.pinnedOk;
  return { ok, claude, codex };
}

function describe(name, r) {
  if (!r.registered) return `${name}: Playwright MCP not registered`;
  if (!r.pinnedOk) return `${name}: registered but not pinned to ${PIN_SPEC}`;
  return `${name}: ok (${PIN_SPEC})`;
}

if (isMain(import.meta.url)) {
  if (process.argv.includes('--version')) {
    console.log(PINNED_MCP_VERSION);
    process.exit(0);
  }
  const result = checkMcpRegistration({});
  const quiet = process.argv.includes('--quiet');
  if (!quiet || !result.ok) {
    console.log(describe('claude', result.claude));
    console.log(describe('codex', result.codex));
  }
  if (!result.ok) {
    console.log(`hint: claude mcp add --scope user playwright -- npx ${PIN_SPEC}`);
    console.log('hint: add [mcp_servers.playwright] to ~/.codex/config.toml');
  }
  process.exit(process.argv.includes('--strict') && !result.ok ? 1 : 0);
}
