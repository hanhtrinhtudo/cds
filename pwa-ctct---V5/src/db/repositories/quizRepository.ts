import { supabase } from "../supabaseClient";
import { Question, QuizAttempt, QuestionType } from "../../types";

export const quizRepository = {
  // --- QUESTIONS ---
  async getQuestions(): Promise<Question[]> {
    const { data, error } = await supabase
      .from("questions")
      .select("*");

    if (error) {
      console.error("Error in quizRepository.getQuestions:", error);
      throw new Error(`Failed to fetch questions: ${error.message}`);
    }

    return (data || []).map(mapDbQuestion);
  },

  async getQuestionsByTopic(topicId: string): Promise<Question[]> {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("topic_id", topicId);

    if (error) {
      console.error("Error in quizRepository.getQuestionsByTopic:", error);
      throw new Error(`Failed to fetch questions for topic: ${error.message}`);
    }

    return (data || []).map(mapDbQuestion);
  },

  async addQuestion(question: Question): Promise<Question> {
    const { data, error } = await supabase
      .from("questions")
      .insert(mapQuestionToDb(question))
      .select()
      .single();

    if (error) throw new Error(`Failed to insert question: ${error.message}`);
    return mapDbQuestion(data);
  },

  async updateQuestion(id: string, updates: Partial<Question>): Promise<Question> {
    const { data, error } = await supabase
      .from("questions")
      .update(mapPartialQuestionToDb(updates))
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update question: ${error.message}`);
    return mapDbQuestion(data);
  },

  // --- QUIZ ATTEMPTS ---
  async getQuizAttempts(): Promise<QuizAttempt[]> {
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("*")
      .order("started_at", { ascending: false });

    if (error) {
      console.error("Error in quizRepository.getQuizAttempts:", error);
      throw new Error(`Failed to fetch quiz attempts: ${error.message}`);
    }

    return (data || []).map(mapDbQuizAttempt);
  },

  async getQuizAttemptById(id: string): Promise<QuizAttempt | null> {
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error in quizRepository.getQuizAttemptById:", error);
      throw new Error(`Failed to fetch quiz attempt: ${error.message}`);
    }

    return data ? mapDbQuizAttempt(data) : null;
  },

  async getQuizAttemptsForUser(userId: string): Promise<QuizAttempt[]> {
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false });

    if (error) throw new Error(`Failed to fetch user quiz attempts: ${error.message}`);
    return (data || []).map(mapDbQuizAttempt);
  },

  async addQuizAttempt(attempt: QuizAttempt): Promise<QuizAttempt> {
    const dbAttempt = mapQuizAttemptToDb(attempt);
    
    // Use upsert/insert
    const { data, error } = await supabase
      .from("quiz_attempts")
      .upsert([dbAttempt], { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.error("Error in quizRepository.addQuizAttempt:", error);
      throw new Error(`Failed to save quiz attempt: ${error.message}`);
    }

    return mapDbQuizAttempt(data);
  }
};

// --- MAPPERS ---
function mapDbQuestion(row: any): Question {
  return {
    id: row.id,
    topicId: row.topic_id,
    type: row.type as QuestionType,
    questionText: row.question_text,
    options: Array.isArray(row.options) ? row.options : [],
    correctAnswers: Array.isArray(row.correct_answers) ? row.correct_answers : [],
    explanation: row.explanation || "",
    difficulty: row.difficulty as any,
    reference: row.reference_info || "",
    tags: Array.isArray(row.tags) ? row.tags : []
  };
}

function mapQuestionToDb(question: Question): any {
  return {
    id: question.id,
    topic_id: question.topicId,
    type: question.type,
    question_text: question.questionText,
    options: question.options,
    correct_answers: question.correctAnswers,
    explanation: question.explanation,
    difficulty: question.difficulty,
    reference_info: question.reference,
    tags: question.tags
  };
}

function mapPartialQuestionToDb(updates: Partial<Question>): any {
  const db: any = { updated_at: new Date().toISOString() };
  if (updates.topicId !== undefined) db.topic_id = updates.topicId;
  if (updates.type !== undefined) db.type = updates.type;
  if (updates.questionText !== undefined) db.question_text = updates.questionText;
  if (updates.options !== undefined) db.options = updates.options;
  if (updates.correctAnswers !== undefined) db.correct_answers = updates.correctAnswers;
  if (updates.explanation !== undefined) db.explanation = updates.explanation;
  if (updates.difficulty !== undefined) db.difficulty = updates.difficulty;
  if (updates.reference !== undefined) db.reference_info = updates.reference;
  if (updates.tags !== undefined) db.tags = updates.tags;
  return db;
}

function mapDbQuizAttempt(row: any): QuizAttempt {
  return {
    id: row.id,
    userId: row.user_id,
    quizType: row.quiz_type as any,
    topicId: row.topic_id || undefined,
    startedAt: row.started_at,
    submittedAt: row.submitted_at || undefined,
    score: Number(row.score),
    correctCount: row.correct_count,
    wrongCount: row.wrong_count,
    totalQuestions: row.total_questions,
    answers: row.answers || {},
    status: row.status as any
  };
}

function mapQuizAttemptToDb(attempt: QuizAttempt): any {
  return {
    id: attempt.id,
    user_id: attempt.userId,
    quiz_type: attempt.quizType,
    topic_id: attempt.topicId || null,
    started_at: attempt.startedAt,
    submitted_at: attempt.submittedAt || null,
    score: attempt.score,
    correct_count: attempt.correctCount,
    wrong_count: attempt.wrongCount,
    total_questions: attempt.totalQuestions,
    answers: attempt.answers,
    status: attempt.status
  };
}
