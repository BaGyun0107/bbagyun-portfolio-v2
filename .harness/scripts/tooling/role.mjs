#!/usr/bin/env node
// 개발자별 role 마커 관리 (.harness/state/dev-role, git-ignored).
// project-profile-guard.mjs가 이 마커를 읽어 상대 앱 영역 "쓰기"를 차단한다.
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const ROLES = ["front", "back", "fullstack"];
const markerPath = join(process.cwd(), ".harness", "state", "dev-role");
const command = (process.argv[2] || "show").toLowerCase();

function readRole() {
  if (!existsSync(markerPath)) return "";
  return readFileSync(markerPath, "utf8").trim().toLowerCase();
}

if (command === "show") {
  const role = readRole();
  if (!role) {
    console.log("dev-role: (미설정) — 제한 없음");
  } else {
    console.log(`dev-role: ${role}`);
  }
  process.exit(0);
}

if (command === "clear") {
  if (existsSync(markerPath)) unlinkSync(markerPath);
  console.log("dev-role 마커를 제거했습니다 (제한 없음).");
  process.exit(0);
}

if (ROLES.includes(command)) {
  mkdirSync(dirname(markerPath), { recursive: true });
  writeFileSync(markerPath, `${command}\n`);
  if (command === "front") {
    console.log("dev-role=front: 이 머신에서 apps/back 쓰기가 차단됩니다 (읽기는 허용).");
  } else if (command === "back") {
    console.log("dev-role=back: 이 머신에서 apps/front 쓰기가 차단됩니다 (읽기는 허용).");
  } else {
    console.log("dev-role=fullstack: 양쪽 앱 영역 모두 허용됩니다.");
  }
  process.exit(0);
}

console.error(`사용법: ./harness role [show|front|back|fullstack|clear]`);
process.exit(1);
