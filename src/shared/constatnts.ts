export const API_BASE_URL = "http://localhost:3000";

export const CLAUSE_TYPE_LABELS: Record<string, string> = {
  personal_data: "Données personnelles",
  third_party_resale: "Revente à des tiers",
  abusive_clause: "Clause abusive",
  retention_duration: "Durée de conservation",
  recourse_rights: "Droits de recours",
};

export const SEVERITY_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};
