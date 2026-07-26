export type TraceLevel = "info" | "step" | "ok" | "warn" | "error";

export type TraceEntry = {
  id: string;
  time: string;
  level: TraceLevel;
  module: string;
  message: string;
  detail?: string;
  error?: string;
};
