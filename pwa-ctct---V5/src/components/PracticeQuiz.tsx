import React, { useState, useEffect } from "react";
import { User, LearningTopic, Question, LearningStatus, QuestionType, QuizAttempt } from "../types";
import { Award, CheckCircle, XCircle, ArrowLeft, HelpCircle, MessageSquare, BookOpen, ChevronRight, AlertTriangle } from "lucide-react";
import { reviewService, ReviewPack } from "../services/reviewService";

interface PracticeQuizProps {
  user: User;
  topics: LearningTopic[];
  allQuestions: Question[];
  activeTopicArg: LearningTopic | null;
  onClearTopicArg: () => void;
  onSaveQuizAttempt: (attempt: QuizAttempt) => void;
  onNavigate: (tab: string, arg?: any) => void;
}

export default function PracticeQuiz({
  user,
  topics,
  allQuestions,
  activeTopicArg,
  onClearTopicArg,
  onSaveQuizAttempt,
  onNavigate
}: PracticeQuizProps) {
  // Config state
  const [quizMode, setQuizMode] = useState<"setup" | "running" | "ended">("setup");
  const [quizType, setQuizType] = useState<"topic" | "random" | "weak">("topic");
  const [selectedTopicId, setSelectedTopicId] = useState<string>(activeTopicArg?.id || topics[0]?.id || "");
  
  // Running state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]); // chosen options for current question
  const [checkedAnswer, setCheckedAnswer] = useState(false); // has checked current question?
  const [quizScore, setQuizScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [answersHistory, setAnswersHistory] = useState<{ [qId: string]: number[] }>({});
  const [lastReviewPack, setLastReviewPack] = useState<ReviewPack | null>(null);

  // Trigger topic-based setup from prop if activeTopicArg is set
  useEffect(() => {
    if (activeTopicArg) {
      setQuizType("topic");
      setSelectedTopicId(activeTopicArg.id);
      startQuiz("topic", activeTopicArg.id);
    }
  }, [activeTopicArg]);

  const startQuiz = (type: "topic" | "random" | "weak", topicId?: string) => {
    let list: Question[] = [];
    const tId = topicId || selectedTopicId;

    if (type === "topic") {
      list = allQuestions.filter(q => q.topicId === tId);
    } else if (type === "weak") {
      // simulate weak-topic questions (e.g. topic t5 which is tagged as weak or random)
      list = allQuestions.filter(q => q.difficulty === "Khó" || q.topicId === "t5" || q.topicId === "t2");
    } else {
      // random selection from entire question bank
      list = [...allQuestions].sort(() => 0.5 - Math.random()).slice(0, 4);
    }

    if (list.length === 0) {
      // Fallback if no questions found
      list = allQuestions.slice(0, 3);
    }

    setQuestions(list);
    setCurrentIdx(0);
    setSelectedAnswers([]);
    setCheckedAnswer(false);
    setQuizScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setAnswersHistory({});
    setLastReviewPack(null);
    setQuizMode("running");
  };

  const handleOptionClick = (idx: number, type: QuestionType) => {
    if (checkedAnswer) return; // already submitted current question

    if (type === QuestionType.SINGLE || type === QuestionType.TRUE_FALSE || type === QuestionType.SCENARIO) {
      setSelectedAnswers([idx]);
    } else {
      // multiple choice
      setSelectedAnswers(prev => 
        prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
      );
    }
  };

  const handleCheckAnswer = () => {
    if (selectedAnswers.length === 0) return;

    const currentQ = questions[currentIdx];
    const isCorrect = currentQ.correctAnswers.length === selectedAnswers.length &&
      currentQ.correctAnswers.every(ans => selectedAnswers.includes(ans));

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    } else {
      setWrongCount(prev => prev + 1);
    }

    // Save answers history
    setAnswersHistory(prev => ({
      ...prev,
      [currentQ.id]: selectedAnswers
    }));

    setCheckedAnswer(true);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedAnswers([]);
      setCheckedAnswer(false);
    } else {
      // End Quiz
      const finalAnswers = {
        ...answersHistory,
        [questions[currentIdx].id]: selectedAnswers
      };
      const isAnswerCorrect = (question: Question) => {
        const submitted = finalAnswers[question.id] || [];
        return question.correctAnswers.length === submitted.length &&
          question.correctAnswers.every(answer => submitted.includes(answer));
      };
      const finalCorrect = questions.filter(isAnswerCorrect).length;
      const finalSkip = questions.filter(question => !(finalAnswers[question.id] || []).length).length;
      const finalWrong = questions.length - finalCorrect - finalSkip;
      const calculatedScore = Math.round((finalCorrect / questions.length) * 10);
      setQuizScore(calculatedScore);
      setQuizMode("ended");

      // Save quiz attempt record to parent state
      const finalAttempt: QuizAttempt = {
        id: "qa_" + Date.now(),
        userId: user.id,
        quizType: quizType,
        topicId: quizType === "topic" ? selectedTopicId : undefined,
        startedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        score: calculatedScore,
        correctCount: finalCorrect,
        wrongCount: finalWrong,
        totalQuestions: questions.length,
        answers: finalAnswers,
        status: "submitted"
      };

      const reviewPack: ReviewPack = {
        sourceType: "practice",
        attemptId: finalAttempt.id,
        title: quizType === "topic" ? topics.find(topic => topic.id === selectedTopicId)?.title || "Ôn trắc nghiệm" : "Ôn trắc nghiệm",
        submittedAt: finalAttempt.submittedAt || new Date().toISOString(),
        score: finalAttempt.score,
        total: questions.length,
        correct: finalCorrect,
        wrong: finalWrong,
        skip: finalSkip,
        answers: questions.map((question, index) => {
          const chosen = (finalAnswers[question.id] || [])[0] ?? -1;
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
            ok: isAnswerCorrect(question),
            topic: question.tags?.[0] || question.topicId,
            explain: question.explanation
          };
        })
      };
      reviewService.saveReviewPack(reviewPack);
      setLastReviewPack(reviewPack);
      onSaveQuizAttempt(finalAttempt);
    }
  };

  const isCurrentCorrect = () => {
    const currentQ = questions[currentIdx];
    if (!currentQ) return false;
    return currentQ.correctAnswers.length === selectedAnswers.length &&
      currentQ.correctAnswers.every(ans => selectedAnswers.includes(ans));
  };

  const handleExitQuiz = () => {
    setQuizMode("setup");
    onClearTopicArg();
  };
  if (quizMode === "running") {
    const currentQuestion = questions[currentIdx];
    const percentage = Math.round(((currentIdx + 1) / questions.length) * 100);

    return (
      <div className="space-y-4" id="quiz-runner-box">
        {/* Top Header Panel */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              CÂU {currentIdx + 1} / {questions.length}
            </span>
          </div>
          <button
            onClick={handleExitQuiz}
            className="text-[10px] font-extrabold uppercase text-slate-400 hover:text-slate-600 cursor-pointer p-1"
          >
            Thoát học tập
          </button>
        </div>

        {/* Progress Bar indicator */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300" style={{ width: `${percentage}%` }}></div>
        </div>

        {/* Primary Question Container Card */}
        <div className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm space-y-4">
          <div className="space-y-2">
            <span className="inline-flex px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[8px] font-black rounded uppercase tracking-wide">
              {currentQuestion.type === QuestionType.SINGLE ? "Một đáp án đúng" :
               currentQuestion.type === QuestionType.MULTIPLE ? "Nhiều đáp án đúng" :
               currentQuestion.type === QuestionType.TRUE_FALSE ? "Lựa chọn Đúng/Sai" : "Bài tập tình huống"}
            </span>
            <h3 className="text-sm font-black text-slate-800 leading-snug">
              {currentQuestion.questionText}
            </h3>
          </div>

          {/* Large touch-target option buttons */}
          <div className="space-y-2.5">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswers.includes(idx);
              const isCorrectOpt = currentQuestion.correctAnswers.includes(idx);

              let optionStyle = "bg-slate-50 border-slate-200 text-slate-700 active:scale-98 hover:bg-slate-100/70";
              if (isSelected && !checkedAnswer) {
                optionStyle = "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-sm";
              } else if (checkedAnswer) {
                if (isCorrectOpt) {
                  optionStyle = "bg-green-100 border-green-500 text-green-950 font-black shadow-sm";
                } else if (isSelected && !isCorrectOpt) {
                  optionStyle = "bg-red-50 border-red-400 text-red-950 font-bold";
                } else {
                  optionStyle = "bg-slate-50/50 border-slate-100 text-slate-400 opacity-50";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(idx, currentQuestion.type)}
                  disabled={checkedAnswer}
                  className={`w-full p-4 rounded-2xl text-left text-xs border transition flex items-start gap-3 min-h-[52px] cursor-pointer ${optionStyle}`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${
                    isSelected ? "bg-emerald-800 text-white" : "bg-white border text-slate-500"
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="leading-snug pt-0.5">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Action check button / next button controls */}
          <div className="pt-3.5 border-t border-slate-50 flex flex-col gap-3">
            
            {checkedAnswer && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                isCurrentCorrect() ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}>
                {isCurrentCorrect() ? (
                  <>
                    <CheckCircle size={15} className="text-green-600" />
                    <span>Học tập tốt! Đáp án chính xác. (+1 điểm)</span>
                  </>
                ) : (
                  <>
                    <XCircle size={15} className="text-red-600" />
                    <span>Lý thuyết chưa chính xác, hãy đọc giải thích!</span>
                  </>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              {!checkedAnswer ? (
                <button
                  onClick={handleCheckAnswer}
                  disabled={selectedAnswers.length === 0}
                  className="w-full py-3 px-5 bg-emerald-800 hover:bg-emerald-950 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl transition shadow active:scale-95 cursor-pointer min-h-[44px]"
                  id="btn-quiz-check"
                >
                  Kiểm tra đáp án
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="w-full py-3 px-5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl transition shadow active:scale-95 flex items-center justify-center gap-1 cursor-pointer min-h-[44px]"
                  id="btn-quiz-next"
                >
                  <span>{currentIdx < questions.length - 1 ? "Đọc tiếp câu sau" : "Hoàn thành & Gửi kết quả"}</span>
                  <ChevronRight size={14} />
                </button>
              )}
            </div>

          </div>

          {/* Detailed Solution Explanation Box */}
          {checkedAnswer && (
            <div className="p-4 bg-amber-50/70 border border-amber-200/50 rounded-2xl space-y-2 animate-fade-in" id="quiz-explanation-box">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-900 flex items-center gap-1">
                <HelpCircle size={13} />
                <span>Giải thích lý thuyết chính trị viên:</span>
              </p>
              <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                {currentQuestion.explanation}
              </p>
              {currentQuestion.reference && (
                <p className="text-[9px] text-slate-500 font-bold italic border-t border-amber-100 pt-1">
                  Cơ sở pháp lý: {currentQuestion.reference}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (quizMode === "ended") {
    const finalScore = Math.round((correctCount / questions.length) * 10);
    const passed = finalScore >= 6;

    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-center max-w-lg mx-auto space-y-6" id="quiz-ended-box">
        <div className="flex flex-col items-center gap-2">
          <div className={`p-4 rounded-full ${passed ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600"}`}>
            <Award size={48} />
          </div>
          <h2 className="text-xl font-black text-slate-800">Bài luyện tập hoàn tất!</h2>
          <p className="text-xs text-slate-500">Hệ thống đã tự động chấm điểm và đánh giá tiến độ của đồng chí.</p>
        </div>

        {/* Scorecard */}
        <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Điểm số</p>
            <p className={`text-2xl font-black ${passed ? "text-green-700" : "text-orange-700"}`}>{finalScore}/10</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Số câu đúng</p>
            <p className="text-2xl font-black text-slate-800">{correctCount}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Số câu sai</p>
            <p className="text-2xl font-black text-slate-800">{wrongCount}</p>
          </div>
        </div>

        {/* Evaluation Message */}
        <div className="p-4 rounded-xl border text-xs leading-relaxed">
          {passed ? (
            <div className="text-green-800 bg-green-50/40 border-green-200">
              <p className="font-bold mb-1 flex items-center gap-1 justify-center">
                <CheckCircle size={14} />
                <span>ĐẠT TIÊU CHUẨN</span>
              </p>
              <p className="font-medium text-slate-600">Đồng chí đã nắm vững kiến thức lý luận cơ bản của chuyên đề này. Điểm số của đồng chí được cộng vào thành tích thi đua của Đơn vị.</p>
            </div>
          ) : (
            <div className="text-orange-800 bg-orange-50/40 border-orange-200">
              <p className="font-bold mb-1 flex items-center gap-1 justify-center">
                <AlertTriangle size={14} />
                <span>CẦN ÔN TẬP LẠI (DƯỚI 6.0 ĐIỂM)</span>
              </p>
              <p className="font-medium text-slate-600">Bài tự luyện chưa đạt yêu cầu tối thiểu. Chuyên đề này đã được đánh dấu trạng thái <strong>Cần ôn tập</strong> để đồng chí dễ dàng tìm đọc lại.</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            onClick={() => {
              if (quizType === "topic") {
                startQuiz("topic", selectedTopicId);
              } else {
                startQuiz(quizType);
              }
            }}
            className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition shadow cursor-pointer"
          >
            Luyện tập lại bài này
          </button>

          <button
            onClick={() => onNavigate("aitutor", quizType === "topic" ? topics.find(t => t.id === selectedTopicId) : null)}
            className="flex-1 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <MessageSquare size={14} className="text-emerald-700" />
            <span>Hỏi Trợ lý AI về các lỗi sai</span>
          </button>

          <button
            onClick={() => onNavigate("ranking", lastReviewPack)}
            className="flex-1 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Xem lại & Giải thích
          </button>

          <button
            onClick={handleExitQuiz}
            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Về trang chủ tự luyện
          </button>
        </div>
      </div>
    );
  }

  // Setup view / Selection view
  return (
    <div className="space-y-6" id="quiz-setup-view">
      <div className="bg-gradient-to-r from-blue-800 to-indigo-900 p-5 rounded-2xl text-white shadow">
        <h2 className="text-lg font-bold tracking-tight flex items-center gap-1.5">
          <Award className="text-yellow-400" size={24} />
          <span>Hệ thống Trắc nghiệm Tự luyện</span>
        </h2>
        <p className="text-xs text-blue-100/90 mt-1 max-w-md leading-relaxed">
          Hãy ôn tập kiến thức định kỳ để nâng cao bản lĩnh lý luận chính trị và nắm chắc quy định pháp luật. Kết quả trắc nghiệm sẽ giúp AI đánh giá chủ đề yếu của đồng chí.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Setup Configuration Card */}
        <div className="md:col-span-2 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2">Cấu hình bài tự luyện</h3>

          {/* Mode selections */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-600 block">Hình thức tự luyện:</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setQuizType("topic")}
                className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                  quizType === "topic"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-900 font-medium"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                }`}
              >
                <span className="text-xs font-bold">Luyện theo chuyên đề</span>
                <span className="text-[10px] text-slate-500">Tập trung một bài học nhất định</span>
              </button>

              <button
                type="button"
                onClick={() => setQuizType("random")}
                className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                  quizType === "random"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-900 font-medium"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                }`}
              >
                <span className="text-xs font-bold">Sát hạch ngẫu nhiên</span>
                <span className="text-[10px] text-slate-500">Trộn các câu hỏi từ hệ thống</span>
              </button>

              <button
                type="button"
                onClick={() => setQuizType("weak")}
                className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                  quizType === "weak"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-900 font-medium"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                }`}
              >
                <span className="text-xs font-bold">Khắc phục điểm yếu</span>
                <span className="text-[10px] text-slate-500">Các chủ đề có kết quả thấp</span>
              </button>
            </div>
          </div>

          {/* Topic Selector */}
          {quizType === "topic" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 block">Chọn Chuyên đề Học tập:</label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 transition"
              >
                {topics.map(t => (
                  <option key={t.id} value={t.id}>
                    [{t.category}] {t.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => startQuiz(quizType)}
            className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-1 cursor-pointer"
            id="btn-quiz-start"
          >
            <span>Bắt đầu tự luyện trắc nghiệm</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Review Instructions / History */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b pb-2">Hướng dẫn tự học</h3>
          <div className="text-xs space-y-3 text-slate-600 leading-relaxed">
            <p>
              1. <strong>Tự kiểm tra khách quan:</strong> Kết quả tự luyện giúp chiến sĩ kiểm tra lỗ hổng kiến thức để bổ sung kịp thời.
            </p>
            <p>
              2. <strong>Học từ sai lầm:</strong> Trình kiểm tra sẽ giải thích luật pháp chi tiết và chỉ dẫn văn bản gốc ngay khi chiến sĩ trả lời chưa đúng.
            </p>
            <p>
              3. <strong>Hỗ trợ của AI:</strong> Đồng chí có thể bấm &apos;Hỏi AI&apos; bất kỳ lúc nào để nhận phân tích chi tiết cho từng trường hợp vi phạm kỷ luật.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
