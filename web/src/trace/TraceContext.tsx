import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { TraceEntry, TraceLevel } from "./types";

type TraceContextValue = {
  entries: TraceEntry[];
  connected: boolean;
  logClient: (level: TraceLevel, module: string, message: string, detail?: string, error?: string) => void;
  clear: () => void;
};

const TraceContext = createContext<TraceContextValue | null>(null);

export function TraceProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<TraceEntry[]>([]);
  const [connected, setConnected] = useState(false);

  const push = useCallback((e: TraceEntry) => {
    setEntries((prev) => [...prev.slice(-299), e]);
  }, []);

  const logClient = useCallback(
    (level: TraceLevel, module: string, message: string, detail?: string, error?: string) => {
      push({
        id: crypto.randomUUID(),
        time: new Date().toISOString(),
        level,
        module,
        message,
        detail,
        error,
      });
    },
    [push]
  );

  useEffect(() => {
    logClient("step", "ui", "در حال اتصال به ردیاب سرور…");
    fetch("/api/v1/trace/history")
      .then((r) => r.json())
      .then((data) => {
        const list = (data.entries ?? []) as TraceEntry[];
        list.forEach((e) => push(e));
        logClient("ok", "ui", "تاریخچه ردیاب بارگذاری شد");
      })
      .catch((err) => {
        logClient("error", "ui", "بارگذاری تاریخچه ناموفق", undefined, String(err));
      });

    const es = new EventSource("/api/v1/trace/stream");
    es.addEventListener("connected", () => {
      setConnected(true);
      logClient("ok", "ui", "اتصال زنده ردیاب برقرار شد");
    });
    es.addEventListener("trace", (ev) => {
      try {
        const e = JSON.parse(ev.data) as TraceEntry;
        push(e);
      } catch {
        /* ignore */
      }
    });
    es.onerror = () => {
      setConnected(false);
      logClient("warn", "ui", "اتصال ردیاب قطع شد — تلاش مجدد…");
    };
    return () => es.close();
  }, [logClient, push]);

  const clear = useCallback(() => setEntries([]), []);

  const value = useMemo(
    () => ({ entries, connected, logClient, clear }),
    [entries, connected, logClient, clear]
  );

  return <TraceContext.Provider value={value}>{children}</TraceContext.Provider>;
}

export function useTrace() {
  const ctx = useContext(TraceContext);
  if (!ctx) throw new Error("useTrace outside provider");
  return ctx;
}
