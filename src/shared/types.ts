// Clause categories returned by the backend
export interface ClauseCategory {
  type:
    | "personal_data"
    | "third_party_resale"
    | "abusive_clause"
    | "retention_duration"
    | "recourse_rights";
  label: string;
  severity: "low" | "medium" | "high";
  summary: string;
}

// Full analysis result from POST /analyze
export interface AnalysisResult {
  siteDomain: string;
  score: number; // 0–100, lower = riskier
  clauses: ClauseCategory[];
  analyzedAt: string;
}

// Messages between content script ↔ background ↔ popup
export type ExtensionMessage =
  | { type: "CGV_DETECTED"; text: string; sourceUrl: string }
  | {
      type: "ANALYZE_REQUEST";
      text: string;
      siteDomain: string;
      sourceUrl: string;
    }
  | { type: "ANALYSIS_RESULT"; result: AnalysisResult }
  | { type: "ANALYSIS_ERROR"; message: string }
  | { type: "GET_CURRENT_STATE" }
  | { type: "TRIGGER_ANALYZE" }
  | { type: "CURRENT_STATE"; state: PopupState };

// State managed by the background worker, read by popup
export type PopupState =
  | { status: "idle" }
  | { status: "detected"; sourceUrl: string }
  | { status: "loading" }
  | { status: "result"; result: AnalysisResult }
  | { status: "error"; message: string };
