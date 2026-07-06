import React, { useState } from "react";
import { User, UserRole, LearningTopic, LearningProgress, Question, Exam, AccountStatus, TopicCategory, LearningStatus, Unit } from "../types";
import { Award, CheckCircle, XCircle, AlertTriangle, Users, BookOpen, FileText, BarChart3, Plus, Trash2, ArrowLeft, ShieldAlert, Calendar, UserPlus, Clock, ToggleLeft, ToggleRight, Archive, Check, Send } from "lucide-react";
import { isLegacyAppsScriptAuthMode } from "../services/authService";

interface AdminPanelProps {
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
  auditLogs = []
}: AdminPanelProps) {
  const isStaticLegacyMode = isLegacyAppsScriptAuthMode();
  const [adminTab, setAdminTab] = useState<"users" | "topics" | "exams" | "reports">("users");
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.MEMBER);
  const [newUserUnitId, setNewUserUnitId] = useState(units[0]?.id || "");

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

  // Split users for approval flow
  const pendingUsers = users.filter(u => u.accountStatus === "pending");
  const approvedUsers = users.filter(u => u.accountStatus !== "pending");

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
    const temporaryPassword = window.prompt(`Nhập mật khẩu tạm thời mới cho ${user.fullName}:`);
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

  return (
    <div className="space-y-4 text-xs font-sans" id="admin-panel-container">
      
      {/* SECTION HEADER BAR */}
      <div className="bg-white border border-slate-100 rounded-[24px] p-4.5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
            <ShieldAlert size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-tight">Khu vực quản trị</h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase truncate">CÁN BỘ CHÍNH TRỊ: {currentUser.fullName}</p>
          </div>
        </div>

        {isStaticLegacyMode && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-900 leading-relaxed">
            Chế độ Netlify static: chỉ hỗ trợ quản trị tài khoản qua Apps Script. Các chức năng tạo nội dung/đề thi nâng cao đang bị khóa.
          </div>
        )}

        {/* Dynamic Admin Sub-tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-[9px] font-black uppercase tracking-wider text-center">
          <button
            onClick={() => setAdminTab("users")}
            className={`flex-1 py-2 rounded-lg cursor-pointer transition ${
              adminTab === "users" ? "bg-white text-emerald-900 shadow-sm" : "text-slate-400"
            }`}
          >
            Quân số
          </button>
          
          <button
            type="button"
            disabled={isStaticLegacyMode}
            onClick={() => !isStaticLegacyMode && setAdminTab("topics")}
            title={isStaticLegacyMode ? "Không được Apps Script Auth API hỗ trợ trong chế độ Netlify static" : undefined}
            className={`flex-1 py-2 rounded-lg cursor-pointer transition ${
              adminTab === "topics" ? "bg-white text-emerald-900 shadow-sm" : "text-slate-400"
            } ${isStaticLegacyMode ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Giáo án
          </button>

          <button
            type="button"
            disabled={isStaticLegacyMode}
            onClick={() => !isStaticLegacyMode && setAdminTab("exams")}
            title={isStaticLegacyMode ? "Không được Apps Script Auth API hỗ trợ trong chế độ Netlify static" : undefined}
            className={`flex-1 py-2 rounded-lg cursor-pointer transition ${
              adminTab === "exams" ? "bg-white text-emerald-900 shadow-sm" : "text-slate-400"
            } ${isStaticLegacyMode ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Kỳ thi
          </button>

          <button
            onClick={() => setAdminTab("reports")}
            className={`flex-1 py-2 rounded-lg cursor-pointer transition ${
              adminTab === "reports" ? "bg-white text-emerald-900 shadow-sm" : "text-slate-400"
            }`}
          >
            {isStaticLegacyMode ? "Nhật ký" : "Báo cáo"}
          </button>
        </div>
      </div>

      {/* 1. USERS LIST & APPROVAL PANEL */}
      {adminTab === "users" && (
        <div className="space-y-4 animate-fade-in" id="admin-users-subpanel">
          {currentUser.role === UserRole.ADMIN && !isStaticLegacyMode && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Quản lý tài khoản</h3>
                <button
                  type="button"
                  onClick={() => setShowAddUserForm(value => !value)}
                  className="py-1.5 px-3 bg-emerald-800 text-white font-bold text-[10px] rounded-lg flex items-center gap-1"
                >
                  <UserPlus size={12} />
                  {showAddUserForm ? "Đóng" : "Tạo tài khoản"}
                </button>
              </div>
              {showAddUserForm && (
                <form onSubmit={handleCreateUserSubmit} className="p-4 bg-white border border-slate-100 rounded-[20px] space-y-2.5 text-xs">
                  <input value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Họ và tên" className="w-full px-3 py-2 border border-slate-200 rounded-lg" required />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="Email" className="min-w-0 px-3 py-2 border border-slate-200 rounded-lg" required />
                    <input value={newUserPhone} onChange={e => setNewUserPhone(e.target.value)} placeholder="Số điện thoại" className="min-w-0 px-3 py-2 border border-slate-200 rounded-lg" />
                  </div>
                  <input type="password" minLength={8} value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} placeholder="Mật khẩu tạm thời" className="w-full px-3 py-2 border border-slate-200 rounded-lg" required />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as UserRole)} className="min-w-0 px-2 py-2 border border-slate-200 rounded-lg">
                      <option value={UserRole.MEMBER}>Học viên</option>
                      <option value={UserRole.INSTRUCTOR}>Giảng viên</option>
                      <option value={UserRole.POLITICAL_OFFICER}>Chính trị viên</option>
                      <option value={UserRole.ADMIN}>Quản trị viên</option>
                    </select>
                    <select value={newUserUnitId} onChange={e => setNewUserUnitId(e.target.value)} className="min-w-0 px-2 py-2 border border-slate-200 rounded-lg" required>
                      {units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="w-full py-2 bg-emerald-800 text-white font-bold rounded-lg">Tạo tài khoản và yêu cầu đổi mật khẩu</button>
                </form>
              )}
            </div>
          )}
          
          {/* A. Pending requests */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 pl-1 flex items-center gap-1">
              <span>Yêu cầu chờ phê duyệt</span>
              <span className="px-1.5 py-0.5 rounded-full text-[8px] bg-amber-500 text-white font-black animate-pulse">
                {pendingUsers.length}
              </span>
            </h3>

            {pendingUsers.length > 0 ? (
              pendingUsers.map(u => {
                const unitName = units.find(un => un.id === u.unitId)?.name || "Chưa xác định";
                return (
                  <div key={u.id} className="p-4 bg-amber-50/60 border border-amber-100 rounded-[24px] flex flex-col gap-3 text-xs shadow-sm">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-800 text-[13px]">{u.fullName}</span>
                        <span className="px-2 py-0.5 rounded-full font-black text-[8px] uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-200">
                          Chờ duyệt
                        </span>
                      </div>
                      <p className="text-slate-500 font-semibold text-[10px]">Đơn vị đăng ký: {unitName}</p>
                      <p className="text-[9px] text-slate-400 font-mono">Email: {u.email} • SĐT: {u.phone}</p>
                    </div>

                    {currentUser.role === UserRole.ADMIN && <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => onUpdateUserStatus(u.id, AccountStatus.ACTIVE)}
                        className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-[10px] uppercase rounded-xl transition flex items-center justify-center gap-1 cursor-pointer min-h-[38px]"
                      >
                        <CheckCircle size={12} />
                        <span>Duyệt nhập ngũ</span>
                      </button>
                      <button
                        onClick={() => onUpdateUserStatus(u.id, AccountStatus.REJECTED)}
                        className="flex-1 py-2.5 bg-white hover:bg-red-50 text-red-700 font-black text-[10px] uppercase rounded-xl border border-red-200 transition flex items-center justify-center gap-1 cursor-pointer min-h-[38px]"
                      >
                        <XCircle size={12} />
                        <span>Từ chối</span>
                      </button>
                    </div>}
                  </div>
                );
              })
            ) : (
              <div className="p-4 bg-white border border-slate-100 rounded-[20px] text-center text-slate-400 py-6 font-semibold shadow-sm">
                Không có tài khoản mới nào đang chờ duyệt.
              </div>
            )}
          </div>

          {/* B. Approved military list */}
          <div className="space-y-2">
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 pl-1">
              Danh sách quân số chính thức ({approvedUsers.length} đ/c)
            </h3>

            <div className="space-y-2.5">
              {approvedUsers.map(u => {
                const unitName = units.find(un => un.id === u.unitId)?.name || "Chưa xác định";
                return (
                  <div key={u.id} className="p-4 bg-white border border-slate-100 rounded-[24px] flex flex-col gap-3 shadow-sm">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-800 text-[12px]">{u.fullName}</span>
                        <span className={`px-2 py-0.5 rounded-full font-black text-[8px] uppercase tracking-wide border ${
                          u.accountStatus === "active" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-800"
                        }`}>
                          {u.accountStatus === "active" ? "Kích hoạt" : "Bị khóa"}
                        </span>
                      </div>
                      <p className="text-slate-500 font-semibold text-[10px]">
                        Chức vụ: {u.role === "member" ? "Chiến sĩ" : "Cán bộ sĩ quan"} • {unitName}
                      </p>
                      <p className="text-[9px] text-slate-400 font-mono">{u.email}</p>
                    </div>

                    {currentUser.role === UserRole.ADMIN && u.id !== currentUser.id && (
                      <div className="pt-2 border-t border-slate-50 flex flex-wrap items-center gap-2 justify-end">
                        <select
                          value={u.role}
                          onChange={e => onChangeUserRole?.(u.id, e.target.value as UserRole)}
                          className="mr-auto px-2 py-1.5 border border-slate-200 rounded-lg text-[9px] font-bold bg-white"
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
                            className="py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[9px] uppercase rounded-lg border border-amber-100"
                          >
                            Đặt lại mật khẩu
                          </button>
                        )}
                        {u.accountStatus === "active" ? (
                          <button
                            onClick={() => onUpdateUserStatus(u.id, AccountStatus.SUSPENDED)}
                            className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[9px] uppercase rounded-lg transition border border-red-100 cursor-pointer"
                          >
                            Tạm khóa tài khoản
                          </button>
                        ) : (
                          <button
                            onClick={() => onUpdateUserStatus(u.id, AccountStatus.ACTIVE)}
                            className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase rounded-lg transition border border-emerald-100 cursor-pointer"
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
                <div className="p-4 bg-white border border-slate-100 rounded-[20px] text-center text-slate-400 py-6 font-semibold shadow-sm">
                  Apps Script chưa trả về tài khoản đã kích hoạt.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. TOPICS MANAGEMENT & ASSIGNMENT */}
      {adminTab === "topics" && !isStaticLegacyMode && (
        <div className="space-y-4 animate-fade-in" id="admin-topics-subpanel">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Giáo trình & Biên soạn chuyên đề</h3>
            <button
              onClick={() => setShowAddTopicForm(!showAddTopicForm)}
              className="py-1.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-[10px] rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              <Plus size={12} />
              <span>{showAddTopicForm ? "Đóng" : "Soạn chuyên đề mới"}</span>
            </button>
          </div>

          {/* Add topic form overlay */}
          {showAddTopicForm && (
            <form onSubmit={handleCreateTopicSubmit} className="p-4 bg-white border border-slate-100 rounded-[24px] shadow-sm space-y-3.5 text-xs animate-fade-in">
              <h4 className="font-black text-slate-800 text-xs border-b pb-2">BIỂU MẪU BIÊN SOẠN BÀI GIẢNG CHÍNH QUY</h4>
              
              <div className="space-y-1">
                <label className="font-extrabold text-slate-400 uppercase text-[9px]">Tiêu đề chuyên đề</label>
                <input
                  type="text"
                  required
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  placeholder="Ví dụ: Lịch sử truyền thống Quân đội..."
                  className="w-full p-3 bg-slate-50 border border-transparent rounded-xl text-xs focus:ring-2 focus:ring-emerald-800 focus:outline-none font-semibold text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-400 uppercase text-[9px]">Phân loại học tập</label>
                <select
                  value={newTopicCategory}
                  onChange={(e) => setNewTopicCategory(e.target.value as TopicCategory)}
                  className="w-full p-3 bg-slate-50 border border-transparent rounded-xl text-xs focus:ring-2 focus:ring-emerald-800 focus:outline-none font-bold"
                >
                  {Object.values(TopicCategory).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-400 uppercase text-[9px]">Mô tả tóm tắt nội dung chính</label>
                <input
                  type="text"
                  required
                  value={newTopicDesc}
                  onChange={(e) => setNewTopicDesc(e.target.value)}
                  placeholder="Nêu rõ mục tiêu giáo dục..."
                  className="w-full p-3 bg-slate-50 border border-transparent rounded-xl text-xs focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-400 uppercase text-[9px]">Nội dung giáo trình lý luận (Markdown hỗ trợ)</label>
                <textarea
                  required
                  rows={6}
                  value={newTopicContent}
                  onChange={(e) => setNewTopicContent(e.target.value)}
                  placeholder="Nhập nội dung giảng dạy tuyên truyền..."
                  className="w-full p-3 bg-slate-50 border border-transparent rounded-xl text-xs focus:ring-2 focus:ring-emerald-800 font-mono leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-400 uppercase text-[9px]">Thời gian đọc (phút)</label>
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
                    className="w-4 h-4 text-emerald-800 border-slate-300 rounded cursor-pointer"
                  />
                  <label htmlFor="newTopicRequired" className="font-bold text-slate-600 cursor-pointer">Bắt buộc học</label>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setShowAddTopicForm(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-[10px] min-h-[40px] cursor-pointer"
                >
                  Hủy soạn thảo
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-800 text-white font-extrabold rounded-xl text-[10px] min-h-[40px] shadow-sm cursor-pointer"
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
                <div key={topic.id} className="p-4 bg-white border border-slate-100 rounded-[24px] text-xs flex flex-col gap-3 shadow-sm">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-black text-slate-800 leading-snug">{topic.title}</p>
                      <p className="text-[9px] text-slate-400 font-extrabold uppercase mt-0.5">
                        {topic.category} • {topic.estimatedMinutes} phút
                      </p>
                      {topic.deadline && (
                        <p className="text-[9px] text-red-600 font-bold flex items-center gap-1 mt-1">
                          <Calendar size={10} />
                          <span>Hạn chót hoàn thành: {new Date(topic.deadline).toLocaleDateString("vi-VN")}</span>
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded-full font-black text-[8px] uppercase tracking-wide border ${
                        topic.required ? "bg-red-50 border-red-200 text-red-700 animate-pulse" : "bg-slate-100 text-slate-500 border-transparent"
                      }`}>
                        {topic.required ? "Bắt buộc" : "Tự do"}
                      </span>
                      <span className="text-[8px] font-black uppercase text-slate-400 mt-1">
                        {assignedToAll ? "Tất cả chiến sĩ" : "Phân phối riêng"}
                      </span>
                    </div>
                  </div>

                  {/* Assignment distribution button */}
                  {onUpdateTopicAssignment && (
                    <div className="pt-2 border-t border-slate-50 flex justify-end">
                      <button
                        onClick={() => {
                          setActiveAssignTopic(topic);
                          setAssignDeadline(topic.deadline || "");
                          setAssignRequired(topic.required);
                        }}
                        className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-[9px] uppercase rounded-xl transition flex items-center gap-1 cursor-pointer"
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
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="topic-distribution-modal">
              <form onSubmit={handleAssignSubmit} className="bg-white rounded-[28px] p-5 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4 text-xs animate-scale-up">
                <div className="flex items-center gap-2 border-b pb-2">
                  <UserPlus size={16} className="text-emerald-800" />
                  <h4 className="font-black text-slate-800 uppercase tracking-tight">Cấu hình phân phối bài học</h4>
                </div>
                
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                  Thiết lập đơn vị huấn luyện và hạn định cụ thể cho bài học: <strong className="text-emerald-800">"{activeAssignTopic.title}"</strong>
                </p>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-400 uppercase text-[9px]">Giao cho đơn vị</label>
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
                  <label className="font-extrabold text-slate-400 uppercase text-[9px]">Chiến sĩ đích danh (Tùy chọn)</label>
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
                  <label className="font-extrabold text-slate-400 uppercase text-[9px]">Hạn chót hoàn thành học tập</label>
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
                    className="w-4 h-4 text-emerald-800 border-slate-300 rounded cursor-pointer"
                  />
                  <label htmlFor="assignRequired" className="font-bold text-slate-600 cursor-pointer">Bài học bắt buộc tích lũy</label>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setActiveAssignTopic(null)}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl uppercase tracking-wider text-[9px] min-h-[38px] cursor-pointer"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-800 text-white font-extrabold rounded-xl uppercase tracking-wider text-[9px] min-h-[38px] cursor-pointer"
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
        <div className="space-y-4 animate-fade-in" id="admin-exams-subpanel">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Thi cử & Khảo thí chính trị chính thức</h3>
            {onAddExam && (
              <button
                onClick={() => setShowAddExamForm(!showAddExamForm)}
                className="py-1.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-[10px] rounded-lg transition flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} />
                <span>{showAddExamForm ? "Đóng" : "Mở đợt thi mới"}</span>
              </button>
            )}
          </div>

          {/* Add Exam Form */}
          {showAddExamForm && (
            <form onSubmit={handleCreateExamSubmit} className="p-4 bg-white border border-slate-100 rounded-[24px] shadow-sm space-y-3.5 text-xs animate-fade-in">
              <h4 className="font-black text-slate-800 text-xs border-b pb-2">THIẾT LẬP KỲ THI CHÍNH QUY BAN CHỈ HUY</h4>
              
              <div className="space-y-1">
                <label className="font-extrabold text-slate-400 uppercase text-[9px]">Tên kỳ thi</label>
                <input
                  type="text"
                  required
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  placeholder="Ví dụ: Kiểm tra chuyên đề Tư tưởng Hồ Chí Minh năm 2026"
                  className="w-full p-3 bg-slate-50 border border-transparent rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-extrabold text-slate-400 uppercase text-[9px]">Mô tả quy chế phòng thi</label>
                <input
                  type="text"
                  required
                  value={newExamDesc}
                  onChange={(e) => setNewExamDesc(e.target.value)}
                  placeholder="Các yêu cầu về kỷ luật và chấm điểm..."
                  className="w-full p-3 bg-slate-50 border border-transparent rounded-xl text-xs focus:ring-2 focus:ring-emerald-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-400 uppercase text-[9px]">Thời gian làm bài (Phút)</label>
                  <input
                    type="number"
                    value={newExamDuration}
                    onChange={(e) => setNewExamDuration(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-transparent rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-extrabold text-slate-400 uppercase text-[9px]">Điểm sàn ĐẠT (Thang 10)</label>
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
                <label className="font-extrabold text-slate-400 uppercase text-[9px] block">Lựa chọn chuyên đề giáo dục kiểm tra</label>
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl max-h-36 overflow-y-auto border border-slate-100">
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
                        className="w-3.5 h-3.5 text-emerald-800 border-slate-300 rounded cursor-pointer"
                      />
                      <label htmlFor={`check-topic-${t.id}`} className="font-semibold text-slate-700 cursor-pointer select-none truncate">
                        {t.title}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setShowAddExamForm(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-[10px] min-h-[40px] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={newExamSelectedTopicIds.length === 0}
                  className={`flex-1 py-3 font-extrabold rounded-xl text-[10px] min-h-[40px] cursor-pointer text-white shadow-sm ${
                    newExamSelectedTopicIds.length === 0 ? "bg-slate-300 cursor-not-allowed" : "bg-emerald-800 hover:bg-emerald-950"
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
                <div key={exam.id} className="p-4 bg-white border border-slate-100 rounded-[24px] text-xs flex flex-col gap-3 shadow-sm">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-black text-slate-800 leading-snug">{exam.title}</p>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-1">{exam.description}</p>
                      <p className="text-[9px] text-slate-400 font-extrabold uppercase mt-1 flex items-center gap-1">
                        <Clock size={10} />
                        <span>{exam.durationMinutes} phút • Sàn đạt: {exam.passingScore}/10đ • {exam.questionCount} câu hỏi</span>
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-black text-[8px] uppercase tracking-wide border ${
                      lifeStatus === "published" && exam.status === "active" ? "bg-red-50 border-red-200 text-red-700" :
                      lifeStatus === "archived" || exam.status === "expired" ? "bg-slate-100 text-slate-500 border-transparent" : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}>
                      {lifeStatus === "published" && exam.status === "active" ? "ĐANG THI" :
                       lifeStatus === "archived" || exam.status === "expired" ? "LƯU TRỮ" : "NHÁP"}
                    </span>
                  </div>

                  {/* Lifecycle and evaluation controls */}
                  {onUpdateExam && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          id={`allow-review-${exam.id}`}
                          checked={exam.allowReview}
                          onChange={(e) => onUpdateExam(exam.id, { allowReview: e.target.checked })}
                          className="w-4 h-4 text-emerald-800 border-slate-300 rounded cursor-pointer"
                        />
                        <label htmlFor={`allow-review-${exam.id}`} className="font-bold text-slate-500 cursor-pointer text-[9px] uppercase tracking-wide">
                          Xem lại bài thi & đáp án
                        </label>
                      </div>

                      {lifeStatus === "published" && exam.status === "active" ? (
                        <button
                          onClick={() => onUpdateExam(exam.id, { lifecycleStatus: "archived", status: "expired" })}
                          className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[9px] uppercase rounded-lg transition flex items-center gap-1 cursor-pointer"
                        >
                          <Archive size={11} />
                          <span>Lưu trữ</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onUpdateExam(exam.id, { lifecycleStatus: "published", status: "active" })}
                          className="py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-black text-[9px] uppercase rounded-lg transition flex items-center gap-1 cursor-pointer"
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
        <div className="space-y-4 animate-fade-in" id="admin-reports-subpanel">
          
          {!isStaticLegacyMode && (
            <>
              {/* Quick Metrics grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white border border-slate-100 rounded-2xl p-3 text-center shadow-sm">
                  <span className="text-lg font-black text-green-700">84%</span>
                  <p className="text-[8px] text-slate-400 uppercase font-black tracking-wider mt-0.5">Học tập</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-3 text-center shadow-sm">
                  <span className="text-lg font-black text-blue-800">{users.filter(u => u.role === "member").length}</span>
                  <p className="text-[8px] text-slate-400 uppercase font-black tracking-wider mt-0.5">Chiến sĩ</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-3 text-center shadow-sm">
                  <span className="text-lg font-black text-red-800">{exams.length}</span>
                  <p className="text-[8px] text-slate-400 uppercase font-black tracking-wider mt-0.5">Đợt thi</p>
                </div>
              </div>

              {/* Unit Stats progress bars */}
              <div className="bg-white border border-slate-100 rounded-[24px] p-4.5 shadow-sm space-y-3">
                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-2 flex items-center justify-between">
                  <span>Xếp hạng tiến độ hoàn thành phân đội</span>
                  <BarChart3 size={11} className="text-slate-400" />
                </h4>
                
                <div className="space-y-3">
                  {unitStats.map(stat => (
                    <div key={stat.id} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800">{stat.name}</span>
                        <span className="font-black text-green-700">{stat.completionRate}%</span>
                      </div>

                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-600 rounded-full transition-all duration-300" style={{ width: `${stat.completionRate}%` }}></div>
                      </div>
                      
                      <div className="flex justify-between text-[8px] text-slate-400 font-extrabold uppercase">
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
          <div className="bg-white border border-slate-100 rounded-[24px] p-4.5 shadow-sm space-y-3">
            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-2 flex items-center justify-between">
              <span>Nhật ký hoạt động huấn luyện hệ thống (Audit Log)</span>
              <BookOpen size={11} className="text-slate-400" />
            </h4>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {auditLogs.length > 0 ? (
                auditLogs.map((log: any, index: number) => (
                  <div key={log.id || log.ID || `audit_${index}`} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex flex-col gap-0.5 leading-snug text-[10px]">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-slate-700">{log.userName || log.user || log.username || log.actor || "Tài khoản hệ thống"}</span>
                      <span className="text-[8px] text-slate-400 font-mono font-bold">
                        {log.createdAt || log.timestamp || log.ts
                          ? new Date(log.createdAt || log.timestamp || log.ts).toLocaleString("vi-VN")
                          : "Không có thời gian"}
                      </span>
                    </div>
                    <p className="text-slate-600 font-semibold mt-0.5">
                      Đã thực hiện: <span className="text-emerald-800 font-black">{log.action}</span>
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium truncate">
                      Mục tiêu: {log.target || log.entityId || log.resource || log.details || "Không có chi tiết"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-[10px] text-slate-400 py-4">
                  Apps Script chưa trả về bản ghi nhật ký quản trị.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
