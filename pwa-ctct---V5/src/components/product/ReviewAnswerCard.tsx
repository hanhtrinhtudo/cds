import React from "react";
import { Badge, Card, AppCaption, AppText } from "../ui";

export interface ReviewAnswerCardProps {
  index: number;
  question: string;
  selectedAnswer?: string;
  correctAnswer?: string;
  explanation?: string;
  isCorrect?: boolean;
  isSkipped?: boolean;
  topic?: string;
  sourceType?: string;
}

export function ReviewAnswerCard({ index, question, selectedAnswer, correctAnswer, explanation, isCorrect, isSkipped, topic, sourceType }: ReviewAnswerCardProps) {
  const statusLabel = isCorrect ? "Đúng" : isSkipped ? "Bỏ qua" : "Sai";
  const statusVariant = isCorrect ? "success" : isSkipped ? "neutral" : "danger";

  return (
    <Card variant="flat" className="space-y-2 p-3">
      <div className="flex items-start justify-between gap-2">
        <AppText variant="bodyS" weight="black" className="text-[var(--app-color-text-primary)] leading-relaxed">Câu {index}. {question}</AppText>
        <Badge variant={statusVariant}>{statusLabel}</Badge>
      </div>
      {topic && <AppCaption className="font-bold text-[var(--app-color-text-secondary)]">Chủ đề: {topic}</AppCaption>}
      {sourceType && <AppCaption className="font-bold text-[var(--app-color-text-muted)]">Nguồn: {sourceType}</AppCaption>}
      <div className="grid grid-cols-1 gap-1.5">
        <div className="p-2 rounded-xl bg-[var(--app-color-surface-soft)]">
          <AppCaption className="font-extrabold text-[var(--app-color-text-secondary)]">Đã chọn: <span className={isSkipped ? "text-[var(--app-color-text-muted)]" : isCorrect ? "text-[var(--app-color-success)]" : "text-[var(--app-color-danger)]"}>{selectedAnswer || "Chưa chọn"}</span></AppCaption>
        </div>
        {correctAnswer && (
          <div className="p-2 rounded-xl bg-green-50">
            <AppCaption className="font-extrabold text-green-900">Đáp án đúng: <span className="text-green-800">{correctAnswer}</span></AppCaption>
          </div>
        )}
      </div>
      {explanation && (
        <div className="p-2 rounded-xl bg-[var(--app-color-warning-soft)]">
          <AppCaption className="text-[var(--app-color-warning)]"><span className="font-extrabold">Giải thích: </span>{explanation}</AppCaption>
        </div>
      )}
    </Card>
  );
}

export default ReviewAnswerCard;
