import { supabase } from "../supabaseClient";
import { LearningTopic, LearningSection, LearningAssignment, LearningProgress, LearningStatus, TopicCategory } from "../../types";

export const learningRepository = {
  // --- TOPICS ---
  async getTopics(): Promise<LearningTopic[]> {
    const { data, error } = await supabase
      .from("learning_topics")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error in learningRepository.getTopics:", error);
      throw new Error(`Failed to fetch topics: ${error.message}`);
    }

    return (data || []).map(mapDbTopic);
  },

  async getTopicById(id: string): Promise<LearningTopic | null> {
    const { data, error } = await supabase
      .from("learning_topics")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error in learningRepository.getTopicById:", error);
      throw new Error(`Failed to fetch topic: ${error.message}`);
    }

    return data ? mapDbTopic(data) : null;
  },

  async addTopic(topic: LearningTopic): Promise<LearningTopic> {
    const dbTopic = mapTopicToDb(topic);
    const { data, error } = await supabase
      .from("learning_topics")
      .insert([dbTopic])
      .select()
      .single();

    if (error) {
      console.error("Error in learningRepository.addTopic:", error);
      throw new Error(`Failed to insert topic: ${error.message}`);
    }

    return mapDbTopic(data);
  },

  async updateTopic(id: string, updates: Partial<LearningTopic>): Promise<LearningTopic> {
    const dbUpdates = mapPartialTopicToDb(updates);
    const { data, error } = await supabase
      .from("learning_topics")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error in learningRepository.updateTopic:", error);
      throw new Error(`Failed to update topic: ${error.message}`);
    }

    return mapDbTopic(data);
  },

  // --- SECTIONS ---
  async getSectionsByTopicId(topicId: string): Promise<LearningSection[]> {
    const { data, error } = await supabase
      .from("learning_sections")
      .select("*")
      .eq("topic_id", topicId)
      .order("section_order", { ascending: true });

    if (error) {
      console.error("Error in learningRepository.getSectionsByTopicId:", error);
      throw new Error(`Failed to fetch sections: ${error.message}`);
    }

    return (data || []).map(mapDbSection);
  },

  async addSections(sections: LearningSection[]): Promise<LearningSection[]> {
    const dbSections = sections.map(mapSectionToDb);
    const { data, error } = await supabase
      .from("learning_sections")
      .insert(dbSections)
      .select();

    if (error) {
      console.error("Error in learningRepository.addSections:", error);
      throw new Error(`Failed to insert sections: ${error.message}`);
    }

    return (data || []).map(mapDbSection);
  },

  // --- ASSIGNMENTS ---
  async getAssignments(): Promise<LearningAssignment[]> {
    const { data, error } = await supabase
      .from("learning_assignments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error in learningRepository.getAssignments:", error);
      throw new Error(`Failed to fetch assignments: ${error.message}`);
    }

    return (data || []).map(mapDbAssignment);
  },

  async getAssignmentsForUser(userId: string, unitId: string): Promise<LearningAssignment[]> {
    const { data, error } = await supabase
      .from("learning_assignments")
      .select("*")
      .or(`assigned_to_user_id.eq.${userId},assigned_to_unit_id.eq.${unitId}`)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to fetch user assignments: ${error.message}`);
    return (data || []).map(mapDbAssignment);
  },

  async addAssignment(assignment: LearningAssignment): Promise<LearningAssignment> {
    const dbAssignment = mapAssignmentToDb(assignment);
    const { data, error } = await supabase
      .from("learning_assignments")
      .insert([dbAssignment])
      .select()
      .single();

    if (error) {
      console.error("Error in learningRepository.addAssignment:", error);
      throw new Error(`Failed to insert assignment: ${error.message}`);
    }

    return mapDbAssignment(data);
  },

  // --- PROGRESS ---
  async getAllProgress(): Promise<LearningProgress[]> {
    const { data, error } = await supabase
      .from("learning_progress")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error in learningRepository.getAllProgress:", error);
      throw new Error(`Failed to fetch all progress: ${error.message}`);
    }

    return (data || []).map(mapDbProgress);
  },

  async getProgressForUser(userId: string): Promise<LearningProgress[]> {
    const { data, error } = await supabase
      .from("learning_progress")
      .select("*")
      .eq("user_id", userId)
      .order("last_accessed_at", { ascending: false });

    if (error) {
      console.error("Error in learningRepository.getProgressForUser:", error);
      throw new Error(`Failed to fetch user progress: ${error.message}`);
    }

    return (data || []).map(mapDbProgress);
  },

  async updateProgress(
    userId: string,
    topicId: string,
    percent: number,
    status: LearningStatus,
    needReview: boolean,
    completedAt?: string
  ): Promise<LearningProgress> {
    const progressId = `prog_${userId}_${topicId}`;
    const now = new Date().toISOString();

    const progressValues: any = {
      id: progressId,
      user_id: userId,
      topic_id: topicId,
      progress_percent: percent,
      status: status,
      need_review: needReview,
      last_accessed_at: now,
      updated_at: now
    };

    if (completedAt) {
      progressValues.completed_at = completedAt;
    } else if (status === LearningStatus.COMPLETED) {
      progressValues.completed_at = now;
    }

    const { data, error } = await supabase
      .from("learning_progress")
      .upsert(progressValues, { onConflict: "user_id,topic_id" })
      .select()
      .single();

    if (error) {
      console.error("Error in learningRepository.updateProgress:", error);
      throw new Error(`Failed to upsert progress: ${error.message}`);
    }

    return mapDbProgress(data);
  }
};

// --- MAPPERS ---
function mapDbTopic(row: any): LearningTopic {
  return {
    id: row.id,
    title: row.title,
    category: row.category as TopicCategory,
    description: row.description || "",
    objective: row.objective || "",
    content: row.content,
    contentType: row.content_type as any,
    estimatedMinutes: row.estimated_minutes,
    required: row.required,
    deadline: row.deadline || undefined,
    difficulty: row.difficulty as any,
    tags: Array.isArray(row.tags) ? row.tags : [],
    references: Array.isArray(row.references_data) ? row.references_data : [],
    createdBy: row.created_by || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    videoUrl: row.video_url || undefined,
    pdfUrl: row.pdf_url || undefined,
    assignedUnitIds: Array.isArray(row.assigned_unit_ids) ? row.assigned_unit_ids : [],
    assignedUserIds: Array.isArray(row.assigned_user_ids) ? row.assigned_user_ids : []
  };
}

function mapTopicToDb(topic: LearningTopic): any {
  return {
    id: topic.id,
    title: topic.title,
    category: topic.category,
    description: topic.description,
    objective: topic.objective,
    content: topic.content,
    content_type: topic.contentType,
    estimated_minutes: topic.estimatedMinutes,
    required: topic.required,
    deadline: topic.deadline || null,
    difficulty: topic.difficulty,
    tags: topic.tags,
    references_data: topic.references,
    created_by: topic.createdBy || null,
    created_at: topic.createdAt,
    updated_at: topic.updatedAt,
    video_url: topic.videoUrl || null,
    pdf_url: topic.pdfUrl || null,
    assigned_unit_ids: topic.assignedUnitIds,
    assigned_user_ids: topic.assignedUserIds
  };
}

function mapPartialTopicToDb(updates: Partial<LearningTopic>): any {
  const db: any = {};
  if (updates.title !== undefined) db.title = updates.title;
  if (updates.category !== undefined) db.category = updates.category;
  if (updates.description !== undefined) db.description = updates.description;
  if (updates.objective !== undefined) db.objective = updates.objective;
  if (updates.content !== undefined) db.content = updates.content;
  if (updates.contentType !== undefined) db.content_type = updates.contentType;
  if (updates.estimatedMinutes !== undefined) db.estimated_minutes = updates.estimatedMinutes;
  if (updates.required !== undefined) db.required = updates.required;
  if (updates.deadline !== undefined) db.deadline = updates.deadline || null;
  if (updates.difficulty !== undefined) db.difficulty = updates.difficulty;
  if (updates.tags !== undefined) db.tags = updates.tags;
  if (updates.references !== undefined) db.references_data = updates.references;
  if (updates.updatedAt !== undefined) db.updated_at = updates.updatedAt;
  if (updates.videoUrl !== undefined) db.video_url = updates.videoUrl || null;
  if (updates.pdfUrl !== undefined) db.pdf_url = updates.pdfUrl || null;
  if (updates.assignedUnitIds !== undefined) db.assigned_unit_ids = updates.assignedUnitIds;
  if (updates.assignedUserIds !== undefined) db.assigned_user_ids = updates.assignedUserIds;
  return db;
}

function mapDbSection(row: any): LearningSection {
  return {
    id: row.id,
    topicId: row.topic_id,
    title: row.title,
    content: row.content,
    order: row.section_order,
    required: row.required
  };
}

function mapSectionToDb(sec: LearningSection): any {
  return {
    id: sec.id,
    topic_id: sec.topicId,
    title: sec.title,
    content: sec.content,
    section_order: sec.order,
    required: sec.required
  };
}

function mapDbAssignment(row: any): LearningAssignment {
  return {
    id: row.id,
    topicId: row.topic_id,
    assignedToUserId: row.assigned_to_user_id || undefined,
    assignedToUnitId: row.assigned_to_unit_id || undefined,
    assignedBy: row.assigned_by || "",
    required: row.required,
    deadline: row.deadline || undefined,
    status: row.status as any,
    createdAt: row.created_at
  };
}

function mapAssignmentToDb(assign: LearningAssignment): any {
  return {
    id: assign.id,
    topic_id: assign.topicId,
    assigned_to_user_id: assign.assignedToUserId || null,
    assigned_to_unit_id: assign.assignedToUnitId || null,
    assigned_by: assign.assignedBy || null,
    required: assign.required,
    deadline: assign.deadline || null,
    status: assign.status,
    created_at: assign.createdAt
  };
}

function mapDbProgress(row: any): LearningProgress {
  return {
    id: row.id,
    userId: row.user_id,
    topicId: row.topic_id,
    status: row.status as LearningStatus,
    progressPercent: row.progress_percent,
    startedAt: row.started_at,
    completedAt: row.completed_at || undefined,
    lastAccessedAt: row.last_accessed_at,
    needReview: row.need_review,
    scoreImpact: row.score_impact ? Number(row.score_impact) : undefined
  };
}
