import { ExtensionMessage, PopupState, AnalysisResult } from "../shared/types";
/* import { API_ANALYZE_URL } from "../shared/constants"; */

// ── Mock data for testing ─────────────────────────────────────────────────────

const MOCK_RESULT: AnalysisResult = {
  domain: "amazon.fr",
  global_score: 42,
  rating: "red",
  analyzed_at: new Date().toISOString(),
  clauses: [
    {
      type: "personal_data",
      content:
        "Amazon collects your browsing data, purchases and interactions to personalise advertisements.",
      severity: "high",
      score_impact: -20,
    },
    {
      type: "third_party",
      content: "Your data may be shared with third-party commercial partners.",
      severity: "high",
      score_impact: -20,
    },
    {
      type: "retention",
      content: "Data is retained for as long as your account is active.",
      severity: "medium",
      score_impact: -10,
    },
    {
      type: "recourse",
      content: "You can exercise your rights by contacting customer service.",
      severity: "low",
      score_impact: -3,
    },
  ],
};

// ── State ─────────────────────────────────────────────────────────────────────

let currentState: PopupState = { status: "idle" };

function setState(state: PopupState) {
  currentState = state;
  chrome.runtime
    .sendMessage({ type: "CURRENT_STATE", state } satisfies ExtensionMessage)
    .catch(() => {});
}

// ── API call ──────────────────────────────────────────────────────────────────

async function analyze(text: string, siteDomain: string, sourceUrl: string) {
  setState({ status: "loading" });

  // TODO: remove mock and use real API when key is available
  await new Promise((res) => setTimeout(res, 1500)); // simulate network delay
  setState({ status: "result", result: MOCK_RESULT });
  chrome.runtime
    .sendMessage({
      type: "ANALYSIS_RESULT",
      result: MOCK_RESULT,
    } satisfies ExtensionMessage)
    .catch(() => {});

  // Real API call (uncomment when API key is ready):
  // try {
  //   const response = await fetch(API_ANALYZE_URL, {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ text, siteDomain, sourceUrl }),
  //   });
  //   if (!response.ok) {
  //     const err = await response.json();
  //     throw new Error(err.error ?? "Erreur serveur");
  //   }
  //   const result = await response.json();
  //   setState({ status: "result", result });
  //   chrome.runtime.sendMessage({ type: "ANALYSIS_RESULT", result } satisfies ExtensionMessage).catch(() => {});
  // } catch (error) {
  //   const message = (error as Error).message ?? "Erreur inconnue";
  //   setState({ status: "error", message });
  //   chrome.runtime.sendMessage({ type: "ANALYSIS_ERROR", message } satisfies ExtensionMessage).catch(() => {});
  // }
}

// ── Message handler ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    switch (message.type) {
      case "GET_CURRENT_STATE":
        sendResponse({ type: "CURRENT_STATE", state: currentState });
        break;

      case "CGV_DETECTED":
        if (currentState.status === "idle") {
          setState({ status: "detected", sourceUrl: message.sourceUrl });
        }
        break;

      case "TRIGGER_ANALYZE":
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tabId = tabs[0]?.id;
          if (!tabId) return;
          chrome.tabs.sendMessage(tabId, { type: "GET_CGV_TEXT" });
        });
        break;

      case "ANALYZE_REQUEST":
        analyze(message.text, message.domain, message.sourceUrl);
        break;
    }

    return true;
  },
);
