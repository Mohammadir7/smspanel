import { useState } from "react";
import { useTrace } from "../trace/TraceContext";
import type { TraceEntry } from "../trace/types";

const levelLabel: Record<string, string> = {
  step: "مرحله",
  ok: "موفق",
  info: "اطلاع",
  warn: "هشدار",
  error: "خطا",
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("fa-IR");
  } catch {
    return iso;
  }
}

function Line({ e }: { e: TraceEntry }) {
  return (
    <div className={`trace-line trace-${e.level}`}>
      <span className="trace-time">{formatTime(e.time)}</span>
      <span className="trace-badge">{levelLabel[e.level] ?? e.level}</span>
      <span className="trace-mod">{e.module}</span>
      <span className="trace-msg">{e.message}</span>
      {e.detail ? <span className="trace-detail"> — {e.detail}</span> : null}
      {e.error ? <pre className="trace-err">{e.error}</pre> : null}
    </div>
  );
}

export function DevLogWindow() {
  const { entries, connected, clear } = useTrace();
  const [open, setOpen] = useState(true);
  const [height, setHeight] = useState(220);

  return (
    <div className="trace-panel" style={{ height: open ? height : 40 }}>
      <div className="trace-header">
        <button type="button" className="btn-ghost btn trace-toggle" onClick={() => setOpen((o) => !o)}>
          {open ? "▼" : "▲"} ردیاب مراحل (موقت)
        </button>
        <span className={`trace-dot ${connected ? "on" : "off"}`} title={connected ? "متصل" : "قطع"} />
        <span className="muted">{entries.length} رویداد</span>
        <button type="button" className="btn-ghost btn" onClick={clear}>
          پاک کردن
        </button>
        {open ? (
          <input
            type="range"
            min={120}
            max={480}
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            title="ارتفاع پنجره"
            className="trace-resize"
          />
        ) : null}
      </div>
      {open ? (
        <div className="trace-body">
          {entries.length === 0 ? (
            <p className="muted">هنوز رویدادی ثبت نشده — سرور را اجرا کنید.</p>
          ) : (
            entries.map((e) => <Line key={e.id} e={e} />)
          )}
        </div>
      ) : null}
      <style>{`
        .trace-panel {
          border-top: 2px solid var(--border);
          background: #0a0c10;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        [data-theme="light"] .trace-panel { background: #e8eaef; }
        .trace-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 16px;
          border-bottom: 1px solid var(--border);
        }
        .trace-toggle { font-size: 0.85rem; padding: 4px 10px; }
        .trace-dot { width: 8px; height: 8px; border-radius: 50%; }
        .trace-dot.on { background: var(--success); }
        .trace-dot.off { background: var(--error); }
        .trace-body {
          overflow: auto;
          flex: 1;
          padding: 8px 12px;
          font-size: 0.82rem;
          font-family: ui-monospace, monospace;
        }
        .trace-line { margin-bottom: 6px; line-height: 1.5; }
        .trace-time { color: var(--text-muted); margin-left: 8px; }
        .trace-badge {
          display: inline-block;
          min-width: 48px;
          text-align: center;
          border-radius: 4px;
          padding: 0 6px;
          margin-left: 8px;
          font-size: 0.75rem;
        }
        .trace-step .trace-badge { background: #0ea5e933; color: var(--step); }
        .trace-ok .trace-badge { background: #22c55e33; color: var(--success); }
        .trace-warn .trace-badge { background: #f59e0b33; color: var(--warn); }
        .trace-error .trace-badge { background: #ef444433; color: var(--error); }
        .trace-mod { color: var(--primary); margin-left: 6px; }
        .trace-detail { color: var(--text-muted); }
        .trace-err {
          margin: 4px 0 0;
          padding: 8px;
          background: #ef444422;
          border-radius: 6px;
          white-space: pre-wrap;
          color: var(--error);
        }
        .trace-resize { margin-right: auto; width: 120px; }
      `}</style>
    </div>
  );
}
