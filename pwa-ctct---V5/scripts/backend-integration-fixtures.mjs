import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

export class Gate6dFixtureBlocked extends Error {
  constructor(message) {
    super(message);
    this.name = "Gate6dFixtureBlocked";
  }
}

export const GATE6D_FIXTURE_IDS = {
  units: {
    a: "60000000-0000-4000-8000-000000006d01",
    b: "60000000-0000-4000-8000-000000006d02"
  },
  users: {
    admin: "60000000-0000-4000-8000-000000006d10",
    politicalOfficer: "60000000-0000-4000-8000-000000006d11",
    instructor: "60000000-0000-4000-8000-000000006d12",
    memberA: "60000000-0000-4000-8000-000000006d13",
    memberB: "60000000-0000-4000-8000-000000006d14"
  },
  news: {
    public: "gate6d_news_public",
    internal: "gate6d_news_internal",
    draft: "gate6d_news_draft"
  },
  topics: {
    inScope: "gate6d_topic_in_scope",
    outOfScope: "gate6d_topic_out_of_scope"
  },
  questions: {
    one: "gate6d_question_1"
  },
  quizAttempts: {
    memberA: "gate6d_quiz_attempt_member_a"
  },
  exams: {
    main: "gate6d_exam_main"
  },
  examAttempts: {
    memberA: "gate6d_exam_attempt_member_a"
  },
  notifications: {
    memberA: "gate6d_notification_member_a"
  },
  aiMessages: {
    memberA: "gate6d_ai_member_a",
    memberB: "gate6d_ai_member_b"
  },
  progress: {
    memberA: "gate6d_progress_member_a"
  }
};

const APPROVAL = "I_UNDERSTAND_THIS_WRITES_TO_LOCAL_TEST_DB";

const isLocalApiBase = value => {
  try {
    const url = new URL(value);
    return ["127.0.0.1", "localhost", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
};

export const gate6dFixtureSafety = () => {
  const apiBaseUrl = process.env.GATE6D_API_BASE_URL || process.env.API_BASE_URL || "http://127.0.0.1:3000";
  if (!isLocalApiBase(apiBaseUrl)) {
    throw new Gate6dFixtureBlocked("Fixture setup refused: API base URL is not localhost/127.0.0.1.");
  }
  if (process.env.GATE6D_ALLOW_MUTATING_INTEGRATION !== "1") {
    throw new Gate6dFixtureBlocked("Fixture setup refused: GATE6D_ALLOW_MUTATING_INTEGRATION=1 is required.");
  }
  if (process.env.GATE6D_DISPOSABLE_DB !== "1") {
    throw new Gate6dFixtureBlocked("Fixture setup refused: GATE6D_DISPOSABLE_DB=1 is required.");
  }
  if (process.env.GATE6D_FIXTURE_APPROVAL !== APPROVAL) {
    throw new Gate6dFixtureBlocked("Fixture setup refused: explicit Gate 6D fixture approval phrase is required.");
  }
};

const getSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Gate6dFixtureBlocked("Fixture setup blocked: Supabase configuration is missing.");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
};

const assertNoError = (operation, error) => {
  if (error) throw new Error(`${operation}: ${error.message}`);
};

const nowIso = () => new Date().toISOString();
const futureIso = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const pastIso = () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

const PASSWORD_HASH = "$2b$12$Ru/SAL4Gnasy4CIQnoG8yuIiVStm.3iCYF3dvumapMWX2wxVr.0pO";

export const cleanupGate6dFixtures = async () => {
  gate6dFixtureSafety();
  const supabase = getSupabase();
  const ids = GATE6D_FIXTURE_IDS;
  const cleanup = {};

  const run = async (name, builder) => {
    const { error, count } = await builder();
    assertNoError(`cleanup ${name}`, error);
    cleanup[name] = count ?? null;
  };

  await run("audit_logs", () => supabase
    .from("audit_logs")
    .delete({ count: "exact" })
    .or(`user_id.in.(${Object.values(ids.users).join(",")}),entity_id.like.gate6d_%`));
  await run("exam_answers", () => supabase
    .from("exam_answers")
    .delete({ count: "exact" })
    .or(`id.like.gate6d_%,exam_attempt_id.like.gate6d_%,exam_attempt_id.eq.${ids.examAttempts.memberA}`));
  await run("notifications", () => supabase
    .from("notifications")
    .delete({ count: "exact" })
    .or(`id.like.gate6d_%,user_id.in.(${Object.values(ids.users).join(",")})`));
  await run("ai_chat_messages", () => supabase
    .from("ai_chat_messages")
    .delete({ count: "exact" })
    .or(`id.like.gate6d_%,user_id.in.(${Object.values(ids.users).join(",")})`));
  await run("exam_attempts", () => supabase
    .from("exam_attempts")
    .delete({ count: "exact" })
    .or(`id.like.gate6d_%,exam_id.eq.${ids.exams.main},user_id.in.(${Object.values(ids.users).join(",")})`));
  await run("quiz_attempts", () => supabase
    .from("quiz_attempts")
    .delete({ count: "exact" })
    .or(`id.like.gate6d_%,topic_id.like.gate6d_%,user_id.in.(${Object.values(ids.users).join(",")})`));
  await run("learning_progress", () => supabase
    .from("learning_progress")
    .delete({ count: "exact" })
    .or(`id.like.gate6d_%,topic_id.like.gate6d_%,user_id.in.(${Object.values(ids.users).join(",")})`));
  await run("learning_assignments", () => supabase
    .from("learning_assignments")
    .delete({ count: "exact" })
    .or(`id.like.gate6d_%,topic_id.like.gate6d_%,assigned_to_user_id.in.(${Object.values(ids.users).join(",")}),assigned_to_unit_id.in.(${Object.values(ids.units).join(",")})`));
  await run("exams", () => supabase
    .from("exams")
    .delete({ count: "exact" })
    .or(`id.like.gate6d_%,created_by.in.(${Object.values(ids.users).join(",")})`));
  await run("questions", () => supabase
    .from("questions")
    .delete({ count: "exact" })
    .or("id.like.gate6d_%,topic_id.like.gate6d_%"));
  await run("learning_sections", () => supabase
    .from("learning_sections")
    .delete({ count: "exact" })
    .or("id.like.gate6d_%,topic_id.like.gate6d_%"));
  await run("learning_topics", () => supabase
    .from("learning_topics")
    .delete({ count: "exact" })
    .or(`id.like.gate6d_%,created_by.in.(${Object.values(ids.users).join(",")})`));
  await run("news", () => supabase
    .from("news")
    .delete({ count: "exact" })
    .or(`id.like.gate6d_%,title.like.gate6d_%,author_id.in.(${Object.values(ids.users).join(",")})`));
  await run("users", () => supabase
    .from("users")
    .delete({ count: "exact" })
    .or(`id.in.(${Object.values(ids.users).join(",")}),email.like.gate6d_%`));
  await run("units", () => supabase
    .from("units")
    .delete({ count: "exact" })
    .or(`id.in.(${Object.values(ids.units).join(",")}),name.like.gate6d_%`));

  return cleanup;
};

export const setupGate6dFixtures = async () => {
  gate6dFixtureSafety();
  const supabase = getSupabase();
  const ids = GATE6D_FIXTURE_IDS;
  const createdAt = nowIso();

  const cleanupBefore = await cleanupGate6dFixtures();

  const upsert = async (table, rows) => {
    const { error } = await supabase.from(table).upsert(rows, { onConflict: "id" });
    assertNoError(`setup ${table}`, error);
    return rows.length;
  };

  const counts = {};
  counts.units = await upsert("units", [
    {
      id: ids.units.a,
      name: "gate6d_unit_a",
      type: "test",
      description: "gate6d disposable integration unit A",
      created_at: createdAt,
      updated_at: createdAt
    },
    {
      id: ids.units.b,
      name: "gate6d_unit_b",
      type: "test",
      description: "gate6d disposable integration unit B",
      created_at: createdAt,
      updated_at: createdAt
    }
  ]);

  counts.users = await upsert("users", [
    ["admin", "admin", ids.units.a],
    ["political_officer", "political_officer", ids.units.a],
    ["instructor", "instructor", ids.units.a],
    ["member_a", "member", ids.units.a],
    ["member_b", "member", ids.units.b]
  ].map(([name, role, unitId], index) => ({
    id: ids.users[name === "member_a" ? "memberA" : name === "member_b" ? "memberB" : name === "political_officer" ? "politicalOfficer" : name],
    full_name: `gate6d_${name}`,
    email: `gate6d_${name}@example.test`,
    phone: `0960006d${String(index).padStart(2, "0")}`,
    password_hash: PASSWORD_HASH,
    unit_id: unitId,
    role,
    account_status: "active",
    must_change_password: false,
    created_at: createdAt,
    updated_at: createdAt,
    last_login_at: null
  })));

  counts.news = await upsert("news", [
    {
      id: ids.news.public,
      title: "gate6d_public_news",
      category: "gate6d",
      summary: "gate6d public news",
      content: "gate6d public news content",
      image_url: null,
      visibility: "public",
      status: "published",
      author_id: ids.users.politicalOfficer,
      published_at: createdAt,
      created_at: createdAt,
      updated_at: createdAt
    },
    {
      id: ids.news.internal,
      title: "gate6d_internal_news",
      category: "gate6d",
      summary: "gate6d internal news",
      content: "gate6d internal news content",
      image_url: null,
      visibility: "internal",
      status: "published",
      author_id: ids.users.politicalOfficer,
      published_at: createdAt,
      created_at: createdAt,
      updated_at: createdAt
    },
    {
      id: ids.news.draft,
      title: "gate6d_draft_news",
      category: "gate6d",
      summary: "gate6d draft news",
      content: "gate6d draft news content",
      image_url: null,
      visibility: "internal",
      status: "draft",
      author_id: ids.users.politicalOfficer,
      published_at: null,
      created_at: createdAt,
      updated_at: createdAt
    }
  ]);

  counts.learning_topics = await upsert("learning_topics", [
    {
      id: ids.topics.inScope,
      title: "gate6d_topic_in_scope",
      category: "Giáo dục chính trị",
      description: "gate6d in-scope topic",
      objective: "gate6d objective",
      content: "gate6d content",
      content_type: "document",
      estimated_minutes: 5,
      required: true,
      deadline: futureIso(),
      difficulty: "Trung bình",
      tags: ["gate6d"],
      references_data: [],
      created_by: ids.users.instructor,
      created_at: createdAt,
      updated_at: createdAt,
      video_url: null,
      pdf_url: null,
      assigned_unit_ids: [ids.units.a],
      assigned_user_ids: [ids.users.memberA]
    },
    {
      id: ids.topics.outOfScope,
      title: "gate6d_topic_out_of_scope",
      category: "Giáo dục chính trị",
      description: "gate6d out-of-scope topic",
      objective: "gate6d objective",
      content: "gate6d content",
      content_type: "document",
      estimated_minutes: 5,
      required: true,
      deadline: futureIso(),
      difficulty: "Trung bình",
      tags: ["gate6d"],
      references_data: [],
      created_by: ids.users.memberB,
      created_at: createdAt,
      updated_at: createdAt,
      video_url: null,
      pdf_url: null,
      assigned_unit_ids: [ids.units.b],
      assigned_user_ids: [ids.users.memberB]
    }
  ]);

  counts.questions = await upsert("questions", [
    {
      id: ids.questions.one,
      topic_id: ids.topics.inScope,
      type: "single",
      question_text: "gate6d disposable question",
      options: ["A", "B", "C", "D"],
      correct_answers: [1],
      explanation: "gate6d explanation",
      difficulty: "Trung bình",
      reference_info: "gate6d reference",
      tags: ["gate6d"],
      created_at: createdAt,
      updated_at: createdAt
    }
  ]);

  counts.exams = await upsert("exams", [
    {
      id: ids.exams.main,
      title: "gate6d_exam_main",
      description: "gate6d disposable exam",
      topic_ids: [ids.topics.inScope],
      duration_minutes: 30,
      question_count: 1,
      start_date: pastIso(),
      end_date: futureIso(),
      passing_score: 5,
      allow_review: true,
      status: "active",
      lifecycle_status: "published",
      created_by: ids.users.instructor,
      created_at: createdAt,
      updated_at: createdAt
    }
  ]);

  counts.quiz_attempts = await upsert("quiz_attempts", [
    {
      id: ids.quizAttempts.memberA,
      user_id: ids.users.memberA,
      quiz_type: "topic",
      topic_id: ids.topics.inScope,
      started_at: createdAt,
      submitted_at: null,
      score: 0,
      correct_count: 0,
      wrong_count: 0,
      total_questions: 1,
      answers: {},
      status: "in_progress",
      created_at: createdAt,
      updated_at: createdAt
    }
  ]);

  counts.exam_attempts = await upsert("exam_attempts", [
    {
      id: ids.examAttempts.memberA,
      exam_id: ids.exams.main,
      user_id: ids.users.memberA,
      started_at: createdAt,
      submitted_at: null,
      score: 0,
      correct_count: 0,
      wrong_count: 0,
      passed: false,
      status: "in_progress",
      answers: {},
      created_at: createdAt,
      updated_at: createdAt
    }
  ]);

  counts.notifications = await upsert("notifications", [
    {
      id: ids.notifications.memberA,
      user_id: ids.users.memberA,
      title: "gate6d_notification_member_a",
      message: "gate6d notification",
      type: "info",
      read: false,
      created_at: createdAt,
      updated_at: createdAt
    }
  ]);

  counts.ai_chat_messages = await upsert("ai_chat_messages", [
    {
      id: ids.aiMessages.memberA,
      user_id: ids.users.memberA,
      topic_id: ids.topics.inScope,
      role: "user",
      content: "gate6d_ai_member_a_private_content",
      created_at: createdAt,
      safety_level: "test",
      reference_used: "gate6d"
    },
    {
      id: ids.aiMessages.memberB,
      user_id: ids.users.memberB,
      topic_id: ids.topics.inScope,
      role: "user",
      content: "gate6d_ai_member_b_private_content",
      created_at: createdAt,
      safety_level: "test",
      reference_used: "gate6d"
    }
  ]);

  counts.learning_progress = await upsert("learning_progress", [
    {
      id: ids.progress.memberA,
      user_id: ids.users.memberA,
      topic_id: ids.topics.inScope,
      status: "completed",
      progress_percent: 100,
      started_at: createdAt,
      completed_at: createdAt,
      last_accessed_at: createdAt,
      need_review: false,
      score_impact: 0,
      created_at: createdAt,
      updated_at: createdAt
    }
  ]);

  return {
    ids,
    counts,
    cleanupBefore,
    users: {
      admin: { id: ids.users.admin, role: "admin" },
      politicalOfficer: { id: ids.users.politicalOfficer, role: "political_officer" },
      instructor: { id: ids.users.instructor, role: "instructor" },
      memberA: { id: ids.users.memberA, role: "member" },
      memberB: { id: ids.users.memberB, role: "member" }
    }
  };
};

if (import.meta.url === `file://${process.argv[1]?.replaceAll("\\", "/")}`) {
  try {
    const command = process.argv[2] || "setup";
    const result = command === "cleanup"
      ? await cleanupGate6dFixtures()
      : await setupGate6dFixtures();
    console.log(JSON.stringify({ status: "PASS", command, result }, null, 2));
  } catch (error) {
    const status = error instanceof Gate6dFixtureBlocked ? "BLOCKED" : "FAIL";
    console.log(JSON.stringify({ status, error: error.message }, null, 2));
    process.exit(status === "FAIL" ? 1 : 0);
  }
}
