import React from "react";
import { Send } from "lucide-react";
import { Chip, IconButton, AppCaption } from "../ui";

export interface ChatPreset {
  label: string;
  value?: string;
}

export interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event?: React.FormEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  presets?: ChatPreset[];
  onPresetClick?: (preset: ChatPreset) => void;
  showDisclaimer?: boolean;
  disclaimer?: string;
}

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  disabled = false,
  loading = false,
  placeholder = "Trao đổi về tài liệu, câu hỏi hoặc văn bản...",
  presets = [],
  onPresetClick,
  showDisclaimer = true,
  disclaimer = "AI hỗ trợ học tập; cần đối chiếu văn bản chính thức khi áp dụng."
}: ChatComposerProps) {
  return (
    <div className="shrink-0 overflow-hidden bg-[var(--app-color-surface)]">
      {presets.length > 0 && !value.trim() && (
        <div className="px-2.5 py-1">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar overscroll-x-contain touch-pan-x">
            {presets.slice(0, 5).map(preset => (
              <Chip
                key={preset.label}
                onClick={() => onPresetClick?.(preset)}
                disabled={disabled || loading}
                variant="brand"
                className="min-h-11 whitespace-nowrap !px-3"
              >
                {preset.label}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-0.5 border-t border-[var(--app-color-divider)] px-2.5 pb-1 pt-1">
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            value={value}
            onChange={event => onChange(event.target.value)}
            disabled={disabled || loading}
            placeholder={placeholder}
            enterKeyHint="send"
            autoComplete="off"
            className="motion-interactive flex-1 h-11 px-4 text-sm bg-[var(--app-color-surface-soft)] rounded-full focus:outline-none focus:ring-2 focus:ring-red-700 min-w-0"
          />
          <IconButton
            type="submit"
            disabled={!value.trim() || disabled || loading}
            variant="primary"
            size="md"
            icon={<Send size={18} />}
            id="btn-ai-send"
            aria-label="Gửi câu hỏi cho AI Chính trị viên"
          />
        </form>
        {showDisclaimer && (
          <AppCaption align="center" truncate className="text-[var(--app-color-text-muted)] px-1 leading-tight">
            {disclaimer}
          </AppCaption>
        )}
      </div>
    </div>
  );
}

export default ChatComposer;
