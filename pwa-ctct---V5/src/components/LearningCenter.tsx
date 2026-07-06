import React, { useState } from "react";
import { User, LearningTopic, LearningProgress, LearningStatus, TopicCategory, QuizAttempt } from "../types";
import { BookOpen, Search, CheckCircle, Clock, PlayCircle, FileText, ChevronRight, Bookmark, ArrowLeft, MessageSquare, Award, ExternalLink } from "lucide-react";
import { learningService, MaterialQuizQuestion } from "../services/learningService";
import { reviewService, ReviewPack } from "../services/reviewService";


interface LearningCenterProps {
  user: User;
  topics: LearningTopic[];
  progress: LearningProgress[];
  quizAttempts: QuizAttempt[];
  onUpdateProgress: (topicId: string, status: LearningStatus, percent: number) => void;
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
  onNavigate,
  activeTopicArg,
  onClearTopicArg
}: LearningCenterProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailTopic, setDetailTopic] = useState<LearningTopic | null>(activeTopicArg);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
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
    setBookmarkedIds(prev => 
      prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]
    );
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
    } catch (error) {
      setQuizError(error instanceof Error ? error.message : "Không tải được câu hỏi ôn tập.");
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
      <div className="space-y-4 relative" id="learning-topic-detail-view">
        {/* Sticky Header with Back Button */}
        <div className="sticky top-0 bg-slate-50/95 backdrop-blur-md flex items-center justify-between py-2 border-b border-slate-100 z-20">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-1.5 text-xs font-black text-emerald-800 hover:text-emerald-950 transition cursor-pointer min-h-[32px]"
          >
            <ArrowLeft size={16} />
            <span>DANH SÁCH BÀI HỌC</span>
          </button>
          
          <button
            onClick={() => toggleBookmark(detailTopic.id)}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              bookmarkedIds.includes(detailTopic.id)
                ? "bg-amber-50 text-amber-500 border-amber-200"
                : "bg-white text-slate-400 border-slate-200 hover:text-slate-600"
            }`}
            title="Lưu trữ học tập"
          >
            <Bookmark size={14} className={bookmarkedIds.includes(detailTopic.id) ? "fill-current" : ""} />
          </button>
        </div>

        {/* Visual Topic Banner */}
        <div className="bg-gradient-to-tr from-emerald-900 to-emerald-800 rounded-2xl p-5 text-white relative overflow-hidden shadow-sm">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-3">
            <BookOpen size={120} />
          </div>
          <span className="px-2 py-0.5 bg-yellow-400 text-slate-950 font-black rounded text-[9px] uppercase tracking-wide">
            {detailTopic.category}
          </span>
          <h1 className="text-sm font-black text-white mt-2 leading-snug">
            {detailTopic.title}
          </h1>
          <p className="text-[10px] text-emerald-100 mt-1.5 leading-relaxed">
            {detailTopic.description}
          </p>
        </div>

        {detailLoading && (
          <div className="bg-white border border-slate-100 rounded-2xl p-3 text-[11px] font-bold text-slate-500">
            Đang tải tài liệu, mục nội dung và câu hỏi ôn tập từ Hoctap...
          </div>
        )}

        {/* Lesson metadata metrics */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 grid grid-cols-2 gap-3.5 text-[11px] shadow-sm">
          <div>
            <p className="text-slate-400 font-bold">Thời gian tự học</p>
            <p className="font-extrabold text-slate-800 flex items-center gap-1 mt-0.5">
              <Clock size={12} className="text-slate-400" />
              <span>{detailTopic.estimatedMinutes} phút</span>
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-bold">Hình thức học</p>
            <p className="font-extrabold text-slate-800 mt-0.5">
              {detailTopic.required ? "Bắt buộc chính khóa" : "Tự học mở rộng"}
            </p>
          </div>
          <div>
            <p className="text-slate-400 font-bold">Cấp độ lý luận</p>
            <p className="font-extrabold text-slate-800 mt-0.5">{detailTopic.difficulty}</p>
          </div>
          <div>
            <p className="text-slate-400 font-bold">Tiến trình</p>
            <span className={`inline-block px-2 py-0.5 rounded-full font-black text-[9px] mt-0.5 ${
              status === LearningStatus.COMPLETED ? "bg-green-100 text-green-800" :
              status === LearningStatus.IN_PROGRESS ? "bg-blue-100 text-blue-800" :
              status === LearningStatus.NEED_REVIEW ? "bg-orange-100 text-orange-800" :
              "bg-slate-100 text-slate-600"
            }`}>
              {status === LearningStatus.COMPLETED ? "Đã hoàn thành" :
               status === LearningStatus.IN_PROGRESS ? `Đang học (${progressPercent}%)` :
               status === LearningStatus.NEED_REVIEW ? "Cần ôn tập lại" : "Chưa học"}
            </span>
          </div>
        </div>

        {/* Primary reading resource doc */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm space-y-4">
          <div className="flex items-center gap-1 text-emerald-800 font-extrabold text-xs border-b pb-2">
            <FileText size={14} />
            <span>TÀI LIỆU CHÍNH QUY (VĂN BẢN)</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] leading-relaxed text-slate-600 font-medium">
            <p className="font-extrabold text-emerald-950 uppercase tracking-wider mb-0.5">Mục tiêu học tập:</p>
            <p className="italic font-bold">"{detailTopic.objective}"</p>
          </div>

          {detailSummary && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[11px] leading-relaxed text-amber-950 font-medium">
              <p className="font-extrabold uppercase tracking-wider mb-1">Tóm tắt nhanh từ Hoctap AI</p>
              <p className="whitespace-pre-line">{detailSummary}</p>
            </div>
          )}

          <div className="prose prose-sm max-w-none text-xs leading-relaxed text-slate-700 whitespace-pre-line space-y-3" id="document-content-text">
            {detailTopic.content}
          </div>

          {detailSections.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Mục nội dung từ tài liệu</h4>
              {detailSections.map((section, index) => (
                <div key={section.id || index} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700">
                  <p className="font-black text-slate-800">{section.title || `Mục ${index + 1}`}</p>
                  {section.content && <p className="mt-1 whitespace-pre-line leading-relaxed">{section.content}</p>}
                </div>
              ))}
            </div>
          )}

          {detailTopic.pdfUrl && (
            <div className="mt-4 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
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
            <div className="mt-4 pt-4 border-t border-slate-100">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tài liệu tham khảo đối chiếu:</h4>
              <ul className="space-y-1">
                {detailTopic.references.map((ref, idx) => (
                  <li key={idx} className="text-[10px] text-slate-500 flex items-start gap-1.5">
                    <ExternalLink size={10} className="text-slate-400 mt-0.5 shrink-0" />
                    <span>{ref}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {detailHasQuiz && (
          <div className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm space-y-3" id="material-quiz-panel">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1 text-emerald-800 font-extrabold text-xs">
                <Award size={14} />
                <span>Câu hỏi ôn tập theo tài liệu</span>
              </div>
              <button
                type="button"
                onClick={startMaterialQuiz}
                disabled={quizLoading}
                className="py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-[10px] rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <PlayCircle size={13} />
                <span>{quizLoading ? "Đang tải..." : quizQuestions.length ? "Tải lại" : "Bắt đầu ôn tập"}</span>
              </button>
            </div>

            {quizError && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 font-bold">{quizError}</div>}

            {quizQuestions.length > 0 && (
              <div className="space-y-3">
                {quizQuestions.map((question, index) => (
                  <div key={question.id} className="p-3 rounded-2xl border border-slate-100 bg-slate-50 space-y-2 text-xs">
                    <p className="font-black text-slate-800">Câu {index + 1}. {question.question}</p>
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
                              selected ? "bg-blue-50 border-blue-300 text-blue-950" : "bg-white border-slate-200 text-slate-700"
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
                      <div className="text-[11px] text-slate-600">
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
                    className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs rounded-xl"
                  >
                    Nộp bài ôn tập
                  </button>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-3 text-center text-green-900 text-xs font-bold">
                    Kết quả: {quizScore}/10. Dữ liệu xem lại đã được lưu cục bộ cho tài liệu này.
                    <button type="button" onClick={() => onNavigate("ranking", lastLearningReview)} className="mt-2 w-full py-2 bg-white border border-green-200 rounded-xl text-green-900 font-black">
                      Xem lại & Giải thích
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bottom Interactive Learning Panel */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 uppercase">Cập nhật tiến độ của đồng chí</p>
            <p className="text-xs text-slate-500">Sau khi đã nghiên cứu kỹ tài liệu bài đọc, hãy đánh dấu hoàn thành hoặc thi thử sức.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate("aitutor", detailTopic)}
              className="py-2 px-4 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition border border-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare size={14} className="text-emerald-700" />
              <span>Hỏi Trợ lý AI về bài này</span>
            </button>

            {detailHasQuiz && (
              <button
                onClick={startMaterialQuiz}
                className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Award size={14} />
                <span>Làm bài ôn tập tài liệu</span>
              </button>
            )}

            {status !== LearningStatus.COMPLETED && (
              <button
                onClick={() => handleCompleteTopic(detailTopic)}
                className="py-2 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle size={14} />
                <span>Đánh dấu hoàn thành bài</span>
              </button>
            )}
          </div>
        </div>

        {/* MD3-style Quiz Requirement Warning Overlay Modal */}
        {showQuizWarning && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="quiz-requirement-modal">
            <div className="bg-white rounded-[28px] p-6 max-w-xs w-full shadow-2xl border border-slate-100 space-y-4 text-center">
              <div className="mx-auto w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
                <Award size={24} className="animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-slate-800 text-xs uppercase">Yêu cầu trắc nghiệm</h3>
                <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                  Đồng chí chưa hoàn tất hoặc chưa đạt yêu cầu của bài trắc nghiệm tự luyện Chuyên đề này. Vui lòng đạt điểm tối thiểu <strong className="text-amber-600">6/10</strong> để đủ điều kiện hoàn thành bài học.
                </p>
              </div>
              <div className="flex flex-col gap-1.5 pt-2">
                <button
                  onClick={() => {
                    setShowQuizWarning(false);
                    void startMaterialQuiz();
                  }}
                  className="w-full py-3 bg-emerald-800 text-white font-extrabold text-[10px] uppercase rounded-xl transition cursor-pointer hover:bg-emerald-950 active:scale-95 min-h-[44px]"
                >
                  Làm bài ôn tập ngay
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuizWarning(false)}
                  className="w-full py-2.5 bg-slate-100 text-slate-600 font-bold text-[10px] uppercase rounded-xl transition cursor-pointer hover:bg-slate-200 min-h-[38px]"
                >
                  Quay lại đọc tiếp
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5" id="learning-center-tab-content">
      {learningFallback && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-[11px] font-bold text-amber-900">
          Không tải được dữ liệu học tập trực tuyến, đang hiển thị dữ liệu dự phòng.
        </div>
      )}

      {/* Search and Category Filters */}
      <div className="bg-white border border-slate-100 rounded-[24px] p-4.5 shadow-sm space-y-4">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm chuyên đề chính trị, pháp luật..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9.5 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition"
          />
        </div>

        {/* Category horizontal scroll */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block">Bộ lọc chuyên đề</label>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-2 px-2">
            {categoriesList.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-full whitespace-nowrap border shrink-0 transition cursor-pointer min-h-[32px] ${
                  selectedCategory === cat
                    ? "bg-emerald-800 text-white border-emerald-800 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {cat === "All" ? "Tất cả chuyên đề" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[11px]">
          <span className="text-slate-400 font-bold shrink-0">Trạng thái:</span>
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
                className={`px-3 py-1 rounded-full font-bold transition cursor-pointer shrink-0 min-h-[28px] ${
                  selectedStatus === st.id
                    ? "bg-slate-800 text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                }`}
              >
                {st.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid List of Topics - Styled as Duolingo Lesson Paths / Cards */}
      <div className="space-y-3" id="learning-topics-list-grid">
        {filteredTopics.length > 0 ? (
          filteredTopics.map(topic => {
            const prog = getTopicProgress(topic.id);
            const status = prog ? prog.status : LearningStatus.NOT_STARTED;
            const progressPercent = prog ? prog.progressPercent : 0;
            const isBookmarked = bookmarkedIds.includes(topic.id);

            return (
              <div
                key={topic.id}
                onClick={() => handleStartTopic(topic)}
                className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-300 hover:shadow-md transition duration-200 group relative cursor-pointer active:scale-98"
              >
                {/* Bookmarking trigger */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBookmark(topic.id);
                  }}
                  className="absolute top-4 right-4 text-slate-300 hover:text-amber-500 transition z-10 p-1 rounded-full hover:bg-slate-50"
                >
                  <Bookmark size={15} className={isBookmarked ? "fill-amber-400 text-amber-500" : ""} />
                </button>

                {/* Card Main Info */}
                <div className="space-y-2 pr-6">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 text-[8px] font-black rounded uppercase tracking-wide">
                      {topic.category}
                    </span>
                    {topic.required && (
                      <span className="px-1.5 py-0.5 bg-red-50 text-red-700 text-[8px] font-black rounded border border-red-100 uppercase tracking-wide">
                        Bắt buộc
                      </span>
                    )}
                  </div>

                  <h3 className="text-xs font-bold text-slate-800 group-hover:text-emerald-800 transition line-clamp-2 leading-snug">
                    {topic.title}
                  </h3>

                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                    {topic.description}
                  </p>
                </div>

                {/* Card Bottom Progress and Action Trigger */}
                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between gap-4">
                  
                  {/* Visual Progress percentage slider */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-extrabold text-slate-400">
                      <span className="flex items-center gap-0.5 uppercase">
                        <Clock size={10} />
                        <span>{topic.estimatedMinutes} phút</span>
                      </span>
                      <span className={
                        status === LearningStatus.COMPLETED ? "text-green-700 font-black" :
                        status === LearningStatus.IN_PROGRESS ? "text-blue-700 font-black" :
                        status === LearningStatus.NEED_REVIEW ? "text-orange-700 font-black" :
                        "text-slate-400"
                      }>
                        {status === LearningStatus.COMPLETED ? "Hoàn thành" :
                         status === LearningStatus.IN_PROGRESS ? `${progressPercent}%` :
                         status === LearningStatus.NEED_REVIEW ? "Cần ôn tập" : "Chưa học"}
                      </span>
                    </div>

                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          status === LearningStatus.COMPLETED ? "bg-green-600" :
                          status === LearningStatus.IN_PROGRESS ? "bg-blue-600" :
                          status === LearningStatus.NEED_REVIEW ? "bg-orange-600" :
                          "bg-slate-200"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="p-1.5 bg-slate-50 group-hover:bg-emerald-800 rounded-xl text-slate-500 group-hover:text-white transition shadow-sm border border-slate-100">
                    <ChevronRight size={16} />
                  </div>

                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2 bg-white rounded-[24px] border border-dashed border-slate-200" id="learning-empty-state">
            <BookOpen size={32} className="text-slate-300" />
            <p className="text-xs font-bold text-slate-700">Không tìm thấy bài học nào</p>
            <p className="text-[10px] max-w-xs text-slate-400 px-4">Hãy đổi từ khóa hoặc bộ lọc của đồng chí.</p>
          </div>
        )}
      </div>
    </div>
  );
}
