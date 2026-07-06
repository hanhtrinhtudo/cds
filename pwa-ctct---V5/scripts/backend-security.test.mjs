import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const server = read("server.ts");
const permissionService = read("src/services/permissionService.ts");

const routeBlock = (method, path) => {
  const marker = `app.${method}("${path}"`;
  const start = server.indexOf(marker);
  assert.notEqual(start, -1, `Missing route ${method.toUpperCase()} ${path}`);
  const nextRoute = server.indexOf("\napp.", start + marker.length);
  return server.slice(start, nextRoute === -1 ? server.length : nextRoute);
};

assert.match(server, /const canReadNewsItem = \(item: News, user: User \| null\): boolean =>/);
assert.match(server, /UserRole\.ADMIN, UserRole\.POLITICAL_OFFICER/);
assert.match(server, /item\.status !== "published"/);
assert.match(server, /item\.visibility === "public"/);
assert.match(server, /item\.visibility === "internal"/);

const newsListRoute = routeBlock("get", "/api/news");
assert.match(newsListRoute, /list\.filter\(item => canReadNewsItem\(item, user\)\)/);

const newsDetailRoute = routeBlock("get", "/api/news/:id");
assert.match(newsDetailRoute, /const user = await getAuthUser\(req\)/);
assert.match(newsDetailRoute, /if \(!canReadNewsItem\(item, user\)\) return res\.status\(404\)/);
assert.ok(
  newsDetailRoute.indexOf("canReadNewsItem(item, user)") < newsDetailRoute.indexOf("res.json(item)"),
  "News detail must evaluate visibility before returning the item."
);

console.log("Backend security checks passed: news visibility.");

assert.match(server, /type LearnerQuestion = Omit<Question, "correctAnswers">/);
assert.match(server, /const redactQuestionForLearner = \(question: Question\): LearnerQuestion =>/);
assert.match(server, /const \{ correctAnswers, \.\.\.safeQuestion \} = question/);
assert.match(server, /const redactQuestionsForLearner = \(questions: Question\[\]\): LearnerQuestion\[\] =>/);

const quizQuestionsRoute = routeBlock("get", "/api/quiz/questions");
assert.match(quizQuestionsRoute, /redactQuestionsForLearner\(await dbEngine\.getQuestions\(\)\)/);
assert.doesNotMatch(quizQuestionsRoute, /res\.json\(await dbEngine\.getQuestions\(\)\)/);

const quizByTopicRoute = routeBlock("get", "/api/quiz/by-topic/:topicId");
assert.match(quizByTopicRoute, /res\.json\(redactQuestionsForLearner\(questions\)\)/);
assert.doesNotMatch(quizByTopicRoute, /res\.json\(questions\)/);

const examDetailRoute = routeBlock("get", "/api/exams/:id");
assert.match(examDetailRoute, /questions: redactQuestionsForLearner\(examQuestions\)/);
assert.doesNotMatch(examDetailRoute, /questions: examQuestions/);

const quizSubmitRoute = routeBlock("post", "/api/quiz/submit");
assert.match(quizSubmitRoute, /const correctAnswers = q\.correctAnswers/);
const examSubmitRoute = routeBlock("post", "/api/exam-attempts/submit");
assert.match(examSubmitRoute, /question\.correctAnswers/);

console.log("Backend security checks passed: learner answer redaction.");

assert.match(server, /const requireActiveMember = async \(req: express\.Request, res: express\.Response, next: express\.NextFunction\) =>/);
assert.match(server, /if \(user\.role !== UserRole\.MEMBER\) \{/);
assert.match(server, /Chi quan nhan hoc vien moi duoc thuc hien bai thi chinh thuc/);

for (const route of [
  "/api/exam-attempts/start",
  "/api/exam-attempts/save-attempt",
  "/api/exam-attempts/submit",
]) {
  const block = routeBlock("post", route);
  assert.match(block, new RegExp(`app\\.post\\("${route.replaceAll("/", "\\/")}", requireActiveMember`));
  assert.doesNotMatch(block, /requireActiveUser/);
}

console.log("Backend security checks passed: official exam member-only eligibility.");

const quizSaveRoute = routeBlock("post", "/api/quiz/save-attempt");
assert.match(quizSaveRoute, /attempt\.userId = user\.id/);
assert.match(quizSaveRoute, /if \(existing && existing\.userId !== user\.id\)/);

const quizSubmitOwnerRoute = routeBlock("post", "/api/quiz/submit");
assert.match(quizSubmitOwnerRoute, /if \(attempt && attempt\.userId !== user\.id\) return res\.status\(404\)/);

const examSaveRoute = routeBlock("post", "/api/exam-attempts/save-attempt");
assert.match(examSaveRoute, /if \(!attempt\.id\) \{/);
assert.match(examSaveRoute, /const existing = await dbEngine\.getExamAttemptById\(attempt\.id\)/);
assert.match(examSaveRoute, /if \(!existing\) \{/);
assert.match(examSaveRoute, /if \(existing\.userId !== user\.id\) \{/);
assert.match(examSaveRoute, /attempt\.examId = existing\.examId/);
assert.match(examSaveRoute, /attempt\.startedAt = existing\.startedAt/);

const examSubmitOwnerRoute = routeBlock("post", "/api/exam-attempts/submit");
assert.match(examSubmitOwnerRoute, /if \(!attemptId\) return res\.status\(400\)/);
assert.match(examSubmitOwnerRoute, /if \(attempt && attempt\.userId !== user\.id\) return res\.status\(404\)/);

const notificationReadRoute = routeBlock("post", "/api/notifications/:id/read");
assert.match(notificationReadRoute, /markNotificationRead\(req\.params\.id, req\.user!\.id\)/);

const aiHistoryRoute = routeBlock("get", "/api/ai/chat/history");
assert.match(aiHistoryRoute, /getChatHistory\(user\.id\)/);

const personalReportRoute = routeBlock("get", "/api/reports/personal");
assert.match(personalReportRoute, /getProgressForUser\(user\.id\)/);
assert.match(personalReportRoute, /getQuizAttemptsForUser\(user\.id\)/);
assert.match(personalReportRoute, /getExamAttemptsForUser\(user\.id\)/);

console.log("Backend security checks passed: ownership predicates.");

assert.match(server, /const canManageTopicRecord = \(user: RequestUser, topic: LearningTopic\): boolean =>/);
assert.match(server, /topic\.createdBy === user\.id/);
assert.match(server, /topic\.assignedUnitIds\?\.includes\(user\.unitId\)/);
assert.match(server, /const canAssignLearningTargets = async/);
assert.match(server, /assignedUnitIds\.some\(unitId => unitId !== user\.unitId\)/);
assert.match(server, /target\.id === userId && target\.unitId === user\.unitId/);
assert.match(server, /const canUseTopicsForExam = async/);

const topicPatchRoute = routeBlock("patch", "/api/learning/topics/:id");
assert.match(topicPatchRoute, /const existingTopic = await dbEngine\.getTopicById\(req\.params\.id\)/);
assert.match(topicPatchRoute, /if \(!canManageTopicRecord\(currentUser, existingTopic\)\)/);

const topicAssignRoute = routeBlock("post", "/api/learning/topics/:id/assign");
assert.match(topicAssignRoute, /const safeAssignedUnitIds = Array\.isArray\(assignedUnitIds\) \? assignedUnitIds : \[\]/);
assert.match(topicAssignRoute, /const safeAssignedUserIds = Array\.isArray\(assignedUserIds\) \? assignedUserIds : \[\]/);
assert.match(topicAssignRoute, /if \(!await canAssignLearningTargets\(currentUser, safeAssignedUnitIds, safeAssignedUserIds\)\)/);

const questionCreateRoute = routeBlock("post", "/api/quiz/questions");
assert.match(questionCreateRoute, /const topic = await dbEngine\.getTopicById\(topicId\)/);
assert.match(questionCreateRoute, /if \(!canManageTopicRecord\(req\.user!, topic\)\)/);

const questionPatchRoute = routeBlock("patch", "/api/quiz/questions/:id");
assert.match(questionPatchRoute, /const existingQuestion = \(await dbEngine\.getQuestions\(\)\)\.find/);
assert.match(questionPatchRoute, /if \(!canManageTopicRecord\(req\.user!, topic\)\)/);

const examCreateRoute = routeBlock("post", "/api/exams");
assert.match(examCreateRoute, /!Array\.isArray\(topicIds\)/);
assert.match(examCreateRoute, /if \(!await canUseTopicsForExam\(currentUser, topicIds\)\)/);

const examPatchRoute = routeBlock("patch", "/api/exams/:id");
assert.match(examPatchRoute, /const existingExam = await dbEngine\.getExamById\(req\.params\.id\)/);
assert.match(examPatchRoute, /if \(!canManageExamRecord\(currentUser, existingExam\)\)/);
assert.match(examPatchRoute, /!Array\.isArray\(req\.body\.topicIds\)/);

console.log("Backend security checks passed: instructor content scope.");

assert.match(permissionService, /case "manage_users":\s*return u\.role === UserRole\.ADMIN;/);
assert.match(permissionService, /default:\s*return false;/);
assert.match(permissionService, /case "unit":\s*return \[UserRole\.ADMIN, UserRole\.POLITICAL_OFFICER, UserRole\.INSTRUCTOR\]\.includes\(u\.role\);/);
assert.match(permissionService, /return user\.role === UserRole\.ADMIN;/);
assert.doesNotMatch(permissionService, /case "manage_users":\s*return \[UserRole\.ADMIN, UserRole\.POLITICAL_OFFICER\]/);
assert.doesNotMatch(permissionService, /default:\s*return true;/);

console.log("Backend security checks passed: permission service alignment.");
