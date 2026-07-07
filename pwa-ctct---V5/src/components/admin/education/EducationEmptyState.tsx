import React from "react";
import { BarChart3 } from "lucide-react";
import { EmptyState } from "../../ui";

interface EducationEmptyStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export default function EducationEmptyState({
  title = "Chưa có dữ liệu phân tích",
  description = "Dữ liệu sẽ hiển thị khi hệ thống phân tích được kích hoạt và có hoạt động phát sinh.",
  className = ""
}: EducationEmptyStateProps) {
  return (
    <EmptyState
      icon={<BarChart3 size={20} />}
      title={title}
      description={description}
      className={className}
    />
  );
}
