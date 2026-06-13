#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const guardPath = path.join(root, "scripts/team-beta-signoff-guard.mjs");
const baseRecord = fs.readFileSync(path.join(root, "docs/team-beta-signoff-record.md"), "utf8");
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tjc-team-beta-signoff-"));
const failures = [];

function writeFixture(name, source) {
  const filePath = path.join(tempDir, `${name}.md`);
  fs.writeFileSync(filePath, source);
  return filePath;
}

function runGuard(filePath) {
  return spawnSync(process.execPath, [guardPath, filePath], {
    cwd: root,
    encoding: "utf8"
  });
}

function expectPass(label, source) {
  const result = runGuard(writeFixture(label, source));
  if (result.status !== 0) failures.push(`${label} should pass:\n${result.stderr || result.stdout}`);
}

function expectFail(label, source) {
  const result = runGuard(writeFixture(label, source));
  if (result.status === 0) failures.push(`${label} should fail but passed:\n${result.stdout}`);
}

const noGoRecord = baseRecord
  .replace("Decision: GO", "Decision: NO-GO")
  .replace(/^Current status:.*$/m, "Current status: **NO-GO until this record is complete.**");

const incompleteGo = baseRecord
  .replace(/^Named tester count:.*$/m, "Named tester count:")
  .replace(/^Stable URL only confirmed: Yes$/m, "Stable URL only confirmed: Yes / No");

const partialGoWithFinalBlock = baseRecord
  .replace(
    /^\| Seed\/media safety \|.*\|$/m,
    "| Seed/media safety | Hali/requester partial consent | 2026-06-11T21:23:01Z | Human response captured; final reviewer evidence still required. | Partial; final invite GO not approved | Preview-only consent captured; reviewer evidence fields still need final send approval. |"
  );

expectPass("current-record", baseRecord);
expectPass("no-go-record", noGoRecord);
expectFail("incomplete-go", incompleteGo);
expectFail("partial-go-with-final-block", partialGoWithFinalBlock);

if (failures.length) {
  console.error("Team Beta signoff guard self-test failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Team Beta signoff guard self-test passed.");
