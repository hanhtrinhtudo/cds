import React, { useEffect, useState } from "react";
import { User, Exam, ExamAttempt, Question, QuestionType } from "../types";
import { AlertTriangle, ArrowLeft, Award, CheckCircle, ClipboardList, FileText, Timer } from "lucide-react";
import {
  ExamAnswerPayload,
  ExamWithBank,
  examService,
  SubmitExamPayload,
  toUiQuestion
} from "../services/examService";
import { reviewService, ReviewPack } from "../services/reviewService";
import { Alert, Button, EmptyState } from "./ui";
import { ExamCard } from "./product";
import { AppContainer, AppPage, AppStack } from "./layout";

interface OfficialExamProps {
  user: User;
  userUnitName?: string;
  exams: Exam[];
  attempts: ExamAttempt[];
  allQuestions: Question[];
  onSaveExamAttempt: (attempt: ExamAttempt) => void;
  onSaveReview?: (review: ReviewPack) => void;
  activeExamArg: Exam | null;
  onClearExamArg: () => void;
  onNavigate: (tab: string, arg?: any) => void;
}

const targetLabel = (target: string) => {
  const normalized = target.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (["all", "canboqncn", "cbqncn", "canbo"].includes(normalized)) return "CB, QNCN";
  if (["sq", "siquan"].includes(normalized)) return "SQ";
  if (normalized === "qncn") return "QNCN";
  if (["dqtv", "danquantuve"].includes(normalized)) return "DQTV";
  return target.replace(/\s*\(\d+\s*câu\)\s*$/i, "");
};

export default function OfficialExam({
  user,
  userUnitName,
  exams,
  attempts,
  onSaveExamAttempt,
  onSaveReview,
  activeExamArg,
  onClearExamArg,
  onNavigate
}: OfficialExamProps) {
  const [examMode, setExamMode] = useState<"list" | "runner" | "result">("list");
  const [selectedExam, setSelectedExam] = useState<ExamWithBank | null>(activeExamArg as ExamWithBank | null);
  const [activeAttempt, setActiveAttempt] = useState<ExamAttempt | null>(null);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [runnerAnswers, setRunnerAnswers] = useState<Record<string, number[]>>({});
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [confirmSubmitModal, setConfirmSubmitModal] = useState(false);
  const [startingExamKey, setStartingExamKey] = useState<string | null>(null);
  const [fallback, setFallback] = useState(examService.wasFallbackUsed());
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<Record<string, string>>({});
  const [lastReviewPack, setLastReviewPack] = useState<ReviewPack | null>(null);
  const [availableExams, setAvailableExams] = useState<ExamWithBank[]>(exams as ExamWithBank[]);
  const [mockApiUnavailable, setMockApiUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([examService.getMockExams(), examService.getOfficialExams()])
      .then(([mockBanks, officialBanks]) => {
        if (!active) return;
        const byId = new Map((exams as ExamWithBank[]).map(exam => [exam.bankId, exam]));
        const resolved = [...mockBanks, ...officialBanks].map(bank => byId.get(bank.bankId) || ({
          id: bank.bankId,
          bankId: bank.bankId,
          title: bank.title,
          description: bank.mode === "mock" ? "Bài thi thử" : "Bài kiểm tra",
          topicIds: [],
          durationMinutes: Math.max(1, Math.ceil(bank.durationSec / 60)),
          questionCount: bank.totalOverride || bank.questionCount,
          startDate: bank.startAt || new Date(0).toISOString(),
          endDate: bank.endAt || new Date(8640000000000000).toISOString(),
          passingScore: 5,
          allowReview: true,
          status: bank.status === "open" ? "active" : bank.status === "closed" ? "expired" : "inactive",
          lifecycleStatus: bank.status === "open" ? "published" : "scheduled",
          createdBy: "legacy_apps_script",
          bankMode: bank.mode,
          bankStatus: bank.status,
          statusLabel: bank.statusLabel,
          startAtLocal: bank.startAtLocal,
          endAtLocal: bank.endAtLocal,
          durationSec: bank.durationSec,
          targets: bank.targets.map(item => typeof item === "string" ? { key: item, label: item } : item),
          folderId: bank.folderId,
          apiSource: bank.apiSource
        } as ExamWithBank));
        setAvailableExams(resolved);
        setMockApiUnavailable(examService.hasMockApiError());
      })
      .catch(() => active && setMockApiUnavailable(true));
    return () => { active = false; };
  }, [exams]);

  useEffect(() => {
    if (!activeExamArg) return;
    const exam = activeExamArg as ExamWithBank;
    const alreadyAttempted = attempts.find(attempt => attempt.userId === user.id && attempt.examId === exam.id);
    setSelectedExam(exam);
    if (alreadyAttempted) {
      setActiveAttempt(alreadyAttempted);
      setExamMode("result");
    } else {
      void handleStartExam(exam);
    }
  }, [activeExamArg]);

  useEffect(() => {
    if (examMode !== "runner" || timeLeft <= 0) {
      if (timeLeft === 0 && examMode === "runner" && activeAttempt) void handleSubmitExam(true);
      return;
    }
    const timer = window.setInterval(() => setTimeLeft(previous => previous - 1), 1000);
    return () => window.clearInterval(timer);
  }, [timeLeft, examMode]);

  const handleStartExam = async (exam: ExamWithBank) => {
    if (exam.bankStatus !== "open") return;
    const startKey = `${exam.apiSource}:${exam.bankId}`;
    setStartingExamKey(startKey);
    setSubmitError("");
    try {
      const target = selectedTargets[startKey] || selectedTargets[exam.bankId] || exam.targets?.[0]?.key;
      const response = exam.apiSource === "mock"
        ? await examService.getMockExamQuestions(exam.bankId, target)
        : await examService.getExamQuestions(exam.bankId, target);
      const questions = response.questions.map(question => toUiQuestion(question, response.bankId));
      setFallback(exam.apiSource === "official" && examService.wasFallbackUsed());
      setExamQuestions(questions);
      setRunnerAnswers({});
      setCurrentQIdx(0);
      setDurationSec(Number(response.durationSec || exam.durationSec || 1800));
      setTimeLeft(Number(response.durationSec || exam.durationSec || 1800));
      setSelectedExam(exam);
      setExamMode("runner");
      setActiveAttempt({
        id: `ea_${Date.now()}`,
        examId: exam.bankId,
        userId: user.id,
        startedAt: new Date().toISOString(),
        score: 0,
        correctCount: 0,
        wrongCount: 0,
        passed: false,
        status: "in_progress",
        answers: {}
      });
    } finally {
      setStartingExamKey(null);
    }
  };

  const handleOptionSelect = (questionId: string, optionIndex: number, type: QuestionType) => {
    setRunnerAnswers(previous => {
      const current = previous[questionId] || [];
      if (type !== QuestionType.MULTIPLE) return { ...previous, [questionId]: [optionIndex] };
      const next = current.includes(optionIndex) ? current.filter(index => index !== optionIndex) : [...current, optionIndex];
      return { ...previous, [questionId]: next };
    });
  };

  const buildAnswerDetail = (): ExamAnswerPayload[] => examQuestions.map((question, index) => {
    const chosen = runnerAnswers[question.id]?.[0] ?? -1;
    const correctIndex = question.correctAnswers[0] ?? -1;
    return {
      no: index + 1,
      qid: question.id,
      qtext: question.questionText,
      opts: question.options,
      chosen,
      chosenText: chosen >= 0 ? question.options[chosen] || "" : "",
      correctIndex,
      correctText: correctIndex >= 0 ? question.options[correctIndex] || "" : "",
      ok: chosen === correctIndex,
      topic: question.tags?.[0]
    };
  });

  const preserveReview = (payload: SubmitExamPayload, attemptId: string, score: number) => {
    const key = `ptkv_exam_review_${user.id}`;
    const record = { attemptId, bankId: payload.bankId, savedAt: new Date().toISOString(), answers: payload.answers, extra: payload.extra };
    try {
      const previous = JSON.parse(localStorage.getItem(key) || "[]");
      localStorage.setItem(key, JSON.stringify([record, ...(Array.isArray(previous) ? previous : [])].slice(0, 10)));
    } catch {
      localStorage.setItem(key, JSON.stringify([record]));
    }
    const reviewPack: ReviewPack = {
      sourceType: payload.extra?.mode === "mock" ? "mock" : "official",
      attemptId,
      title: String(payload.extra?.title || payload.bankId),
      submittedAt: new Date().toISOString(),
      score,
      total: payload.total,
      correct: payload.correct,
      wrong: payload.wrong,
      skip: payload.skip,
      answers: payload.answers.map(answer => ({
        ...answer,
        qid: answer.qid,
        explain: answer.topic ? `Chủ đề: ${answer.topic}` : ""
      }))
    };
    reviewService.saveReviewPack(reviewPack);
    onSaveReview?.(reviewPack);
    setLastReviewPack(reviewPack);
  };

  const handleSubmitExam = async (force = false) => {
    if (!selectedExam || !activeAttempt || examQuestions.length === 0) return;
    if (!force && !confirmSubmitModal) {
      setConfirmSubmitModal(true);
      return;
    }

    const detail = buildAnswerDetail();
    const correct = detail.filter(answer => answer.ok).length;
    const skip = detail.filter(answer => answer.chosen < 0).length;
    const wrong = detail.length - correct - skip;
    const spentSec = Math.max(0, durationSec - timeLeft);
    const payload: SubmitExamPayload = {
      action: "submit",
      bankId: selectedExam.bankId,
      userId: user.id,
      username: user.email,
      userName: user.fullName,
      userUnit: userUnitName || user.unitId,
      correct,
      wrong,
      skip,
      total: detail.length,
      spentSec,
      device: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
      userAgent: navigator.userAgent,
      answers: detail,
      extra: {
        mode: selectedExam.bankMode,
        apiSource: selectedExam.apiSource,
        title: selectedExam.title,
        target: selectedTargets[`${selectedExam.apiSource}:${selectedExam.bankId}`] || selectedTargets[selectedExam.bankId] || selectedExam.targets?.[0]?.key || ""
      }
    };

    if (selectedExam.bankId.startsWith("fallback_")) {
      setSubmitError("Bài kiểm tra hiện chưa thể ghi nhận kết quả. Vui lòng thử lại khi kết nối ổn định.");
      setConfirmSubmitModal(false);
      return;
    }

    let attemptId = activeAttempt.id;
    let submittedAt = new Date().toISOString();
    setSubmitError("");
    setSubmitting(true);
    try {
      const response = await examService.submitExamResult(payload);
      attemptId = response.attemptId || attemptId;
      submittedAt = response.ts || submittedAt;
    } catch {
      setSubmitError("Không thể ghi nhận kết quả. Vui lòng thử lại.");
      setConfirmSubmitModal(false);
      return;
    } finally {
      setSubmitting(false);
    }

    const score = detail.length ? Number(((correct / detail.length) * 10).toFixed(1)) : 0;
    preserveReview(payload, attemptId, score);
    const finishedAttempt: ExamAttempt = {
      ...activeAttempt,
      id: attemptId,
      submittedAt,
      score,
      correctCount: correct,
      wrongCount: wrong,
      passed: score >= selectedExam.passingScore,
      status: "submitted",
      answers: runnerAnswers
    };
    onSaveExamAttempt(finishedAttempt);
    setActiveAttempt(finishedAttempt);
    setConfirmSubmitModal(false);
    setExamMode("result");
  };

  const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const getUserAttempt = (examId: string) => activeAttempt?.examId === examId ? activeAttempt : attempts.find(attempt => attempt.userId === user.id && attempt.examId === examId);
  const handleBackToList = () => { setSelectedExam(null); setExamMode("list"); onClearExamArg(); };

  if (examMode === "runner" && selectedExam) {
    const currentQuestion = examQuestions[currentQIdx];
    if (!currentQuestion) return <div className="bg-white rounded-2xl p-6 text-center text-xs">Đang chuẩn bị bài kiểm tra...</div>;
    return (
      <AppPage variant="plain" id="exam-fullscreen-runner">
        <AppContainer bleed>
          <AppStack gap="md">
        {fallback && <Alert variant="warning" description="Không thể cập nhật nội dung mới. Đang hiển thị nội dung đã lưu." />}
        {submitError && <Alert variant="danger" title="Chưa nộp được bài" description={`${submitError}. Bài làm vẫn đang được giữ trên màn hình để thử lại.`} />}
        <div className="pixel-surface-flat flex min-h-11 items-center justify-between p-3">
          <div className="min-w-0"><span className="inline-flex px-2 py-0.5 bg-red-50 text-red-700 text-caption font-extrabold rounded uppercase">{selectedExam.bankMode === "mock" ? "Thi thử" : "Kiểm tra"}</span><h3 className="text-xs font-bold text-[var(--app-color-text-primary)] line-clamp-1 mt-0.5">{selectedExam.title}</h3></div>
          <div className="flex items-center gap-1 bg-red-700 text-white px-3 py-1.5 rounded-xl font-mono font-extrabold text-xs shrink-0"><Timer size={13} />{formatTime(timeLeft)}</div>
        </div>
        <div className="flex items-center justify-between text-caption text-[var(--app-color-text-muted)] font-extrabold px-1"><span>Đã trả lời {Object.keys(runnerAnswers).length}/{examQuestions.length}</span><span>TIẾN ĐỘ {Math.round(((currentQIdx + 1) / examQuestions.length) * 100)}%</span></div>
        <div className="pixel-surface space-y-3 p-3">
          <div><span className="inline-block px-1.5 py-0.5 bg-slate-100 text-[var(--app-color-text-secondary)] text-caption font-extrabold rounded uppercase">Câu {currentQIdx + 1} / {examQuestions.length}</span><h4 className="text-sm font-extrabold text-[var(--app-color-text-primary)] leading-snug mt-2">{currentQuestion.questionText}</h4></div>
          <div className="space-y-2">
            {currentQuestion.options.map((option, index) => {
              const selected = runnerAnswers[currentQuestion.id]?.includes(index) || false;
              return <button key={index} onClick={() => handleOptionSelect(currentQuestion.id, index, currentQuestion.type)} className={`w-full p-3 rounded-2xl text-left text-xs transition min-h-[48px] ${selected ? "bg-red-50 text-red-950 font-bold ring-1 ring-red-400" : "bg-slate-50 text-[var(--app-color-text-secondary)]"}`}><span className={`inline-flex w-5 h-5 mr-2.5 rounded-full items-center justify-center text-caption font-extrabold ${selected ? "bg-red-700 text-white" : "bg-white text-[var(--app-color-text-muted)]"}`}>{String.fromCharCode(65 + index)}</span>{option}</button>;
            })}
          </div>
          <div className="pt-1 flex justify-between gap-2.5">
            <button onClick={() => setCurrentQIdx(previous => Math.max(0, previous - 1))} disabled={currentQIdx === 0} className="px-4 py-3 bg-slate-100 disabled:opacity-40 text-xs font-bold rounded-xl">Câu trước</button>
            {currentQIdx < examQuestions.length - 1 ? <button onClick={() => setCurrentQIdx(previous => previous + 1)} className="px-4 py-3 bg-red-800 text-white text-xs font-bold rounded-xl">Câu tiếp theo</button> : <button onClick={() => setConfirmSubmitModal(true)} className="px-5 py-3 bg-red-700 text-white font-extrabold text-xs rounded-xl">Nộp bài</button>}
          </div>
        </div>
        <div className="pixel-surface p-3"><div className="grid grid-cols-5 gap-1.5">{examQuestions.map((question, index) => <button key={question.id} onClick={() => setCurrentQIdx(index)} className={`h-11 text-xs font-extrabold rounded-xl ${currentQIdx === index ? "bg-red-700 text-white" : runnerAnswers[question.id]?.length ? "bg-green-50 text-green-800" : "bg-slate-50 text-[var(--app-color-text-muted)]"}`}>{index + 1}</button>)}</div></div>
        {confirmSubmitModal && <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"><div className="app-overlay max-w-sm w-full p-5 space-y-4 text-center"><AlertTriangle size={32} className="text-red-600 mx-auto" /><h4 className="text-sm font-extrabold">Xác nhận nộp bài?</h4><p className="text-xs text-[var(--app-color-text-muted)]">Đã trả lời {Object.keys(runnerAnswers).length}/{examQuestions.length} câu.</p><div className="flex gap-2"><button disabled={submitting} onClick={() => setConfirmSubmitModal(false)} className="flex-1 py-3 bg-slate-100 disabled:opacity-50 rounded-xl text-xs font-bold">Rà soát lại</button><button disabled={submitting} onClick={() => void handleSubmitExam(true)} className="flex-1 py-3 bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold">{submitting ? "Đang nộp..." : "Nộp bài ngay"}</button></div></div></div>}
          </AppStack>
        </AppContainer>
      </AppPage>
    );
  }

  if (examMode === "result" && selectedExam) {
    const attempt = getUserAttempt(selectedExam.bankId);
    return (
      <AppPage variant="plain" id="exam-result-box">
        <AppContainer bleed>
          <AppStack gap="md">
        <div className="bg-white rounded-2xl p-3 flex justify-between"><button onClick={handleBackToList} className="flex items-center gap-1 text-xs font-extrabold text-red-800"><ArrowLeft size={16} />DANH SÁCH THI</button><span className="text-caption text-[var(--app-color-text-muted)] font-extrabold">KẾT QUẢ</span></div>
        {submitError && <Alert variant="warning" description={`Kết quả được giữ trên thiết bị để xem lại nhưng chưa được ghi nhận: ${submitError}`} />}
        <div className="pixel-surface space-y-3 p-3 text-center">
          <Award size={42} className={attempt?.passed ? "text-green-600 mx-auto" : "text-red-600 mx-auto"} />
          <div><h2 className="text-base font-extrabold">Kết quả {selectedExam.bankMode === "mock" ? "Thi thử" : "Kiểm tra"}</h2><p className="text-caption text-[var(--app-color-text-muted)] mt-1">{selectedExam.title}</p></div>
          <div className="p-2.5 rounded-2xl bg-slate-50 text-left text-caption text-[var(--app-color-text-secondary)] space-y-1">
            <p><span className="font-extrabold">Mã lượt làm:</span> {attempt?.id || "—"}</p>
            <p><span className="font-extrabold">Thời điểm nộp:</span> {attempt?.submittedAt ? new Date(attempt.submittedAt).toLocaleString("vi-VN") : "—"}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl"><div><p className="text-caption uppercase text-[var(--app-color-text-muted)]">Kết luận</p><p className={attempt?.passed ? "font-extrabold text-green-700" : "font-extrabold text-red-700"}>{attempt?.passed ? "ĐẠT" : "CHƯA ĐẠT"}</p></div><div><p className="text-caption uppercase text-[var(--app-color-text-muted)]">Điểm</p><p className="font-extrabold">{attempt?.score ?? 0}/10</p></div></div>
          <div className="text-left space-y-2">
            {examQuestions.map((question, index) => {
              const chosen = attempt?.answers[question.id]?.[0] ?? -1;
              const correct = question.correctAnswers[0] ?? -1;
              const ok = chosen === correct;
              return <div key={question.id} className="p-3 bg-slate-50 border rounded-2xl text-body-s space-y-1"><p className="font-bold">Câu {index + 1}: {question.questionText}</p><p className={ok ? "text-green-700" : "text-red-700"}>{ok ? <CheckCircle size={12} className="inline mr-1" /> : <AlertTriangle size={12} className="inline mr-1" />}Đã chọn: {chosen >= 0 ? question.options[chosen] : "Bỏ trống"}</p><p className="text-[var(--app-color-text-secondary)]">Đáp án đúng: {question.options[correct] || "—"}</p><p className="text-[var(--app-color-text-muted)]">Chủ đề: {question.tags?.[0] || "—"}</p></div>;
            })}
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button onClick={() => onNavigate("ranking", lastReviewPack)} className="w-full py-3 bg-red-700 text-white font-bold text-xs rounded-xl">Xem lại và giải thích</button>
            <button onClick={handleBackToList} className="w-full py-3 bg-slate-800 text-white font-bold text-xs rounded-xl">Trở lại danh sách</button>
          </div>
        </div>
          </AppStack>
        </AppContainer>
      </AppPage>
    );
  }

  const grouped = [
    { mode: "mock", title: "Thi thử" },
    { mode: "exam", title: "Kiểm tra" }
  ];
  return (
    <AppPage variant="plain" id="official-exam-tab-content">
      <AppContainer bleed>
        <AppStack gap="xl">
      <div className="flex items-center gap-3 rounded-[var(--app-radius-card)] bg-gradient-to-br from-red-800 via-rose-900 to-rose-950 p-3 text-white"><ClipboardList size={34} /><div><h2 className="text-base font-extrabold">Thi thử và Kiểm tra</h2><p className="text-caption text-red-100 mt-0.5">Chọn nội dung phù hợp để bắt đầu làm bài.</p></div></div>
      {fallback && <Alert variant="warning" description="Không thể cập nhật nội dung mới. Đang hiển thị nội dung đã lưu." />}
      {mockApiUnavailable && <Alert variant="warning" description="Hiện chưa thể tải nội dung Thi thử. Vui lòng thử lại." />}
      {grouped.map(group => {
        const groupExams = availableExams.filter(exam => exam.bankMode === group.mode);
        return (
          <section key={group.mode} className="space-y-3">
            <h3 className="text-body-s font-extrabold uppercase text-[var(--app-color-text-secondary)]">{group.title}</h3>
            {groupExams.length ? groupExams.map(exam => {
              const attempt = getUserAttempt(exam.bankId);
              const open = exam.bankStatus === "open";
              const examKey = `${exam.apiSource}:${exam.bankId}`;
              const target = selectedTargets[examKey] || selectedTargets[exam.bankId] || exam.targets?.[0]?.key || "";
              return (
                <ExamCard
                  key={examKey}
                  title={exam.title}
                  description={exam.description}
                  mode={group.mode === "mock" ? "mock" : "exam"}
                  status={open ? "active" : "unavailable"}
                  statusLabel={open ? "Đang diễn ra" : exam.bankStatus === "scheduled" ? "Sắp diễn ra" : "Đã kết thúc"}
                  durationMinutes={Math.ceil(exam.durationSec / 60)}
                  questionCount={exam.questionCount}
                  timeWindowLabel={`${exam.startAtLocal || new Date(exam.startDate).toLocaleString("vi-VN")} — ${exam.endAtLocal || new Date(exam.endDate).toLocaleString("vi-VN")}`}
                  selectedTarget={target}
                  targetOptions={exam.targets?.map(item => ({
                    value: item.key,
                    label: targetLabel(item.label || item.key)
                  })) || []}
                  onTargetChange={value => setSelectedTargets(previous => ({ ...previous, [examKey]: value }))}
                  loading={startingExamKey === examKey}
                  resultSummary={attempt ? (
                    <Button
                      type="button"
                      onClick={event => {
                        event.stopPropagation();
                        setSelectedExam(exam);
                        setActiveAttempt(attempt);
                        setExamMode("result");
                      }}
                      variant="secondary"
                      size="sm"
                    >
                      Xem kết quả
                    </Button>
                  ) : undefined}
                  onStart={event => {
                    event.stopPropagation();
                    void handleStartExam(exam);
                  }}
                />
              );
            }) : (
              <EmptyState
                variant={group.mode === "mock" ? "exam" : "default"}
                icon={<FileText size={24} />}
                title={group.mode === "mock" ? "Hiện chưa có kỳ thi thử" : "Hiện chưa có kỳ kiểm tra"}
                description={group.mode === "mock" ? "Nội dung Thi thử sẽ hiển thị khi được ban hành." : "Nội dung Kiểm tra sẽ hiển thị khi được ban hành."}
              />
            )}
          </section>
        );
      })}
        </AppStack>
      </AppContainer>
    </AppPage>
  );
}
