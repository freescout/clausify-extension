import { API_ANALYZE_URL } from "../shared/constants";
import { ExtensionMessage, PopupState } from "../shared/types";

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

  try {
    const response = await fetch(API_ANALYZE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, siteDomain, sourceUrl }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error ?? "Erreur serveur");
    }

    const result = await response.json();
    setState({ status: "result", result });
    chrome.runtime
      .sendMessage({
        type: "ANALYSIS_RESULT",
        result,
      } satisfies ExtensionMessage)
      .catch(() => {});
  } catch (error) {
    const message = (error as Error).message ?? "Erreur inconnue";
    setState({ status: "error", message });
    chrome.runtime
      .sendMessage({
        type: "ANALYSIS_ERROR",
        message,
      } satisfies ExtensionMessage)
      .catch(() => {});
  }
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
        analyze(message.text, message.siteDomain, message.sourceUrl);
        break;
    }

    return true;
  },
);
