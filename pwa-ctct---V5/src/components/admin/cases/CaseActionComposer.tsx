import React, { useState } from "react";
import { Button } from "../../ui";

export default function CaseActionComposer({ onAdd }: { onAdd: (detail: string) => void }) {
  const [detail, setDetail] = useState("");
  return <div className="flex gap-2"><input aria-label="Ghi chú xử lý" value={detail} onChange={event => setDetail(event.target.value)} placeholder="Ghi chú xử lý nội bộ" className="min-h-11 min-w-0 flex-1 rounded-xl border border-[var(--app-color-border)] bg-white px-3" /><Button size="sm" disabled={!detail.trim()} onClick={() => { onAdd(detail.trim()); setDetail(""); }}>Thêm</Button></div>;
}

