import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();
const execFileAsync = promisify(execFile);
const APPROVAL = "I_UNDERSTAND_THIS_IMPORTS_LOCAL_STAGING_ONLY";
const PASSWORD = "Gate7b_Staging_Only_42!";
const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const ids = {
  unit: "7b000000-0000-4000-8000-000000000001",
  questionTopic: "gate7b_topic_questions",
  materialTopic: "gate7b_material_topic",
  materialSection: "gate7b_material_section",
  newsPublic: "gate7b_news_public",
  newsInternal: "gate7b_news_internal",
  newsDraft: "gate7b_news_draft",
};

const safety = () => {
  if (process.env.GATE7B_ALLOW_STAGING_IMPORT !== "1") throw new Error("BLOCKED: GATE7B_ALLOW_STAGING_IMPORT=1 required");
  if (process.env.GATE7B_DISPOSABLE_DB !== "1") throw new Error("BLOCKED: GATE7B_DISPOSABLE_DB=1 required");
  if (process.env.GATE7B_FIXTURE_APPROVAL !== APPROVAL) throw new Error("BLOCKED: exact Gate 7B approval phrase required");
  for (const [name, value] of [["SUPABASE_URL", process.env.SUPABASE_URL], ["database URL", process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres"]]) {
    const url = new URL(value);
    if (!localHosts.has(url.hostname)) throw new Error(`BLOCKED: ${name} must be localhost`);
  }
};

const runPsql = async (sql, tuplesOnly = false) => {
  safety();
  const url = new URL(process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres");
  const common = ["-X", "-v", "ON_ERROR_STOP=1", ...(tuplesOnly ? ["-t", "-A"] : []), "-c", sql];
  try {
    const { stdout } = await execFileAsync(process.env.GATE7B_PSQL_PATH || "psql", ["-h", url.hostname, "-p", url.port || "5432", "-U", decodeURIComponent(url.username || "postgres"), "-d", url.pathname.slice(1) || "postgres", ...common], { env: { ...process.env, PGPASSWORD: decodeURIComponent(url.password || "") }, maxBuffer: 10 * 1024 * 1024 });
    return stdout.trim();
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const { stdout: names } = await execFileAsync("docker", ["ps", "--filter", `publish=${url.port || "5432"}`, "--format", "{{.Names}}"]);
  const container = names.split(/\r?\n/).map(value => value.trim()).find(Boolean);
  if (!container) throw new Error("BLOCKED: local PostgreSQL client/container unavailable");
  const { stdout } = await execFileAsync("docker", ["exec", "-i", container, "psql", "-X", "-v", "ON_ERROR_STOP=1", "-U", decodeURIComponent(url.username || "postgres"), "-d", url.pathname.slice(1) || "postgres", ...(tuplesOnly ? ["-t", "-A"] : []), "-c", sql], { maxBuffer: 10 * 1024 * 1024 });
  return stdout.trim();
};

const cleanup = async () => {
  const output = await runPsql(`BEGIN;
DELETE FROM public.audit_logs WHERE entity_id LIKE 'gate7b\\_%' ESCAPE '\\' OR user_id IN (SELECT id FROM public.users WHERE email LIKE 'gate7b\\_%' ESCAPE '\\');
DELETE FROM public.exam_answers WHERE id LIKE 'gate7b\\_%' ESCAPE '\\';
DELETE FROM public.notifications WHERE user_id IN (SELECT id FROM public.users WHERE email LIKE 'gate7b\\_%' ESCAPE '\\');
DELETE FROM public.ai_chat_messages WHERE user_id IN (SELECT id FROM public.users WHERE email LIKE 'gate7b\\_%' ESCAPE '\\');
DELETE FROM public.exam_attempts WHERE user_id IN (SELECT id FROM public.users WHERE email LIKE 'gate7b\\_%' ESCAPE '\\');
DELETE FROM public.quiz_attempts WHERE user_id IN (SELECT id FROM public.users WHERE email LIKE 'gate7b\\_%' ESCAPE '\\');
DELETE FROM public.learning_progress WHERE user_id IN (SELECT id FROM public.users WHERE email LIKE 'gate7b\\_%' ESCAPE '\\');
DELETE FROM public.questions WHERE topic_id = '${ids.questionTopic}';
DELETE FROM public.learning_sections WHERE id = '${ids.materialSection}' OR topic_id IN ('${ids.questionTopic}','${ids.materialTopic}');
DELETE FROM public.learning_assignments WHERE topic_id IN ('${ids.questionTopic}','${ids.materialTopic}');
DELETE FROM public.learning_topics WHERE id IN ('${ids.questionTopic}','${ids.materialTopic}');
DELETE FROM public.news WHERE id IN ('${ids.newsPublic}','${ids.newsInternal}','${ids.newsDraft}') OR title LIKE 'gate7b\\_%' ESCAPE '\\';
DELETE FROM public.users WHERE email LIKE 'gate7b\\_%' ESCAPE '\\';
DELETE FROM public.units WHERE id = '${ids.unit}' AND name = 'gate7b_unit';
DELETE FROM auth.users WHERE email LIKE 'gate7b\\_%' ESCAPE '\\';
COMMIT;`);
  return { completed: true, outputLines: output ? output.split(/\r?\n/).length : 0 };
};

const api = async (base, path, { method = "GET", token, body } = {}) => {
  const response = await fetch(`${base}${path}`, { method, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { "content-type": "application/json" }) }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(10000) });
  const text = await response.text();
  return { status: response.status, json: text ? JSON.parse(text) : null };
};

const runImporter = async batchId => {
  const { stdout } = await execFileAsync(process.execPath, ["scripts/import-cds-questions.mjs", "--source", "../cds/data/questions.json", "--topic-id", ids.questionTopic, "--batch-id", batchId, "--staging-import"], { cwd: process.cwd(), env: process.env, maxBuffer: 20 * 1024 * 1024 });
  return JSON.parse(stdout);
};

export async function runStagingScenario() {
  safety();
  await cleanup();
  let backend;
  const summary = { status: "RUNNING", scope: "localhost-disposable-staging", passed: [], failed: [], import: null, reconciliation: null, rollback: null };
  try {
    const anon = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const memberEmail = "gate7b_member@example.test";
    const serviceEmail = "gate7b_backend_service@example.test";
    const memberSignup = await anon().auth.signUp({ email: memberEmail, password: PASSWORD, options: { data: { gate: "7b" } } });
    const serviceSignup = await anon().auth.signUp({ email: serviceEmail, password: PASSWORD, options: { data: { gate: "7b" } } });
    if (memberSignup.error || serviceSignup.error) throw memberSignup.error || serviceSignup.error;
    const memberId = memberSignup.data.user.id;
    const serviceId = serviceSignup.data.user.id;
    const passwordHash = await bcrypt.hash(PASSWORD, 12);
    await runPsql(`BEGIN;
INSERT INTO public.units (id,name,type,description) VALUES ('${ids.unit}','gate7b_unit','test','Gate 7B disposable staging') ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO public.users (id,full_name,email,password_hash,unit_id,role,account_status,must_change_password) VALUES ('${memberId}','gate7b_member','${memberEmail}','${passwordHash}','${ids.unit}','member','active',false);
INSERT INTO public.learning_topics (id,title,category,content,content_type,required,assigned_unit_ids,assigned_user_ids) VALUES ('${ids.questionTopic}','gate7b question topic','test','Gate 7B staging question topic','document',true,'["${ids.unit}"]','["${memberId}"]'),('${ids.materialTopic}','gate7b material topic','test','Gate 7B readable material','document',false,'["${ids.unit}"]','["${memberId}"]');
INSERT INTO public.learning_sections (id,topic_id,title,content,section_order,required) VALUES ('${ids.materialSection}','${ids.materialTopic}','gate7b section','Gate 7B material content',1,true);
INSERT INTO public.news (id,title,category,summary,content,visibility,status,published_at) VALUES ('${ids.newsPublic}','gate7b_public','test','public','public','public','published',NOW()),('${ids.newsInternal}','gate7b_internal','test','internal','internal','internal','published',NOW()),('${ids.newsDraft}','gate7b_draft','test','draft','draft','internal','draft',NULL);
UPDATE auth.users SET role='service_role', raw_app_meta_data=COALESCE(raw_app_meta_data,'{}'::jsonb)||'{"role":"service_role","gate":"7b"}'::jsonb WHERE id='${serviceId}' AND email='${serviceEmail}';
COMMIT;`);

    const sourceText = await execFileAsync(process.execPath, ["-e", "const fs=require('fs');process.stdout.write(require('crypto').createHash('sha256').update(fs.readFileSync('../cds/data/questions.json')).digest('hex'))"], { cwd: process.cwd() });
    const batchId = `gate7b_questions_${sourceText.stdout.trim().slice(0, 12)}`;
    const baselineCount = Number(await runPsql(`SELECT COUNT(*) FROM public.questions WHERE topic_id='${ids.questionTopic}';`, true));
    assert.equal(baselineCount, 0);
    const first = await runImporter(batchId);
    const second = await runImporter(batchId);
    assert.equal(first.stagingImport.importedCount, 8);
    assert.equal(first.stagingImport.skippedExistingIdentical, 0);
    assert.equal(second.stagingImport.importedCount, 0);
    assert.equal(second.stagingImport.skippedExistingIdentical, 8);
    assert.equal(first.stagingImport.checksum.match, true);
    assert.equal(second.stagingImport.checksum.match, true);
    summary.import = first.stagingImport;
    summary.passed.push("staging import inserted 8 valid rows", "second import skipped 8 identical rows", "source/target checksum match");

    const serviceLogin = await anon().auth.signInWithPassword({ email: serviceEmail, password: PASSWORD });
    if (serviceLogin.error) throw serviceLogin.error;
    const serviceToken = serviceLogin.data.session.access_token;
    const payload = JSON.parse(Buffer.from(serviceToken.split(".")[1], "base64url").toString("utf8"));
    assert.equal(payload.role, "service_role");
    const port = 31907;
    backend = spawn(process.execPath, ["node_modules/tsx/dist/cli.mjs", "server.ts"], { cwd: process.cwd(), env: { ...process.env, PORT: String(port), SUPABASE_SERVICE_ROLE_KEY: serviceToken }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    const base = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      try { if ((await fetch(`${base}/api/news`, { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    assert.ok(ready, "isolated staging backend readiness");
    const login = await api(base, "/api/auth/login", { method: "POST", body: { emailOrPhone: memberEmail, password: PASSWORD } });
    assert.equal(login.status, 200);
    const questions = await api(base, `/api/quiz/by-topic/${ids.questionTopic}`, { token: login.json.token });
    assert.equal(questions.status, 200); assert.equal(questions.json.length, 8); assert.ok(questions.json.every(row => !("correctAnswers" in row)));
    const material = await api(base, `/api/learning/topics/${ids.materialTopic}`, { token: login.json.token });
    assert.equal(material.status, 200); assert.ok(material.json.sections.some(section => section.id === ids.materialSection));
    const guestNews = await api(base, "/api/news");
    assert.ok(guestNews.json.some(row => row.id === ids.newsPublic)); assert.ok(!guestNews.json.some(row => [ids.newsInternal, ids.newsDraft].includes(row.id)));
    const memberNews = await api(base, "/api/news", { token: login.json.token });
    assert.ok(memberNews.json.some(row => row.id === ids.newsInternal)); assert.ok(!memberNews.json.some(row => row.id === ids.newsDraft));
    summary.passed.push("backend returns 8 redacted imported questions", "material topic/section readable", "news visibility compatible");

    const dbReportText = await runPsql(`SELECT json_build_object('count',COUNT(*),'nullTopic',COUNT(*) FILTER (WHERE topic_id IS NULL),'nullQuestion',COUNT(*) FILTER (WHERE question_text IS NULL),'badOptions',COUNT(*) FILTER (WHERE jsonb_array_length(options)<>4),'missingTopic',COUNT(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM public.learning_topics t WHERE t.id=questions.topic_id))) FROM public.questions WHERE topic_id='${ids.questionTopic}';`, true);
    const dbReport = JSON.parse(dbReportText);
    assert.deepEqual(dbReport, { count: 8, nullTopic: 0, nullQuestion: 0, badOptions: 0, missingTopic: 0 });
    summary.reconciliation = { source: 8, imported: 8, skipped: 0, duplicate: 0, invalid: 0, checksumMatch: true, missingReferences: 0, constraints: dbReport };

    if (backend && backend.exitCode === null) { backend.kill(); backend = null; }
    await runPsql(`DELETE FROM public.questions WHERE topic_id='${ids.questionTopic}';`);
    const restoredCount = Number(await runPsql(`SELECT COUNT(*) FROM public.questions WHERE topic_id='${ids.questionTopic}';`, true));
    assert.equal(restoredCount, baselineCount);
    summary.rollback = { backupBaselineCount: baselineCount, restoredCount, cleanupScopedToTopic: true, status: "PASS" };
    summary.passed.push("backup baseline captured", "rollback restored baseline", "cleanup scope verified");
    summary.status = "PASS";
  } catch (error) {
    summary.status = "FAIL"; summary.failed.push(error.message);
  } finally {
    if (backend && backend.exitCode === null) backend.kill();
    try { summary.cleanup = await cleanup(); } catch (error) { summary.status = "FAIL"; summary.failed.push(`cleanup: ${error.message}`); }
  }
  return summary;
}

if (process.argv[1] && fileURLToPath(import.meta.url).toLowerCase() === resolve(process.argv[1]).toLowerCase()) {
  const result = await runStagingScenario();
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== "PASS") process.exit(1);
}
