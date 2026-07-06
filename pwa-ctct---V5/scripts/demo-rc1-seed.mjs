#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const execFileAsync = promisify(execFile);
const PASSWORD = "Demo_Rc1_Test_42!";
const PREFIX = "demo_rc1_";
const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

const ids = {
  unitCommand: "de000001-0000-4000-8000-000000000001",
  unitMobile: "de000001-0000-4000-8000-000000000002",
  member: "de000001-0000-4000-8000-000000000101",
  instructor: "de000001-0000-4000-8000-000000000102",
  admin: "de000001-0000-4000-8000-000000000103",
  topic: "demo_rc1_topic_political_legal",
  section: "demo_rc1_section_lesson_01",
  assignment: "demo_rc1_assignment_member_topic",
  learningProgress: "demo_rc1_progress_member_topic",
  news: "demo_rc1_news_public_legal",
  exam: "demo_rc1_exam_official",
  quizAttempt: "demo_rc1_quiz_attempt_member",
  examAttempt: "demo_rc1_exam_attempt_member",
  notification: "demo_rc1_notification_member",
  aiUser: "demo_rc1_ai_user_member",
  aiModel: "demo_rc1_ai_model_member",
  report: "demo_rc1_report_member",
};

const demoAccounts = [
  {
    id: ids.member,
    email: "demo_rc1_member@example.test",
    phone: "0917000001",
    fullName: "Chiến sĩ Demo RC1",
    role: "member",
    unitId: ids.unitMobile,
  },
  {
    id: ids.instructor,
    email: "demo_rc1_instructor@example.test",
    phone: "0917000002",
    fullName: "Giáo viên Demo RC1",
    role: "instructor",
    unitId: ids.unitMobile,
  },
  {
    id: ids.admin,
    email: "demo_rc1_admin@example.test",
    phone: "0917000003",
    fullName: "Quản trị Demo RC1",
    role: "admin",
    unitId: ids.unitCommand,
  },
];

function assertSafeEnvironment() {
  if (!process.env.SUPABASE_URL) throw new Error("SUPABASE_URL is required.");
  const supabaseUrl = new URL(process.env.SUPABASE_URL);
  const dbUrl = new URL(process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres");
  const hostedAllowed = process.env.DEMO_RC1_ALLOW_HOSTED_STAGING === "1";
  if (!localHosts.has(supabaseUrl.hostname) && !hostedAllowed) {
    throw new Error("BLOCKED: hosted Supabase target requires DEMO_RC1_ALLOW_HOSTED_STAGING=1.");
  }
  if (!localHosts.has(dbUrl.hostname)) {
    throw new Error("BLOCKED: demo RC1 direct fixture seeding is local/disposable PostgreSQL only.");
  }
}

function sqlLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function runPsql(sql, tuplesOnly = false) {
  assertSafeEnvironment();
  const url = new URL(process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "postgresql://postgres:postgres@127.0.0.1:54322/postgres");
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

function loadCdsQuestions() {
  const path = resolve(process.cwd(), "../cds/data/questions.json");
  if (!existsSync(path)) throw new Error(`CDS question source not found: ${path}`);
  const rows = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(rows) || rows.length !== 8) throw new Error("Expected exactly 8 CDS questions.");
  return rows.map((row, index) => {
    const optionEntries = Object.entries(row.options || {}).sort(([left], [right]) => left.localeCompare(right));
    const answerIndex = optionEntries.findIndex(([key]) => key.toUpperCase() === String(row.answer || "").toUpperCase());
    if (!row.question || optionEntries.length !== 4 || answerIndex < 0) {
      throw new Error(`Invalid CDS question row ${index + 1}.`);
    }
    const hash = createHash("sha256").update(`${ids.topic}|${row.question}|${row.answer}`).digest("hex").slice(0, 20);
    return {
      id: `${PREFIX}q_${hash}`,
      questionText: row.question,
      options: optionEntries.map(([, text]) => text),
      correctAnswers: [answerIndex],
    };
  });
}

async function cleanup() {
  const sql = `BEGIN;
DELETE FROM public.audit_logs WHERE entity_id LIKE 'demo_rc1\\_%' ESCAPE '\\' OR user_id IN (${demoAccounts.map(account => sqlLiteral(account.id)).join(",")});
DELETE FROM public.exam_answers WHERE id LIKE 'demo_rc1\\_%' ESCAPE '\\' OR exam_attempt_id = ${sqlLiteral(ids.examAttempt)};
DELETE FROM public.notifications WHERE id LIKE 'demo_rc1\\_%' ESCAPE '\\' OR user_id IN (${demoAccounts.map(account => sqlLiteral(account.id)).join(",")});
DELETE FROM public.ai_chat_messages WHERE id LIKE 'demo_rc1\\_%' ESCAPE '\\' OR user_id = ${sqlLiteral(ids.member)};
DELETE FROM public.exam_attempts WHERE id LIKE 'demo_rc1\\_%' ESCAPE '\\' OR user_id IN (${demoAccounts.map(account => sqlLiteral(account.id)).join(",")});
DELETE FROM public.quiz_attempts WHERE id LIKE 'demo_rc1\\_%' ESCAPE '\\' OR user_id IN (${demoAccounts.map(account => sqlLiteral(account.id)).join(",")});
DELETE FROM public.learning_progress WHERE id LIKE 'demo_rc1\\_%' ESCAPE '\\' OR user_id IN (${demoAccounts.map(account => sqlLiteral(account.id)).join(",")});
DELETE FROM public.report_snapshots WHERE id LIKE 'demo_rc1\\_%' ESCAPE '\\' OR generated_by IN (${demoAccounts.map(account => sqlLiteral(account.id)).join(",")});
DELETE FROM public.exams WHERE id LIKE 'demo_rc1\\_%' ESCAPE '\\';
DELETE FROM public.questions WHERE id LIKE 'demo_rc1\\_%' ESCAPE '\\' OR topic_id = ${sqlLiteral(ids.topic)};
DELETE FROM public.learning_sections WHERE id LIKE 'demo_rc1\\_%' ESCAPE '\\' OR topic_id = ${sqlLiteral(ids.topic)};
DELETE FROM public.learning_assignments WHERE id LIKE 'demo_rc1\\_%' ESCAPE '\\' OR topic_id = ${sqlLiteral(ids.topic)};
DELETE FROM public.learning_topics WHERE id = ${sqlLiteral(ids.topic)};
DELETE FROM public.news WHERE id LIKE 'demo_rc1\\_%' ESCAPE '\\' OR title LIKE 'demo_rc1\\_%' ESCAPE '\\';
DELETE FROM public.users WHERE id IN (${demoAccounts.map(account => sqlLiteral(account.id)).join(",")}) OR email LIKE 'demo_rc1\\_%' ESCAPE '\\';
DELETE FROM public.units WHERE id IN (${sqlLiteral(ids.unitMobile)},${sqlLiteral(ids.unitCommand)}) OR name LIKE 'demo_rc1\\_%' ESCAPE '\\';
COMMIT;`;
  await runPsql(sql);
  return { status: "PASS", deletedPrefix: PREFIX };
}

async function seed() {
  await cleanup();
  const questions = loadCdsQuestions();
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const now = new Date().toISOString();
  const later = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const quizAnswers = Object.fromEntries(questions.map(question => [question.id, question.correctAnswers]));
  const questionValues = questions.map(question => `(${[
    question.id,
    ids.topic,
    "single",
    question.questionText,
    JSON.stringify(question.options),
    JSON.stringify(question.correctAnswers),
    "Dữ liệu câu hỏi kế thừa từ CDS; dùng cho DEMO RC1 local/staging.",
    "Trung bình",
    "CDS legacy questions.json",
    JSON.stringify(["demo_rc1", "cds_legacy"]),
  ].map(sqlLiteral).join(",")})`).join(",\n");

  const userValues = demoAccounts.map(account => `(${[
    account.id,
    account.fullName,
    account.email,
    account.phone,
    passwordHash,
    account.unitId,
    account.role,
    "active",
    false,
  ].map(value => typeof value === "boolean" ? String(value) : sqlLiteral(value)).join(",")})`).join(",\n");

  const sql = `BEGIN;
INSERT INTO public.units (id,name,type,parent_unit_id,description) VALUES
(${sqlLiteral(ids.unitCommand)},'demo_rc1_Ban chỉ huy','demo',NULL,'Demo RC1 command unit')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,type=EXCLUDED.type,description=EXCLUDED.description,updated_at=NOW();
INSERT INTO public.units (id,name,type,parent_unit_id,description) VALUES
(${sqlLiteral(ids.unitMobile)},'demo_rc1_Trung đội học tập','demo',${sqlLiteral(ids.unitCommand)},'Demo RC1 learner unit')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,type=EXCLUDED.type,parent_unit_id=EXCLUDED.parent_unit_id,description=EXCLUDED.description,updated_at=NOW();
INSERT INTO public.users (id,full_name,email,phone,password_hash,unit_id,role,account_status,must_change_password)
VALUES ${userValues}
ON CONFLICT (email) DO UPDATE SET full_name=EXCLUDED.full_name, phone=EXCLUDED.phone, password_hash=EXCLUDED.password_hash, unit_id=EXCLUDED.unit_id, role=EXCLUDED.role, account_status='active', must_change_password=false, updated_at=NOW();
INSERT INTO public.learning_topics (id,title,category,description,objective,content,content_type,estimated_minutes,required,difficulty,tags,references_data,created_by,assigned_unit_ids,assigned_user_ids)
VALUES (${sqlLiteral(ids.topic)},'demo_rc1_Chính trị và pháp luật cơ bản','Giáo dục chính trị','Chuyên đề demo cho luồng học tập mobile RC1.','Bù nội dung học vắng, tự luyện và kiểm tra nhanh trên thiết bị di động.','Nội dung demo kết hợp giáo dục chính trị, kỷ luật quân đội và phổ biến pháp luật.','document',15,true,'Trung bình','["demo_rc1","cds_legacy"]','["CDS questions.json"]',${sqlLiteral(ids.instructor)},${sqlLiteral(JSON.stringify([ids.unitMobile]))},${sqlLiteral(JSON.stringify([ids.member]))})
ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,category=EXCLUDED.category,description=EXCLUDED.description,objective=EXCLUDED.objective,content=EXCLUDED.content,content_type=EXCLUDED.content_type,estimated_minutes=EXCLUDED.estimated_minutes,required=EXCLUDED.required,difficulty=EXCLUDED.difficulty,tags=EXCLUDED.tags,references_data=EXCLUDED.references_data,created_by=EXCLUDED.created_by,assigned_unit_ids=EXCLUDED.assigned_unit_ids,assigned_user_ids=EXCLUDED.assigned_user_ids,updated_at=NOW();
INSERT INTO public.learning_sections (id,topic_id,title,content,section_order,required)
VALUES (${sqlLiteral(ids.section)},${sqlLiteral(ids.topic)},'demo_rc1_Bài học: học bù và tự kiểm tra','Tình huống demo: đồng chí vắng buổi học tập trung vẫn mở chuyên đề trên điện thoại, đọc nội dung chính, sau đó làm phần luyện tập bằng bộ câu hỏi CDS đã chuyển vào PTKV.',1,true)
ON CONFLICT (id) DO UPDATE SET topic_id=EXCLUDED.topic_id,title=EXCLUDED.title,content=EXCLUDED.content,section_order=EXCLUDED.section_order,required=EXCLUDED.required,updated_at=NOW();
INSERT INTO public.learning_assignments (id,topic_id,assigned_to_user_id,assigned_to_unit_id,assigned_by,required,status)
VALUES (${sqlLiteral(ids.assignment)},${sqlLiteral(ids.topic)},${sqlLiteral(ids.member)},${sqlLiteral(ids.unitMobile)},${sqlLiteral(ids.instructor)},true,'pending')
ON CONFLICT (id) DO UPDATE SET topic_id=EXCLUDED.topic_id,assigned_to_user_id=EXCLUDED.assigned_to_user_id,assigned_to_unit_id=EXCLUDED.assigned_to_unit_id,assigned_by=EXCLUDED.assigned_by,required=EXCLUDED.required,status=EXCLUDED.status,updated_at=NOW();
INSERT INTO public.questions (id,topic_id,type,question_text,options,correct_answers,explanation,difficulty,reference_info,tags)
VALUES ${questionValues}
ON CONFLICT (id) DO UPDATE SET topic_id=EXCLUDED.topic_id,type=EXCLUDED.type,question_text=EXCLUDED.question_text,options=EXCLUDED.options,correct_answers=EXCLUDED.correct_answers,explanation=EXCLUDED.explanation,difficulty=EXCLUDED.difficulty,reference_info=EXCLUDED.reference_info,tags=EXCLUDED.tags,updated_at=NOW();
INSERT INTO public.exams (id,title,description,topic_ids,duration_minutes,question_count,start_date,end_date,passing_score,allow_review,status,lifecycle_status,created_by)
VALUES (${sqlLiteral(ids.exam)},'demo_rc1_Sát hạch chính trị pháp luật RC1','Đề demo dùng câu hỏi CDS đã chuyển sang PTKV.',${sqlLiteral(JSON.stringify([ids.topic]))},10,${Math.min(8, questions.length)},${sqlLiteral(now)},${sqlLiteral(later)},6,true,'active','published',${sqlLiteral(ids.instructor)})
ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,topic_ids=EXCLUDED.topic_ids,duration_minutes=EXCLUDED.duration_minutes,question_count=EXCLUDED.question_count,start_date=EXCLUDED.start_date,end_date=EXCLUDED.end_date,passing_score=EXCLUDED.passing_score,allow_review=EXCLUDED.allow_review,status=EXCLUDED.status,lifecycle_status=EXCLUDED.lifecycle_status,created_by=EXCLUDED.created_by,updated_at=NOW();
INSERT INTO public.news (id,title,category,summary,content,visibility,status,author_id,published_at)
VALUES (${sqlLiteral(ids.news)},'demo_rc1_Tuyên truyền pháp luật và học tập chính trị','Phổ biến giáo dục pháp luật','Tin public phục vụ màn hình khách trong demo RC1.','Nội dung demo: ứng dụng hỗ trợ phổ biến giáo dục pháp luật, giáo dục chính trị và theo dõi chất lượng học tập tại đơn vị.','public','published',${sqlLiteral(ids.admin)},NOW())
ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,category=EXCLUDED.category,summary=EXCLUDED.summary,content=EXCLUDED.content,visibility=EXCLUDED.visibility,status=EXCLUDED.status,author_id=EXCLUDED.author_id,published_at=EXCLUDED.published_at,updated_at=NOW();
INSERT INTO public.learning_progress (id,user_id,topic_id,status,progress_percent,completed_at,need_review,score_impact)
VALUES (${sqlLiteral(ids.learningProgress)},${sqlLiteral(ids.member)},${sqlLiteral(ids.topic)},'completed',100,NOW(),false,10)
ON CONFLICT (user_id,topic_id) DO UPDATE SET status=EXCLUDED.status,progress_percent=EXCLUDED.progress_percent,completed_at=EXCLUDED.completed_at,need_review=EXCLUDED.need_review,score_impact=EXCLUDED.score_impact,updated_at=NOW();
INSERT INTO public.quiz_attempts (id,user_id,quiz_type,topic_id,started_at,submitted_at,score,correct_count,wrong_count,total_questions,answers,status)
VALUES (${sqlLiteral(ids.quizAttempt)},${sqlLiteral(ids.member)},'topic',${sqlLiteral(ids.topic)},${sqlLiteral(now)},${sqlLiteral(now)},8.8,7,1,8,${sqlLiteral(JSON.stringify(quizAnswers))},'submitted')
ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id,quiz_type=EXCLUDED.quiz_type,topic_id=EXCLUDED.topic_id,submitted_at=EXCLUDED.submitted_at,score=EXCLUDED.score,correct_count=EXCLUDED.correct_count,wrong_count=EXCLUDED.wrong_count,total_questions=EXCLUDED.total_questions,answers=EXCLUDED.answers,status=EXCLUDED.status,updated_at=NOW();
INSERT INTO public.exam_attempts (id,exam_id,user_id,started_at,submitted_at,score,correct_count,wrong_count,passed,status,answers)
VALUES (${sqlLiteral(ids.examAttempt)},${sqlLiteral(ids.exam)},${sqlLiteral(ids.member)},${sqlLiteral(now)},${sqlLiteral(now)},8.8,7,1,true,'graded',${sqlLiteral(JSON.stringify(quizAnswers))})
ON CONFLICT (exam_id,user_id) DO UPDATE SET submitted_at=EXCLUDED.submitted_at,score=EXCLUDED.score,correct_count=EXCLUDED.correct_count,wrong_count=EXCLUDED.wrong_count,passed=EXCLUDED.passed,status=EXCLUDED.status,answers=EXCLUDED.answers,updated_at=NOW();
INSERT INTO public.notifications (id,user_id,title,message,type,read)
VALUES (${sqlLiteral(ids.notification)},${sqlLiteral(ids.member)},'demo_rc1_Nhắc học tập','Mời đồng chí hoàn thành chuyên đề demo RC1 và kiểm tra kết quả.','success',false)
ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,message=EXCLUDED.message,type=EXCLUDED.type,read=EXCLUDED.read,updated_at=NOW();
INSERT INTO public.ai_chat_messages (id,user_id,topic_id,role,content,safety_level,reference_used)
VALUES (${sqlLiteral(ids.aiUser)},${sqlLiteral(ids.member)},${sqlLiteral(ids.topic)},'user','Tóm tắt nội dung cần ôn sau bài kiểm tra demo RC1.','demo','demo_rc1'),
(${sqlLiteral(ids.aiModel)},${sqlLiteral(ids.member)},${sqlLiteral(ids.topic)},'model','Đồng chí nên ôn lại các nguyên tắc cơ bản và liên hệ với nội dung giáo dục pháp luật của đơn vị.','demo','demo_rc1')
ON CONFLICT (id) DO UPDATE SET content=EXCLUDED.content,safety_level=EXCLUDED.safety_level,reference_used=EXCLUDED.reference_used;
INSERT INTO public.report_snapshots (id,title,type,generated_by,data)
VALUES (${sqlLiteral(ids.report)},'demo_rc1_Báo cáo tiến độ cá nhân','personal',${sqlLiteral(ids.member)},${sqlLiteral(JSON.stringify({ completionRate: 100, avgScore: 8.8, passedExamsCount: 1, source: "demo_rc1" }))})
ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title,type=EXCLUDED.type,generated_by=EXCLUDED.generated_by,data=EXCLUDED.data,updated_at=NOW();
COMMIT;`;
  await runPsql(sql);
  const countsText = await runPsql(`SELECT json_build_object(
    'units',(SELECT COUNT(*) FROM public.units WHERE id IN (${sqlLiteral(ids.unitCommand)},${sqlLiteral(ids.unitMobile)})),
    'users',(SELECT COUNT(*) FROM public.users WHERE email LIKE 'demo_rc1\\_%' ESCAPE '\\'),
    'topics',(SELECT COUNT(*) FROM public.learning_topics WHERE id=${sqlLiteral(ids.topic)}),
    'sections',(SELECT COUNT(*) FROM public.learning_sections WHERE topic_id=${sqlLiteral(ids.topic)}),
    'questions',(SELECT COUNT(*) FROM public.questions WHERE topic_id=${sqlLiteral(ids.topic)}),
    'exams',(SELECT COUNT(*) FROM public.exams WHERE id=${sqlLiteral(ids.exam)}),
    'news',(SELECT COUNT(*) FROM public.news WHERE id=${sqlLiteral(ids.news)}),
    'quizAttempts',(SELECT COUNT(*) FROM public.quiz_attempts WHERE id=${sqlLiteral(ids.quizAttempt)}),
    'examAttempts',(SELECT COUNT(*) FROM public.exam_attempts WHERE exam_id=${sqlLiteral(ids.exam)} AND user_id=${sqlLiteral(ids.member)})
  );`, true);
  return {
    status: "PASS",
    prefix: PREFIX,
    password: PASSWORD,
    accounts: demoAccounts.map(({ email, role, fullName }) => ({ email, role, fullName })),
    ids,
    counts: JSON.parse(countsText),
  };
}

const mode = process.argv.includes("--cleanup") ? "cleanup" : "seed";
try {
  const result = mode === "cleanup" ? await cleanup() : await seed();
  console.log(JSON.stringify({ mode, ...result, productionImport: "BLOCKED" }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ mode, status: "FAIL", error: error.message, productionImport: "BLOCKED" }, null, 2));
  process.exit(1);
}
