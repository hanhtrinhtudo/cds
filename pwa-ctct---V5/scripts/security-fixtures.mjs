import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

dotenv.config();

export class Gate6eBlocked extends Error {
  constructor(message) {
    super(message);
    this.name = "Gate6eBlocked";
  }
}

const APPROVAL = "I_UNDERSTAND_THIS_WRITES_TO_LOCAL_TEST_DB";
const PREFIX = "gate6e_";
const PASSWORD = "Gate6e_Test_Only_42!";
const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const execFileAsync = promisify(execFile);

const parseLocalUrl = (value, label) => {
  let url;
  try { url = new URL(value); } catch { throw new Gate6eBlocked(`${label} is missing or invalid.`); }
  if (!localHosts.has(url.hostname)) throw new Gate6eBlocked(`${label} must target localhost/127.0.0.1/::1.`);
  return url;
};

export const gate6eSafety = () => {
  const apiBaseUrl = process.env.GATE6E_API_BASE_URL || "http://127.0.0.1:3000";
  const supabaseUrl = process.env.SUPABASE_URL || "";
  parseLocalUrl(apiBaseUrl, "Gate 6E API URL");
  parseLocalUrl(supabaseUrl, "SUPABASE_URL");
  if (process.env.GATE6E_ALLOW_MUTATING_SECURITY !== "1") throw new Gate6eBlocked("GATE6E_ALLOW_MUTATING_SECURITY=1 is required.");
  if (process.env.GATE6E_DISPOSABLE_DB !== "1") throw new Gate6eBlocked("GATE6E_DISPOSABLE_DB=1 is required.");
  if (process.env.GATE6E_FIXTURE_APPROVAL !== APPROVAL) throw new Gate6eBlocked("The exact Gate 6E fixture approval phrase is required.");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Gate6eBlocked("SUPABASE_SERVICE_ROLE_KEY is required for disposable setup/cleanup.");
  if (!process.env.SUPABASE_ANON_KEY) throw new Gate6eBlocked("SUPABASE_ANON_KEY is required to prove user-token RLS without service-role ambiguity.");
  return { apiBaseUrl, supabaseUrl };
};

const localDatabaseUrl = () => {
  gate6eSafety();
  const value = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
  const url = parseLocalUrl(value, "Gate 6E database URL");
  if (!/^postgres(?:ql)?:$/.test(url.protocol)) throw new Gate6eBlocked("Gate 6E database URL must use PostgreSQL.");
  return url;
};

const runPsql = async (sql, { tuplesOnly = false } = {}) => {
  const url = localDatabaseUrl();
  const baseArgs = ["-X", "-v", "ON_ERROR_STOP=1", ...(tuplesOnly ? ["-t", "-A"] : []), "-c", sql];
  const env = { ...process.env, PGPASSWORD: decodeURIComponent(url.password || "") };
  const connectionArgs = ["-h", url.hostname, "-p", url.port || "5432", "-U", decodeURIComponent(url.username || "postgres"), "-d", url.pathname.slice(1) || "postgres"];
  try {
    const { stdout } = await execFileAsync(process.env.GATE6E_PSQL_PATH || "psql", [...connectionArgs, ...baseArgs], { env, maxBuffer: 10 * 1024 * 1024 });
    return stdout.trim();
  } catch (error) {
    if (error.code !== "ENOENT") throw new Error(`local PostgreSQL command failed: ${error.stderr?.trim() || error.message}`);
  }

  const port = url.port || "5432";
  const { stdout: containers } = await execFileAsync("docker", ["ps", "--filter", `publish=${port}`, "--format", "{{.Names}}"], { maxBuffer: 1024 * 1024 });
  const container = containers.split(/\r?\n/).map(value => value.trim()).find(Boolean);
  if (!container) throw new Gate6eBlocked(`No local PostgreSQL client or Docker database container publishes port ${port}.`);
  const dockerArgs = ["exec", "-i", container, "psql", "-X", "-v", "ON_ERROR_STOP=1", "-U", decodeURIComponent(url.username || "postgres"), "-d", url.pathname.slice(1) || "postgres", ...(tuplesOnly ? ["-t", "-A"] : []), "-c", sql];
  const { stdout } = await execFileAsync("docker", dockerArgs, { maxBuffer: 10 * 1024 * 1024 });
  return stdout.trim();
};

export const queryLocalPostgres = async sql => runPsql(sql, { tuplesOnly: true });

export const diagnoseBackendLoginFixture = async identity => {
  gate6eSafety();
  if (!identity?.id || !/^[0-9a-f-]{36}$/i.test(identity.id)) throw new Error("Invalid diagnostic fixture identity");
  const raw = await queryLocalPostgres(`SELECT json_build_object('id', id, 'passwordHash', password_hash, 'accountStatus', account_status, 'mustChangePassword', must_change_password, 'role', role) FROM public.users WHERE id = '${identity.id}';`);
  const row = raw ? JSON.parse(raw.split(/\r?\n/).find(line => line.trim().startsWith("{"))) : null;
  const service = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await service.from("users").select("id,account_status,must_change_password,role").eq("id", identity.id);
  return {
    directPostgres: {
      rowExists: !!row,
      passwordMatches: !!row && await bcrypt.compare(PASSWORD, row.passwordHash),
      accountStatus: row?.accountStatus || null,
      mustChangePassword: row?.mustChangePassword ?? null,
      role: row?.role || null
    },
    backendEquivalentRest: {
      rowVisible: !!data?.some(item => item.id === identity.id),
      errorCode: error?.code || null,
      errorMessage: error?.message || null
    },
    supabaseAuthUsedByBackendLogin: false,
    approvedFieldUsedByBackendLogin: false
  };
};

const authClient = supabaseUrl => createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const assertOk = (label, error) => { if (error) throw new Error(`${label}: ${error.message}`); };
const now = () => new Date().toISOString();
const future = () => new Date(Date.now() + 7 * 86400000).toISOString();
const past = () => new Date(Date.now() - 86400000).toISOString();

export const GATE6E_STATIC_IDS = {
  units: { a: "6e000000-0000-4000-8000-000000000001", b: "6e000000-0000-4000-8000-000000000002" },
  topicA: "gate6e_topic_a", topicB: "gate6e_topic_b", question: "gate6e_question",
  exam: "gate6e_exam", quizAttempt: "gate6e_quiz_attempt_a", examAttempt: "gate6e_exam_attempt_a",
  notification: "gate6e_notification_a", aiA: "gate6e_ai_a", aiB: "gate6e_ai_b",
  progress: "gate6e_progress_a", report: "gate6e_report_a",
  news: { public: "gate6e_news_public", internal: "gate6e_news_internal", draft: "gate6e_news_draft" }
};

export const cleanupSecurityFixtures = async () => {
  gate6eSafety();
  const output = await runPsql(`
BEGIN;
CREATE TEMP TABLE gate6e_users ON COMMIT DROP AS
  SELECT id FROM public.users WHERE email LIKE 'gate6e\\_%' ESCAPE '\\';
DELETE FROM public.audit_logs WHERE id LIKE 'gate6e\\_%' ESCAPE '\\' OR entity_id LIKE 'gate6e\\_%' ESCAPE '\\' OR user_id IN (SELECT id FROM gate6e_users);
DELETE FROM public.exam_answers WHERE id LIKE 'gate6e\\_%' ESCAPE '\\' OR exam_attempt_id LIKE 'gate6e\\_%' ESCAPE '\\';
DELETE FROM public.notifications WHERE id LIKE 'gate6e\\_%' ESCAPE '\\' OR user_id IN (SELECT id FROM gate6e_users);
DELETE FROM public.ai_chat_messages WHERE id LIKE 'gate6e\\_%' ESCAPE '\\' OR user_id IN (SELECT id FROM gate6e_users);
DELETE FROM public.report_snapshots WHERE id LIKE 'gate6e\\_%' ESCAPE '\\' OR generated_by IN (SELECT id FROM gate6e_users);
DELETE FROM public.exam_attempts WHERE id LIKE 'gate6e\\_%' ESCAPE '\\' OR user_id IN (SELECT id FROM gate6e_users);
DELETE FROM public.quiz_attempts WHERE id LIKE 'gate6e\\_%' ESCAPE '\\' OR user_id IN (SELECT id FROM gate6e_users);
DELETE FROM public.learning_progress WHERE id LIKE 'gate6e\\_%' ESCAPE '\\' OR user_id IN (SELECT id FROM gate6e_users);
DELETE FROM public.learning_assignments WHERE id LIKE 'gate6e\\_%' ESCAPE '\\' OR topic_id LIKE 'gate6e\\_%' ESCAPE '\\' OR assigned_to_user_id IN (SELECT id FROM gate6e_users);
DELETE FROM public.exams WHERE id LIKE 'gate6e\\_%' ESCAPE '\\';
DELETE FROM public.questions WHERE id LIKE 'gate6e\\_%' ESCAPE '\\' OR topic_id LIKE 'gate6e\\_%' ESCAPE '\\';
DELETE FROM public.learning_sections WHERE id LIKE 'gate6e\\_%' ESCAPE '\\' OR topic_id LIKE 'gate6e\\_%' ESCAPE '\\';
DELETE FROM public.learning_topics WHERE id LIKE 'gate6e\\_%' ESCAPE '\\';
DELETE FROM public.news WHERE id LIKE 'gate6e\\_%' ESCAPE '\\' OR title LIKE 'gate6e\\_%' ESCAPE '\\' OR author_id IN (SELECT id FROM gate6e_users);
DELETE FROM public.users WHERE id IN (SELECT id FROM gate6e_users);
DELETE FROM public.units WHERE id IN ('${GATE6E_STATIC_IDS.units.a}', '${GATE6E_STATIC_IDS.units.b}') AND name LIKE 'gate6e\\_%' ESCAPE '\\';
DELETE FROM auth.users WHERE email LIKE 'gate6e\\_%' ESCAPE '\\';
COMMIT;`);
  return { mode: "local-postgres", completed: true, outputLines: output ? output.split(/\r?\n/).length : 0 };
};

const identitySpecs = [
  ["memberA", "member", "active", "a"], ["memberB", "member", "active", "b"],
  ["instructor", "instructor", "active", "a"], ["politicalOfficer", "political_officer", "active", "a"],
  ["admin", "admin", "active", "a"], ["pending", "member", "pending", "a"],
  ["suspended", "member", "suspended", "a"], ["rejected", "member", "rejected", "a"]
];

export const setupSecurityFixtures = async () => {
  const { apiBaseUrl, supabaseUrl } = gate6eSafety();
  await cleanupSecurityFixtures();
  const createdAt = now();
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const ids = GATE6E_STATIC_IDS;
  const counts = {};

  const identities = {};
  for (const [name, role, accountStatus, unit] of identitySpecs) {
    const email = `${PREFIX}${name.toLowerCase()}@example.test`;
    const { data, error } = await authClient(supabaseUrl).auth.signUp({ email, password: PASSWORD, options: { data: { gate: "6e" } } });
    assertOk(`create auth identity ${name}`, error);
    if (!data.user?.id) throw new Error(`create auth identity ${name}: no user id returned`);
    identities[name] = { id: data.user.id, email, role, accountStatus, unitId: ids.units[unit] };
  }
  const backendServiceEmail = `${PREFIX}backend_service@example.test`;
  const { data: backendServiceSignup, error: backendServiceSignupError } = await authClient(supabaseUrl).auth.signUp({ email: backendServiceEmail, password: PASSWORD, options: { data: { gate: "6e", purpose: "backend-service" } } });
  assertOk("create backend service auth identity", backendServiceSignupError);
  if (!backendServiceSignup.user?.id) throw new Error("create backend service auth identity: no user id returned");
  const backendServiceId = backendServiceSignup.user.id;
  counts.authUsers = Object.keys(identities).length;
  const uuid = value => { if (!/^[0-9a-f-]{36}$/i.test(value)) throw new Error("Invalid fixture UUID"); return value; };
  const u = Object.fromEntries(Object.entries(identities).map(([name, value]) => [name, uuid(value.id)]));
  await runPsql(`BEGIN;
INSERT INTO public.units (id,name,type,description) VALUES ('${ids.units.a}','gate6e_unit_a','test','gate6e disposable'),('${ids.units.b}','gate6e_unit_b','test','gate6e disposable') ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name;
INSERT INTO public.users (id,full_name,email,phone,password_hash,unit_id,role,account_status,must_change_password) VALUES
('${u.memberA}','gate6e_memberA','${identities.memberA.email}','0960006e00','${passwordHash}','${ids.units.a}','member','active',false),
('${u.memberB}','gate6e_memberB','${identities.memberB.email}','0960006e01','${passwordHash}','${ids.units.b}','member','active',false),
('${u.instructor}','gate6e_instructor','${identities.instructor.email}','0960006e02','${passwordHash}','${ids.units.a}','instructor','active',false),
('${u.politicalOfficer}','gate6e_politicalOfficer','${identities.politicalOfficer.email}','0960006e03','${passwordHash}','${ids.units.a}','political_officer','active',false),
('${u.admin}','gate6e_admin','${identities.admin.email}','0960006e04','${passwordHash}','${ids.units.a}','admin','active',false),
('${u.pending}','gate6e_pending','${identities.pending.email}','0960006e05','${passwordHash}','${ids.units.a}','member','pending',false),
('${u.suspended}','gate6e_suspended','${identities.suspended.email}','0960006e06','${passwordHash}','${ids.units.a}','member','suspended',false),
('${u.rejected}','gate6e_rejected','${identities.rejected.email}','0960006e07','${passwordHash}','${ids.units.a}','member','rejected',false);
INSERT INTO public.news (id,title,category,summary,content,visibility,status,author_id,published_at) VALUES ('${ids.news.public}','gate6e_public','gate6e','public','public','public','published','${u.politicalOfficer}','${createdAt}'),('${ids.news.internal}','gate6e_internal','gate6e','internal','internal','internal','published','${u.politicalOfficer}','${createdAt}'),('${ids.news.draft}','gate6e_draft','gate6e','draft','draft','internal','draft','${u.politicalOfficer}',NULL);
INSERT INTO public.learning_topics (id,title,category,content,required,created_by,assigned_unit_ids,assigned_user_ids) VALUES ('${ids.topicA}','gate6e topic A','test','test',true,'${u.instructor}','["${ids.units.a}"]','["${u.memberA}"]'),('${ids.topicB}','gate6e topic B','test','test',true,'${u.memberB}','["${ids.units.b}"]','["${u.memberB}"]');
INSERT INTO public.questions (id,topic_id,type,question_text,options,correct_answers,explanation,tags) VALUES ('${ids.question}','${ids.topicA}','single','gate6e question','["A","B","C","D"]','[1]','gate6e','["gate6e"]');
INSERT INTO public.exams (id,title,topic_ids,duration_minutes,question_count,start_date,end_date,passing_score,allow_review,status,lifecycle_status,created_by) VALUES ('${ids.exam}','gate6e exam','["${ids.topicA}"]',30,1,'${past()}','${future()}',5,true,'active','published','${u.instructor}');
INSERT INTO public.quiz_attempts (id,user_id,quiz_type,topic_id,total_questions,answers,status) VALUES ('${ids.quizAttempt}','${u.memberA}','topic','${ids.topicA}',1,'{}','in_progress');
INSERT INTO public.exam_attempts (id,exam_id,user_id,status,answers) VALUES ('${ids.examAttempt}','${ids.exam}','${u.memberA}','in_progress','{}');
INSERT INTO public.notifications (id,user_id,title,message,type,read) VALUES ('${ids.notification}','${u.memberA}','gate6e','private','info',false);
INSERT INTO public.ai_chat_messages (id,user_id,topic_id,role,content) VALUES ('${ids.aiA}','${u.memberA}','${ids.topicA}','user','gate6e member A secret'),('${ids.aiB}','${u.memberB}','${ids.topicB}','user','gate6e member B secret');
INSERT INTO public.learning_progress (id,user_id,topic_id,status,progress_percent) VALUES ('${ids.progress}','${u.memberA}','${ids.topicA}','completed',100);
INSERT INTO public.report_snapshots (id,title,type,generated_by,data) VALUES ('${ids.report}','gate6e report A','personal','${u.memberA}','{"private":true}');
UPDATE auth.users SET role = 'service_role', raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"service_role","gate":"6e"}'::jsonb WHERE id = '${uuid(backendServiceId)}' AND email = '${backendServiceEmail}';
COMMIT;`);
  Object.assign(counts, { authUsers: 9, units: 2, users: 8, news: 3, learning_topics: 2, questions: 1, exams: 1, quiz_attempts: 1, exam_attempts: 1, notifications: 1, ai_chat_messages: 2, learning_progress: 1, report_snapshots: 1 });
  const memberDiagnostic = await diagnoseBackendLoginFixture(identities.memberA);
  if (!memberDiagnostic.directPostgres.passwordMatches) throw new Error("Gate 6E fixture bcrypt self-check failed");

  const sessions = {};
  for (const [name, identity] of Object.entries(identities)) {
    const client = authClient(supabaseUrl);
    const { data, error } = await client.auth.signInWithPassword({ email: identity.email, password: PASSWORD });
    assertOk(`sign in auth identity ${name}`, error);
    sessions[name] = { accessToken: data.session.access_token, client };
  }
  const backendAuthClient = authClient(supabaseUrl);
  const { data: backendServiceLogin, error: backendServiceLoginError } = await backendAuthClient.auth.signInWithPassword({ email: backendServiceEmail, password: PASSWORD });
  assertOk("sign in backend service auth identity", backendServiceLoginError);
  const backendServiceKey = backendServiceLogin.session?.access_token;
  if (!backendServiceKey) throw new Error("sign in backend service auth identity: no access token returned");
  const servicePayload = JSON.parse(Buffer.from(backendServiceKey.split(".")[1], "base64url").toString("utf8"));
  if (servicePayload.role !== "service_role") throw new Error("backend service Auth token does not contain service_role");
  const backendCompatibleClient = createClient(supabaseUrl, backendServiceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: visibleUser, error: visibleUserError } = await backendCompatibleClient.from("users").select("id").eq("id", identities.memberA.id).maybeSingle();
  assertOk("verify backend-compatible fixture visibility", visibleUserError);
  if (visibleUser?.id !== identities.memberA.id) throw new Error("backend-compatible service identity cannot see fixture user");
  return { apiBaseUrl, ids, identities, sessions, counts, backendServiceKey, visibility: { directPostgres: true, configuredSecretRest: false, authIssuedServiceRoleRest: true } };
};
