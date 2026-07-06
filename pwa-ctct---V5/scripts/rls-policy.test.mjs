import assert from "node:assert/strict";
import fs from "node:fs";

const schema = fs.readFileSync(new URL("../schema.sql", import.meta.url), "utf8");

const tables = [
  "units",
  "users",
  "roles",
  "permissions",
  "learning_topics",
  "learning_sections",
  "learning_assignments",
  "learning_progress",
  "questions",
  "quiz_attempts",
  "exams",
  "exam_attempts",
  "exam_answers",
  "news",
  "notifications",
  "ai_chat_messages",
  "report_snapshots",
  "audit_logs"
];

for (const table of tables) {
  assert.match(
    schema,
    new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\s*\\(`),
    `Missing table definition: ${table}`
  );
  assert.match(
    schema,
    new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`),
    `RLS is not enabled for table: ${table}`
  );
}

const helperFunctions = [
  "app_current_user_id",
  "app_current_user_role",
  "app_current_user_unit_id",
  "app_is_active_user",
  "app_has_role",
  "app_is_admin",
  "app_is_admin_or_political_officer",
  "app_same_unit",
  "app_can_manage_topic"
];

for (const fn of helperFunctions) {
  assert.match(
    schema,
    new RegExp(`CREATE OR REPLACE FUNCTION ${fn}\\(`),
    `Missing RLS helper function: ${fn}`
  );
}

const expectedPolicies = [
  "units_select_active_users",
  "units_manage_admin",
  "users_select_self_or_scoped_roles",
  "users_manage_admin",
  "roles_select_active_users",
  "roles_manage_admin",
  "permissions_select_active_users",
  "permissions_manage_admin",
  "learning_topics_select_active_scope",
  "learning_topics_insert_admin_or_instructor_scope",
  "learning_topics_update_admin_or_instructor_scope",
  "learning_topics_delete_admin_or_instructor_scope",
  "learning_sections_select_topic_scope",
  "learning_sections_manage_topic_scope",
  "learning_assignments_select_scope",
  "learning_assignments_manage_admin_or_instructor_scope",
  "learning_progress_select_owner_or_scope",
  "learning_progress_owner_insert_update",
  "questions_select_management_roles",
  "questions_manage_admin_or_instructor_topic_scope",
  "quiz_attempts_select_owner_or_scope",
  "quiz_attempts_owner_write",
  "exams_select_active_published_or_manager",
  "exams_manage_admin_or_instructor_scope",
  "exam_attempts_select_owner_or_scope",
  "exam_attempts_member_owner_write",
  "exam_answers_select_attempt_scope",
  "exam_answers_member_owner_write",
  "news_select_visibility",
  "news_manage_admin_or_political_officer",
  "notifications_owner_access",
  "ai_chat_messages_owner_access",
  "report_snapshots_select_scope",
  "report_snapshots_manage_admin",
  "audit_logs_select_admin_or_political_officer",
  "audit_logs_insert_admin_only"
];

for (const policy of expectedPolicies) {
  assert.match(
    schema,
    new RegExp(`CREATE POLICY ${policy}\\b`),
    `Missing RLS policy: ${policy}`
  );
}

const broadAccessPatterns = [
  /USING\s*\(\s*true\s*\)/i,
  /WITH CHECK\s*\(\s*true\s*\)/i,
  /TO\s+public\s+USING\s*\(\s*true\s*\)/i,
  /TO\s+anon\s+USING\s*\(\s*true\s*\)/i
];

for (const pattern of broadAccessPatterns) {
  assert.doesNotMatch(schema, pattern, `Broad public access pattern found: ${pattern}`);
}

const newsPolicyBlock = schema.match(/CREATE POLICY news_select_visibility[\s\S]*?;\n/)?.[0] || "";
assert.match(newsPolicyBlock, /status = 'published' AND visibility = 'public'/);
assert.match(newsPolicyBlock, /status = 'published'[\s\S]*visibility IN \('public', 'internal'\)/);
assert.match(newsPolicyBlock, /app_is_admin_or_political_officer\(\)/);

const questionSelectBlock = schema.match(/CREATE POLICY questions_select_management_roles[\s\S]*?;\n/)?.[0] || "";
assert.doesNotMatch(questionSelectBlock, /app_is_active_user\(\)/);
assert.match(questionSelectBlock, /app_is_admin\(\)/);
assert.match(questionSelectBlock, /app_has_role\(ARRAY\['instructor', 'political_officer'\]\)/);

const examAttemptWriteBlock = schema.match(/CREATE POLICY exam_attempts_member_owner_write[\s\S]*?;\n/)?.[0] || "";
assert.match(examAttemptWriteBlock, /app_has_role\(ARRAY\['member'\]\)/);
assert.match(examAttemptWriteBlock, /user_id = app_current_user_id\(\)/);

const privateOwnerPolicies = [
  "notifications_owner_access",
  "ai_chat_messages_owner_access",
  "quiz_attempts_owner_write",
  "learning_progress_owner_insert_update"
];

for (const policy of privateOwnerPolicies) {
  const block = schema.match(new RegExp(`CREATE POLICY ${policy}[\\s\\S]*?;\\n`))?.[0] || "";
  assert.match(block, /user_id = app_current_user_id\(\)/, `${policy} must enforce owner user_id`);
}

assert.match(schema, /service-role client in repositories/);
assert.match(schema, /service-role requests bypass[\s\S]{0,40}RLS/i);
assert.match(schema, /Production rollback must never be done without a backup/);

console.log(`RLS policy static checks passed for ${tables.length} tables and ${expectedPolicies.length} policies.`);
