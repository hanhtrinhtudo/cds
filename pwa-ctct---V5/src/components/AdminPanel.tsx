import React, { useEffect, useState } from "react";
import { User, UserRole, LearningTopic, LearningProgress, Question, Exam, AccountStatus, TopicCategory, LearningStatus, Unit } from "../types";
import { Award, CheckCircle, XCircle, AlertTriangle, Users, BookOpen, FileText, BarChart3, Plus, Trash2, ArrowLeft, ShieldAlert, Calendar, UserPlus, Clock, ToggleLeft, ToggleRight, Archive, Check, Send, GitBranch, Search, Link2 } from "lucide-react";
import { isLegacyAppsScriptAuthMode } from "../services/authService";
import { organizationService, flattenOrganizationTree, resolveOrganizationLocally } from "../services/organizationService";
import { OrganizationAlias, OrganizationMigrationResult, OrganizationStats, OrganizationTreeNode } from "../types/organization";
import { apiClient } from "../services/apiClient";
import { analyticsService, AnalyticsEventRecord, AnalyticsSummary, PEQIResult } from "../services/analyticsService";

export type AdminPanelSection = "organizations" | "users" | "topics" | "exams" | "reports";

export interface AdminPanelProps {
  currentUser: User;
  topics: LearningTopic[];
  progress: LearningProgress[];
  questions: Question[];
  exams: Exam[];
  users: User[];
  units: Unit[];
  onUpdateUserStatus: (userId: string, status: AccountStatus) => void;
  onCreateUser?: (data: { fullName: string; email: string; phone?: string; temporaryPassword: string; role: UserRole; unitId: string }) => Promise<void>;
  onResetUserPassword?: (userId: string, temporaryPassword: string) => Promise<void>;
  onChangeUserRole?: (userId: string, role: UserRole) => Promise<void>;
  onAddTopic?: (topic: LearningTopic) => void;
  onUpdateTopicAssignment?: (topicId: string, updatedFields: Partial<LearningTopic>) => void;
  onAddExam?: (newExam: Exam) => void;
  onUpdateExam?: (examId: string, updatedFields: Partial<Exam>) => void;
  auditLogs?: any[];
  activeSection?: AdminPanelSection;
  embedded?: boolean;
}

export default function AdminPanel({
  currentUser,
  topics,
  progress,
  questions,
  exams,
  users,
  units,
  onUpdateUserStatus,
  onCreateUser,
  onResetUserPassword,
  onChangeUserRole,
  onAddTopic,
  onUpdateTopicAssignment,
  onAddExam,
  onUpdateExam,
  auditLogs = [],
  activeSection,
  embedded = false
}: AdminPanelProps) {
  const isStaticLegacyMode = isLegacyAppsScriptAuthMode();
  const [adminTab, setAdminTab] = useState<AdminPanelSection>(activeSection || "organizations");
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.MEMBER);
  const [newUserUnitId, setNewUserUnitId] = useState(units[0]?.id || "");
  const [organizationTree, setOrganizationTree] = useState<OrganizationTreeNode[]>([]);
  const [organizationStats, setOrganizationStats] = useState<OrganizationStats[]>([]);
  const [organizationAliases, setOrganizationAliases] = useState<OrganizationAlias[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("ORG_PTKV3");
  const [organizationSearch, setOrganizationSearch] = useState("");
  const [newAlias, setNewAlias] = useState("");
  const [organizationLoading, setOrganizationLoading] = useState(false);
  const [organizationMessage, setOrganizationMessage] = useState("");
  const [migrationResult, setMigrationResult] = useState<OrganizationMigrationResult | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsAvailable, setAnalyticsAvailable] = useState(false);
  const [analyticsMessage, setAnalyticsMessage] = useState("");
  const [analyticsRange, setAnalyticsRange] = useState<"today" | "7d" | "30d">("7d");
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary>({});
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEventRecord[]>([]);
  const [selectedLearnerId, setSelectedLearnerId] = useState("");
  const [selectedLearnerSummary, setSelectedLearnerSummary] = useState<AnalyticsSummary>({});
  const [selectedLearnerPeqi, setSelectedLearnerPeqi] = useState<PEQIResult | null>(null);

  // Topic form states
  const [showAddTopicForm, setShowAddTopicForm] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicCategory, setNewTopicCategory] = useState<TopicCategory>(TopicCategory.POLITICAL);
  const [newTopicDesc, setNewTopicDesc] = useState("");
  const [newTopicContent, setNewTopicContent] = useState("");
  const [newTopicMinutes, setNewTopicMinutes] = useState(15);
  const [newTopicRequired, setNewTopicRequired] = useState(true);

  // Assignment modal states
  const [activeAssignTopic, setActiveAssignTopic] = useState<LearningTopic | null>(null);
  const [assignDeadline, setAssignDeadline] = useState("");
  const [assignUnitId, setAssignUnitId] = useState("all");
  const [assignUserId, setAssignUserId] = useState("all");
  const [assignRequired, setAssignRequired] = useState(true);

  // Exam form states
  const [showAddExamForm, setShowAddExamForm] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState("");
  const [newExamDesc, setNewExamDesc] = useState("");
  const [newExamDuration, setNewExamDuration] = useState(20);
  const [newExamScore, setNewExamScore] = useState(7);
  const [newExamSelectedTopicIds, setNewExamSelectedTopicIds] = useState<string[]>([]);

  useEffect(() => {
    if (activeSection) setAdminTab(activeSection);
  }, [activeSection]);

  useEffect(() => {
    let cancelled = false;
    const loadOrganizationDomain = async () => {
      setOrganizationLoading(true);
      setOrganizationMessage("");
      try {
        const [tree, stats, aliases] = await Promise.all([
          organizationService.getOrganizationTree(),
          organizationService.getOrganizationStats(),
          organizationService.listAliases()
        ]);
        if (cancelled) return;
        setOrganizationTree(tree);
        setOrganizationStats(stats);
        setOrganizationAliases(aliases);
        const flat = flattenOrganizationTree(tree);
        if (!flat.some(item => item.organizationId === selectedOrganizationId)) {
          setSelectedOrganizationId(flat[0]?.organizationId || "ORG_PTKV3");
        }
      } catch (error) {
        if (!cancelled) setOrganizationMessage(error instanceof Error ? error.message : "Không thể tải cây tổ chức.");
      } finally {
        if (!cancelled) setOrganizationLoading(false);
      }
    };
    loadOrganizationDomain();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (adminTab !== "reports") return;
    let cancelled = false;
    const loadAnalytics = async () => {
      const token = apiClient.getAuthToken();
      if (!token) {
        setAnalyticsAvailable(false);
        setAnalyticsMessage("Chưa có phiên quản trị hợp lệ để tải phân tích.");
        return;
      }
      setAnalyticsLoading(true);
      setAnalyticsMessage("");
      try {
        const health = await analyticsService.health(token);
        if (!analyticsService.isSupported(health)) {
          if (!cancelled) {
            setAnalyticsAvailable(false);
            setAnalyticsMessage("Kho phân tích học tập chưa được kích hoạt trên máy chủ.");
          }
          return;
        }
        const [summary, events] = await Promise.all([
          analyticsService.getAdminSummary(token, { range: analyticsRange, limit: 100 }),
          analyticsService.adminListEvents(token, { range: analyticsRange, limit: 100 })
        ]);
        if (cancelled) return;
        setAnalyticsAvailable(true);
        setAnalyticsSummary(summary);
        setAnalyticsEvents(events);
        const firstLearner = selectedLearnerId || users.find(user => user.role === UserRole.MEMBER)?.id || "";
        if (firstLearner) {
          setSelectedLearnerId(firstLearner);
          const [userSummary, userPeqi] = await Promise.all([
            analyticsService.getUserSummary(token, firstLearner),
            analyticsService.getUserPEQI(token, firstLearner)
          ]);
          if (!cancelled) {
            setSelectedLearnerSummary(userSummary);
            setSelectedLearnerPeqi(userPeqi);
          }
        }
      } catch {
        if (!cancelled) {
          setAnalyticsAvailable(false);
          setAnalyticsMessage("Chưa thể tải phân tích học tập. Các chức năng hiện có vẫn hoạt động bình thường.");
        }
      } finally {
        if (!cancelled) setAnalyticsLoading(false);
      }
    };
    void loadAnalytics();
    return () => {
      cancelled = true;
    };
  }, [adminTab, analyticsRange, selectedLearnerId]);

  // Split users for approval flow
  const pendingUsers = users.filter(u => u.accountStatus === "pending");
  const approvedUsers = users.filter(u => u.accountStatus !== "pending");
  const activeUsers = users.filter(u => u.accountStatus === "active");
  const analyticsMetric = (value: unknown, fallback = "--") => {
    if (typeof value === "number" && Number.isFinite(value)) return value.toLocaleString("vi-VN");
    if (typeof value === "string" && value.trim()) return value;
    return fallback;
  };
  const accountUnitStats = Array.from(
    users.reduce((stats, user) => {
      const unitName = String(user.unitId || "").trim() || "Chưa xác định";
      stats.set(unitName, (stats.get(unitName) || 0) + 1);
      return stats;
    }, new Map<string, number>())
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "vi"));

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onCreateUser || !newUserName || !newUserEmail || !newUserPassword || !newUserUnitId) return;
    await onCreateUser({
      fullName: newUserName,
      email: newUserEmail,
      phone: newUserPhone,
      temporaryPassword: newUserPassword,
      role: newUserRole,
      unitId: newUserUnitId
    });
    setNewUserName("");
    setNewUserEmail("");
    setNewUserPhone("");
    setNewUserPassword("");
    setShowAddUserForm(false);
  };

  const requestPasswordReset = async (user: User) => {
    const temporaryPassword = window.prompt(`Nhập mật khẩu khởi tạo mới cho ${user.fullName}:`);
    if (temporaryPassword && onResetUserPassword) await onResetUserPassword(user.id, temporaryPassword);
  };

  const handleCreateTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddTopic || !newTopicTitle || !newTopicContent) return;

    const topic: LearningTopic = {
      id: "t_" + Date.now(),
      title: newTopicTitle,
      category: newTopicCategory,
      description: newTopicDesc,
      content: newTopicContent,
      contentType: "document",
      estimatedMinutes: Number(newTopicMinutes),
      required: newTopicRequired,
      tags: [newTopicCategory, "Mới soạn"],
      difficulty: "Trung bình",
      objective: "Trang bị lý luận tư tưởng vững chắc cho cán bộ chiến sĩ.",
      references: ["Tài liệu chính quy", "Quyết định bộ quốc phòng"],
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedUnitIds: [],
      assignedUserIds: []
    };

    onAddTopic(topic);
    setNewTopicTitle("");
    setNewTopicDesc("");
    setNewTopicContent("");
    setShowAddTopicForm(false);
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssignTopic || !onUpdateTopicAssignment) return;

    const unitIds = assignUnitId === "all" ? [] : [assignUnitId];
    const userIds = assignUserId === "all" ? [] : [assignUserId];

    onUpdateTopicAssignment(activeAssignTopic.id, {
      deadline: assignDeadline || undefined,
      required: assignRequired,
      assignedUnitIds: unitIds,
      assignedUserIds: userIds
    });

    setActiveAssignTopic(null);
    setAssignDeadline("");
    setAssignUnitId("all");
    setAssignUserId("all");
  };

  const handleCreateExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle || !onAddExam) return;

    const exam: Exam = {
      id: "exam_" + Date.now(),
      title: newExamTitle,
      description: newExamDesc,
      topicIds: newExamSelectedTopicIds,
      durationMinutes: Number(newExamDuration),
      questionCount: newExamSelectedTopicIds.length * 5 || 10, // heuristic
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days later
      passingScore: Number(newExamScore),
      allowReview: true,
      status: "active",
      lifecycleStatus: "published",
      createdBy: currentUser.id
    };

    onAddExam(exam);
    setNewExamTitle("");
    setNewExamDesc("");
    setNewExamSelectedTopicIds([]);
    setShowAddExamForm(false);
  };

  // Unit completion calculations
  const getUnitCompletionStats = () => {
    return units.map(unit => {
      const unitUsers = users.filter(u => u.unitId === unit.id && u.role === "member");
      if (unitUsers.length === 0) return { ...unit, completionRate: 0, count: 0 };

      let totalAssigned = 0;
      let totalCompleted = 0;

      unitUsers.forEach(u => {
        const uProg = progress.filter(p => p.userId === u.id);
        const compl = topics.filter(t => t.required).filter(t => {
          const p = uProg.find(pr => pr.topicId === t.id);
          return p && p.status === LearningStatus.COMPLETED;
        }).length;

        totalAssigned += topics.filter(t => t.required).length;
        totalCompleted += compl;
      });

      const rate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 100;

      return {
        ...unit,
        count: unitUsers.length,
        completionRate: rate
      };
    });
  };

  const unitStats = getUnitCompletionStats();
  const flatOrganizations = flattenOrganizationTree(organizationTree);
  const selectedOrganization =
    flatOrganizations.find(item => item.organizationId === selectedOrganizationId) ||
    flatOrganizations[0];
  const selectedStats = selectedOrganization
    ? organizationStats.find(item => item.organizationId === selectedOrganization.organizationId)
    : undefined;
  const selectedAliases = selectedOrganization
    ? organizationAliases.filter(item => item.organizationId === selectedOrganization.organizationId)
    : [];
  const filteredOrganizations = flatOrganizations.filter(item => {
    if (!organizationSearch.trim()) return true;
    const query = organizationSearch.toLowerCase();
    return `${item.canonicalName} ${item.shortName} ${item.code}`.toLowerCase().includes(query);
  });

  const handleAddOrganizationAlias = async () => {
    if (!selectedOrganization || !newAlias.trim()) return;
    setOrganizationLoading(true);
    setOrganizationMessage("");
    try {
      const alias = await organizationService.addAlias(newAlias.trim(), selectedOrganization.organizationId);
      setOrganizationAliases(prev => [...prev.filter(item => item.alias !== alias.alias), alias]);
      setNewAlias("");
      setOrganizationMessage("Đã ghi nhận bí danh đơn vị.");
    } catch (error) {
      setOrganizationMessage(error instanceof Error ? error.message : "Cần triển khai quyền quản trị bí danh trên Apps Script.");
    } finally {
      setOrganizationLoading(false);
    }
  };

  const handleRunOrganizationMigration = async () => {
    setOrganizationLoading(true);
    setOrganizationMessage("");
    try {
      const result = await organizationService.migrateUserOrganizations();
      setMigrationResult(result);
      setOrganizationMessage(result.message);
    } catch (error) {
      setOrganizationMessage(error instanceof Error ? error.message : "Không thể chạy đồng bộ đơn vị.");
    } finally {
      setOrganizationLoading(false);
    }
  };

  const renderOrganizationRow = (node: OrganizationTreeNode, depth = 0): React.ReactNode => {
    const stats = organizationStats.find(item => item.organizationId === node.organizationId);
    const children = (node.children || []).map(child => renderOrganizationRow(child, depth + 1));
    const isSelected = selectedOrganizationId === node.organizationId;
    return (
      <React.Fragment key={node.organizationId}>
        <button
          type="button"
          onClick={() => setSelectedOrganizationId(node.organizationId)}
          className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition ${
            isSelected ? "bg-red-50 text-[var(--app-color-brand-primary)]" : "bg-[var(--app-color-surface-soft)] text-[var(--app-color-text-primary)]"
          }`}
          style={{ paddingLeft: `${12 + depth * 14}px` }}
        >
          <span className="min-w-0">
            <span className="block truncate text-caption font-extrabold">{node.displayName}</span>
            <span className="block truncate text-caption font-semibold text-[var(--app-color-text-muted)]">{node.shortName} • {node.scopeLevel}</span>
          </span>
          <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-caption font-extrabold text-[var(--app-color-text-secondary)]">
            {stats?.memberCount || 0}
          </span>
        </button>
        {children}
      </React.Fragment>
    );
  };

  return (
    <div className="space-y-4 text-xs font-sans" id="admin-panel-container">
      
      {/* SECTION HEADER BAR */}
      {!embedded && <div className="pixel-surface space-y-3 p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[var(--brand-warm)] text-[var(--app-color-brand-primary)] rounded-xl">
            <ShieldAlert size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-extrabold text-[var(--app-color-text-primary)] uppercase tracking-tight">Khu vực quản trị</h2>
            <p className="text-caption text-[var(--app-color-text-muted)] font-bold uppercase truncate">CÁN BỘ CHÍNH TRỊ: {currentUser.fullName}</p>
          </div>
        </div>

        {isStaticLegacyMode && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-caption font-bold text-amber-900 leading-relaxed">
            Hiện chỉ hỗ trợ quản trị tài khoản. Các chức năng quản lý nội dung và đề kiểm tra chưa được mở.
          </div>
        )}

        {/* Dynamic Admin Sub-tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-caption font-extrabold uppercase tracking-wider text-center">
          <button
            onClick={() => setAdminTab("organizations")}
            className={`min-h-11 flex-1 py-2 rounded-lg cursor-pointer transition ${
              adminTab === "organizations" ? "bg-white text-[var(--app-color-brand-primary-dark)] app-shadow-low" : "text-[var(--app-color-text-muted)]"
            }`}
          >
            Tổ chức
          </button>

          <button
            onClick={() => setAdminTab("users")}
            className={`min-h-11 flex-1 py-2 rounded-lg cursor-pointer transition ${
              adminTab === "users" ? "bg-white text-[var(--app-color-brand-primary-dark)] app-shadow-low" : "text-[var(--app-color-text-muted)]"
            }`}
          >
            Quân số
          </button>
          
          <button
            type="button"
            disabled={isStaticLegacyMode}
            onClick={() => !isStaticLegacyMode && setAdminTab("topics")}
            title={isStaticLegacyMode ? "Chức năng quản lý nội dung hiện chưa được mở" : undefined}
            className={`min-h-11 flex-1 py-2 rounded-lg cursor-pointer transition ${
              adminTab === "topics" ? "bg-white text-[var(--app-color-brand-primary-dark)] app-shadow-low" : "text-[var(--app-color-text-muted)]"
            } ${isStaticLegacyMode ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Giáo án
          </button>

          <button
            type="button"
            disabled={isStaticLegacyMode}
            onClick={() => !isStaticLegacyMode && setAdminTab("exams")}
            title={isStaticLegacyMode ? "Chức năng quản lý đề kiểm tra hiện chưa được mở" : undefined}
            className={`min-h-11 flex-1 py-2 rounded-lg cursor-pointer transition ${
              adminTab === "exams" ? "bg-white text-[var(--app-color-brand-primary-dark)] app-shadow-low" : "text-[var(--app-color-text-muted)]"
            } ${isStaticLegacyMode ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Kỳ thi
          </button>

          <button
            onClick={() => setAdminTab("reports")}
            className={`min-h-11 flex-1 py-2 rounded-lg cursor-pointer transition ${
              adminTab === "reports" ? "bg-white text-[var(--app-color-brand-primary-dark)] app-shadow-low" : "text-[var(--app-color-text-muted)]"
            }`}
          >
            Báo cáo
          </button>
        </div>
      </div>}

      {adminTab === "organizations" && (
        <div className="space-y-4 motion-fade-in" id="admin-organizations-subpanel">
          <div className="pixel-surface space-y-3 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-red-50 p-2.5 text-[var(--app-color-brand-primary)]">
                <GitBranch size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-label font-extrabold text-[var(--app-color-text-primary)]">Khu vực quản trị</h3>
                <p className="text-caption font-semibold leading-relaxed text-[var(--app-color-text-muted)]">
                  Quản lý tổ chức, tài khoản và dữ liệu huấn luyện theo cấp chỉ huy.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                ["Quân số", users.length],
                ["Hoạt động", activeUsers.length],
                ["Chờ duyệt", pendingUsers.length],
                ["Tổ chức", flatOrganizations.length]
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-[var(--app-color-surface-soft)] p-2 text-center">
                  <p className="text-base font-extrabold text-[var(--app-color-brand-primary)]">{value}</p>
                  <p className="text-caption font-extrabold uppercase text-[var(--app-color-text-muted)]">{label}</p>
                </div>
              ))}
            </div>

            {organizationMessage && (
              <div className="rounded-2xl bg-amber-50 p-3 text-caption font-bold leading-relaxed text-amber-900">
                {organizationMessage}
              </div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
            <div className="pixel-surface space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-caption font-extrabold uppercase tracking-wider text-[var(--app-color-text-muted)]">Cây tổ chức</h4>
                <span className="rounded-full bg-green-50 px-2 py-0.5 text-caption font-extrabold text-green-700">
                  {organizationLoading ? "Đang tải" : "Sẵn sàng"}
                </span>
              </div>

              <label className="flex min-h-11 items-center gap-2 rounded-2xl bg-[var(--app-color-surface-soft)] px-3">
                <Search size={14} className="text-[var(--app-color-text-muted)]" />
                <input
                  value={organizationSearch}
                  onChange={event => setOrganizationSearch(event.target.value)}
                  placeholder="Tìm đơn vị"
                  className="min-w-0 flex-1 bg-transparent text-caption font-semibold outline-none"
                />
              </label>

              <div className="max-h-96 space-y-1 overflow-y-auto pr-1">
                {organizationSearch.trim()
                  ? filteredOrganizations.map(item => renderOrganizationRow({ ...item, children: [] }))
                  : organizationTree.map(item => renderOrganizationRow(item))}
              </div>
            </div>

            <div className="pixel-surface space-y-3 p-4">
              <h4 className="text-caption font-extrabold uppercase tracking-wider text-[var(--app-color-text-muted)]">Chi tiết tổ chức</h4>

              {selectedOrganization ? (
                <>
                  <div className="rounded-2xl bg-red-50/70 p-3">
                    <p className="text-label font-extrabold text-[var(--app-color-text-primary)]">{selectedOrganization.canonicalName}</p>
                    <p className="mt-1 text-caption font-semibold text-[var(--app-color-text-muted)]">{selectedOrganization.path}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-white px-2 py-1 text-caption font-extrabold text-[var(--app-color-brand-primary)]">{selectedOrganization.organizationType}</span>
                      <span className="rounded-full bg-white px-2 py-1 text-caption font-extrabold text-[var(--app-color-text-secondary)]">{selectedOrganization.scopeLevel}</span>
                      <span className="rounded-full bg-white px-2 py-1 text-caption font-extrabold text-green-700">{selectedOrganization.status}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-2xl bg-[var(--app-color-surface-soft)] p-2 text-center">
                      <p className="text-base font-extrabold text-[var(--app-color-text-primary)]">{selectedStats?.memberCount || 0}</p>
                      <p className="text-caption font-bold text-[var(--app-color-text-muted)]">Thành viên</p>
                    </div>
                    <div className="rounded-2xl bg-[var(--app-color-surface-soft)] p-2 text-center">
                      <p className="text-base font-extrabold text-green-700">{selectedStats?.activeCount || 0}</p>
                      <p className="text-caption font-bold text-[var(--app-color-text-muted)]">Hoạt động</p>
                    </div>
                    <div className="rounded-2xl bg-[var(--app-color-surface-soft)] p-2 text-center">
                      <p className="text-base font-extrabold text-amber-700">{selectedStats?.pendingCount || 0}</p>
                      <p className="text-caption font-bold text-[var(--app-color-text-muted)]">Chờ duyệt</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-caption font-extrabold uppercase tracking-wider text-[var(--app-color-text-muted)]">Bí danh</p>
                      <span className="text-caption font-bold text-[var(--app-color-text-muted)]">{selectedAliases.length}</span>
                    </div>
                    <div className="max-h-28 space-y-1 overflow-y-auto">
                      {selectedAliases.length > 0 ? selectedAliases.map(alias => (
                        <div key={`${alias.alias}_${alias.organizationId}`} className="flex min-h-9 items-center justify-between rounded-xl bg-[var(--app-color-surface-soft)] px-3 text-caption">
                          <span className="font-bold text-[var(--app-color-text-primary)]">{alias.alias}</span>
                          <span className="font-extrabold text-[var(--app-color-text-muted)]">{Math.round(alias.confidence * 100)}%</span>
                        </div>
                      )) : (
                        <p className="rounded-xl bg-[var(--app-color-surface-soft)] p-3 text-caption font-semibold text-[var(--app-color-text-muted)]">
                          Chưa có bí danh cho đơn vị này.
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={newAlias}
                        onChange={event => setNewAlias(event.target.value)}
                        placeholder="Thêm bí danh đơn vị"
                        className="min-h-11 min-w-0 flex-1 rounded-xl border border-[var(--app-color-border)] px-3 text-caption font-semibold"
                      />
                      <button
                        type="button"
                        onClick={handleAddOrganizationAlias}
                        disabled={!newAlias.trim() || organizationLoading}
                        className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-[var(--app-color-brand-primary)] px-3 text-caption font-extrabold text-white disabled:opacity-50"
                      >
                        <Link2 size={13} />
                        Thêm
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="rounded-2xl bg-[var(--app-color-surface-soft)] p-4 text-center text-caption font-semibold text-[var(--app-color-text-muted)]">
                  Chưa có tổ chức để hiển thị.
                </p>
              )}
            </div>
          </div>

          <div className="pixel-surface space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-caption font-extrabold uppercase tracking-wider text-[var(--app-color-text-muted)]">Đồng bộ tài khoản vào tổ chức</h4>
                <p className="mt-1 text-caption font-semibold leading-relaxed text-[var(--app-color-text-muted)]">
                  Tác vụ đọc cột Đơn vị hiện có, chuẩn hóa theo bí danh và tạo liên kết UserOrganizations. Có thể chạy lại an toàn.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRunOrganizationMigration}
                disabled={organizationLoading}
                className="min-h-11 shrink-0 rounded-xl bg-[var(--app-color-brand-primary)] px-3 text-caption font-extrabold text-white disabled:opacity-50"
              >
                Chạy đồng bộ
              </button>
            </div>

            {migrationResult && (
              <div className="rounded-2xl bg-[var(--app-color-surface-soft)] p-3 text-caption font-semibold leading-relaxed text-[var(--app-color-text-secondary)]">
                <p><strong>Kết quả:</strong> {migrationResult.message}</p>
                <p>Tạo mới: {migrationResult.createdLinks} • Bỏ qua: {migrationResult.skippedExisting}</p>
                {migrationResult.backendPatchRequired && (
                  <p className="mt-1 font-extrabold text-amber-800">Cần triển khai Apps Script patch để ghi dữ liệu thật.</p>
                )}
                {migrationResult.unresolvedUnits.length > 0 && (
                  <p className="mt-1">Đơn vị chưa khớp: {migrationResult.unresolvedUnits.join(", ")}</p>
                )}
              </div>
            )}

            <div className="rounded-2xl bg-[var(--app-color-surface-soft)] p-3">
              <p className="text-caption font-extrabold uppercase tracking-wider text-[var(--app-color-text-muted)]">Kiểm thử resolver nhanh</p>
              {["Phòng Hậu cần - Kỹ thuật", "Phòng HCKT", "phong thammuu", "Phòng chính trị"].map(sample => {
                const result = resolveOrganizationLocally(sample);
                return (
                  <div key={sample} className="mt-2 flex items-center justify-between gap-2 text-caption">
                    <span className="font-semibold text-[var(--app-color-text-primary)]">{sample}</span>
                    <span className="shrink-0 font-extrabold text-[var(--app-color-brand-primary)]">{result.organizationId}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 1. USERS LIST & APPROVAL PANEL */}
      {adminTab === "users" && (
        <div className="space-y-4 motion-fade-in" id="admin-users-subpanel">
          {currentUser.role === UserRole.ADMIN && !isStaticLegacyMode && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-caption font-extrabold uppercase tracking-widest text-[var(--app-color-text-muted)]">Quản lý tài khoản</h3>
                <button
                  type="button"
                  onClick={() => setShowAddUserForm(value => !value)}
                  className="py-1.5 px-3 bg-[var(--app-color-brand-primary)] text-white font-bold text-caption rounded-lg flex items-center gap-1"
                >
                  <UserPlus size={12} />
                  {showAddUserForm ? "Đóng" : "Tạo tài khoản"}
                </button>
              </div>
              {showAddUserForm && (
                <form onSubmit={handleCreateUserSubmit} className="pixel-surface space-y-2.5 p-4 text-xs">
                  <input value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Họ và tên" className="w-full px-3 py-2 border border-[var(--app-color-border)] rounded-lg" required />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="Email" className="min-w-0 px-3 py-2 border border-[var(--app-color-border)] rounded-lg" required />
                    <input value={newUserPhone} onChange={e => setNewUserPhone(e.target.value)} placeholder="Số điện thoại" className="min-w-0 px-3 py-2 border border-[var(--app-color-border)] rounded-lg" />
                  </div>
                  <input type="password" minLength={8} value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} placeholder="Mật khẩu khởi tạo" className="w-full px-3 py-2 border border-[var(--app-color-border)] rounded-lg" required />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as UserRole)} className="min-w-0 px-2 py-2 border border-[var(--app-color-border)] rounded-lg">
                      <option value={UserRole.MEMBER}>Học viên</option>
                      <option value={UserRole.INSTRUCTOR}>Giảng viên</option>
                      <option value={UserRole.POLITICAL_OFFICER}>Chính trị viên</option>
                      <option value={UserRole.ADMIN}>Quản trị viên</option>
                    </select>
                    <select value={newUserUnitId} onChange={e => setNewUserUnitId(e.target.value)} className="min-w-0 px-2 py-2 border border-[var(--app-color-border)] rounded-lg" required>
                      {units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="w-full py-2 bg-[var(--app-color-brand-primary)] text-white font-bold rounded-lg">Tạo tài khoản và yêu cầu đổi mật khẩu</button>
                </form>
              )}
            </div>
          )}
          
          {/* A. Pending requests */}
          <div className="space-y-2">
            <h3 className="text-caption font-extrabold uppercase tracking-widest text-[var(--app-color-text-muted)] pl-1 flex items-center gap-1">
              <span>Yêu cầu chờ phê duyệt</span>
              <span className="px-1.5 py-0.5 rounded-full text-caption bg-amber-500 text-white font-extrabold motion-status-change">
                {pendingUsers.length}
              </span>
            </h3>

            {pendingUsers.length > 0 ? (
              pendingUsers.map(u => {
                const unitName = units.find(un => un.id === u.unitId)?.name || "Chưa xác định";
                return (
                  <div key={u.id} className="flex flex-col gap-3 rounded-[var(--app-radius-card)] border border-amber-100 bg-amber-50/60 p-4 text-xs app-shadow-low">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[var(--app-color-text-primary)] text-label">{u.fullName}</span>
                        <span className="px-2 py-0.5 rounded-full font-extrabold text-caption uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-200">
                          Chờ duyệt
                        </span>
                      </div>
                      <p className="text-[var(--app-color-text-muted)] font-semibold text-caption">Đơn vị đăng ký: {unitName}</p>
                      <p className="text-caption text-[var(--app-color-text-muted)] font-mono">Email: {u.email} • SĐT: {u.phone}</p>
                    </div>

                    {currentUser.role === UserRole.ADMIN && <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => onUpdateUserStatus(u.id, AccountStatus.ACTIVE)}
                        className="flex-1 py-2.5 bg-[var(--app-color-brand-primary)] hover:bg-[var(--app-color-brand-primary-dark)] text-white font-extrabold text-caption uppercase rounded-xl transition flex items-center justify-center gap-1 cursor-pointer min-h-11"
                      >
                        <CheckCircle size={12} />
                        <span>Duyệt nhập ngũ</span>
                      </button>
                      <button
                        onClick={() => onUpdateUserStatus(u.id, AccountStatus.REJECTED)}
                        className="flex-1 py-2.5 bg-white hover:bg-red-50 text-red-700 font-extrabold text-caption uppercase rounded-xl border border-red-200 transition flex items-center justify-center gap-1 cursor-pointer min-h-11"
                      >
                        <XCircle size={12} />
                        <span>Từ chối</span>
                      </button>
                    </div>}
                  </div>
                );
              })
            ) : (
              <div className="pixel-surface p-4 py-6 text-center font-semibold text-[var(--app-color-text-muted)]">
                Hiện không có tài khoản chờ duyệt.
              </div>
            )}
          </div>

          {/* B. Approved military list */}
          <div className="space-y-2">
            <h3 className="text-caption font-extrabold uppercase tracking-widest text-[var(--app-color-text-muted)] pl-1">
              Danh sách quân số chính thức ({approvedUsers.length} đ/c)
            </h3>

            <div className="space-y-2.5">
              {approvedUsers.map(u => {
                const unitName = units.find(un => un.id === u.unitId)?.name || "Chưa xác định";
                return (
                  <div key={u.id} className="pixel-surface flex flex-col gap-3 p-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[var(--app-color-text-primary)] text-caption">{u.fullName}</span>
                        <span className={`px-2 py-0.5 rounded-full font-extrabold text-caption uppercase tracking-wide border ${
                          u.accountStatus === "active" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-800"
                        }`}>
                          {u.accountStatus === "active" ? "Kích hoạt" : "Bị khóa"}
                        </span>
                      </div>
                      <p className="text-[var(--app-color-text-muted)] font-semibold text-caption">
                        Chức vụ: {u.role === "member" ? "Chiến sĩ" : "Cán bộ sĩ quan"} • {unitName}
                      </p>
                      <p className="text-caption text-[var(--app-color-text-muted)] font-mono">{u.email}</p>
                    </div>

                    {currentUser.role === UserRole.ADMIN && u.id !== currentUser.id && (
                      <div className="pt-2 border-t border-[var(--app-color-divider)] flex flex-wrap items-center gap-2 justify-end">
                        <select
                          value={u.role}
                          onChange={e => onChangeUserRole?.(u.id, e.target.value as UserRole)}
                          className="mr-auto min-h-11 px-2 py-1.5 border border-[var(--app-color-border)] rounded-lg text-caption font-bold bg-white"
                          aria-label={`Vai trò của ${u.fullName}`}
                        >
                          <option value={UserRole.MEMBER}>Học viên</option>
                          {!isStaticLegacyMode && <option value={UserRole.INSTRUCTOR}>Giảng viên</option>}
                          <option value={UserRole.POLITICAL_OFFICER}>Chính trị viên</option>
                          <option value={UserRole.ADMIN}>Quản trị viên</option>
                        </select>
                        {!isStaticLegacyMode && (
                          <button
                            onClick={() => requestPasswordReset(u)}
                            className="min-h-11 py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-caption uppercase rounded-lg border border-amber-100"
                          >
                            Đặt lại mật khẩu
                          </button>
                        )}
                        {u.accountStatus === "active" ? (
                          <button
                            onClick={() => onUpdateUserStatus(u.id, AccountStatus.SUSPENDED)}
                            className="min-h-11 py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-caption uppercase rounded-lg transition border border-red-100 cursor-pointer"
                          >
                            Tạm khóa tài khoản
                          </button>
                        ) : (
                          <button
                            onClick={() => onUpdateUserStatus(u.id, AccountStatus.ACTIVE)}
                            className="min-h-11 py-1.5 px-3 bg-[var(--brand-warm)] hover:bg-[var(--brand-warm)] text-[var(--app-color-brand-primary)] font-bold text-caption uppercase rounded-lg transition border border-[var(--app-color-border)] cursor-pointer"
                          >
                            Mở khóa tài khoản
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {approvedUsers.length === 0 && (
                <div className="pixel-surface p-4 py-6 text-center font-semibold text-[var(--app-color-text-muted)]">
                  Hiện chưa có tài khoản đã kích hoạt.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. TOPICS MANAGEMENT & ASSIGNMENT */}
      {adminTab === "topics" && !isStaticLegacyMode && (
        <div className="space-y-4 motion-fade-in" id="admin-topics-subpanel">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-caption font-extrabold uppercase tracking-widest text-[var(--app-color-text-muted)]">Giáo trình & Biên soạn chuyên đề</h3>
            <button
              onClick={() => setShowAddTopicForm(!showAddTopicForm)}
              className="py-1.5 px-3 bg-[var(--app-color-brand-primary)] hover:bg-[var(--app-color-brand-primary-dark)] text-white font-extrabold text-caption rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              <Plus size={12} />
              <span>{showAddTopicForm ? "Đóng" : "Soạn chuyên đề mới"}</span>
            </button>
          </div>

          {/* Add topic form overlay */}
          {showAddTopicForm && (
            <form onSubmit={handleCreateTopicSubmit} className="pixel-surface motion-fade-in space-y-3 p-4 text-xs">
              <h4 className="font-extrabold text-[var(--app-color-text-primary)] text-xs border-b pb-2">BIỂU MẪU BIÊN SOẠN BÀI GIẢNG CHÍNH QUY</h4>
              
              <div className="space-y-1">
                <label className="font-extrabold text-[var(--app-color-text-muted)] uppercase text-caption">Tiêu đề chuyên đề</label>
                <input
                  type="text"
                  required
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  placeholder="Ví dụ: Lịch sử truyền thống Quân đội..."
                  className="w-full p-3 bg-slate-50 border border-transparent rounded-xl text-xs focus:ring-2 focus:ring-red-800 focus:outline-none font-semibold text-[var(--app-color-text-secondary)]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-[var(--app-color-text-muted)] uppercase text-caption">Phân loại học tập</label>
                <select
                  value={newTopicCategory}
                  onChange={(e) => setNewTopicCategory(e.target.value as TopicCategory)}
                  className="w-full p-3 bg-slate-50 border border-transparent rounded-xl text-xs focus:ring-2 focus:ring-red-800 focus:outline-none font-bold"
                >
                  {Object.values(TopicCategory).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-[var(--app-color-text-muted)] uppercase text-caption">Mô tả tóm tắt nội dung chính</label>
                <input
                  type="text"
                  required
                  value={newTopicDesc}
                  onChange={(e) => setNewTopicDesc(e.target.value)}
                  placeholder="Nêu rõ mục tiêu giáo dục..."
                  className="w-full p-3 bg-slate-50 border border-transparent rounded-xl text-xs focus:ring-2 focus:ring-red-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-[var(--app-color-text-muted)] uppercase text-caption">Nội dung giáo trình lý luận (Markdown hỗ trợ)</label>
                <textarea
                  required
                  rows={6}
                  value={newTopicContent}
                  onChange={(e) => setNewTopicContent(e.target.value)}
                  placeholder="Nhập nội dung giảng dạy tuyên truyền..."
                  className="w-full p-3 bg-slate-50 border border-transparent rounded-xl text-xs focus:ring-2 focus:ring-red-800 font-mono leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-extrabold text-[var(--app-color-text-muted)] uppercase text-caption">Thời gian đọc (phút)</label>
                  <input
                    type="number"
                    value={newTopicMinutes}
                    onChange={(e) => setNewTopicMinutes(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-transparent rounded-xl text-xs"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="newTopicRequired"
                    checked={newTopicRequired}
                    onChange={(e) => setNewTopicRequired(e.target.checked)}
                    className="w-4 h-4 text-[var(--app-color-brand-primary)] border-[var(--app-color-border-strong)] rounded cursor-pointer"
                  />
                  <label htmlFor="newTopicRequired" className="font-bold text-[var(--app-color-text-secondary)] cursor-pointer">Bắt buộc học</label>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-[var(--app-color-divider)]">
                <button
                  type="button"
                  onClick={() => setShowAddTopicForm(false)}
                  className="flex-1 py-3 bg-slate-100 text-[var(--app-color-text-secondary)] font-bold rounded-xl text-caption min-h-11 cursor-pointer"
                >
                  Hủy soạn thảo
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[var(--app-color-brand-primary)] text-white font-extrabold rounded-xl text-caption min-h-11 app-shadow-low cursor-pointer"
                >
                  Lưu trữ giáo án
                </button>
              </div>
            </form>
          )}

          {/* List of current topics with assignment capabilities */}
          <div className="space-y-2">
            {topics.map(topic => {
              const assignedToAll = (!topic.assignedUnitIds?.length && !topic.assignedUserIds?.length);
              return (
                <div key={topic.id} className="pixel-surface flex flex-col gap-3 p-4 text-xs">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-extrabold text-[var(--app-color-text-primary)] leading-snug">{topic.title}</p>
                      <p className="text-caption text-[var(--app-color-text-muted)] font-extrabold uppercase mt-0.5">
                        {topic.category} • {topic.estimatedMinutes} phút
                      </p>
                      {topic.deadline && (
                        <p className="text-caption text-red-600 font-bold flex items-center gap-1 mt-1">
                          <Calendar size={10} />
                          <span>Hạn chót hoàn thành: {new Date(topic.deadline).toLocaleDateString("vi-VN")}</span>
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded-full font-extrabold text-caption uppercase tracking-wide border ${
                        topic.required ? "bg-red-50 border-red-200 text-red-700 motion-status-change" : "bg-slate-100 text-[var(--app-color-text-muted)] border-transparent"
                      }`}>
                        {topic.required ? "Bắt buộc" : "Tự do"}
                      </span>
                      <span className="text-caption font-extrabold uppercase text-[var(--app-color-text-muted)] mt-1">
                        {assignedToAll ? "Tất cả chiến sĩ" : "Phân phối riêng"}
                      </span>
                    </div>
                  </div>

                  {/* Assignment distribution button */}
                  {onUpdateTopicAssignment && (
                    <div className="pt-2 border-t border-[var(--app-color-divider)] flex justify-end">
                      <button
                        onClick={() => {
                          setActiveAssignTopic(topic);
                          setAssignDeadline(topic.deadline || "");
                          setAssignRequired(topic.required);
                        }}
                        className="py-1.5 px-3 bg-[var(--brand-warm)] hover:bg-[var(--brand-warm)] text-[var(--app-color-brand-primary)] font-extrabold text-caption uppercase rounded-xl transition flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus size={12} />
                        <span>Phân phối huấn luyện</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Assignment Modal (Overlay) */}
          {activeAssignTopic && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm motion-dialog-backdrop flex items-center justify-center p-4 z-50 motion-fade-in" id="topic-distribution-modal">
              <form onSubmit={handleAssignSubmit} className="app-overlay motion-dialog-panel w-full max-w-sm space-y-4 p-5 text-xs">
                <div className="flex items-center gap-2 border-b pb-2">
                  <UserPlus size={16} className="text-[var(--app-color-brand-primary)]" />
                  <h4 className="font-extrabold text-[var(--app-color-text-primary)] uppercase tracking-tight">Cấu hình phân phối bài học</h4>
                </div>
                
                <p className="text-caption text-[var(--app-color-text-muted)] font-semibold leading-relaxed">
                  Thiết lập đơn vị huấn luyện và hạn định cụ thể cho bài học: <strong className="text-[var(--app-color-brand-primary)]">"{activeAssignTopic.title}"</strong>
                </p>

                <div className="space-y-1">
                  <label className="font-extrabold text-[var(--app-color-text-muted)] uppercase text-caption">Giao cho đơn vị</label>
                  <select
                    value={assignUnitId}
                    onChange={(e) => setAssignUnitId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-transparent rounded-lg font-bold"
                  >
                    <option value="all">Tất cả các đại đội/trung đội</option>
                    {units.map(unit => (
                      <option key={unit.id} value={unit.id}>{unit.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-[var(--app-color-text-muted)] uppercase text-caption">Chiến sĩ đích danh (Tùy chọn)</label>
                  <select
                    value={assignUserId}
                    onChange={(e) => setAssignUserId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-transparent rounded-lg font-bold"
                  >
                    <option value="all">Tất cả quân nhân trong đơn vị</option>
                    {users.filter(u => u.role === "member").map(u => (
                      <option key={u.id} value={u.id}>{u.fullName} ({units.find(un => un.id === u.unitId)?.name || "Chưa xác định"})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-[var(--app-color-text-muted)] uppercase text-caption">Hạn chót hoàn thành học tập</label>
                  <input
                    type="date"
                    required
                    value={assignDeadline}
                    onChange={(e) => setAssignDeadline(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-transparent rounded-lg text-xs font-bold"
                  />
                </div>

                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="assignRequired"
                    checked={assignRequired}
                    onChange={(e) => setAssignRequired(e.target.checked)}
                    className="w-4 h-4 text-[var(--app-color-brand-primary)] border-[var(--app-color-border-strong)] rounded cursor-pointer"
                  />
                  <label htmlFor="assignRequired" className="font-bold text-[var(--app-color-text-secondary)] cursor-pointer">Bài học bắt buộc tích lũy</label>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setActiveAssignTopic(null)}
                    className="flex-1 py-2.5 bg-slate-100 text-[var(--app-color-text-secondary)] font-bold rounded-xl uppercase tracking-wider text-caption min-h-11 cursor-pointer"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[var(--app-color-brand-primary)] text-white font-extrabold rounded-xl uppercase tracking-wider text-caption min-h-11 cursor-pointer"
                  >
                    Giao nhiệm vụ
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 3. EXAMS LIFECYCLE MANAGEMENT */}
      {adminTab === "exams" && !isStaticLegacyMode && (
        <div className="space-y-4 motion-fade-in" id="admin-exams-subpanel">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-caption font-extrabold uppercase tracking-widest text-[var(--app-color-text-muted)]">Thi cử & Khảo thí chính trị chính thức</h3>
            {onAddExam && (
              <button
                onClick={() => setShowAddExamForm(!showAddExamForm)}
                className="py-1.5 px-3 bg-[var(--app-color-brand-primary)] hover:bg-[var(--app-color-brand-primary-dark)] text-white font-extrabold text-caption rounded-lg transition flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} />
                <span>{showAddExamForm ? "Đóng" : "Mở đợt thi mới"}</span>
              </button>
            )}
          </div>

          {/* Add Exam Form */}
          {showAddExamForm && (
            <form onSubmit={handleCreateExamSubmit} className="pixel-surface motion-fade-in space-y-3 p-4 text-xs">
              <h4 className="font-extrabold text-[var(--app-color-text-primary)] text-xs border-b pb-2">THIẾT LẬP KỲ THI CHÍNH QUY BAN CHỈ HUY</h4>
              
              <div className="space-y-1">
                <label className="font-extrabold text-[var(--app-color-text-muted)] uppercase text-caption">Tên kỳ thi</label>
                <input
                  type="text"
                  required
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  placeholder="Ví dụ: Kiểm tra chuyên đề Tư tưởng Hồ Chí Minh năm 2026"
                  className="w-full p-3 bg-slate-50 border border-transparent rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-[var(--app-color-text-muted)] uppercase text-caption">Mô tả quy chế phòng thi</label>
                <input
                  type="text"
                  required
                  value={newExamDesc}
                  onChange={(e) => setNewExamDesc(e.target.value)}
                  placeholder="Các yêu cầu về kỷ luật và chấm điểm..."
                  className="w-full p-3 bg-slate-50 border border-transparent rounded-xl text-xs focus:ring-2 focus:ring-red-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-extrabold text-[var(--app-color-text-muted)] uppercase text-caption">Thời gian làm bài (Phút)</label>
                  <input
                    type="number"
                    value={newExamDuration}
                    onChange={(e) => setNewExamDuration(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-transparent rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-extrabold text-[var(--app-color-text-muted)] uppercase text-caption">Điểm sàn ĐẠT (Thang 10)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newExamScore}
                    onChange={(e) => setNewExamScore(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-transparent rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="font-extrabold text-[var(--app-color-text-muted)] uppercase text-caption block">Lựa chọn chuyên đề giáo dục kiểm tra</label>
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl max-h-36 overflow-y-auto border border-[var(--app-color-divider)]">
                  {topics.map(t => (
                    <div key={t.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`check-topic-${t.id}`}
                        checked={newExamSelectedTopicIds.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewExamSelectedTopicIds([...newExamSelectedTopicIds, t.id]);
                          } else {
                            setNewExamSelectedTopicIds(newExamSelectedTopicIds.filter(id => id !== t.id));
                          }
                        }}
                        className="w-3.5 h-3.5 text-[var(--app-color-brand-primary)] border-[var(--app-color-border-strong)] rounded cursor-pointer"
                      />
                      <label htmlFor={`check-topic-${t.id}`} className="font-semibold text-[var(--app-color-text-secondary)] cursor-pointer select-none truncate">
                        {t.title}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-[var(--app-color-divider)]">
                <button
                  type="button"
                  onClick={() => setShowAddExamForm(false)}
                  className="flex-1 py-3 bg-slate-100 text-[var(--app-color-text-secondary)] font-bold rounded-xl text-caption min-h-11 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={newExamSelectedTopicIds.length === 0}
                  className={`flex-1 py-3 font-extrabold rounded-xl text-caption min-h-11 cursor-pointer text-white app-shadow-low ${
                    newExamSelectedTopicIds.length === 0 ? "bg-slate-300 cursor-not-allowed" : "bg-[var(--app-color-brand-primary)] hover:bg-[var(--app-color-brand-primary-dark)]"
                  }`}
                >
                  Phát hành đợt thi
                </button>
              </div>
            </form>
          )}

          {/* List of current exams */}
          <div className="space-y-2.5">
            {exams.map(exam => {
              const lifeStatus = exam.lifecycleStatus || "published";
              return (
                <div key={exam.id} className="pixel-surface flex flex-col gap-3 p-4 text-xs">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-extrabold text-[var(--app-color-text-primary)] leading-snug">{exam.title}</p>
                      <p className="text-caption text-[var(--app-color-text-muted)] font-semibold leading-relaxed mt-1">{exam.description}</p>
                      <p className="text-caption text-[var(--app-color-text-muted)] font-extrabold uppercase mt-1 flex items-center gap-1">
                        <Clock size={10} />
                        <span>{exam.durationMinutes} phút • Sàn đạt: {exam.passingScore}/10đ • {exam.questionCount} câu hỏi</span>
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-extrabold text-caption uppercase tracking-wide border ${
                      lifeStatus === "published" && exam.status === "active" ? "bg-red-50 border-red-200 text-red-700" :
                      lifeStatus === "archived" || exam.status === "expired" ? "bg-slate-100 text-[var(--app-color-text-muted)] border-transparent" : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}>
                      {lifeStatus === "published" && exam.status === "active" ? "ĐANG THI" :
                       lifeStatus === "archived" || exam.status === "expired" ? "LƯU TRỮ" : "NHÁP"}
                    </span>
                  </div>

                  {/* Lifecycle and evaluation controls */}
                  {onUpdateExam && (
                    <div className="pt-2 border-t border-[var(--app-color-divider)] flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          id={`allow-review-${exam.id}`}
                          checked={exam.allowReview}
                          onChange={(e) => onUpdateExam(exam.id, { allowReview: e.target.checked })}
                          className="w-4 h-4 text-[var(--app-color-brand-primary)] border-[var(--app-color-border-strong)] rounded cursor-pointer"
                        />
                        <label htmlFor={`allow-review-${exam.id}`} className="font-bold text-[var(--app-color-text-muted)] cursor-pointer text-caption uppercase tracking-wide">
                          Xem lại bài thi & đáp án
                        </label>
                      </div>

                      {lifeStatus === "published" && exam.status === "active" ? (
                        <button
                          onClick={() => onUpdateExam(exam.id, { lifecycleStatus: "archived", status: "expired" })}
                          className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-[var(--app-color-text-secondary)] font-extrabold text-caption uppercase rounded-lg transition flex items-center gap-1 cursor-pointer"
                        >
                          <Archive size={11} />
                          <span>Lưu trữ</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onUpdateExam(exam.id, { lifecycleStatus: "published", status: "active" })}
                          className="py-1 px-2.5 bg-[var(--brand-warm)] hover:bg-[var(--brand-warm)] text-[var(--app-color-brand-primary)] font-extrabold text-caption uppercase rounded-lg transition flex items-center gap-1 cursor-pointer"
                        >
                          <Check size={11} />
                          <span>Công bố lại</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. STATISTICAL REPORTS & AUDIT TRAIL LOG */}
      {adminTab === "reports" && (
        <div className="space-y-4 motion-fade-in" id="admin-reports-subpanel">
          <div className="pixel-surface space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-label font-extrabold text-[var(--app-color-text-primary)]">Command Center</h3>
                <p className="mt-1 text-caption font-semibold leading-relaxed text-[var(--app-color-text-muted)]">
                  Theo dõi hoạt động học tập, hồ sơ điện tử và chỉ số chất lượng giáo dục chính trị.
                </p>
              </div>
              <select
                value={analyticsRange}
                onChange={event => setAnalyticsRange(event.target.value as "today" | "7d" | "30d")}
                className="min-h-11 shrink-0 rounded-xl border border-[var(--app-color-border)] bg-white px-2 text-caption font-extrabold"
                aria-label="Khoảng thời gian phân tích"
              >
                <option value="today">Hôm nay</option>
                <option value="7d">7 ngày</option>
                <option value="30d">30 ngày</option>
              </select>
            </div>

            {analyticsMessage && (
              <div className="rounded-2xl bg-amber-50 p-3 text-caption font-bold leading-relaxed text-amber-900">
                {analyticsMessage}
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              {[
                ["Đăng nhập", analyticsSummary.loggedInToday],
                ["Đang học", analyticsSummary.learningToday],
                ["Hoàn thành", analyticsSummary.completedTopics],
                ["Điểm TB", analyticsSummary.averageScore]
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl bg-[var(--app-color-surface-soft)] p-2 text-center">
                  <p className="text-base font-extrabold text-[var(--app-color-brand-primary)]">{analyticsMetric(value)}</p>
                  <p className="text-caption font-extrabold uppercase text-[var(--app-color-text-muted)]">{label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                ["Hoạt động hôm nay", analyticsSummary.activeToday],
                ["Nộp bài ôn tập", analyticsSummary.quizSubmissions],
                ["Học viên cần hỗ trợ", analyticsSummary.weakLearners],
                ["Tổng tài khoản", analyticsSummary.totalUsers ?? users.length]
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl bg-[var(--app-color-surface-soft)] p-3">
                  <p className="text-lg font-extrabold text-[var(--app-color-text-primary)]">{analyticsMetric(value)}</p>
                  <p className="text-caption font-bold text-[var(--app-color-text-muted)]">{label}</p>
                </div>
              ))}
            </div>

            {!analyticsAvailable && !analyticsLoading && (
              <p className="rounded-2xl bg-[var(--app-color-surface-soft)] p-3 text-caption font-semibold leading-relaxed text-[var(--app-color-text-muted)]">
                Phần hiển thị phân tích đã sẵn sàng ở frontend. Cần triển khai dispatcher analytics trên Apps Script để ghi và đọc dữ liệu thật.
              </p>
            )}
          </div>

          {analyticsAvailable && (
            <>
              <div className="pixel-surface space-y-3 p-4">
                <h4 className="text-caption font-extrabold uppercase tracking-wider text-[var(--app-color-text-muted)]">Tổng hợp theo đơn vị</h4>
                {(analyticsSummary.units || []).length > 0 ? (
                  <div className="space-y-2">
                    {(analyticsSummary.units || []).slice(0, 8).map(unit => (
                      <div key={unit.unit} className="rounded-2xl bg-[var(--app-color-surface-soft)] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-[var(--app-color-text-primary)]">{unit.unit || "Chưa xác định"}</span>
                          <span className="rounded-full bg-white px-2 py-1 text-caption font-extrabold text-[var(--app-color-brand-primary)]">
                            PEQI {analyticsMetric(unit.peqiAverage)}
                          </span>
                        </div>
                        <p className="mt-1 text-caption font-semibold text-[var(--app-color-text-muted)]">
                          Quân số {unit.users} • Hoạt động {unit.activeUsers} • Hoàn thành {unit.completionRate}% • Điểm TB {unit.averageScore}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl bg-[var(--app-color-surface-soft)] p-3 text-caption font-semibold text-[var(--app-color-text-muted)]">
                    Chưa có dữ liệu đơn vị trong khoảng thời gian đã chọn.
                  </p>
                )}
              </div>

              <div className="pixel-surface space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-caption font-extrabold uppercase tracking-wider text-[var(--app-color-text-muted)]">Hồ sơ học viên điện tử</h4>
                  <select
                    value={selectedLearnerId}
                    onChange={event => setSelectedLearnerId(event.target.value)}
                    className="min-h-11 max-w-[170px] rounded-xl border border-[var(--app-color-border)] bg-white px-2 text-caption font-bold"
                    aria-label="Chọn học viên"
                  >
                    {users.filter(user => user.role === UserRole.MEMBER).map(user => (
                      <option key={user.id} value={user.id}>{user.fullName}</option>
                    ))}
                  </select>
                </div>

                <div className="rounded-2xl bg-red-50/70 p-3">
                  <p className="text-label font-extrabold text-[var(--app-color-text-primary)]">
                    {users.find(user => user.id === selectedLearnerId)?.fullName || "Chưa chọn học viên"}
                  </p>
                  <p className="text-caption font-semibold text-[var(--app-color-text-muted)]">
                    PEQI: {selectedLearnerPeqi ? `${selectedLearnerPeqi.score}/100 • ${selectedLearnerPeqi.level}` : "Chưa có dữ liệu"}
                  </p>
                  {selectedLearnerPeqi?.riskFlags?.length ? (
                    <p className="mt-1 text-caption font-bold text-amber-800">Cờ rủi ro: {selectedLearnerPeqi.riskFlags.join(", ")}</p>
                  ) : null}
                  {selectedLearnerPeqi?.recommendation && (
                    <p className="mt-1 text-caption font-semibold leading-relaxed text-[var(--app-color-text-secondary)]">
                      {selectedLearnerPeqi.recommendation}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    ["Phiên học", selectedLearnerSummary.activeToday],
                    ["Bài hoàn thành", selectedLearnerSummary.completedTopics],
                    ["Bài ôn", selectedLearnerSummary.quizSubmissions]
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-2xl bg-[var(--app-color-surface-soft)] p-2 text-center">
                      <p className="text-base font-extrabold text-[var(--app-color-text-primary)]">{analyticsMetric(value)}</p>
                      <p className="text-caption font-bold text-[var(--app-color-text-muted)]">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pixel-surface space-y-3 p-4">
                <h4 className="text-caption font-extrabold uppercase tracking-wider text-[var(--app-color-text-muted)]">Dòng thời gian hoạt động gần đây</h4>
                {analyticsEvents.length > 0 ? (
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {analyticsEvents.slice(0, 20).map(event => (
                      <div key={event.eventId} className="rounded-xl bg-[var(--app-color-surface-soft)] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-extrabold text-[var(--app-color-text-primary)]">{event.fullName || event.username || event.userId}</span>
                          <span className="text-caption font-mono font-bold text-[var(--app-color-text-muted)]">
                            {event.createdAt ? new Date(event.createdAt).toLocaleString("vi-VN") : ""}
                          </span>
                        </div>
                        <p className="mt-1 text-caption font-bold text-[var(--app-color-brand-primary)]">{event.eventType}</p>
                        <p className="text-caption font-semibold text-[var(--app-color-text-muted)] truncate">
                          {event.resourceTitle || event.resourceType || "Hoạt động học tập"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl bg-[var(--app-color-surface-soft)] p-3 text-caption font-semibold text-[var(--app-color-text-muted)]">
                    Chưa có hoạt động được ghi nhận trong khoảng thời gian này.
                  </p>
                )}
              </div>
            </>
          )}

          {isStaticLegacyMode && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="pixel-surface p-3 text-center">
                  <span className="text-lg font-extrabold text-[var(--app-color-brand-primary)]">{users.length}</span>
                  <p className="text-caption font-extrabold uppercase tracking-wider text-[var(--app-color-text-muted)]">Tài khoản</p>
                </div>
                <div className="pixel-surface p-3 text-center">
                  <span className="text-lg font-extrabold text-green-700">{activeUsers.length}</span>
                  <p className="text-caption font-extrabold uppercase tracking-wider text-[var(--app-color-text-muted)]">Hoạt động</p>
                </div>
                <div className="pixel-surface p-3 text-center">
                  <span className="text-lg font-extrabold text-amber-700">{pendingUsers.length}</span>
                  <p className="text-caption font-extrabold uppercase tracking-wider text-[var(--app-color-text-muted)]">Chờ duyệt</p>
                </div>
              </div>

              <div className="pixel-surface space-y-3 p-4">
                <h4 className="text-caption font-extrabold uppercase tracking-wider text-[var(--app-color-text-muted)]">
                  Đơn vị ghi nhận trong danh sách tài khoản
                </h4>
                {accountUnitStats.length > 0 ? (
                  <div className="space-y-2">
                    {accountUnitStats.map(unit => (
                      <div key={unit.name} className="flex min-h-11 items-center justify-between rounded-xl bg-[var(--app-color-surface-soft)] px-3">
                        <span className="font-bold text-[var(--app-color-text-primary)]">{unit.name}</span>
                        <span className="text-caption font-extrabold text-[var(--app-color-text-secondary)]">{unit.count} tài khoản</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-3 text-center text-caption text-[var(--app-color-text-muted)]">
                    Hiện chưa có thông tin đơn vị trong danh sách tài khoản.
                  </p>
                )}
              </div>

              <div className="pixel-surface space-y-2 p-4">
                <h4 className="text-caption font-extrabold uppercase tracking-wider text-[var(--app-color-text-muted)]">
                  Phạm vi dữ liệu phân tích
                </h4>
                {[
                  ["Tiến độ học tập", "Hệ thống hiện chưa ghi nhận tiến độ tổng hợp cho quản trị."],
                  ["Kết quả kiểm tra", "Hệ thống hiện chưa cung cấp danh sách kết quả tổng hợp cho quản trị."],
                  ["Bảng xếp hạng", "Hệ thống hiện chưa cung cấp bảng xếp hạng tổng hợp trong khu vực quản trị."],
                  ["Lượt đọc tin", "Hiện chưa có bản ghi lượt đọc tin theo tài khoản."],
                  ["Hoạt động AI", "Hiện chưa có bản ghi sử dụng AI theo tài khoản."]
                ].map(([title, description]) => (
                  <div key={title} className="rounded-xl bg-[var(--app-color-surface-soft)] p-3">
                    <p className="font-extrabold text-[var(--app-color-text-primary)]">{title}</p>
                    <p className="mt-0.5 text-caption leading-relaxed text-[var(--app-color-text-muted)]">{description}</p>
                  </div>
                ))}
              </div>
            </>
          )}
          
          {!isStaticLegacyMode && (
            <>
              {/* Quick Metrics grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white border border-[var(--app-color-divider)] rounded-2xl p-3 text-center app-shadow-low">
                  <span className="text-lg font-extrabold text-green-700">84%</span>
                  <p className="text-caption text-[var(--app-color-text-muted)] uppercase font-extrabold tracking-wider mt-0.5">Học tập</p>
                </div>
                <div className="bg-white border border-[var(--app-color-divider)] rounded-2xl p-3 text-center app-shadow-low">
                  <span className="text-lg font-extrabold text-blue-800">{users.filter(u => u.role === "member").length}</span>
                  <p className="text-caption text-[var(--app-color-text-muted)] uppercase font-extrabold tracking-wider mt-0.5">Chiến sĩ</p>
                </div>
                <div className="bg-white border border-[var(--app-color-divider)] rounded-2xl p-3 text-center app-shadow-low">
                  <span className="text-lg font-extrabold text-red-800">{exams.length}</span>
                  <p className="text-caption text-[var(--app-color-text-muted)] uppercase font-extrabold tracking-wider mt-0.5">Đợt thi</p>
                </div>
              </div>

              {/* Unit Stats progress bars */}
              <div className="pixel-surface space-y-3 p-4">
                <h4 className="text-caption font-extrabold text-[var(--app-color-text-muted)] uppercase tracking-wider border-b border-[var(--app-color-divider)] pb-2 flex items-center justify-between">
                  <span>Xếp hạng tiến độ hoàn thành phân đội</span>
                  <BarChart3 size={11} className="text-[var(--app-color-text-muted)]" />
                </h4>
                
                <div className="space-y-3">
                  {unitStats.map(stat => (
                    <div key={stat.id} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-[var(--app-color-text-primary)]">{stat.name}</span>
                        <span className="font-extrabold text-green-700">{stat.completionRate}%</span>
                      </div>

                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-600 rounded-full transition-all duration-300" style={{ width: `${stat.completionRate}%` }}></div>
                      </div>
                      
                      <div className="flex justify-between text-caption text-[var(--app-color-text-muted)] font-extrabold uppercase">
                        <span>Quân số: {stat.count} Đ/c</span>
                        <span className={stat.completionRate >= 80 ? "text-green-700" : "text-amber-600"}>
                          {stat.completionRate >= 80 ? "Đạt Vững Mạnh" : "Cần Huấn Luyện"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* AUDIT TRAIL LOG CARD */}
          <div className="pixel-surface space-y-3 p-4">
            <h4 className="text-caption font-extrabold text-[var(--app-color-text-muted)] uppercase tracking-wider border-b border-[var(--app-color-divider)] pb-2 flex items-center justify-between">
              <span>Nhật ký hoạt động huấn luyện hệ thống (Audit Log)</span>
              <BookOpen size={11} className="text-[var(--app-color-text-muted)]" />
            </h4>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {auditLogs.length > 0 ? (
                auditLogs.map((log: any, index: number) => (
                  <div key={log.id || log.ID || `audit_${index}`} className="p-2.5 bg-slate-50 border border-[var(--app-color-divider)] rounded-xl flex flex-col gap-0.5 leading-snug text-caption">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-[var(--app-color-text-secondary)]">{log.userName || log.user || log.username || log.actor || "Tài khoản hệ thống"}</span>
                      <span className="text-caption text-[var(--app-color-text-muted)] font-mono font-bold">
                        {log.createdAt || log.timestamp || log.ts
                          ? new Date(log.createdAt || log.timestamp || log.ts).toLocaleString("vi-VN")
                          : "Chưa ghi nhận thời gian"}
                      </span>
                    </div>
                    <p className="text-[var(--app-color-text-secondary)] font-semibold mt-0.5">
                      Đã thực hiện: <span className="text-[var(--app-color-brand-primary)] font-extrabold">{log.action}</span>
                    </p>
                    <p className="text-caption text-[var(--app-color-text-muted)] font-medium truncate">
                      Mục tiêu: {log.target || log.entityId || log.resource || log.details || "Chưa có thông tin"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-caption text-[var(--app-color-text-muted)] py-4">
                  Hiện chưa có hoạt động quản trị được ghi nhận.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
