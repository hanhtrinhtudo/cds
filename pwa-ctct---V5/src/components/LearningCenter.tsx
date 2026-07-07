import React, { useState } from "react";
import { User, LearningTopic, LearningProgress, LearningStatus, TopicCategory, QuizAttempt } from "../types";
import { BookOpen, Search, CheckCircle, Clock, PlayCircle, FileText, ChevronRight, Bookmark, ArrowLeft, MessageSquare, Award, ExternalLink } from "lucide-react";
import { learningService, MaterialQuizQuestion } from "../services/learningService";
import { reviewService, ReviewPack } from "../services/reviewService";
import { LearningCard } from "./product";
import { AppContainer, AppPage, AppStack } from "./layout";


interface LearningCenterProps {
  user: User;
  topics: LearningTopic[];
  progress: LearningProgress[];
  quizAttempts: QuizAttempt[];
  onUpdateProgress: (topicId: string, status: LearningStatus, percent: number) => void;
  onSaveQuizAttempt: (attempt: QuizAttempt) => void;
  onSaveReview: (review: ReviewPack) => void;
  bookmarkedIds: string[];
  onToggleBookmark: (topicId: string, active: boolean) => void;
  onNavigate: (tab: string, arg?: any) => void;
  activeTopicArg: LearningTopic | null;
  onClearTopicArg: () => void;
}

export default function LearningCenter({
  user,
  topics,
  progress,
  quizAttempts,
  onUpdateProgress,
  onSaveQuizAttempt,
  onSaveReview,
  bookmarkedIds,
  onToggleBookmark,
  onNavigate,
  activeTopicArg,
  onClearTopicArg
}: LearningCenterProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailTopic, setDetailTopic] = useState<LearningTopic | null>(activeTopicArg);
  const [showQuizWarning, setShowQuizWarning] = useState(false);
  const [learningFallback, setLearningFallback] = useState(learningService.wasFallbackUsed());
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailSections, setDetailSections] = useState<any[]>([]);
  const [detailSummary, setDetailSummary] = useState("");
  const [detailHasQuiz, setDetailHasQuiz] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<MaterialQuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [quizError, setQuizError] = useState("");
  const [lastLearningReview, setLastLearningReview] = useState<ReviewPack | null>(null);

  // Sync prop changes for detail view (e.g. navigation from dashboard)
  React.useEffect(() => {
    if (activeTopicArg) {
      void openTopicDetail(activeTopicArg, false);
    }
  }, [activeTopicArg]);

  const toggleBookmark = (topicId: string) => {
    onToggleBookmark(topicId, !bookmarkedIds.includes(topicId));
  };

  const getTopicProgress = (topicId: string) => {
    return progress.find(p => p.userId === user.id && p.topicId === topicId);
  };

  const resetMaterialQuiz = () => {
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setQuizError("");
    setLastLearningReview(null);
  };

  const openTopicDetail = async (topic: LearningTopic, shouldStartProgress = true) => {
    const prog = getTopicProgress(topic.id);
    if (shouldStartProgress && (!prog || prog.status === LearningStatus.NOT_STARTED)) {
      onUpdateProgress(topic.id, LearningStatus.IN_PROGRESS, 10);
    }
    setDetailTopic(topic);
    setDetailLoading(true);
    setDetailSections([]);
    setDetailSummary("");
    setDetailHasQuiz(topic.tags?.some(tag => tag.toLocaleLowerCase("vi").includes("câu hỏi")) || false);
    setLearningFallback(learningService.wasFallbackUsed());
    resetMaterialQuiz();
    try {
      const detail = await learningService.getTopicById(topic.id);
      setDetailTopic(detail);
      setDetailSections(Array.isArray(detail.sections) ? detail.sections : []);
      const [hasQuizResult, summaryResult] = await Promise.allSettled([
        learningService.hasMaterialQuiz(topic.id),
        learningService.getMaterialSummary(topic.id)
      ]);
      setDetailHasQuiz(hasQuizResult.status === "fulfilled" ? hasQuizResult.value : false);
      setDetailSummary(summaryResult.status === "fulfilled" ? summaryResult.value : "");
      setLearningFallback(learningService.wasFallbackUsed());
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStartTopic = (topic: LearningTopic) => {
    void openTopicDetail(topic);
  };

  const handleCompleteTopic = (topic: LearningTopic) => {
    if (detailHasQuiz) {
      // Check if user has passed the quiz (score >= 6)
      const passedQuiz = quizAttempts.some(qa => qa.userId === user.id && qa.topicId === topic.id && qa.score >= 6);
      const passedMaterialQuiz = quizSubmitted && quizScore !== null && quizScore >= 6;
      if (!passedQuiz && !passedMaterialQuiz) {
        setShowQuizWarning(true);
        return;
      }
    }

    onUpdateProgress(topic.id, LearningStatus.COMPLETED, 100);
    // update current local state if in detail view
    if (detailTopic && detailTopic.id === topic.id) {
      // just let state sync via props
    }
  };

  const handleBackToList = () => {
    setDetailTopic(null);
    onClearTopicArg();
  };

  const startMaterialQuiz = async () => {
    if (!detailTopic) return;
    setQuizLoading(true);
    setQuizError("");
    setQuizSubmitted(false);
    setQuizScore(null);
    setQuizAnswers({});
    try {
      const questions = await learningService.getMaterialQuiz(detailTopic.id, 10);
      setQuizQuestions(questions);
      if (!questions.length) setQuizError("Chưa có câu hỏi ôn tập cho tài liệu này.");
    } catch {
      setQuizError("Không thể tải câu hỏi ôn tập. Vui lòng thử lại.");
      setQuizQuestions([]);
    } finally {
      setQuizLoading(false);
    }
  };

  const submitMaterialQuiz = () => {
    if (!detailTopic || !quizQuestions.length) return;
    const correct = quizQuestions.filter(question => quizAnswers[question.id] === question.answer).length;
    const score = Number(((correct / quizQuestions.length) * 10).toFixed(1));
    const wrong = quizQuestions.length - correct;
    const reviewPayload: ReviewPack = {
      sourceType: "learningQuiz",
      attemptId: `learning_quiz_${Date.now()}`,
      title: detailTopic.title,
      submittedAt: new Date().toISOString(),
      score,
      total: quizQuestions.length,
      correct,
      wrong,
      skip: 0,
      answers: quizQuestions.map((question, index) => {
        const chosenText = quizAnswers[question.id] || "";
        const chosen = question.options.findIndex(option => option === chosenText);
        const correctIndex = question.options.findIndex(option => option === question.answer);
        return {
        no: index + 1,
        qid: question.id,
        qtext: question.question,
        opts: question.options,
        chosen,
        chosenText,
        correctIndex,
        correctText: question.answer,
        ok: chosenText === question.answer,
        topic: question.topic || detailTopic.title,
        explain: question.explanation || ""
        };
      })
    };
    reviewService.saveReviewPack(reviewPayload);
    onSaveReview(reviewPayload);
    onSaveQuizAttempt({
      id: reviewPayload.attemptId,
      userId: user.id,
      quizType: "topic",
      topicId: detailTopic.id,
      startedAt: reviewPayload.submittedAt,
      submittedAt: reviewPayload.submittedAt,
      score,
      correctCount: correct,
      wrongCount: wrong,
      totalQuestions: quizQuestions.length,
      answers: Object.fromEntries(quizQuestions.map(question => {
        const selected = quizAnswers[question.id] || "";
        const index = question.options.findIndex(option => option === selected);
        return [question.id, index >= 0 ? [index] : []];
      })),
      status: "submitted"
    });
    setLastLearningReview(reviewPayload);
    setQuizScore(score);
    setQuizSubmitted(true);
  };

  // Filters logic
  const filteredTopics = topics.filter(t => {
    const prog = getTopicProgress(t.id);
    const status = prog ? prog.status : LearningStatus.NOT_STARTED;

    const matchesCategory = selectedCategory === "All" || t.category === selectedCategory;
    const matchesStatus = selectedStatus === "All" || 
      (selectedStatus === "not_started" && status === LearningStatus.NOT_STARTED) ||
      (selectedStatus === "in_progress" && status === LearningStatus.IN_PROGRESS) ||
      (selectedStatus === "completed" && status === LearningStatus.COMPLETED) ||
      (selectedStatus === "need_review" && status === LearningStatus.NEED_REVIEW);

    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesStatus && matchesSearch;
  });

  const categoriesList = ["All", ...Object.values(TopicCategory)];

  if (detailTopic) {
    const prog = getTopicProgress(detailTopic.id);
    const status = prog ? prog.status : LearningStatus.NOT_STARTED;
    const progressPercent = prog ? prog.progressPercent : 0;

    return (
      <AppPage variant="plain" id="learning-topic-detail-view">
        <AppContainer bleed>
          <AppStack gap="lg" className="relative">
        {/* Sticky Header with Back Button */}
        <div className="sticky top-0 bg-slate-50/95 backdrop-blur-md flex items-center justify-between py-2 border-b border-[var(--app-color-divider)] z-20">
          <button
            onClick={handleBackToList}
            className="flex min-h-11 items-center gap-1.5 text-xs font-extrabold text-[var(--app-color-brand-primary)] hover:text-[var(--app-color-brand-primary-dark)] transition cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>DANH SÁCH BÀI HỌC</span>
          </button>
          
          <button
            onClick={() => toggleBookmark(detailTopic.id)}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border transition cursor-pointer ${
              bookmarkedIds.includes(detailTopic.id)
                ? "bg-amber-50 text-amber-500 border-amber-200"
                : "bg-white text-[var(--app-color-text-muted)] border-[var(--app-color-border)] hover:text-[var(--app-color-text-secondary)]"
            }`}
            title="Lưu trữ học tập"
          >
            <Bookmark size={14} className={bookmarkedIds.includes(detailTopic.id) ? "fill-current" : ""} />
          </button>
        </div>

        {/* Visual Topic Banner */}
        <div className="relative overflow-hidden rounded-[var(--app-radius-card)] bg-gradient-to-tr from-[var(--app-color-brand-primary-dark)] to-[var(--app-color-brand-primary)] p-5 text-white app-shadow-low">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-3">
            <BookOpen size={120} />
          </div>
          <span className="px-2 py-0.5 bg-yellow-400 text-[var(--app-color-text-primary)] font-extrabold rounded text-caption uppercase tracking-wide">
            {detailTopic.category}
          </span>
          <h1 className="text-sm font-extrabold text-white mt-2 leading-snug">
            {detailTopic.title}
          </h1>
          <p className="text-caption text-yellow-100 mt-1.5 leading-relaxed">
            {detailTopic.description}
          </p>
        </div>

        {detailLoading && (
          <div className="bg-white border border-[var(--app-color-divider)] rounded-2xl p-3 text-body-s font-bold text-[var(--app-color-text-muted)]">
            Đang chuẩn bị tài liệu học tập...
          </div>
        )}

        {/* Lesson metadata metrics */}
        <div className="bg-white border border-[var(--app-color-divider)] rounded-2xl p-4 grid grid-cols-2 gap-3.5 text-body-s app-shadow-low">
          <div>
            <p className="text-[var(--app-color-text-muted)] font-bold">Thời gian tự học</p>
            <p className="font-extrabold text-[var(--app-color-text-primary)] flex items-center gap-1 mt-0.5">
              <Clock size={12} className="text-[var(--app-color-text-muted)]" />
              <span>{detailTopic.estimatedMinutes} phút</span>
            </p>
          </div>
          <div>
            <p className="text-[var(--app-color-text-muted)] font-bold">Hình thức học</p>
            <p className="font-extrabold text-[var(--app-color-text-primary)] mt-0.5">
              {detailTopic.required ? "Bắt buộc chính khóa" : "Tự học mở rộng"}
            </p>
          </div>
          <div>
            <p className="text-[var(--app-color-text-muted)] font-bold">Cấp độ lý luận</p>
            <p className="font-extrabold text-[var(--app-color-text-primary)] mt-0.5">{detailTopic.difficulty}</p>
          </div>
          <div>
            <p className="text-[var(--app-color-text-muted)] font-bold">Tiến trình</p>
            <span className={`inline-block px-2 py-0.5 rounded-full font-extrabold text-caption mt-0.5 ${
              status === LearningStatus.COMPLETED ? "bg-green-100 text-green-800" :
              status === LearningStatus.IN_PROGRESS ? "bg-blue-100 text-blue-800" :
              status === LearningStatus.NEED_REVIEW ? "bg-orange-100 text-orange-800" :
              "bg-slate-100 text-[var(--app-color-text-secondary)]"
            }`}>
              {status === LearningStatus.COMPLETED ? "Hoàn thành" :
               status === LearningStatus.IN_PROGRESS ? `Đang học (${progressPercent}%)` :
               status === LearningStatus.NEED_REVIEW ? "Cần ôn tập lại" : "Chưa học"}
            </span>
          </div>
        </div>

        {/* Primary reading resource doc */}
        <div className="pixel-surface space-y-4 p-4">
          <div className="flex items-center gap-1 text-[var(--app-color-brand-primary)] font-extrabold text-xs border-b pb-2">
            <FileText size={14} />
            <span>TÀI LIỆU CHÍNH QUY (VĂN BẢN)</span>
          </div>

          <div className="p-3 bg-slate-50 border border-[var(--app-color-divider)] rounded-xl text-body-s leading-relaxed text-[var(--app-color-text-secondary)] font-medium">
            <p className="font-extrabold text-[var(--app-color-brand-primary-dark)] uppercase tracking-wider mb-0.5">Mục tiêu học tập:</p>
            <p className="italic font-bold">"{detailTopic.objective}"</p>
          </div>

          {detailSummary && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-body-s leading-relaxed text-amber-950 font-medium">
              <p className="font-extrabold uppercase tracking-wider mb-1">Tóm tắt nội dung</p>
              <p className="whitespace-pre-line">{detailSummary}</p>
            </div>
          )}

          <div className="prose prose-sm max-w-none text-xs leading-relaxed text-[var(--app-color-text-secondary)] whitespace-pre-line space-y-3" id="document-content-text">
            {detailTopic.content}
          </div>

          {detailSections.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-caption font-extrabold uppercase tracking-wider text-[var(--app-color-text-muted)]">Mục nội dung từ tài liệu</h4>
              {detailSections.map((section, index) => (
                <div key={section.id || index} className="p-3 rounded-xl bg-slate-50 border border-[var(--app-color-divider)] text-body-s text-[var(--app-color-text-secondary)]">
                  <p className="font-extrabold text-[var(--app-color-text-primary)]">{section.title || `Mục ${index + 1}`}</p>
                  {section.content && <p className="mt-1 whitespace-pre-line leading-relaxed">{section.content}</p>}
                </div>
              ))}
            </div>
          )}

          {detailTopic.pdfUrl && (
            <div className="mt-4 rounded-2xl overflow-hidden border border-[var(--app-color-border)] bg-slate-50">
              <iframe
                title={detailTopic.title}
                src={detailTopic.pdfUrl}
                className="w-full min-h-[420px] bg-white"
                allow="autoplay"
              />
            </div>
          )}

          {/* References Section inside the same card */}
          {detailTopic.references && detailTopic.references.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--app-color-divider)]">
              <h4 className="text-caption font-bold text-[var(--app-color-text-muted)] uppercase tracking-wider mb-1.5">Tài liệu tham khảo đối chiếu:</h4>
              <ul className="space-y-1">
                {detailTopic.references.map((ref, idx) => (
                  <li key={idx} className="text-caption text-[var(--app-color-text-muted)] flex items-start gap-1.5">
                    <ExternalLink size={10} className="text-[var(--app-color-text-muted)] mt-0.5 shrink-0" />
                    <span>{ref}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {detailHasQuiz && (
          <div className="pixel-surface space-y-3 p-4" id="material-quiz-panel">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--app-color-divider)] pb-2">
              <div className="flex items-center gap-1 text-[var(--app-color-brand-primary)] font-extrabold text-xs">
                <Award size={14} />
                <span>Câu hỏi ôn tập theo tài liệu</span>
              </div>
              <button
                type="button"
                onClick={startMaterialQuiz}
                disabled={quizLoading}
                className="min-h-11 py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-caption rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <PlayCircle size={13} />
                <span>{quizLoading ? "Đang chuẩn bị câu hỏi..." : quizQuestions.length ? "Làm lại bài ôn tập" : "Bắt đầu ôn tập"}</span>
              </button>
            </div>

            {quizError && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-body-s text-amber-900 font-bold">{quizError}</div>}

            {quizQuestions.length > 0 && (
              <div className="space-y-3">
                {quizQuestions.map((question, index) => (
                  <div key={question.id} className="p-3 rounded-2xl border border-[var(--app-color-divider)] bg-slate-50 space-y-2 text-xs">
                    <p className="font-extrabold text-[var(--app-color-text-primary)]">Câu {index + 1}. {question.question}</p>
                    <div className="space-y-1.5">
                      {question.options.map(option => {
                        const selected = quizAnswers[question.id] === option;
                        const correctAfterSubmit = quizSubmitted && option === question.answer;
                        const wrongAfterSubmit = quizSubmitted && selected && option !== question.answer;
                        return (
                          <label
                            key={option}
                            className={`flex items-start gap-2 rounded-xl border p-2.5 cursor-pointer ${
                              correctAfterSubmit ? "bg-green-50 border-green-300 text-green-900" :
                              wrongAfterSubmit ? "bg-red-50 border-red-200 text-red-900" :
                              selected ? "bg-blue-50 border-blue-300 text-blue-950" : "bg-white border-[var(--app-color-border)] text-[var(--app-color-text-secondary)]"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`material-quiz-${question.id}`}
                              checked={selected}
                              disabled={quizSubmitted}
                              onChange={() => setQuizAnswers(previous => ({ ...previous, [question.id]: option }))}
                              className="mt-0.5"
                            />
                            <span>{option}</span>
                          </label>
                        );
                      })}
                    </div>
                    {quizSubmitted && (
                      <div className="text-body-s text-[var(--app-color-text-secondary)]">
                        <p className="font-bold">Đáp án đúng: {question.answer}</p>
                        {question.explanation && <p className="mt-1">Giải thích: {question.explanation}</p>}
                      </div>
                    )}
                  </div>
                ))}

                {!quizSubmitted ? (
                  <button
                    type="button"
                    onClick={submitMaterialQuiz}
                    className="w-full py-3 bg-[var(--app-color-brand-primary)] hover:bg-[var(--app-color-brand-primary-dark)] text-white font-extrabold text-xs rounded-xl"
                  >
                    Nộp bài ôn tập
                  </button>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-center text-green-900 text-xs font-bold">
                    Kết quả: {quizScore}/10. Nội dung xem lại đã được lưu trên thiết bị này.
                    <button type="button" onClick={() => onNavigate("ranking", lastLearningReview)} className="mt-2 w-full py-2 bg-white border border-green-200 rounded-xl text-green-900 font-extrabold">
                      Xem lại và giải thích
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bottom Interactive Learning Panel */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-[var(--app-color-divider)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold text-[var(--app-color-text-muted)] uppercase">Cập nhật tiến độ của đồng chí</p>
            <p className="text-xs text-[var(--app-color-text-muted)]">Sau khi đã nghiên cứu kỹ tài liệu bài đọc, hãy đánh dấu hoàn thành hoặc thi thử sức.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate("aitutor", detailTopic)}
              className="min-h-11 py-2 px-4 bg-white hover:bg-slate-100 text-[var(--app-color-text-secondary)] font-bold text-xs rounded-xl transition border border-[var(--app-color-border)] flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare size={14} className="text-[var(--app-color-brand-primary)]" />
              <span>Trao đổi với AI Chính trị viên</span>
            </button>

            {detailHasQuiz && (
              <button
                onClick={startMaterialQuiz}
                className="min-h-11 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Award size={14} />
                <span>Làm bài ôn tập tài liệu</span>
              </button>
            )}

            {status !== LearningStatus.COMPLETED && (
              <button
                onClick={() => handleCompleteTopic(detailTopic)}
                className="min-h-11 py-2 px-4 bg-[var(--app-color-brand-primary)] hover:bg-[var(--app-color-brand-primary-dark)] text-white font-bold text-xs rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle size={14} />
                <span>Đánh dấu hoàn thành bài</span>
              </button>
            )}
          </div>
        </div>

        {/* MD3-style Quiz Requirement Warning Overlay Modal */}
        {showQuizWarning && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm motion-dialog-backdrop flex items-center justify-center p-4 z-50 motion-fade-in" id="quiz-requirement-modal">
            <div className="app-overlay w-full max-w-xs space-y-4 p-6 text-center">
              <div className="mx-auto w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                <Award size={24} className="motion-status-change" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-[var(--app-color-text-primary)] text-xs uppercase">Yêu cầu trắc nghiệm</h3>
                <p className="text-caption text-[var(--app-color-text-muted)] leading-relaxed font-semibold">
                  Đồng chí chưa hoàn tất hoặc chưa đạt yêu cầu của bài trắc nghiệm tự luyện Chuyên đề này. Vui lòng đạt điểm tối thiểu <strong className="text-amber-600">6/10</strong> để đủ điều kiện hoàn thành bài học.
                </p>
              </div>
              <div className="flex flex-col gap-1.5 pt-2">
                <button
                  onClick={() => {
                    setShowQuizWarning(false);
                    void startMaterialQuiz();
                  }}
                  className="w-full py-3 bg-[var(--app-color-brand-primary)] text-white font-extrabold text-caption uppercase rounded-xl transition cursor-pointer hover:bg-[var(--app-color-brand-primary-dark)] active:scale-95 min-h-[44px]"
                >
                  Làm bài ôn tập ngay
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuizWarning(false)}
                  className="w-full py-2.5 bg-slate-100 text-[var(--app-color-text-secondary)] font-bold text-caption uppercase rounded-xl transition cursor-pointer hover:bg-slate-200 min-h-11"
                >
                  Quay lại đọc tiếp
                </button>
              </div>
            </div>
          </div>
        )}
          </AppStack>
        </AppContainer>
      </AppPage>
    );
  }

  return (
    <AppPage variant="plain" id="learning-center-tab-content">
      <AppContainer bleed>
        <AppStack gap="xl">
      {learningFallback && (
        <div className="bg-amber-50 rounded-2xl p-2.5 text-body-s font-bold text-amber-900">
          Không thể cập nhật nội dung mới. Đang hiển thị nội dung đã lưu.
        </div>
      )}

      {/* Search and Category Filters */}
      <div className="pixel-surface space-y-3 p-3">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--app-color-text-muted)]">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm chuyên đề chính trị, pháp luật..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-11 pl-9.5 pr-4 py-2.5 text-xs bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-800 focus:bg-white transition"
          />
        </div>

        {/* Category horizontal scroll */}
        <div className="space-y-1.5">
          <label className="text-caption font-extrabold uppercase tracking-widest text-[var(--app-color-text-muted)] block">Bộ lọc chuyên đề</label>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-2 px-2">
            {categoriesList.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-body-s font-bold rounded-full whitespace-nowrap shrink-0 transition cursor-pointer min-h-11 ${
                  selectedCategory === cat
                    ? "bg-[var(--app-color-brand-primary)] text-white"
                    : "bg-slate-50 text-[var(--app-color-text-secondary)] hover:bg-slate-100"
                }`}
              >
                {cat === "All" ? "Tất cả chuyên đề" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 pt-1 text-body-s">
          <span className="text-[var(--app-color-text-muted)] font-bold shrink-0">Trạng thái:</span>
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            {[
              { id: "All", name: "Tất cả" },
              { id: "not_started", name: "Chưa học" },
              { id: "in_progress", name: "Đang học" },
              { id: "completed", name: "Đã học" },
              { id: "need_review", name: "Cần ôn tập" }
            ].map(st => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                className={`px-3 py-1 rounded-full font-bold transition cursor-pointer shrink-0 min-h-11 ${
                  selectedStatus === st.id
                    ? "bg-slate-800 text-white"
                    : "bg-slate-50 text-[var(--app-color-text-secondary)] hover:bg-slate-100"
                }`}
              >
                {st.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid List of Topics - Styled as Duolingo Lesson Paths / Cards */}
      <div className="space-y-2" id="learning-topics-list-grid">
        {filteredTopics.length > 0 ? (
          filteredTopics.map(topic => {
            const prog = getTopicProgress(topic.id);
            const status = prog ? prog.status : LearningStatus.NOT_STARTED;
            const progressPercent = prog ? prog.progressPercent : 0;
            const isBookmarked = bookmarkedIds.includes(topic.id);

            const actionLabel =
              status === LearningStatus.COMPLETED ? "Xem lại bài học" :
              status === LearningStatus.IN_PROGRESS ? "Tiếp tục học" :
              status === LearningStatus.NEED_REVIEW ? "Ôn lại bài" :
              "Mở bài học";

            return (
              <LearningCard
                key={topic.id}
                title={topic.title}
                description={topic.description}
                category={topic.category}
                required={topic.required}
                estimatedMinutes={topic.estimatedMinutes}
                progressPercent={progressPercent}
                hasQuiz={topic.tags?.some(tag => tag.toLocaleLowerCase("vi").includes("câu hỏi"))}
                pdfAvailable={Boolean(topic.pdfUrl)}
                actionLabel={actionLabel}
                onOpen={() => handleStartTopic(topic)}
                showBookmark
                bookmarked={isBookmarked}
                bookmarkAriaLabel={isBookmarked ? `Bỏ lưu ${topic.title}` : `Lưu ${topic.title}`}
                onToggleBookmark={() => toggleBookmark(topic.id)}
              />
            );
          })
        ) : (
          <div className="app-surface-soft flex flex-col items-center gap-2 py-8 text-center text-[var(--app-color-text-muted)]" id="learning-empty-state">
            <BookOpen size={32} className="text-[var(--app-color-text-muted)]" />
            <p className="text-xs font-bold text-[var(--app-color-text-secondary)]">Không tìm thấy bài học nào</p>
            <p className="text-caption max-w-xs text-[var(--app-color-text-muted)] px-4">Hãy đổi từ khóa hoặc bộ lọc của đồng chí.</p>
          </div>
        )}
      </div>
        </AppStack>
      </AppContainer>
    </AppPage>
  );
}
