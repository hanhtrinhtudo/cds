import { supabase } from "../supabaseClient";
import { Exam, ExamAttempt, ExamAnswer } from "../../types";

export const examRepository = {
  // --- EXAMS ---
  async getExams(): Promise<Exam[]> {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error in examRepository.getExams:", error);
      throw new Error(`Failed to fetch exams: ${error.message}`);
    }

    return (data || []).map(mapDbExam);
  },

  async getExamById(id: string): Promise<Exam | null> {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error in examRepository.getExamById:", error);
      throw new Error(`Failed to fetch exam: ${error.message}`);
    }

    return data ? mapDbExam(data) : null;
  },

  async addExam(exam: Exam): Promise<Exam> {
    const dbExam = mapExamToDb(exam);
    const { data, error } = await supabase
      .from("exams")
      .insert([dbExam])
      .select()
      .single();

    if (error) {
      console.error("Error in examRepository.addExam:", error);
      throw new Error(`Failed to insert exam: ${error.message}`);
    }

    return mapDbExam(data);
  },

  async updateExam(id: string, updates: Partial<Exam>): Promise<Exam> {
    const dbUpdates = mapPartialExamToDb(updates);
    const { data, error } = await supabase
      .from("exams")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error in examRepository.updateExam:", error);
      throw new Error(`Failed to update exam: ${error.message}`);
    }

    return mapDbExam(data);
  },

  // --- EXAM ATTEMPTS ---
  async getExamAttempts(): Promise<ExamAttempt[]> {
    const { data, error } = await supabase
      .from("exam_attempts")
      .select("*")
      .order("started_at", { ascending: false });

    if (error) {
      console.error("Error in examRepository.getExamAttempts:", error);
      throw new Error(`Failed to fetch exam attempts: ${error.message}`);
    }

    return (data || []).map(mapDbExamAttempt);
  },

  async getExamAttemptById(id: string): Promise<ExamAttempt | null> {
    const { data, error } = await supabase
      .from("exam_attempts")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error in examRepository.getExamAttemptById:", error);
      throw new Error(`Failed to fetch exam attempt: ${error.message}`);
    }

    return data ? mapDbExamAttempt(data) : null;
  },

  async getExamAttemptsForUser(userId: string): Promise<ExamAttempt[]> {
    const { data, error } = await supabase
      .from("exam_attempts")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false });

    if (error) throw new Error(`Failed to fetch user exam attempts: ${error.message}`);
    return (data || []).map(mapDbExamAttempt);
  },

  async addExamAttempt(attempt: ExamAttempt): Promise<ExamAttempt> {
    const dbAttempt = mapExamAttemptToDb(attempt);
    const { data, error } = await supabase
      .from("exam_attempts")
      .upsert([dbAttempt], { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.error("Error in examRepository.addExamAttempt:", error);
      throw new Error(`Failed to save exam attempt: ${error.message}`);
    }

    return mapDbExamAttempt(data);
  },

  // --- EXAM ANSWERS ---
  async getExamAnswers(): Promise<ExamAnswer[]> {
    const { data, error } = await supabase
      .from("exam_answers")
      .select("*");

    if (error) {
      console.error("Error in examRepository.getExamAnswers:", error);
      throw new Error(`Failed to fetch exam answers: ${error.message}`);
    }

    return (data || []).map(mapDbExamAnswer);
  },

  async addExamAnswers(answers: ExamAnswer[]): Promise<ExamAnswer[]> {
    const dbAnswers = answers.map(mapExamAnswerToDb);
    const { data, error } = await supabase
      .from("exam_answers")
      .upsert(dbAnswers, { onConflict: "id" })
      .select();

    if (error) {
      console.error("Error in examRepository.addExamAnswers:", error);
      throw new Error(`Failed to save exam answers: ${error.message}`);
    }

    return (data || []).map(mapDbExamAnswer);
  }
};

// --- MAPPERS ---
function mapDbExam(row: any): Exam {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    topicIds: Array.isArray(row.topic_ids) ? row.topic_ids : [],
    durationMinutes: row.duration_minutes,
    questionCount: row.question_count,
    startDate: row.start_date || "",
    endDate: row.end_date || "",
    passingScore: Number(row.passing_score),
    allowReview: row.allow_review,
    status: row.status as any,
    lifecycleStatus: row.lifecycle_status as any,
    createdBy: row.created_by || ""
  };
}

function mapExamToDb(exam: Exam): any {
  return {
    id: exam.id,
    title: exam.title,
    description: exam.description,
    topic_ids: exam.topicIds,
    duration_minutes: exam.durationMinutes,
    question_count: exam.questionCount,
    start_date: exam.startDate || null,
    end_date: exam.endDate || null,
    passing_score: exam.passingScore,
    allow_review: exam.allowReview,
    status: exam.status,
    lifecycle_status: exam.lifecycleStatus || "draft",
    created_by: exam.createdBy || null
  };
}

function mapPartialExamToDb(updates: Partial<Exam>): any {
  const db: any = {};
  if (updates.title !== undefined) db.title = updates.title;
  if (updates.description !== undefined) db.description = updates.description;
  if (updates.topicIds !== undefined) db.topic_ids = updates.topicIds;
  if (updates.durationMinutes !== undefined) db.duration_minutes = updates.durationMinutes;
  if (updates.questionCount !== undefined) db.question_count = updates.questionCount;
  if (updates.startDate !== undefined) db.start_date = updates.startDate || null;
  if (updates.endDate !== undefined) db.end_date = updates.endDate || null;
  if (updates.passingScore !== undefined) db.passing_score = updates.passingScore;
  if (updates.allowReview !== undefined) db.allow_review = updates.allowReview;
  if (updates.status !== undefined) db.status = updates.status;
  if (updates.lifecycleStatus !== undefined) db.lifecycle_status = updates.lifecycleStatus;
  return db;
}

function mapDbExamAttempt(row: any): ExamAttempt {
  return {
    id: row.id,
    examId: row.exam_id,
    userId: row.user_id,
    startedAt: row.started_at,
    submittedAt: row.submitted_at || undefined,
    score: Number(row.score),
    correctCount: row.correct_count,
    wrongCount: row.wrong_count,
    passed: row.passed,
    status: row.status as any,
    answers: row.answers || {}
  };
}

function mapExamAttemptToDb(attempt: ExamAttempt): any {
  return {
    id: attempt.id,
    exam_id: attempt.examId,
    user_id: attempt.userId,
    started_at: attempt.startedAt,
    submitted_at: attempt.submittedAt || null,
    score: attempt.score,
    correct_count: attempt.correctCount,
    wrong_count: attempt.wrongCount,
    passed: attempt.passed,
    status: attempt.status,
    answers: attempt.answers
  };
}

function mapDbExamAnswer(row: any): ExamAnswer {
  return {
    id: row.id,
    examAttemptId: row.exam_attempt_id,
    questionId: row.question_id,
    selectedAnswers: Array.isArray(row.selected_answers) ? row.selected_answers : [],
    isCorrect: row.is_correct,
    answeredAt: row.answered_at
  };
}

function mapExamAnswerToDb(ans: ExamAnswer): any {
  return {
    id: ans.id,
    exam_attempt_id: ans.examAttemptId,
    question_id: ans.questionId,
    selected_answers: ans.selectedAnswers,
    is_correct: ans.isCorrect,
    answered_at: ans.answeredAt
  };
}
