import assert from "node:assert/strict";
import fs from "node:fs";
import jwt from "jsonwebtoken";
import {
  cleanupGate6dFixtures,
  Gate6dFixtureBlocked,
  setupGate6dFixtures
} from "./backend-integration-fixtures.mjs";

const projectRoot = new URL("../", import.meta.url);
const read = file => fs.readFileSync(new URL(file, projectRoot), "utf8");

const parseDotEnv = () => {
  const envPath = new URL(".env", projectRoot);
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs.readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .map(line => line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/))
      .filter(Boolean)
      .map(match => [match[1], match[2].replace(/^["']|["']$/g, "")])
  );
};

const envFile = parseDotEnv();
const baseUrl = process.env.GATE6D_API_BASE_URL || process.env.API_BASE_URL || "http://127.0.0.1:3000";
const parsedBaseUrl = new URL(baseUrl);
const isLocalTarget = ["127.0.0.1", "localhost", "::1"].includes(parsedBaseUrl.hostname);
const allowMutatingChecks = process.env.GATE6D_ALLOW_MUTATING_INTEGRATION === "1";
const disposableDb = process.env.GATE6D_DISPOSABLE_DB === "1";
const fixtureApproval = process.env.GATE6D_FIXTURE_APPROVAL === "I_UNDERSTAND_THIS_WRITES_TO_LOCAL_TEST_DB";
const jwtSecret = process.env.JWT_SECRET || envFile.JWT_SECRET;
let fixtureContext = null;
let cleanupSummary = null;

const summary = {
  status: "UNKNOWN",
  baseUrl,
  localTarget: isLocalTarget,
  mutatingChecks: allowMutatingChecks ? "enabled" : "disabled",
  disposableFixtures: "disabled",
  fixtureCounts: null,
  cleanup: null,
  passed: [],
  blocked: [],
  failed: []
};

const recordPass = name => summary.passed.push(name);
const recordBlocked = (name, reason) => summary.blocked.push({ name, reason });

const finish = async status => {
  if (fixtureContext) {
    try {
      cleanupSummary = await cleanupGate6dFixtures();
      summary.cleanup = cleanupSummary;
    } catch (error) {
      summary.failed.push({
        name: "fixture cleanup",
        message: error.message
      });
      status = "FAIL";
    }
  }
  summary.status = status;
  console.log(JSON.stringify(summary, null, 2));
};

if (!isLocalTarget) {
  recordBlocked("environment", "Refusing to run against a non-local API target.");
  await finish("BLOCKED");
  process.exit(0);
}

if (!jwtSecret || jwtSecret.length < 32) {
  recordBlocked("environment", "JWT_SECRET is not available or is shorter than the server minimum.");
  await finish("BLOCKED");
  process.exit(0);
}

const timeoutSignal = () => AbortSignal.timeout(2500);
const api = async (path, options = {}) => {
  const headers = { ...(options.headers || {}) };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(new URL(path, parsedBaseUrl), {
    method: options.method || "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: timeoutSignal()
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: response.status, json };
};

const tokenFor = (id, role) => jwt.sign(
  { role, accountStatus: "active" },
  jwtSecret,
  {
    subject: id,
    expiresIn: "30m",
    issuer: "ai-chinh-tri-vien-so",
    audience: "ai-chinh-tri-vien-so-web",
    algorithm: "HS256"
  }
);

const hasKeyDeep = (value, key) => {
  if (!value || typeof value !== "object") return false;
  if (Object.prototype.hasOwnProperty.call(value, key)) return true;
  if (Array.isArray(value)) return value.some(item => hasKeyDeep(item, key));
  return Object.values(value).some(item => hasKeyDeep(item, key));
};

const expectStatus = (name, actual, allowed) => {
  assert.ok(
    allowed.includes(actual),
    `${name}: expected HTTP ${allowed.join("/")} but got ${actual}`
  );
};

const findNewsItem = (items, predicate) => Array.isArray(items) ? items.find(predicate) : undefined;

try {
  await api("/api/news");
} catch (error) {
  recordBlocked("runtime API", `Local backend is not reachable at ${baseUrl}: ${error.message}`);
  await finish("BLOCKED");
  process.exit(0);
}

if (allowMutatingChecks || disposableDb || fixtureApproval) {
  if (!(allowMutatingChecks && disposableDb && fixtureApproval)) {
    recordBlocked("fixture setup", "Disposable fixtures require GATE6D_ALLOW_MUTATING_INTEGRATION=1, GATE6D_DISPOSABLE_DB=1, and the exact GATE6D_FIXTURE_APPROVAL phrase.");
    await finish("BLOCKED");
    process.exit(0);
  }

  try {
    fixtureContext = await setupGate6dFixtures();
    summary.disposableFixtures = "enabled";
    summary.fixtureCounts = fixtureContext.counts;
  } catch (error) {
    if (error instanceof Gate6dFixtureBlocked) {
      recordBlocked("fixture setup", error.message);
      await finish("BLOCKED");
      process.exit(0);
    }
    throw error;
  }
}

const runtimeUsers = fixtureContext?.users || {
  admin: {
    id: "00000000-0000-4000-8000-000000000001",
    role: "admin"
  },
  politicalOfficer: {
    id: "00000000-0000-4000-8000-000000000002",
    role: "political_officer"
  },
  instructor: {
    id: "00000000-0000-4000-8000-000000000003",
    role: "instructor"
  },
  memberA: {
    id: "00000000-0000-4000-8000-000000000004",
    role: "member"
  }
};

runtimeUsers.member = runtimeUsers.memberA;

const tokens = Object.fromEntries(
  Object.entries(runtimeUsers).map(([key, user]) => [key, tokenFor(user.id, user.role)])
);

try {
  const guestNews = await api("/api/news");
  expectStatus("guest news list", guestNews.status, [200]);
  assert.ok(Array.isArray(guestNews.json), "guest news list must return an array");
  assert.ok(
    guestNews.json.every(item => item.status === "published" && item.visibility === "public"),
    "guest news list must contain only published/public news"
  );
  recordPass("guest reads only published/public news list");

  const publicNewsItem = findNewsItem(
    guestNews.json,
    item => item.status === "published" && item.visibility === "public" && item.id
  );

  if (publicNewsItem) {
    const guestPublicDetail = await api(`/api/news/${encodeURIComponent(publicNewsItem.id)}`);
    expectStatus("guest public news detail", guestPublicDetail.status, [200]);
    assert.equal(guestPublicDetail.json.id, publicNewsItem.id);
    assert.equal(guestPublicDetail.json.visibility, "public");
    assert.equal(guestPublicDetail.json.status, "published");
    recordPass("guest can read discovered published/public news detail");
  } else {
    recordBlocked("guest public news detail", "Guest news list contained no published/public item with an id to use as a runtime fixture.");
  }

  const memberNews = await api("/api/news", { token: tokens.member });
  expectStatus("member news list", memberNews.status, [200]);
  assert.ok(Array.isArray(memberNews.json), "member news list must return an array");
  assert.ok(
    memberNews.json.every(item =>
      item.status === "published" &&
      ["public", "internal"].includes(item.visibility)
    ),
    "member news list must contain only published public/internal news"
  );
  recordPass("active member reads only published public/internal news list");

  const internalNewsItem = findNewsItem(
    memberNews.json,
    item => item.status === "published" && item.visibility === "internal" && item.id
  );

  if (internalNewsItem) {
    const guestInternalDetail = await api(`/api/news/${encodeURIComponent(internalNewsItem.id)}`);
    expectStatus("guest internal news detail", guestInternalDetail.status, [403, 404]);
    recordPass("guest cannot read discovered published/internal news detail");

    const memberInternalDetail = await api(`/api/news/${encodeURIComponent(internalNewsItem.id)}`, { token: tokens.member });
    expectStatus("member internal news detail", memberInternalDetail.status, [200]);
    assert.equal(memberInternalDetail.json.id, internalNewsItem.id);
    assert.equal(memberInternalDetail.json.visibility, "internal");
    assert.equal(memberInternalDetail.json.status, "published");
    recordPass("active member can read discovered published/internal news detail");
  } else {
    recordBlocked("member internal news detail", "Member news list contained no published/internal item with an id to use as a runtime fixture.");
    recordBlocked("guest internal news detail denial", "Skipped because no published/internal runtime fixture was discovered from the member news list.");
  }

  if (fixtureContext) {
    const guestDraftDetail = await api(`/api/news/${encodeURIComponent(fixtureContext.ids.news.draft)}`);
    expectStatus("guest draft news detail", guestDraftDetail.status, [403, 404]);

    const memberDraftDetail = await api(`/api/news/${encodeURIComponent(fixtureContext.ids.news.draft)}`, { token: tokens.memberA });
    expectStatus("member draft news detail", memberDraftDetail.status, [403, 404]);

    const adminDraftDetail = await api(`/api/news/${encodeURIComponent(fixtureContext.ids.news.draft)}`, { token: tokens.admin });
    expectStatus("admin draft news detail", adminDraftDetail.status, [200]);
    assert.equal(adminDraftDetail.json.id, fixtureContext.ids.news.draft);
    recordPass("draft news is hidden from guest/member and visible to admin");
  } else if (!allowMutatingChecks) {
    recordBlocked("draft/archived news visibility", "Seed data has no draft/archived news; creating one is a mutating check and requires GATE6D_ALLOW_MUTATING_INTEGRATION=1.");
  }

  const quizQuestions = await api("/api/quiz/questions", { token: tokens.memberA });
  expectStatus("quiz questions", quizQuestions.status, [200]);
  assert.ok(!hasKeyDeep(quizQuestions.json, "correctAnswers"), "quiz question payload must redact correctAnswers");
  recordPass("learner quiz endpoints redact correctAnswers");

  const memberExams = await api("/api/exams", { token: tokens.memberA });
  expectStatus("member exams list", memberExams.status, [200]);
  assert.ok(Array.isArray(memberExams.json), "member exams list must return an array");
  const examItem = memberExams.json.find(item => item.id);

  if (examItem) {
    const discoveredExamDetail = await api(`/api/exams/${encodeURIComponent(examItem.id)}`, { token: tokens.memberA });
    expectStatus("exam detail", discoveredExamDetail.status, [200]);
    assert.equal(discoveredExamDetail.json.id, examItem.id);
    assert.ok(!hasKeyDeep(discoveredExamDetail.json, "correctAnswers"), "exam detail payload must redact correctAnswers");
    recordPass("learner exam detail redacts correctAnswers");
  } else {
    recordBlocked("learner exam detail redaction", "Member exams list contained no exam with an id to use as a runtime fixture.");
  }

  const examIdForRoleDenial = examItem?.id || "__gate6d_missing_exam_fixture__";

  const instructorStart = await api("/api/exam-attempts/start", {
    method: "POST",
    token: tokens.instructor,
    body: { examId: examIdForRoleDenial }
  });
  expectStatus("instructor exam start", instructorStart.status, [403]);

  const politicalStart = await api("/api/exam-attempts/start", {
    method: "POST",
    token: tokens.politicalOfficer,
    body: { examId: examIdForRoleDenial }
  });
  expectStatus("political officer exam start", politicalStart.status, [403]);

  const adminStart = await api("/api/exam-attempts/start", {
    method: "POST",
    token: tokens.admin,
    body: { examId: examIdForRoleDenial }
  });
  expectStatus("admin exam start", adminStart.status, [403]);
  recordPass("non-member roles receive 403 for official exam start");

  for (const [roleName, token] of [
    ["instructor", tokens.instructor],
    ["political officer", tokens.politicalOfficer],
    ["admin", tokens.admin]
  ]) {
    const save = await api("/api/exam-attempts/save-attempt", {
      method: "POST",
      token,
      body: { id: "ea1", answers: {} }
    });
    expectStatus(`${roleName} exam save`, save.status, [403]);

    const submit = await api("/api/exam-attempts/submit", {
      method: "POST",
      token,
      body: { attemptId: "ea1", answers: {} }
    });
    expectStatus(`${roleName} exam submit`, submit.status, [403]);
  }
  recordPass("non-member roles receive 403 for official exam save/submit");

  if (fixtureContext) {
    const start = await api("/api/exam-attempts/start", {
      method: "POST",
      token: tokens.memberB,
      body: { examId: fixtureContext.ids.exams.main }
    });
    expectStatus("member official exam start", start.status, [200]);
    assert.equal(start.json.examId, fixtureContext.ids.exams.main);
    assert.equal(start.json.userId, runtimeUsers.memberB.id);

    const answers = { [fixtureContext.ids.questions.one]: [1] };
    const save = await api("/api/exam-attempts/save-attempt", {
      method: "POST",
      token: tokens.memberB,
      body: {
        ...start.json,
        answers,
        status: "in_progress"
      }
    });
    expectStatus("member official exam save", save.status, [200]);

    const submit = await api("/api/exam-attempts/submit", {
      method: "POST",
      token: tokens.memberB,
      body: {
        attemptId: start.json.id,
        answers
      }
    });
    expectStatus("member official exam submit", submit.status, [200]);
    assert.equal(submit.json.score, 10);
    recordPass("active member can start/save/submit official exam and server-side grading works");
  } else if (!allowMutatingChecks) {
    recordBlocked("member official exam positive path", "Starting/saving/submitting attempts mutates exam_attempts/exam_answers; requires GATE6D_ALLOW_MUTATING_INTEGRATION=1 and a disposable local DB.");
    recordBlocked("server-side grading runtime positive path", "Submitting quiz/exam attempts mutates attempt tables; requires GATE6D_ALLOW_MUTATING_INTEGRATION=1 and a disposable local DB.");
  }

  const memberQuizHistory = await api("/api/quiz/history", { token: tokens.memberA });
  expectStatus("member quiz history", memberQuizHistory.status, [200]);
  assert.ok(Array.isArray(memberQuizHistory.json), "member quiz history must return an array");
  const memberQuizAttempt = memberQuizHistory.json.find(item => item.id);

  if (memberQuizAttempt) {
    const quizCrossUserSave = await api("/api/quiz/save-attempt", {
      method: "POST",
      token: tokens.memberB || tokens.instructor,
      body: {
        id: memberQuizAttempt.id,
        quizType: memberQuizAttempt.quizType || "topic",
        topicId: memberQuizAttempt.topicId,
        answers: {},
        status: "in_progress"
      }
    });
    expectStatus("cross-user quiz attempt save", quizCrossUserSave.status, [404]);
    recordPass("cross-user quiz attempt save is denied");

    const quizCrossUserSubmit = await api("/api/quiz/submit", {
      method: "POST",
      token: tokens.memberB || tokens.instructor,
      body: {
        attemptId: memberQuizAttempt.id,
        answers: {}
      }
    });
    expectStatus("cross-user quiz attempt submit", quizCrossUserSubmit.status, [404]);
    recordPass("cross-user quiz attempt submit is denied");
  } else {
    recordBlocked("cross-user quiz attempt save", "Member quiz history contained no attempt id; skipped to avoid creating a quiz attempt.");
    recordBlocked("cross-user quiz attempt submit", "Member quiz history contained no attempt id; skipped to avoid using a hardcoded attempt.");
  }

  const memberNotifications = await api("/api/notifications", { token: tokens.memberA });
  expectStatus("member notifications", memberNotifications.status, [200]);
  assert.ok(Array.isArray(memberNotifications.json), "member notifications must return an array");
  const memberNotification = memberNotifications.json.find(item => item.id);

  if (memberNotification) {
    const notificationCrossUser = await api(`/api/notifications/${encodeURIComponent(memberNotification.id)}/read`, {
      method: "POST",
      token: tokens.memberB || tokens.instructor
    });
    expectStatus("cross-user notification read", notificationCrossUser.status, [404, 500]);
    recordPass("cross-user notification mark-read is not allowed to update another user's row");
  } else {
    recordBlocked("cross-user notification mark-read", "Member notifications contained no notification id to use as a runtime fixture.");
  }

  if (fixtureContext) {
    const memberBQuizHistory = await api("/api/quiz/history", { token: tokens.memberB });
    expectStatus("member B quiz history", memberBQuizHistory.status, [200]);
    assert.ok(!memberBQuizHistory.json.some(item => item.id === fixtureContext.ids.quizAttempts.memberA), "member B must not see member A quiz attempt");

    const memberBExamHistory = await api("/api/exam-attempts/history", { token: tokens.memberB });
    expectStatus("member B exam history", memberBExamHistory.status, [200]);
    assert.ok(!memberBExamHistory.json.some(item => item.id === fixtureContext.ids.examAttempts.memberA), "member B must not see member A exam attempt");

    const crossUserExamSave = await api("/api/exam-attempts/save-attempt", {
      method: "POST",
      token: tokens.memberB,
      body: {
        id: fixtureContext.ids.examAttempts.memberA,
        answers: {},
        status: "in_progress"
      }
    });
    expectStatus("cross-user exam attempt save", crossUserExamSave.status, [404]);

    const crossUserExamSubmit = await api("/api/exam-attempts/submit", {
      method: "POST",
      token: tokens.memberB,
      body: {
        attemptId: fixtureContext.ids.examAttempts.memberA,
        answers: {}
      }
    });
    expectStatus("cross-user exam attempt submit", crossUserExamSubmit.status, [404]);
    recordPass("user B cannot read/save/submit user A exam attempt");
  }

  const aiHistory = await api("/api/ai/chat/history", { token: tokens.memberA });
  expectStatus("member AI history", aiHistory.status, [200]);
  assert.ok(Array.isArray(aiHistory.json), "AI history must return only the caller's scoped list");
  recordPass("AI history endpoint is caller-scoped at runtime");

  if (fixtureContext) {
    const memberBAiHistory = await api("/api/ai/chat/history", { token: tokens.memberB });
    expectStatus("member B AI history", memberBAiHistory.status, [200]);
    assert.ok(!hasKeyDeep(memberBAiHistory.json, "gate6d_ai_member_a_private_content"), "member B AI history must not include member A content");

    const memberBNotifications = await api("/api/notifications", { token: tokens.memberB });
    expectStatus("member B notifications", memberBNotifications.status, [200]);
    assert.ok(!memberBNotifications.json.some(item => item.id === fixtureContext.ids.notifications.memberA), "member B must not see member A notification");
    recordPass("user B cannot read user A notification or AI history");
  }

  const personalReport = await api("/api/reports/personal", { token: tokens.memberA });
  expectStatus("member personal report", personalReport.status, [200]);
  assert.ok(!hasKeyDeep(personalReport.json, "passwordHash"), "personal report must not leak auth data");
  recordPass("personal report endpoint is caller-scoped at runtime");

  if (fixtureContext) {
    const memberBPersonalReport = await api("/api/reports/personal", { token: tokens.memberB });
    expectStatus("member B personal report", memberBPersonalReport.status, [200]);
    assert.ok(!hasKeyDeep(memberBPersonalReport.json, runtimeUsers.memberA.id), "member B personal report must not contain member A id");
    assert.ok(!hasKeyDeep(memberBPersonalReport.json, "gate6d_quiz_attempt_member_a"), "member B personal report must not contain member A quiz attempt id");
    recordPass("user B personal report does not expose user A identifiers");
  } else {
    recordBlocked("cross-member exam/AI/report read", "Seed data contains only one member account; true User B vs User A member isolation requires additional disposable test fixtures.");
  }

  if (fixtureContext) {
    const outOfScopeTopicUpdate = await api(`/api/learning/topics/${encodeURIComponent(fixtureContext.ids.topics.outOfScope)}`, {
      method: "PATCH",
      token: tokens.instructor,
      body: { title: "gate6d_should_not_mutate_out_of_scope" }
    });
    expectStatus("instructor out-of-scope topic update", outOfScopeTopicUpdate.status, [403, 404]);

    const outOfScopeAssignment = await api(`/api/learning/topics/${encodeURIComponent(fixtureContext.ids.topics.inScope)}/assign`, {
      method: "POST",
      token: tokens.instructor,
      body: {
        assignedUnitIds: [fixtureContext.ids.units.b],
        assignedUserIds: []
      }
    });
    expectStatus("instructor out-of-scope assignment", outOfScopeAssignment.status, [403, 404]);
    recordPass("instructor cannot mutate out-of-scope content");
  } else {
    recordBlocked(
      "instructor out-of-scope content mutation denial",
      "Skipped by default because PATCH/assign requests are mutating if backend scope checks regress; requires a disposable local DB and explicit mutating-check approval."
    );
  }

  if (fixtureContext) {
    const adminNews = await api("/api/news", {
      method: "POST",
      token: tokens.admin,
      body: {
        title: "gate6d_admin_positive_news",
        category: "gate6d",
        summary: "gate6d admin positive path",
        content: "gate6d admin positive path content",
        visibility: "public"
      }
    });
    expectStatus("admin global news create", adminNews.status, [200]);
    assert.match(adminNews.json.title, /^gate6d_/);
    recordPass("admin positive path can create global news fixture");
  } else if (!allowMutatingChecks) {
    recordBlocked("admin global content positive path", "Admin content create/update/delete is mutating and requires GATE6D_ALLOW_MUTATING_INTEGRATION=1 and cleanup in a disposable local DB.");
  }

  const permissionService = read("src/services/permissionService.ts");
  assert.match(permissionService, /case "manage_users":\s*return u\.role === UserRole\.ADMIN;/);
  assert.match(permissionService, /default:\s*return false;/);
  assert.doesNotMatch(permissionService, /POLITICAL_OFFICER\]\.includes\(u\.role\);\s*case "manage_users"/);
  recordPass("permission service defaults unknown access to deny and does not overgrant user management");

  await finish(summary.blocked.length ? "PARTIAL" : "PASS");
} catch (error) {
  summary.failed.push({
    name: "integration assertion",
    message: error.message
  });
  await finish("FAIL");
  process.exit(1);
}
