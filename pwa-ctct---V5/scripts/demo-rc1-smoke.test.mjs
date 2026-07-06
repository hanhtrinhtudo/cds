#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const execFileAsync = promisify(execFile);
const PASSWORD = "Demo_Rc1_Test_42!";
const DEMO_MEMBER = "demo_rc1_member@example.test";
const DEMO_ADMIN = "demo_rc1_admin@example.test";
const DEMO_INSTRUCTOR = "demo_rc1_instructor@example.test";
const SERVICE_EMAIL = "demo_rc1_backend_service@example.test";
const SERVICE_PASSWORD = "Demo_Rc1_Service_42!";
const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const ids = {
  topic: "demo_rc1_topic_political_legal",
  news: "demo_rc1_news_public_legal",
  exam: "demo_rc1_exam_official",
  member: "de000001-0000-4000-8000-000000000101",
  instructor: "de000001-0000-4000-8000-000000000102",
  admin: "de000001-0000-4000-8000-000000000103",
};

function assertSafeEnvironment() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY are required.");
  }
  const supabaseUrl = new URL(process.env.SUPABASE_URL);
  if (!localHosts.has(supabaseUrl.hostname) && process.env.DEMO_RC1_ALLOW_HOSTED_STAGING !== "1") {
    throw new Error("BLOCKED: hosted Supabase target requires DEMO_RC1_ALLOW_HOSTED_STAGING=1.");
  }
}

async function runPsql(sql, tuplesOnly = false) {
  assertSafeEnvironment();
  const url = new URL(process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres");
  if (!localHosts.has(url.hostname)) throw new Error("BLOCKED: smoke fixture Postgres access must be localhost.");
  const common = ["-X", "-v", "ON_ERROR_STOP=1", ...(tuplesOnly ? ["-t", "-A"] : []), "-c", sql];
  try {
    const { stdout } = await execFileAsync(process.env.DEMO_RC1_PSQL_PATH || "psql", [
      "-h", url.hostname,
      "-p", url.port || "5432",
      "-U", decodeURIComponent(url.username || "postgres"),
      "-d", url.pathname.slice(1) || "postgres",
      ...common,
    ], {
      env: { ...process.env, PGPASSWORD: decodeURIComponent(url.password || "") },
      maxBuffer: 20 * 1024 * 1024,
    });
    return stdout.trim();
  } catch (error) {
    if (error.code !== "ENOENT") throw new Error(error.stderr?.trim() || error.message);
  }
  const { stdout: names } = await execFileAsync("docker", ["ps", "--filter", `publish=${url.port || "5432"}`, "--format", "{{.Names}}"]);
  const container = names.split(/\r?\n/).map(value => value.trim()).find(Boolean);
  if (!container) throw new Error("BLOCKED: no local psql executable or PostgreSQL Docker container found.");
  const { stdout } = await execFileAsync("docker", [
    "exec", "-i", container, "psql", "-X", "-v", "ON_ERROR_STOP=1",
    "-U", decodeURIComponent(url.username || "postgres"),
    "-d", url.pathname.slice(1) || "postgres",
    ...(tuplesOnly ? ["-t", "-A"] : []),
    "-c", sql,
  ], { maxBuffer: 20 * 1024 * 1024 });
  return stdout.trim();
}

async function ensureServiceRoleToken() {
  const anon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await runPsql(`DELETE FROM auth.users WHERE email='${SERVICE_EMAIL}';`);
  const signup = await anon.auth.signUp({ email: SERVICE_EMAIL, password: SERVICE_PASSWORD, options: { data: { gate: "demo_rc1" } } });
  if (signup.error) throw signup.error;
  await runPsql(`UPDATE auth.users SET role='service_role', raw_app_meta_data=COALESCE(raw_app_meta_data,'{}'::jsonb)||'{"role":"service_role","gate":"demo_rc1"}'::jsonb WHERE email='${SERVICE_EMAIL}';`);
  const login = await anon.auth.signInWithPassword({ email: SERVICE_EMAIL, password: SERVICE_PASSWORD });
  if (login.error) throw login.error;
  const token = login.data.session.access_token;
  const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
  assert.equal(payload.role, "service_role");
  return token;
}

async function api(base, path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  const text = await response.text();
  return { status: response.status, json: text ? JSON.parse(text) : null };
}

async function waitForBackend(base) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${base}/api/news`, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error("Backend did not become ready.");
}

async function cleanupSmokeRuntimeRows() {
  const userIds = [ids.member, ids.instructor, ids.admin].map(id => `'${id}'`).join(",");
  await runPsql(`BEGIN;
DELETE FROM public.audit_logs WHERE user_id IN (${userIds}) AND entity_id NOT LIKE 'demo_rc1\\_%' ESCAPE '\\';
DELETE FROM public.notifications WHERE user_id IN (${userIds}) AND id NOT LIKE 'demo_rc1\\_%' ESCAPE '\\';
DELETE FROM public.quiz_attempts WHERE user_id = '${ids.member}' AND id NOT LIKE 'demo_rc1\\_%' ESCAPE '\\';
DELETE FROM public.exam_attempts WHERE user_id = '${ids.member}' AND id NOT LIKE 'demo_rc1\\_%' ESCAPE '\\' AND exam_id <> '${ids.exam}';
COMMIT;`);
}

async function run() {
  assertSafeEnvironment();
  await execFileAsync(process.execPath, ["scripts/demo-rc1-seed.mjs"], { cwd: process.cwd(), env: process.env, maxBuffer: 20 * 1024 * 1024 });
  const serviceToken = await ensureServiceRoleToken();
  const port = Number(process.env.DEMO_RC1_BACKEND_PORT || 31911);
  const base = `http://127.0.0.1:${port}`;
  let backend;
  const result = { status: "RUNNING", base, checks: [], blocked: [], failed: [], productionImport: "BLOCKED" };
  try {
    backend = spawn(process.execPath, ["node_modules/tsx/dist/cli.mjs", "server.ts"], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: String(port), SUPABASE_SERVICE_ROLE_KEY: serviceToken },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    await waitForBackend(base);

    const guestNews = await api(base, "/api/news");
    assert.equal(guestNews.status, 200);
    assert.ok(guestNews.json.some(item => item.id === ids.news));
    const guestNewsDetail = await api(base, `/api/news/${ids.news}`);
    assert.equal(guestNewsDetail.status, 200);
    result.checks.push("guest can view demo public legal/news item");

    const memberLogin = await api(base, "/api/auth/login", { method: "POST", body: { emailOrPhone: DEMO_MEMBER, password: PASSWORD } });
    assert.equal(memberLogin.status, 200);
    const memberToken = memberLogin.json.token;
    const dashboardMe = await api(base, "/api/auth/me", { token: memberToken });
    assert.equal(dashboardMe.status, 200);
    const topics = await api(base, "/api/learning/topics", { token: memberToken });
    assert.equal(topics.status, 200);
    assert.ok(topics.json.some(topic => topic.id === ids.topic));
    const topicDetail = await api(base, `/api/learning/topics/${ids.topic}`, { token: memberToken });
    assert.equal(topicDetail.status, 200);
    assert.ok(topicDetail.json.sections.length >= 1);
    const questions = await api(base, `/api/quiz/by-topic/${ids.topic}`, { token: memberToken });
    assert.equal(questions.status, 200);
    assert.equal(questions.json.length, 8);
    assert.ok(questions.json.every(question => !("correctAnswers" in question)));
    result.checks.push("member can login, see learning topic/material, and retrieve 8 redacted CDS questions");

    const quizStart = await api(base, "/api/quiz/start", { method: "POST", token: memberToken, body: { topicId: ids.topic } });
    assert.equal(quizStart.status, 200);
    const quizAnswers = Object.fromEntries(questions.json.map(question => [question.id, [0]]));
    const quizSubmit = await api(base, "/api/quiz/submit", { method: "POST", token: memberToken, body: { attemptId: quizStart.json.id, answers: quizAnswers } });
    assert.equal(quizSubmit.status, 200);
    assert.ok(typeof quizSubmit.json.score === "number");
    const personal = await api(base, "/api/reports/personal", { token: memberToken });
    assert.equal(personal.status, 200);
    const rankings = await api(base, "/api/rankings", { token: memberToken });
    assert.equal(rankings.status, 200);
    assert.ok(rankings.json.some(entry => entry.fullName.includes("Demo RC1")));
    const aiHistory = await api(base, "/api/ai/chat/history", { token: memberToken });
    assert.equal(aiHistory.status, 200);
    result.checks.push("member can submit quiz, see result/ranking, and open Trợ lý AI history");

    const exams = await api(base, "/api/exams", { token: memberToken });
    assert.equal(exams.status, 200);
    assert.ok(exams.json.some(exam => exam.id === ids.exam));
    const examDetail = await api(base, `/api/exams/${ids.exam}`, { token: memberToken });
    assert.equal(examDetail.status, 200);
    assert.ok(examDetail.json.questions.every(question => !("correctAnswers" in question)));
    result.checks.push("official exam is visible and learner payload is answer-redacted");

    const adminLogin = await api(base, "/api/auth/login", { method: "POST", body: { emailOrPhone: DEMO_ADMIN, password: PASSWORD } });
    assert.equal(adminLogin.status, 200);
    const users = await api(base, "/api/users", { token: adminLogin.json.token });
    assert.equal(users.status, 200);
    assert.ok(users.json.some(user => user.email === DEMO_MEMBER));
    const adminReport = await api(base, "/api/reports/admin", { token: adminLogin.json.token });
    assert.equal(adminReport.status, 200);
    result.checks.push("admin can login and view users/admin summary");

    const instructorLogin = await api(base, "/api/auth/login", { method: "POST", body: { emailOrPhone: DEMO_INSTRUCTOR, password: PASSWORD } });
    assert.equal(instructorLogin.status, 200);
    const instructorReport = await api(base, "/api/reports/instructor", { token: instructorLogin.json.token });
    assert.equal(instructorReport.status, 200);
    result.checks.push("instructor can login and view scoped report area");

    result.status = "PASS";
  } catch (error) {
    result.status = "FAIL";
    result.failed.push(error.message);
  } finally {
    if (backend && backend.exitCode === null) backend.kill();
    try { await cleanupSmokeRuntimeRows(); } catch {}
    try { await runPsql(`DELETE FROM auth.users WHERE email='${SERVICE_EMAIL}';`); } catch {}
  }
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== "PASS") process.exit(1);
}

await run();
