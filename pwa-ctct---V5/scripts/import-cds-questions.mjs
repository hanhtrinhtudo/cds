#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const DANGEROUS_FLAGS = new Set([
  "--apply",
  "--execute",
  "--import",
  "--production",
  "--write",
]);

function usage() {
  return `CDS question migration preview (dry-run only)

Usage:
  node scripts/import-cds-questions.mjs [options]

Options:
  --source <path>    CDS questions JSON. Defaults to project-root/cds/data/questions.json.
  --topic-id <id>    Proposed topic mapping for preview only; it is not verified or written.
  --out <path>       Write preview JSON to this file. No database write is possible.
  --strict           Exit non-zero when invalid or duplicate source rows are found.
  --staging-import   Import into an explicitly approved disposable localhost staging DB.
  --batch-id <id>    Required gate7b_ batch identifier for staging import.
  --help             Show this help.
`;
}

function fail(message, exitCode = 1) {
  console.error(JSON.stringify({ mode: "dry-run", error: message }, null, 2));
  process.exit(exitCode);
}

function parseArgs(argv) {
  const parsed = { source: null, topicId: null, out: null, batchId: null, strict: false, stagingImport: false, help: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (DANGEROUS_FLAGS.has(arg)) {
      fail(`Real import remains blocked after Gate 7 design. Unsupported write flag: ${arg}`, 2);
    }
    if (arg === "--strict") {
      parsed.strict = true;
      continue;
    }
    if (arg === "--staging-import") {
      parsed.stagingImport = true;
      continue;
    }
    if (arg === "--help") {
      parsed.help = true;
      continue;
    }

    const matched = arg.match(/^--(source|topic-id|out|batch-id)=(.+)$/);
    if (matched) {
      const [, name, value] = matched;
      parsed[name === "topic-id" ? "topicId" : name === "batch-id" ? "batchId" : name] = value;
      continue;
    }

    if (["--source", "--topic-id", "--out", "--batch-id"].includes(arg)) {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) fail(`Missing value for ${arg}`, 2);
      parsed[arg === "--topic-id" ? "topicId" : arg === "--batch-id" ? "batchId" : arg.slice(2)] = value;
      index += 1;
      continue;
    }

    fail(`Unknown option: ${arg}`, 2);
  }

  return parsed;
}

const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const sqlLiteral = value => `'${String(value).replace(/'/g, "''")}'`;

function stagingSafety() {
  if (process.env.GATE7B_ALLOW_STAGING_IMPORT !== "1") fail("Staging import requires GATE7B_ALLOW_STAGING_IMPORT=1", 3);
  if (process.env.GATE7B_DISPOSABLE_DB !== "1") fail("Staging import requires GATE7B_DISPOSABLE_DB=1", 3);
  if (process.env.GATE7B_FIXTURE_APPROVAL !== "I_UNDERSTAND_THIS_IMPORTS_LOCAL_STAGING_ONLY") fail("Staging import requires the exact Gate 7B approval phrase", 3);
  for (const [label, value] of [["SUPABASE_URL", process.env.SUPABASE_URL], ["staging database URL", process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres"]]) {
    let url;
    try { url = new URL(value || ""); } catch { fail(`${label} is missing or invalid`, 3); }
    if (!localHosts.has(url.hostname)) fail(`${label} must use localhost/127.0.0.1/::1`, 3);
  }
}

async function runLocalPsql(sql, tuplesOnly = false) {
  stagingSafety();
  const url = new URL(process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres");
  const common = ["-X", "-v", "ON_ERROR_STOP=1", ...(tuplesOnly ? ["-t", "-A"] : []), "-c", sql];
  const connection = ["-h", url.hostname, "-p", url.port || "5432", "-U", decodeURIComponent(url.username || "postgres"), "-d", url.pathname.slice(1) || "postgres"];
  try {
    const { stdout } = await execFileAsync(process.env.GATE7B_PSQL_PATH || "psql", [...connection, ...common], { env: { ...process.env, PGPASSWORD: decodeURIComponent(url.password || "") }, maxBuffer: 10 * 1024 * 1024 });
    return stdout.trim();
  } catch (error) {
    if (error.code !== "ENOENT") fail(`Local staging PostgreSQL failed: ${error.stderr?.trim() || error.message}`, 4);
  }
  const { stdout: containerNames } = await execFileAsync("docker", ["ps", "--filter", `publish=${url.port || "5432"}`, "--format", "{{.Names}}"]);
  const container = containerNames.split(/\r?\n/).map(value => value.trim()).find(Boolean);
  if (!container) fail("No local psql executable or disposable PostgreSQL Docker container found", 3);
  const { stdout } = await execFileAsync("docker", ["exec", "-i", container, "psql", "-X", "-v", "ON_ERROR_STOP=1", "-U", decodeURIComponent(url.username || "postgres"), "-d", url.pathname.slice(1) || "postgres", ...(tuplesOnly ? ["-t", "-A"] : []), "-c", sql], { maxBuffer: 10 * 1024 * 1024 });
  return stdout.trim();
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("vi");
}

function normalizeOptions(rawOptions) {
  if (Array.isArray(rawOptions)) {
    return {
      sourceFormat: "array",
      entries: rawOptions.map((text, index) => ({
        key: String.fromCharCode(65 + index),
        text,
      })),
    };
  }

  if (rawOptions && typeof rawOptions === "object") {
    return {
      sourceFormat: "keyed_object",
      entries: Object.entries(rawOptions).map(([key, text]) => ({
        key: key.trim().toUpperCase(),
        text,
      })),
    };
  }

  return { sourceFormat: "invalid", entries: [] };
}

function resolveAnswerIndex(rawAnswer, entries) {
  const answer = String(rawAnswer ?? "").trim();
  if (!answer) return -1;

  const byKey = entries.findIndex(({ key }) => key.toUpperCase() === answer.toUpperCase());
  if (byKey >= 0) return byKey;

  const normalizedAnswer = normalizeText(answer);
  const byText = entries.findIndex(({ text }) => normalizeText(text) === normalizedAnswer);
  if (byText >= 0) return byText;

  if (/^\d+$/.test(answer)) {
    const numericIndex = Number(answer);
    if (numericIndex >= 0 && numericIndex < entries.length) return numericIndex;
  }

  return -1;
}

function validateRow(row, rowIndex, topicId) {
  const errors = [];
  const question = typeof row?.question === "string" ? row.question.trim() : "";
  if (!question) errors.push("question must be a non-empty string");

  const { sourceFormat, entries } = normalizeOptions(row?.options);
  if (sourceFormat === "invalid") {
    errors.push("options must be an array or the CDS A/B/C/D keyed object");
  }
  if (entries.length !== 4) errors.push(`options must contain exactly 4 items; received ${entries.length}`);

  const invalidOptionIndexes = entries
    .map(({ text }, index) => (typeof text !== "string" || !text.trim() ? index : null))
    .filter((index) => index !== null);
  if (invalidOptionIndexes.length > 0) {
    errors.push(`options contain empty/non-string values at indexes: ${invalidOptionIndexes.join(", ")}`);
  }

  const answerPresent = row && Object.prototype.hasOwnProperty.call(row, "answer") && String(row.answer).trim();
  if (!answerPresent) errors.push("answer is required");
  const answerIndex = answerPresent ? resolveAnswerIndex(row.answer, entries) : -1;
  if (answerPresent && answerIndex < 0) {
    errors.push("answer must match an option key, zero-based index, or exact option text");
  }

  const proposed = errors.length === 0
    ? {
        id: null,
        topicId: topicId || null,
        type: "single",
        questionText: question,
        options: entries.map(({ text }) => text.trim()),
        correctAnswers: [answerIndex],
        explanation: null,
        difficulty: null,
        reference: null,
        tags: ["cds_legacy"],
      }
    : null;

  return {
    sourceRow: rowIndex + 1,
    sourceFormat,
    valid: errors.length === 0,
    duplicate: false,
    duplicateOf: null,
    errors,
    normalizedDuplicateKey: proposed
      ? `${normalizeText(proposed.questionText)}|${normalizeText(proposed.options[answerIndex])}`
      : null,
    proposed,
  };
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log(usage());
  process.exit(0);
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptDirectory, "../..");
const defaultSource = resolve(workspaceRoot, "cds/data/questions.json");
const sourcePath = args.source
  ? (isAbsolute(args.source) ? args.source : resolve(process.cwd(), args.source))
  : defaultSource;

if (!existsSync(sourcePath)) fail(`Source file does not exist: ${sourcePath}`);

let sourceText;
let sourceRows;
try {
  sourceText = readFileSync(sourcePath, "utf8");
  sourceRows = JSON.parse(sourceText);
} catch (error) {
  fail(`Source JSON could not be read or parsed: ${error.message}`);
}

if (!Array.isArray(sourceRows)) fail("Source JSON root must be an array");

const rows = sourceRows.map((row, index) => validateRow(row, index, args.topicId));
const firstByDuplicateKey = new Map();
for (const row of rows) {
  if (!row.valid) continue;
  if (firstByDuplicateKey.has(row.normalizedDuplicateKey)) {
    row.duplicate = true;
    row.duplicateOf = firstByDuplicateKey.get(row.normalizedDuplicateKey);
  } else {
    firstByDuplicateKey.set(row.normalizedDuplicateKey, row.sourceRow);
  }
}

const validRows = rows.filter((row) => row.valid);
const invalidRows = rows.filter((row) => !row.valid);
const duplicateRows = rows.filter((row) => row.duplicate);
const plannedPreviewRows = rows.filter((row) => row.valid && !row.duplicate);
const sourceSha256 = createHash("sha256").update(sourceText).digest("hex");
const normalizedPayload = plannedPreviewRows.map((row) => row.proposed);
const normalizedPayloadText = JSON.stringify(normalizedPayload);
const normalizedPayloadSha256 = createHash("sha256").update(normalizedPayloadText).digest("hex");
const duplicateKeySetSha256 = createHash("sha256")
  .update(JSON.stringify([...firstByDuplicateKey.keys()].sort()))
  .digest("hex");
const batchFingerprint = createHash("sha256")
  .update(`${sourceSha256}|${normalizedPayloadSha256}|${args.topicId || "BLOCKED_MISSING_TOPIC_ID"}`)
  .digest("hex");

const stopConditions = [
  ...(!args.topicId ? ["MISSING_TOPIC_ID_MAPPING"] : ["TOPIC_ID_MAPPING_UNVERIFIED"]),
  ...(sourceRows.length !== 8 ? ["SOURCE_COUNT_MISMATCH"] : []),
  ...(invalidRows.length ? ["INVALID_ROWS_PRESENT"] : []),
  ...(duplicateRows.length ? ["DUPLICATE_CONFLICTS_UNRESOLVED"] : []),
];

const missingFields = [
  { field: "id", missingRows: sourceRows.length, reason: "CDS has no stable ID; preview must not invent an import identity" },
  { field: "topicId", missingRows: args.topicId ? 0 : sourceRows.length, reason: "CDS has no topic_id; explicit approved mapping is required before any future import" },
  { field: "explanation", missingRows: sourceRows.length, reason: "Not present in CDS source" },
  { field: "difficulty", missingRows: sourceRows.length, reason: "Not present in CDS source" },
  { field: "reference", missingRows: sourceRows.length, reason: "Not present in CDS source" },
];

const preview = {
  mode: "dry-run",
  generatedAt: new Date().toISOString(),
  safety: {
    databaseConnectionAttempted: false,
    databaseWriteAttempted: false,
    networkAccessRequired: false,
    realImportAllowed: false,
    realImportBlockReason: "No production write path exists. The separate Gate 7B staging path is localhost-only and explicitly gated.",
  },
  source: {
    path: sourcePath,
    sha256: sourceSha256,
    expectedKnownCount: 8,
    observedCount: sourceRows.length,
  },
  topicMapping: {
    provided: Boolean(args.topicId),
    topicId: args.topicId || null,
    verified: false,
    status: args.topicId ? "PROVIDED_BUT_UNVERIFIED_OFFLINE" : "BLOCKED_MISSING_TOPIC_ID",
  },
  summary: {
    totalRows: sourceRows.length,
    validRows: validRows.length,
    invalidRows: invalidRows.length,
    duplicateRows: duplicateRows.length,
    plannedPreviewRows: plannedPreviewRows.length,
    plannedSkipRows: invalidRows.length + duplicateRows.length,
  },
  checksums: {
    algorithm: "sha256",
    sourceSha256,
    normalizedPayloadSha256,
    duplicateKeySetSha256,
    batchFingerprint,
    canonicalPayloadEncoding: "JSON.stringify over ordered normalized preview rows; UTF-8",
  },
  productionReadiness: {
    status: "BLOCKED",
    stagingWritePathImplemented: true,
    productionWritePathImplemented: false,
    stopConditions,
    additionalRequiredEvidence: [
      "approved topic_id mapping verified against staging/target database",
      "Gate 6E security PASS evidence",
      "source and target backups",
      "staging count/checksum reconciliation",
      "explicit production-import gate approval",
    ],
  },
  fieldsMissingForPtkv: missingFields,
  invalidRowDetails: invalidRows.map(({ sourceRow, errors }) => ({ sourceRow, errors })),
  duplicateRowDetails: duplicateRows.map(({ sourceRow, duplicateOf }) => ({ sourceRow, duplicateOf })),
  proposedTransformedShape: {
    id: null,
    topicId: args.topicId || null,
    type: "single",
    questionText: "string",
    options: ["string", "string", "string", "string"],
    correctAnswers: [0],
    explanation: null,
    difficulty: null,
    reference: null,
    tags: ["cds_legacy"],
  },
  rows: rows.map(({ normalizedDuplicateKey, ...row }) => row),
};

async function importQuestionsToStaging() {
  stagingSafety();
  if (!args.topicId) fail("Staging import requires --topic-id", 3);
  if (!args.batchId || !/^gate7b_[a-z0-9_-]+$/i.test(args.batchId)) fail("Staging import requires a gate7b_ batch ID", 3);
  if (invalidRows.length || duplicateRows.length || sourceRows.length !== 8) fail("Staging import blocked by invalid, duplicate, or source-count stop condition", 3);
  if (!/^[a-z0-9_-]+$/i.test(args.topicId)) fail("Staging topic ID contains unsupported characters", 3);

  const topicCount = Number(await runLocalPsql(`SELECT COUNT(*) FROM public.learning_topics WHERE id = ${sqlLiteral(args.topicId)};`, true));
  if (topicCount !== 1) fail("Mapped topic_id does not exist exactly once in staging", 3);

  const importRows = plannedPreviewRows.map(row => ({
    ...row.proposed,
    id: `cds_q_${createHash("sha256").update(`${args.topicId}|${row.normalizedDuplicateKey}`).digest("hex").slice(0, 24)}`,
  }));
  const idsSql = importRows.map(row => sqlLiteral(row.id)).join(",");
  const existingText = await runLocalPsql(`SELECT COALESCE(json_agg(row_to_json(q)), '[]'::json) FROM (SELECT id, topic_id, type, question_text, options, correct_answers, explanation, difficulty, reference_info FROM public.questions WHERE id IN (${idsSql}) ORDER BY id) q;`, true);
  const existingRows = JSON.parse(existingText || "[]");
  const existingById = new Map(existingRows.map(row => [row.id, row]));
  const canonical = row => ({
    id: row.id,
    topicId: row.topicId ?? row.topic_id,
    type: row.type,
    questionText: row.questionText ?? row.question_text,
    options: row.options,
    correctAnswers: row.correctAnswers ?? row.correct_answers,
    explanation: row.explanation ?? null,
    difficulty: row.difficulty ?? null,
    reference: row.reference ?? row.reference_info ?? null,
  });
  for (const row of importRows) {
    const existing = existingById.get(row.id);
    if (existing && JSON.stringify(canonical(existing)) !== JSON.stringify(canonical(row))) {
      fail(`Deterministic ID conflict for ${row.id}; staging import aborted`, 4);
    }
  }
  const missingRows = importRows.filter(row => !existingById.has(row.id));
  if (missingRows.length) {
    const values = missingRows.map(row => `(${[
      row.id, row.topicId, row.type, row.questionText, JSON.stringify(row.options), JSON.stringify(row.correctAnswers),
      row.explanation, row.difficulty, row.reference, JSON.stringify(["cds_legacy", `batch:${args.batchId}`]),
    ].map(value => value === null ? "NULL" : sqlLiteral(value)).join(",")})`).join(",\n");
    await runLocalPsql(`BEGIN; INSERT INTO public.questions (id,topic_id,type,question_text,options,correct_answers,explanation,difficulty,reference_info,tags) VALUES ${values}; COMMIT;`);
  }

  const targetText = await runLocalPsql(`SELECT COALESCE(json_agg(row_to_json(q)), '[]'::json) FROM (SELECT id, topic_id, type, question_text, options, correct_answers, explanation, difficulty, reference_info FROM public.questions WHERE id IN (${idsSql}) ORDER BY id) q;`, true);
  const targetRows = JSON.parse(targetText || "[]");
  const targetById = new Map(targetRows.map(row => [row.id, row]));
  const reconciledPayload = importRows.map(expected => {
    const actual = targetById.get(expected.id);
    return actual ? {
      id: null, topicId: actual.topic_id, type: actual.type, questionText: actual.question_text,
      options: actual.options, correctAnswers: actual.correct_answers, explanation: actual.explanation,
      difficulty: actual.difficulty, reference: actual.reference_info, tags: ["cds_legacy"],
    } : null;
  });
  const missingReferences = reconciledPayload.map((row, index) => row ? null : importRows[index].id).filter(Boolean);
  const targetPayloadSha256 = createHash("sha256").update(JSON.stringify(reconciledPayload.filter(Boolean))).digest("hex");
  return {
    status: missingReferences.length ? "FAIL" : "PASS",
    environment: "localhost-disposable-staging",
    batchId: args.batchId,
    topicId: args.topicId,
    sourceCount: sourceRows.length,
    importedCount: missingRows.length,
    skippedExistingIdentical: existingRows.length,
    invalidCount: invalidRows.length,
    duplicateCount: duplicateRows.length,
    targetCount: targetRows.length,
    missingReferences,
    insertedIds: missingRows.map(row => row.id),
    allExpectedIds: importRows.map(row => row.id),
    backupBaseline: { existingExpectedRows: existingRows.length },
    checksum: {
      expectedNormalizedPayloadSha256: normalizedPayloadSha256,
      targetNormalizedPayloadSha256: targetPayloadSha256,
      match: normalizedPayloadSha256 === targetPayloadSha256,
    },
  };
}

if (args.stagingImport) {
  preview.stagingImport = await importQuestionsToStaging();
  preview.safety.databaseConnectionAttempted = true;
  preview.safety.databaseWriteAttempted = preview.stagingImport.importedCount > 0;
  preview.safety.stagingImportAllowed = true;
  preview.productionReadiness.status = "BLOCKED";
  preview.productionReadiness.stopConditions = ["PRODUCTION_IMPORT_NOT_APPROVED"];
}

if (args.out) {
  const outputPath = isAbsolute(args.out) ? args.out : resolve(process.cwd(), args.out);
  preview.outputFile = outputPath;
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(preview, null, 2)}\n`, "utf8");
} else {
  preview.outputFile = null;
}

console.log(JSON.stringify(preview, null, 2));

if (args.strict && (invalidRows.length > 0 || duplicateRows.length > 0)) {
  process.exitCode = 1;
}
