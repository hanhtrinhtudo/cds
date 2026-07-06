-- SPRINT 4A: Database Schema for Supabase PostgreSQL
-- Created on 2026-06-27

-- 1. Units Table
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    parent_unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. App-managed users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL CHECK (email = LOWER(email)),
    phone TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'instructor', 'political_officer', 'admin')),
    account_status TEXT NOT NULL DEFAULT 'pending' CHECK (account_status IN ('pending', 'active', 'suspended', 'rejected')),
    must_change_password BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- 3. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT
);

-- 4. Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    role_name TEXT REFERENCES roles(name) ON DELETE CASCADE,
    action TEXT NOT NULL,
    description TEXT
);

-- 5. Learning Topics Table
CREATE TABLE IF NOT EXISTS learning_topics (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    objective TEXT,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL DEFAULT 'document', -- document, video, pdf, slide
    estimated_minutes INTEGER NOT NULL DEFAULT 10,
    required BOOLEAN NOT NULL DEFAULT false,
    deadline TIMESTAMPTZ,
    difficulty TEXT DEFAULT 'Trung bình', -- Dễ, Trung bình, Khó
    tags JSONB DEFAULT '[]'::jsonb,
    references_data JSONB DEFAULT '[]'::jsonb, -- renamed from 'references' to avoid keyword conflicts
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    video_url TEXT,
    pdf_url TEXT,
    assigned_unit_ids JSONB DEFAULT '[]'::jsonb,
    assigned_user_ids JSONB DEFAULT '[]'::jsonb
);

-- 6. Learning Sections Table
CREATE TABLE IF NOT EXISTS learning_sections (
    id TEXT PRIMARY KEY,
    topic_id TEXT REFERENCES learning_topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    section_order INTEGER NOT NULL DEFAULT 0,
    required BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Learning Assignments Table
CREATE TABLE IF NOT EXISTS learning_assignments (
    id TEXT PRIMARY KEY,
    topic_id TEXT REFERENCES learning_topics(id) ON DELETE CASCADE,
    assigned_to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    assigned_to_unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
    required BOOLEAN NOT NULL DEFAULT true,
    deadline TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, overdue
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Learning Progress Table
CREATE TABLE IF NOT EXISTS learning_progress (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic_id TEXT REFERENCES learning_topics(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'not_started', -- not_started, in_progress, completed, need_review
    progress_percent INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    need_review BOOLEAN NOT NULL DEFAULT false,
    score_impact NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, topic_id)
);

-- 9. Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    topic_id TEXT REFERENCES learning_topics(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- single, multiple, true_false, scenario
    question_text TEXT NOT NULL,
    options JSONB NOT NULL DEFAULT '[]'::jsonb,
    correct_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    explanation TEXT,
    difficulty TEXT DEFAULT 'Trung bình',
    reference_info TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Quiz Attempts Table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    quiz_type TEXT NOT NULL, -- topic, random, weak
    topic_id TEXT REFERENCES learning_topics(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    score NUMERIC DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    wrong_count INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    answers JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, submitted
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Exams Table
CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    topic_ids JSONB DEFAULT '[]'::jsonb,
    duration_minutes INTEGER NOT NULL DEFAULT 45,
    question_count INTEGER NOT NULL DEFAULT 20,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    passing_score NUMERIC DEFAULT 5.0,
    allow_review BOOLEAN DEFAULT true,
    status TEXT NOT NULL DEFAULT 'active', -- active, inactive, expired
    lifecycle_status TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, published, archived
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Exam Attempts Table
CREATE TABLE IF NOT EXISTS exam_attempts (
    id TEXT PRIMARY KEY,
    exam_id TEXT REFERENCES exams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    score NUMERIC DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    wrong_count INTEGER DEFAULT 0,
    passed BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, submitted, graded, reviewed, expired
    answers JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (exam_id, user_id)
);

-- 13. Exam Answers Table
CREATE TABLE IF NOT EXISTS exam_answers (
    id TEXT PRIMARY KEY,
    exam_attempt_id TEXT REFERENCES exam_attempts(id) ON DELETE CASCADE,
    question_id TEXT REFERENCES questions(id) ON DELETE CASCADE,
    selected_answers JSONB DEFAULT '[]'::jsonb,
    is_correct BOOLEAN DEFAULT false,
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. News Table
CREATE TABLE IF NOT EXISTS news (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    visibility TEXT NOT NULL DEFAULT 'internal', -- public, internal
    status TEXT NOT NULL DEFAULT 'draft', -- draft, published
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info', -- info, warning, success, exam
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. AI Chat Messages Table
CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic_id TEXT REFERENCES learning_topics(id) ON DELETE SET NULL,
    role TEXT NOT NULL, -- user, model
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    safety_level TEXT,
    reference_used TEXT
);

-- 17. Report Snapshots Table
CREATE TABLE IF NOT EXISTS report_snapshots (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- personal, instructor, unit, admin
    generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES (as requested)
CREATE INDEX IF NOT EXISTS idx_users_unit_id ON users(unit_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_units_parent_unit_id ON units(parent_unit_id);

CREATE INDEX IF NOT EXISTS idx_learning_topics_created_by ON learning_topics(created_by);
CREATE INDEX IF NOT EXISTS idx_learning_topics_category ON learning_topics(category);

CREATE INDEX IF NOT EXISTS idx_learning_sections_topic_id ON learning_sections(topic_id);

CREATE INDEX IF NOT EXISTS idx_learning_assignments_topic_id ON learning_assignments(topic_id);
CREATE INDEX IF NOT EXISTS idx_learning_assignments_user_id ON learning_assignments(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_learning_assignments_unit_id ON learning_assignments(assigned_to_unit_id);

CREATE INDEX IF NOT EXISTS idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_topic_id ON learning_progress(topic_id);

CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_topic_id ON quiz_attempts(topic_id);

CREATE INDEX IF NOT EXISTS idx_exams_created_by ON exams(created_by);

CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam_id ON exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_id ON exam_attempts(user_id);

CREATE INDEX IF NOT EXISTS idx_exam_answers_attempt_id ON exam_answers(exam_attempt_id);

CREATE INDEX IF NOT EXISTS idx_news_author_id ON news(author_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_user_id ON ai_chat_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_report_snapshots_generated_by ON report_snapshots(generated_by);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================
-- GATE 6B: ROW LEVEL SECURITY IMPLEMENTATION
-- ============================================================
-- Purpose:
--   Add database-level defense-in-depth policies aligned with Gate 6A/6C/6D.
--
-- Important architecture note:
--   PTKV currently uses app-managed JWT auth in Express and a Supabase
--   service-role client in repositories. Supabase service-role requests bypass
--   RLS by design, so these policies protect direct Supabase client access
--   where auth.uid() maps to public.users.id. Express route guards remain the
--   authoritative runtime path for the current backend.
--
-- Rollback guidance for local/test only:
--   ALTER TABLE <table_name> DISABLE ROW LEVEL SECURITY;
--   DROP POLICY IF EXISTS <policy_name> ON <table_name>;
--   DROP FUNCTION IF EXISTS app_current_user_id();
--   DROP FUNCTION IF EXISTS app_current_user_role();
--   DROP FUNCTION IF EXISTS app_current_user_unit_id();
--   DROP FUNCTION IF EXISTS app_is_active_user();
--   DROP FUNCTION IF EXISTS app_has_role(TEXT[]);
--   DROP FUNCTION IF EXISTS app_is_admin();
--   DROP FUNCTION IF EXISTS app_is_admin_or_political_officer();
--   DROP FUNCTION IF EXISTS app_same_unit(UUID);
--   DROP FUNCTION IF EXISTS app_can_manage_topic(TEXT);
-- Production rollback must never be done without a backup, tested migration,
-- and explicit approval.

-- -----------------------------
-- RLS helper functions
-- -----------------------------

CREATE OR REPLACE FUNCTION app_current_user_id()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION app_current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.role
  FROM public.users u
  WHERE u.id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION app_current_user_unit_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.unit_id
  FROM public.users u
  WHERE u.id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION app_is_active_user()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.account_status = 'active'
      AND COALESCE(u.must_change_password, false) = false
  );
$$;

CREATE OR REPLACE FUNCTION app_has_role(roles TEXT[])
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT app_is_active_user()
    AND app_current_user_role() = ANY (roles);
$$;

CREATE OR REPLACE FUNCTION app_is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT app_has_role(ARRAY['admin']);
$$;

CREATE OR REPLACE FUNCTION app_is_admin_or_political_officer()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT app_has_role(ARRAY['admin', 'political_officer']);
$$;

CREATE OR REPLACE FUNCTION app_same_unit(target_unit_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT app_is_active_user()
    AND target_unit_id IS NOT NULL
    AND target_unit_id = app_current_user_unit_id();
$$;

CREATE OR REPLACE FUNCTION app_can_manage_topic(target_topic_id TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.learning_topics t
    WHERE t.id = target_topic_id
      AND (
        app_is_admin()
        OR (
          app_has_role(ARRAY['instructor'])
          AND (
            t.created_by = auth.uid()
            OR t.assigned_unit_ids ? COALESCE(app_current_user_unit_id()::TEXT, '')
          )
        )
      )
  );
$$;

-- -----------------------------
-- Enable RLS on all 18 tables
-- -----------------------------

ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------
-- units: active users can read unit lookup; admin manages units.
-- -----------------------------

DROP POLICY IF EXISTS units_select_active_users ON units;
CREATE POLICY units_select_active_users
ON units
FOR SELECT
USING (app_is_active_user());

DROP POLICY IF EXISTS units_manage_admin ON units;
CREATE POLICY units_manage_admin
ON units
FOR ALL
USING (app_is_admin())
WITH CHECK (app_is_admin());

-- -----------------------------
-- users: self/profile read, same-unit oversight read, admin management.
-- Direct self-update is intentionally restricted because RLS cannot safely
-- limit mutable columns without separate column privileges/triggers.
-- -----------------------------

DROP POLICY IF EXISTS users_select_self_or_scoped_roles ON users;
CREATE POLICY users_select_self_or_scoped_roles
ON users
FOR SELECT
USING (
  id = app_current_user_id()
  OR app_is_admin()
  OR (
    app_has_role(ARRAY['instructor', 'political_officer'])
    AND unit_id = app_current_user_unit_id()
  )
);

DROP POLICY IF EXISTS users_manage_admin ON users;
CREATE POLICY users_manage_admin
ON users
FOR ALL
USING (app_is_admin())
WITH CHECK (app_is_admin());

-- -----------------------------
-- roles / permissions: active users can read lookup data; admin manages.
-- -----------------------------

DROP POLICY IF EXISTS roles_select_active_users ON roles;
CREATE POLICY roles_select_active_users
ON roles
FOR SELECT
USING (app_is_active_user());

DROP POLICY IF EXISTS roles_manage_admin ON roles;
CREATE POLICY roles_manage_admin
ON roles
FOR ALL
USING (app_is_admin())
WITH CHECK (app_is_admin());

DROP POLICY IF EXISTS permissions_select_active_users ON permissions;
CREATE POLICY permissions_select_active_users
ON permissions
FOR SELECT
USING (app_is_active_user());

DROP POLICY IF EXISTS permissions_manage_admin ON permissions;
CREATE POLICY permissions_manage_admin
ON permissions
FOR ALL
USING (app_is_admin())
WITH CHECK (app_is_admin());

-- -----------------------------
-- learning_topics: active users read general/assigned topics; instructors
-- manage only created/assigned-unit topics; admin manages all.
-- -----------------------------

DROP POLICY IF EXISTS learning_topics_select_active_scope ON learning_topics;
CREATE POLICY learning_topics_select_active_scope
ON learning_topics
FOR SELECT
USING (
  app_is_admin()
  OR app_has_role(ARRAY['instructor', 'political_officer'])
  OR (
    app_is_active_user()
    AND (
      (COALESCE(jsonb_array_length(assigned_unit_ids), 0) = 0 AND COALESCE(jsonb_array_length(assigned_user_ids), 0) = 0)
      OR assigned_unit_ids ? COALESCE(app_current_user_unit_id()::TEXT, '')
      OR assigned_user_ids ? COALESCE(app_current_user_id()::TEXT, '')
    )
  )
);

DROP POLICY IF EXISTS learning_topics_insert_admin_or_instructor_scope ON learning_topics;
CREATE POLICY learning_topics_insert_admin_or_instructor_scope
ON learning_topics
FOR INSERT
WITH CHECK (
  app_is_admin()
  OR (
    app_has_role(ARRAY['instructor'])
    AND created_by = app_current_user_id()
    AND (
      COALESCE(jsonb_array_length(assigned_unit_ids), 0) = 0
      OR assigned_unit_ids ? COALESCE(app_current_user_unit_id()::TEXT, '')
    )
  )
);

DROP POLICY IF EXISTS learning_topics_update_admin_or_instructor_scope ON learning_topics;
CREATE POLICY learning_topics_update_admin_or_instructor_scope
ON learning_topics
FOR UPDATE
USING (
  app_is_admin()
  OR (
    app_has_role(ARRAY['instructor'])
    AND (
      created_by = app_current_user_id()
      OR assigned_unit_ids ? COALESCE(app_current_user_unit_id()::TEXT, '')
    )
  )
)
WITH CHECK (
  app_is_admin()
  OR (
    app_has_role(ARRAY['instructor'])
    AND (
      created_by = app_current_user_id()
      OR assigned_unit_ids ? COALESCE(app_current_user_unit_id()::TEXT, '')
    )
  )
);

DROP POLICY IF EXISTS learning_topics_delete_admin_or_instructor_scope ON learning_topics;
CREATE POLICY learning_topics_delete_admin_or_instructor_scope
ON learning_topics
FOR DELETE
USING (
  app_is_admin()
  OR (
    app_has_role(ARRAY['instructor'])
    AND (
      created_by = app_current_user_id()
      OR assigned_unit_ids ? COALESCE(app_current_user_unit_id()::TEXT, '')
    )
  )
);

-- -----------------------------
-- learning_sections: visibility follows parent topic.
-- -----------------------------

DROP POLICY IF EXISTS learning_sections_select_topic_scope ON learning_sections;
CREATE POLICY learning_sections_select_topic_scope
ON learning_sections
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM learning_topics t
    WHERE t.id = learning_sections.topic_id
  )
);

DROP POLICY IF EXISTS learning_sections_manage_topic_scope ON learning_sections;
CREATE POLICY learning_sections_manage_topic_scope
ON learning_sections
FOR ALL
USING (app_can_manage_topic(topic_id))
WITH CHECK (app_can_manage_topic(topic_id));

-- -----------------------------
-- learning_assignments: owner/unit visibility; instructor/admin scoped writes.
-- -----------------------------

DROP POLICY IF EXISTS learning_assignments_select_scope ON learning_assignments;
CREATE POLICY learning_assignments_select_scope
ON learning_assignments
FOR SELECT
USING (
  app_is_admin()
  OR assigned_to_user_id = app_current_user_id()
  OR assigned_to_unit_id = app_current_user_unit_id()
  OR assigned_by = app_current_user_id()
  OR (
    app_has_role(ARRAY['instructor', 'political_officer'])
    AND assigned_to_unit_id = app_current_user_unit_id()
  )
);

DROP POLICY IF EXISTS learning_assignments_manage_admin_or_instructor_scope ON learning_assignments;
CREATE POLICY learning_assignments_manage_admin_or_instructor_scope
ON learning_assignments
FOR ALL
USING (
  app_is_admin()
  OR (
    app_has_role(ARRAY['instructor'])
    AND assigned_by = app_current_user_id()
    AND (
      assigned_to_unit_id = app_current_user_unit_id()
      OR assigned_to_user_id IN (SELECT u.id FROM users u WHERE u.unit_id = app_current_user_unit_id())
    )
  )
)
WITH CHECK (
  app_is_admin()
  OR (
    app_has_role(ARRAY['instructor'])
    AND assigned_by = app_current_user_id()
    AND (
      assigned_to_unit_id = app_current_user_unit_id()
      OR assigned_to_user_id IN (SELECT u.id FROM users u WHERE u.unit_id = app_current_user_unit_id())
    )
  )
);

-- -----------------------------
-- learning_progress: owner writes; same-unit reporting reads.
-- -----------------------------

DROP POLICY IF EXISTS learning_progress_select_owner_or_scope ON learning_progress;
CREATE POLICY learning_progress_select_owner_or_scope
ON learning_progress
FOR SELECT
USING (
  user_id = app_current_user_id()
  OR app_is_admin()
  OR (
    app_has_role(ARRAY['instructor', 'political_officer'])
    AND user_id IN (SELECT u.id FROM users u WHERE u.unit_id = app_current_user_unit_id())
  )
);

DROP POLICY IF EXISTS learning_progress_owner_insert_update ON learning_progress;
CREATE POLICY learning_progress_owner_insert_update
ON learning_progress
FOR ALL
USING (user_id = app_current_user_id())
WITH CHECK (user_id = app_current_user_id());

-- -----------------------------
-- questions: direct table access to correct_answers is restricted to content
-- managers. Learner answer redaction remains a backend DTO responsibility.
-- -----------------------------

DROP POLICY IF EXISTS questions_select_management_roles ON questions;
CREATE POLICY questions_select_management_roles
ON questions
FOR SELECT
USING (
  app_is_admin()
  OR app_has_role(ARRAY['instructor', 'political_officer'])
);

DROP POLICY IF EXISTS questions_manage_admin_or_instructor_topic_scope ON questions;
CREATE POLICY questions_manage_admin_or_instructor_topic_scope
ON questions
FOR ALL
USING (
  app_is_admin()
  OR app_can_manage_topic(topic_id)
)
WITH CHECK (
  app_is_admin()
  OR app_can_manage_topic(topic_id)
);

-- -----------------------------
-- quiz_attempts: owner access; unit/reporting read scope.
-- -----------------------------

DROP POLICY IF EXISTS quiz_attempts_select_owner_or_scope ON quiz_attempts;
CREATE POLICY quiz_attempts_select_owner_or_scope
ON quiz_attempts
FOR SELECT
USING (
  user_id = app_current_user_id()
  OR app_is_admin()
  OR (
    app_has_role(ARRAY['instructor', 'political_officer'])
    AND user_id IN (SELECT u.id FROM users u WHERE u.unit_id = app_current_user_unit_id())
  )
);

DROP POLICY IF EXISTS quiz_attempts_owner_write ON quiz_attempts;
CREATE POLICY quiz_attempts_owner_write
ON quiz_attempts
FOR ALL
USING (user_id = app_current_user_id())
WITH CHECK (user_id = app_current_user_id());

-- -----------------------------
-- exams: active users read active/published exams; instructor/admin manage.
-- -----------------------------

DROP POLICY IF EXISTS exams_select_active_published_or_manager ON exams;
CREATE POLICY exams_select_active_published_or_manager
ON exams
FOR SELECT
USING (
  app_is_admin()
  OR app_has_role(ARRAY['instructor', 'political_officer'])
  OR (
    app_is_active_user()
    AND status = 'active'
    AND lifecycle_status = 'published'
  )
);

DROP POLICY IF EXISTS exams_manage_admin_or_instructor_scope ON exams;
CREATE POLICY exams_manage_admin_or_instructor_scope
ON exams
FOR ALL
USING (
  app_is_admin()
  OR (
    app_has_role(ARRAY['instructor'])
    AND created_by = app_current_user_id()
  )
)
WITH CHECK (
  app_is_admin()
  OR (
    app_has_role(ARRAY['instructor'])
    AND created_by = app_current_user_id()
  )
);

-- -----------------------------
-- exam_attempts: only active members may write own attempts; scoped reads.
-- -----------------------------

DROP POLICY IF EXISTS exam_attempts_select_owner_or_scope ON exam_attempts;
CREATE POLICY exam_attempts_select_owner_or_scope
ON exam_attempts
FOR SELECT
USING (
  user_id = app_current_user_id()
  OR app_is_admin()
  OR (
    app_has_role(ARRAY['instructor', 'political_officer'])
    AND user_id IN (SELECT u.id FROM users u WHERE u.unit_id = app_current_user_unit_id())
  )
);

DROP POLICY IF EXISTS exam_attempts_member_owner_write ON exam_attempts;
CREATE POLICY exam_attempts_member_owner_write
ON exam_attempts
FOR ALL
USING (
  app_has_role(ARRAY['member'])
  AND user_id = app_current_user_id()
)
WITH CHECK (
  app_has_role(ARRAY['member'])
  AND user_id = app_current_user_id()
);

-- -----------------------------
-- exam_answers: follows owning exam attempt.
-- -----------------------------

DROP POLICY IF EXISTS exam_answers_select_attempt_scope ON exam_answers;
CREATE POLICY exam_answers_select_attempt_scope
ON exam_answers
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM exam_attempts ea
    WHERE ea.id = exam_answers.exam_attempt_id
  )
);

DROP POLICY IF EXISTS exam_answers_member_owner_write ON exam_answers;
CREATE POLICY exam_answers_member_owner_write
ON exam_answers
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM exam_attempts ea
    WHERE ea.id = exam_answers.exam_attempt_id
      AND ea.user_id = app_current_user_id()
      AND app_has_role(ARRAY['member'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM exam_attempts ea
    WHERE ea.id = exam_answers.exam_attempt_id
      AND ea.user_id = app_current_user_id()
      AND app_has_role(ARRAY['member'])
  )
);

-- -----------------------------
-- news: guests read published/public; active users read published internal;
-- admin/political officer manage and read draft/unpublished.
-- -----------------------------

DROP POLICY IF EXISTS news_select_visibility ON news;
CREATE POLICY news_select_visibility
ON news
FOR SELECT
USING (
  (status = 'published' AND visibility = 'public')
  OR (
    app_is_active_user()
    AND status = 'published'
    AND visibility IN ('public', 'internal')
  )
  OR app_is_admin_or_political_officer()
);

DROP POLICY IF EXISTS news_manage_admin_or_political_officer ON news;
CREATE POLICY news_manage_admin_or_political_officer
ON news
FOR ALL
USING (app_is_admin_or_political_officer())
WITH CHECK (app_is_admin_or_political_officer());

-- -----------------------------
-- notifications: owner-only.
-- -----------------------------

DROP POLICY IF EXISTS notifications_owner_access ON notifications;
CREATE POLICY notifications_owner_access
ON notifications
FOR ALL
USING (user_id = app_current_user_id())
WITH CHECK (user_id = app_current_user_id());

-- -----------------------------
-- ai_chat_messages: owner-only.
-- -----------------------------

DROP POLICY IF EXISTS ai_chat_messages_owner_access ON ai_chat_messages;
CREATE POLICY ai_chat_messages_owner_access
ON ai_chat_messages
FOR ALL
USING (user_id = app_current_user_id())
WITH CHECK (user_id = app_current_user_id());

-- -----------------------------
-- report_snapshots: personal/generated-by and role/unit scoped reporting.
-- -----------------------------

DROP POLICY IF EXISTS report_snapshots_select_scope ON report_snapshots;
CREATE POLICY report_snapshots_select_scope
ON report_snapshots
FOR SELECT
USING (
  generated_by = app_current_user_id()
  OR app_is_admin()
  OR (
    app_has_role(ARRAY['instructor', 'political_officer'])
    AND generated_by IN (SELECT u.id FROM users u WHERE u.unit_id = app_current_user_unit_id())
  )
);

DROP POLICY IF EXISTS report_snapshots_manage_admin ON report_snapshots;
CREATE POLICY report_snapshots_manage_admin
ON report_snapshots
FOR ALL
USING (app_is_admin())
WITH CHECK (app_is_admin());

-- -----------------------------
-- audit_logs: admin/political officer read; backend inserts via service role.
-- -----------------------------

DROP POLICY IF EXISTS audit_logs_select_admin_or_political_officer ON audit_logs;
CREATE POLICY audit_logs_select_admin_or_political_officer
ON audit_logs
FOR SELECT
USING (app_is_admin_or_political_officer());

DROP POLICY IF EXISTS audit_logs_insert_admin_only ON audit_logs;
CREATE POLICY audit_logs_insert_admin_only
ON audit_logs
FOR INSERT
WITH CHECK (app_is_admin());
