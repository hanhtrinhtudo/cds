import assert from "node:assert/strict";
import { runStagingScenario } from "./staging-migration.test.mjs";

const first = await runStagingScenario();
assert.equal(first.status, "PASS");
assert.deepEqual(first.reconciliation, {
  source: 8,
  imported: 8,
  skipped: 0,
  duplicate: 0,
  invalid: 0,
  checksumMatch: true,
  missingReferences: 0,
  constraints: { count: 8, nullTopic: 0, nullQuestion: 0, badOptions: 0, missingTopic: 0 }
});
assert.equal(first.rollback.status, "PASS");
assert.equal(first.rollback.backupBaselineCount, first.rollback.restoredCount);

const second = await runStagingScenario();
assert.equal(second.status, "PASS");
assert.deepEqual(second.reconciliation, first.reconciliation);
assert.deepEqual(second.rollback, first.rollback);
assert.equal(second.import.checksum.targetNormalizedPayloadSha256, first.import.checksum.targetNormalizedPayloadSha256);

console.log(JSON.stringify({
  status: "PASS",
  deterministicRuns: 2,
  reconciliation: second.reconciliation,
  rollback: second.rollback,
  targetChecksumStable: true,
  productionImport: "BLOCKED"
}, null, 2));

