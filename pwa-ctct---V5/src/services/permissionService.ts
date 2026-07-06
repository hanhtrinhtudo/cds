import { User, UserRole, AccountStatus, LearningTopic, Exam, ExamAttempt } from "../types";

export const permissionService = {
  // Check if a user is fully active
  isActive(user: User | null): boolean {
    return !!user && user.accountStatus === AccountStatus.ACTIVE;
  },

  hasPermission(user: User | null, permission: string): boolean {
    if (!this.isActive(user)) return false;
    const u = user!;
    
    switch (permission) {
      case "view_reports":
        return [UserRole.ADMIN, UserRole.POLITICAL_OFFICER, UserRole.INSTRUCTOR].includes(u.role);
      case "manage_users":
        return u.role === UserRole.ADMIN;
      case "manage_learning":
        return [UserRole.ADMIN, UserRole.INSTRUCTOR].includes(u.role);
      case "publish_news":
        return [UserRole.ADMIN, UserRole.POLITICAL_OFFICER].includes(u.role);
      case "view_audit_logs":
        return [UserRole.ADMIN, UserRole.POLITICAL_OFFICER].includes(u.role);
      case "take_exams":
        return u.role === UserRole.MEMBER;
      case "manage_exams":
        return [UserRole.ADMIN, UserRole.INSTRUCTOR].includes(u.role);
      default:
        return false;
    }
  },

  canAccessRoute(user: User | null, route: string): boolean {
    // If user is null or not active, they cannot access any protected routes
    if (!user) return false;
    
    // Pending user can only access auth screen or pending view (handled in Auth)
    // They cannot access learning, quiz, exam, AI, reports
    if (user.accountStatus !== AccountStatus.ACTIVE) {
      return false;
    }

    // Active users
    switch (route) {
      case "dashboard":
      case "ranking":
      case "news":
      case "news_detail":
        return true;
      case "learning":
      case "legal":
      case "quiz":
      case "aitutor":
        // Pending users are already blocked by above check
        return true;
      case "exams":
        // Only members take exams, but let's allow instructor/officer/admin to view/manage
        return true;
      case "admin":
        return [UserRole.ADMIN, UserRole.POLITICAL_OFFICER, UserRole.INSTRUCTOR].includes(user.role);
      case "reports":
        return [UserRole.ADMIN, UserRole.POLITICAL_OFFICER, UserRole.INSTRUCTOR].includes(user.role);
      default:
        return false;
    }
  },

  canManageTopic(user: User | null, topic?: LearningTopic): boolean {
    if (!this.isActive(user)) return false;
    return [UserRole.ADMIN, UserRole.INSTRUCTOR].includes(user!.role);
  },

  canViewUserResult(user: User | null, targetUserId: string): boolean {
    if (!user) return false;
    if (user.id === targetUserId) return true;
    if (user.accountStatus !== AccountStatus.ACTIVE) return false;
    // Without target unit context, only admin can be safely granted cross-user access here.
    return user.role === UserRole.ADMIN;
  },

  canStartExam(user: User | null, exam: Exam): boolean {
    if (!this.isActive(user)) return false;
    if (user!.role !== UserRole.MEMBER) return false; // only members can take exams
    // Check if exam is published/available
    const isPublished = exam.lifecycleStatus === "published" || exam.status === "active";
    if (!isPublished) return false;
    
    // Check date range
    const now = new Date();
    const start = new Date(exam.startDate);
    const end = new Date(exam.endDate);
    if (now < start || now > end) return false;

    return true;
  },

  canSubmitExamAttempt(user: User | null, attempt: ExamAttempt): boolean {
    if (!this.isActive(user)) return false;
    if (user!.id !== attempt.userId) return false;
    if (attempt.status !== "in_progress") return false;
    return true;
  },

  canViewReport(user: User | null, reportScope: string): boolean {
    if (!this.isActive(user)) return false;
    const u = user!;
    
    switch (reportScope) {
      case "personal":
        return true; // any active user can view their own personal reports
      case "instructor":
        return [UserRole.ADMIN, UserRole.INSTRUCTOR].includes(u.role);
      case "unit":
        return [UserRole.ADMIN, UserRole.POLITICAL_OFFICER, UserRole.INSTRUCTOR].includes(u.role);
      case "admin":
        return u.role === UserRole.ADMIN;
      default:
        return false;
    }
  },

  // Keep compatibility with existing functions
  canViewReports(user: User | null): boolean {
    return this.canViewReport(user, "instructor") || this.canViewReport(user, "unit");
  },

  canManageUsers(user: User | null): boolean {
    return this.hasPermission(user, "manage_users");
  },

  canManageLearning(user: User | null): boolean {
    return this.hasPermission(user, "manage_learning");
  },

  canPublishNews(user: User | null): boolean {
    return this.hasPermission(user, "publish_news");
  },

  canViewAuditLogs(user: User | null): boolean {
    return this.hasPermission(user, "view_audit_logs");
  },

  canTakeExams(user: User | null): boolean {
    return this.hasPermission(user, "take_exams");
  },

  canManageExams(user: User | null): boolean {
    return this.hasPermission(user, "manage_exams");
  }
};

export default permissionService;
