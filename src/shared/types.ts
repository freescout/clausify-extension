// Clause categories returned by the backend
export interface ClauseCategory {
  type: "personal_data" | "third_party" | "abusive" | "retention" | "recourse";
  content: string;
  severity: "low" | "medium" | "high";
  score_impact: number;
}

// Full analysis result from POST /api/analyze
export interface AnalysisResult {
  domain: string;
  global_score: number; // 0–100, lower = riskier
  rating: "green" | "orange" | "red";
  clauses: ClauseCategory[];
  analyzed_at: string;
}

// Messages between content script ↔ background ↔ popup
export type ExtensionMessage =
  | { type: "CGV_DETECTED"; text: string; sourceUrl: string }
  | {
      type: "ANALYZE_REQUEST";
      text: string;
      domain: string;
      sourceUrl: string;
    }
  | { type: "ANALYSIS_RESULT"; result: AnalysisResult }
  | { type: "ANALYSIS_ERROR"; message: string }
  | { type: "GET_CURRENT_STATE" }
  | { type: "TRIGGER_ANALYZE" }
  | { type: "GET_CGV_TEXT" }
  | { type: "CURRENT_STATE"; state: PopupState };

// State managed by the background worker, read by popup
export type PopupState =
  | { status: "idle" }
  | { status: "detected"; sourceUrl: string }
  | { status: "loading" }
  | { status: "result"; result: AnalysisResult }
  | { status: "error"; message: string };
