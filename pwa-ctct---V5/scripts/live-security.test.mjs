import assert from "node:assert/strict";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { spawn } from "node:child_process";
import path from "node:path";
import { Gate6eBlocked, setupSecurityFixtures, cleanupSecurityFixtures, diagnoseBackendLoginFixture } from "./security-fixtures.mjs";

dotenv.config();

const result = { suite: "Gate 6E live backend security", status: "RUNNING", passed: [], failed: [], blocked: [], matrices: {} };
const pass = name => result.passed.push(name);
const api = async (base, path, { method = "GET", token, body } = {}) => {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { "content-type": "application/json" }) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10000)
  });
  const text = await response.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { json = { unparsed: true }; }
  return { status: response.status, json, text };
};
const containsKey = (value, forbidden) => {
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, child]) => forbidden.has(key.toLowerCase()) || containsKey(child, forbidden));
};
const expect = (condition, message) => assert.ok(condition, message);

let fixture;
let backendProcess;
try {
  fixture = await setupSecurityFixtures();
} catch (error) {
  if (error instanceof Gate6eBlocked) {
    result.status = "BLOCKED"; result.blocked.push(error.message); console.log(JSON.stringify(result, null, 2)); process.exit(0);
  }
  throw error;
}

try {
  const backendPort = 31906;
  const tsxCli = path.resolve("node_modules/tsx/dist/cli.mjs");
  backendProcess = spawn(process.execPath, [tsxCli, "server.ts"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(backendPort), SUPABASE_SERVICE_ROLE_KEY: fixture.backendServiceKey },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });
  let backendError = "";
  backendProcess.stderr.on("data", chunk => { backendError = `${backendError}${chunk}`.slice(-2000); });
  const base = `http://127.0.0.1:${backendPort}`;
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (backendProcess.exitCode !== null) throw new Error(`isolated backend exited before readiness: ${backendError}`);
    try { const response = await fetch(`${base}/api/news`, { signal: AbortSignal.timeout(1000) }); if (response.ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error(`isolated backend did not become ready: ${backendError}`);
  result.environment = { isolatedLocalBackend: base, visibility: fixture.visibility, generatedServiceJwt: false, authIssuedServiceRoleToken: true };

  const tokens = {};
  result.matrices.authentication = [];
  const guest = await api(base, "/api/auth/me");
  assert.equal(guest.status, 401, "guest auth status");
  result.matrices.authentication.push({ actor: "guest", status: guest.status, result: "PASS" });
  for (const actor of ["memberA", "memberB", "instructor", "politicalOfficer", "admin"]) {
    const login = await api(base, "/api/auth/login", { method: "POST", body: { emailOrPhone: fixture.identities[actor].email, password: "Gate6e_Test_Only_42!" } });
    if (login.status !== 200) {
      const diagnostic = await diagnoseBackendLoginFixture(fixture.identities[actor]);
      throw new Error(`${actor} login status ${login.status}; fixture diagnostic: ${JSON.stringify(diagnostic)}`);
    }
    assert.ok(login.json?.token, `${actor} login token`);
    tokens[actor] = login.json.token;
    const response = await api(base, "/api/auth/me", { token: tokens[actor] });
    assert.equal(response.status, 200, `${actor} auth status`);
    result.matrices.authentication.push({ actor, status: response.status, result: "PASS" });
  }
  for (const actor of ["pending", "suspended", "rejected"]) {
    const response = await api(base, "/api/auth/login", { method: "POST", body: { emailOrPhone: fixture.identities[actor].email, password: "Gate6e_Test_Only_42!" } });
    assert.equal(response.status, 403, `${actor} login status`);
    result.matrices.authentication.push({ actor, status: response.status, result: "PASS" });
  }
  pass("authentication matrix: guest, five active roles/identities, pending, suspended, rejected");

  const protectedRoutes = [
    ["GET", "/api/users"], ["POST", "/api/users"], ["GET", `/api/users/${fixture.identities.memberA.id}`], ["PATCH", `/api/users/${fixture.identities.memberA.id}`],
    ["POST", `/api/users/${fixture.identities.memberA.id}/approve`], ["POST", `/api/users/${fixture.identities.memberA.id}/reject`], ["POST", `/api/users/${fixture.identities.memberA.id}/suspend`], ["POST", `/api/users/${fixture.identities.memberA.id}/reactivate`], ["POST", `/api/users/${fixture.identities.memberA.id}/reset-password`], ["POST", `/api/users/${fixture.identities.memberA.id}/change-role`],
    ["GET", "/api/learning/topics"], ["GET", `/api/learning/topics/${fixture.ids.topicA}`], ["POST", "/api/learning/topics"], ["PATCH", `/api/learning/topics/${fixture.ids.topicA}`], ["POST", `/api/learning/topics/${fixture.ids.topicA}/assign`], ["GET", "/api/learning/my-assignments"],
    ["POST", "/api/learning/progress/start"], ["POST", "/api/learning/progress/update"], ["POST", "/api/learning/progress/complete"], ["GET", "/api/quiz/questions"], ["GET", `/api/quiz/by-topic/${fixture.ids.topicA}`], ["POST", "/api/quiz/questions"], ["PATCH", `/api/quiz/questions/${fixture.ids.question}`], ["POST", "/api/quiz/start"], ["POST", "/api/quiz/save-attempt"], ["POST", "/api/quiz/submit"], ["GET", "/api/quiz/history"],
    ["GET", "/api/exams"], ["GET", `/api/exams/${fixture.ids.exam}`], ["POST", "/api/exams"], ["PATCH", `/api/exams/${fixture.ids.exam}`], ["POST", "/api/exam-attempts/start"], ["POST", "/api/exam-attempts/save-attempt"], ["POST", "/api/exam-attempts/submit"], ["GET", "/api/exam-attempts/history"],
    ["GET", "/api/reports/personal"], ["GET", "/api/reports/instructor"], ["GET", "/api/reports/unit"], ["GET", "/api/rankings"], ["GET", "/api/reports/admin"], ["GET", "/api/notifications"], ["POST", `/api/notifications/${fixture.ids.notification}/read`], ["POST", "/api/news"], ["PATCH", `/api/news/${fixture.ids.news.public}`], ["DELETE", `/api/news/${fixture.ids.news.public}`], ["GET", "/api/audit-logs"], ["GET", "/api/ai/chat/history"], ["POST", "/api/ai/chat/message"], ["POST", "/api/ai/chat"]
  ];
  result.matrices.guestProtectedEndpoints = [];
  for (const [method, path] of protectedRoutes) {
    const response = await api(base, path, { method, body: method === "GET" ? undefined : {} });
    expect([401, 403].includes(response.status), `guest must be denied ${method} ${path}; got ${response.status}`);
    result.matrices.guestProtectedEndpoints.push({ method, path, status: response.status, result: "PASS" });
  }
  pass(`authorization matrix: guest denied on all ${protectedRoutes.length} protected routes`);

  for (const actor of ["instructor", "politicalOfficer", "admin"]) {
    const response = await api(base, "/api/exam-attempts/start", { method: "POST", token: tokens[actor], body: { examId: fixture.ids.exam } });
    assert.equal(response.status, 403, `${actor} official-exam mutation`);
  }
  assert.equal((await api(base, "/api/reports/admin", { token: tokens.memberA })).status, 403);
  assert.equal((await api(base, "/api/audit-logs", { token: tokens.instructor })).status, 403);
  pass("backend role guards: official exam, admin reports, audit logs");

  const ownership = [
    ["quiz attempt", "/api/quiz/save-attempt", { ...{ id: fixture.ids.quizAttempt, topicId: fixture.ids.topicA, status: "in_progress" } }],
    ["exam attempt", "/api/exam-attempts/save-attempt", { id: fixture.ids.examAttempt, examId: fixture.ids.exam, status: "in_progress", answers: {} }],
    ["notification", `/api/notifications/${fixture.ids.notification}/read`, undefined]
  ];
  result.matrices.ownership = [];
  for (const [resource, path, body] of ownership) {
    const response = await api(base, path, { method: "POST", token: tokens.memberB, body: body ?? {} });
    expect([403, 404].includes(response.status), `cross-user ${resource} must be hidden/denied`);
    result.matrices.ownership.push({ resource, status: response.status, result: "PASS" });
  }
  const memberBHistory = await api(base, "/api/quiz/history", { token: tokens.memberB });
  expect(!memberBHistory.json.some(row => row.id === fixture.ids.quizAttempt), "quiz history leakage");
  const memberBExams = await api(base, "/api/exam-attempts/history", { token: tokens.memberB });
  expect(!memberBExams.json.some(row => row.id === fixture.ids.examAttempt), "exam history leakage");
  const memberBNotifications = await api(base, "/api/notifications", { token: tokens.memberB });
  expect(!memberBNotifications.json.some(row => row.id === fixture.ids.notification), "notification leakage");
  const memberBAi = await api(base, "/api/ai/chat/history", { token: tokens.memberB });
  expect(!memberBAi.json.some(row => row.id === fixture.ids.aiA), "AI history leakage");
  const reportA = await api(base, "/api/reports/personal", { token: tokens.memberA });
  const reportB = await api(base, "/api/reports/personal", { token: tokens.memberB });
  expect(reportA.status === 200 && reportB.status === 200 && JSON.stringify(reportA.json) !== JSON.stringify(reportB.json), "personal reports must be actor-scoped");
  pass("ownership matrix: progress/quiz/exam/notifications/AI/reports actor scope");

  const validToken = tokens.memberA;
  const negativeAppToken = overrides => jwt.sign(
    { role: "member", accountStatus: "active" },
    process.env.JWT_SECRET,
    { subject: fixture.identities.memberA.id, expiresIn: "10m", issuer: "ai-chinh-tri-vien-so", audience: "ai-chinh-tri-vien-so-web", algorithm: "HS256", ...overrides }
  );
  const invalidTokens = [
    "not-a-jwt",
    validToken.slice(0, -1),
    `${validToken.slice(0, -1)}${validToken.endsWith("a") ? "b" : "a"}`,
    negativeAppToken({ expiresIn: -1 }),
    negativeAppToken({ issuer: "wrong-issuer" }),
    negativeAppToken({ audience: "wrong-audience" })
  ];
  for (const token of invalidTokens) assert.equal((await api(base, "/api/auth/me", { token })).status, 401);
  pass("JWT validation: malformed, truncated, corrupted, expired, wrong issuer, and wrong audience app tokens");

  const injectionPayloads = ["' OR 1=1 --", "x'; DROP TABLE users; --", "../../etc/passwd"];
  for (const payload of injectionPayloads) {
    const news = await api(base, `/api/news/${encodeURIComponent(payload)}`);
    expect([400, 404].includes(news.status), "injected news id must not succeed");
  }
  const loginInjection = await api(base, "/api/auth/login", { method: "POST", body: { emailOrPhone: "' OR 1=1 --", password: "wrong" } });
  expect([400, 401].includes(loginInjection.status), "SQL injection login must not authenticate");
  pass("SQL injection probes rejected without server error or authentication bypass");

  const forbidden = new Set(["password", "passwordhash", "password_hash", "correctanswers", "correct_answers", "service_role_key", "jwt_secret"]);
  for (const [path, token] of [["/api/auth/me", tokens.memberA], ["/api/quiz/questions", tokens.memberA], [`/api/exams/${fixture.ids.exam}`, tokens.memberA]]) {
    const response = await api(base, path, { token }); assert.equal(response.status, 200); expect(!containsKey(response.json, forbidden), `sensitive field leaked by ${path}`);
  }
  pass("sensitive data leakage: password, secrets, and pre-submission correct answers absent");

  const rateLogin = "gate6e_rate_limit_missing@example.test";
  const rateStatuses = [];
  for (let index = 0; index < 6; index++) rateStatuses.push((await api(base, "/api/auth/login", { method: "POST", body: { emailOrPhone: rateLogin, password: "wrong-password" } })).status);
  assert.equal(rateStatuses.at(-1), 429, `expected login rate limit; got ${rateStatuses.join(",")}`);
  pass("rate limiting: sixth failed login is HTTP 429");

  const created = await api(base, "/api/news", { method: "POST", token: tokens.admin, body: { title: "gate6e audit probe", content: "gate6e", visibility: "public" } });
  assert.equal(created.status, 200);
  const logs = await api(base, "/api/audit-logs", { token: tokens.admin });
  assert.equal(logs.status, 200); expect(logs.json.some(log => log.entityId === created.json.id), "audit record not generated");
  pass("audit log generated for privileged news mutation");

  result.status = "PASS";
} catch (error) {
  result.status = "FAIL"; result.failed.push({ message: error.message, stack: error.stack?.split("\n").slice(0, 4) });
} finally {
  if (backendProcess && backendProcess.exitCode === null) backendProcess.kill();
  try { result.cleanup = await cleanupSecurityFixtures(); } catch (error) { result.status = "FAIL"; result.failed.push({ message: `cleanup: ${error.message}` }); }
  console.log(JSON.stringify(result, null, 2));
}
if (result.status === "FAIL") process.exit(1);
