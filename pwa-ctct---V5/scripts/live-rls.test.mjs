import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { Gate6eBlocked, setupSecurityFixtures, cleanupSecurityFixtures, queryLocalPostgres } from "./security-fixtures.mjs";

const result = { suite: "Gate 6E live RLS", status: "RUNNING", passed: [], failed: [], blocked: [], matrix: [] };
const check = async (name, fn) => {
  try { await fn(); result.passed.push(name); result.matrix.push({ test: name, result: "PASS" }); }
  catch (error) { result.failed.push({ name, message: error.message }); result.matrix.push({ test: name, result: "FAIL" }); }
};
let fixture;
try { fixture = await setupSecurityFixtures(); }
catch (error) {
  if (error instanceof Gate6eBlocked) { result.status = "BLOCKED"; result.blocked.push(error.message); console.log(JSON.stringify(result, null, 2)); process.exit(0); }
  throw error;
}

try {
  const { ids, sessions, identities } = fixture;
  const anon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const rows = async (client, table, columns = "id") => { const { data, error } = await client.from(table).select(columns); if (error) throw error; return data; };

  await check("anon sees published/public news only", async () => {
    const data = await rows(anon, "news", "id,status,visibility");
    assert.ok(data.some(row => row.id === ids.news.public));
    assert.ok(!data.some(row => [ids.news.internal, ids.news.draft].includes(row.id)));
  });
  await check("active member sees public/internal published but not draft", async () => {
    const data = await rows(sessions.memberA.client, "news", "id");
    assert.ok(data.some(row => row.id === ids.news.public)); assert.ok(data.some(row => row.id === ids.news.internal)); assert.ok(!data.some(row => row.id === ids.news.draft));
  });
  await check("admin and political officer see draft news", async () => {
    for (const client of [sessions.admin.client, sessions.politicalOfficer.client]) assert.ok((await rows(client, "news")).some(row => row.id === ids.news.draft));
  });
  await check("member cannot read direct question answers", async () => {
    const { data, error } = await sessions.memberA.client.from("questions").select("id,correct_answers").eq("id", ids.question);
    if (error) throw error; assert.equal(data.length, 0);
  });
  await check("quiz ownership denies member B", async () => {
    assert.ok((await rows(sessions.memberA.client, "quiz_attempts")).some(row => row.id === ids.quizAttempt));
    assert.ok(!(await rows(sessions.memberB.client, "quiz_attempts")).some(row => row.id === ids.quizAttempt));
  });
  await check("exam ownership denies member B", async () => {
    assert.ok((await rows(sessions.memberA.client, "exam_attempts")).some(row => row.id === ids.examAttempt));
    assert.ok(!(await rows(sessions.memberB.client, "exam_attempts")).some(row => row.id === ids.examAttempt));
  });
  await check("progress ownership denies member B", async () => {
    assert.ok((await rows(sessions.memberA.client, "learning_progress")).some(row => row.id === ids.progress));
    assert.ok(!(await rows(sessions.memberB.client, "learning_progress")).some(row => row.id === ids.progress));
  });
  await check("notification ownership denies member B", async () => {
    assert.ok((await rows(sessions.memberA.client, "notifications")).some(row => row.id === ids.notification));
    assert.ok(!(await rows(sessions.memberB.client, "notifications")).some(row => row.id === ids.notification));
  });
  await check("AI history ownership denies member B", async () => {
    assert.ok((await rows(sessions.memberA.client, "ai_chat_messages")).some(row => row.id === ids.aiA));
    assert.ok(!(await rows(sessions.memberB.client, "ai_chat_messages")).some(row => row.id === ids.aiA));
  });
  await check("report snapshot ownership denies member B", async () => {
    assert.ok((await rows(sessions.memberA.client, "report_snapshots")).some(row => row.id === ids.report));
    assert.ok(!(await rows(sessions.memberB.client, "report_snapshots")).some(row => row.id === ids.report));
  });
  await check("non-member cannot insert official exam attempt", async () => {
    for (const [name, session] of [["instructor", sessions.instructor], ["political", sessions.politicalOfficer], ["admin", sessions.admin]]) {
      const { error } = await session.client.from("exam_attempts").insert({ id: `gate6e_forbidden_${name}`, exam_id: ids.exam, user_id: identities[name === "political" ? "politicalOfficer" : name].id, status: "in_progress", answers: {} });
      assert.ok(error, `${name} insert unexpectedly succeeded`);
    }
  });
  await check("instructor cannot mutate out-of-unit topic", async () => {
    const { data, error } = await sessions.instructor.client.from("learning_topics").update({ title: "forbidden" }).eq("id", ids.topicB).select("id");
    if (error) throw error; assert.equal(data.length, 0);
  });
  await check("service role bypass is explicit and operational", async () => {
    const evidence = await queryLocalPostgres(`BEGIN; SET LOCAL ROLE service_role; SELECT json_build_object('ai', COUNT(*) FILTER (WHERE id IN ('${ids.aiA}','${ids.aiB}')), 'draft', COUNT(*) FILTER (WHERE id = '${ids.news.draft}')) FROM (SELECT id FROM public.ai_chat_messages UNION ALL SELECT id FROM public.news) rows; ROLLBACK;`);
    const jsonLine = evidence.split(/\r?\n/).find(line => line.trim().startsWith("{"));
    const parsed = JSON.parse(jsonLine);
    assert.equal(Number(parsed.ai), 2);
    assert.equal(Number(parsed.draft), 1);
  });
  result.status = result.failed.length ? "FAIL" : "PASS";
} finally {
  try { result.cleanup = await cleanupSecurityFixtures(); } catch (error) { result.status = "FAIL"; result.failed.push({ name: "cleanup", message: error.message }); }
  console.log(JSON.stringify(result, null, 2));
}
if (result.status === "FAIL") process.exit(1);
