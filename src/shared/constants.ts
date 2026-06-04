export const API_BASE_URL = "http://localhost:3000";

export const API_ANALYZE_URL = `${API_BASE_URL}/api/analyze`;

export const CLAUSE_TYPE_LABELS: Record<string, string> = {
  personal_data: "Personal Data",
  third_party: "Third Party Sharing",
  abusive: "Abusive Clause",
  retention: "Data Retention",
  recourse: "Recourse Rights",
};

export const SEVERITY_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};
