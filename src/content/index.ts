import { ExtensionMessage } from "../shared/types";

// ── Keywords that indicate a CGV page ────────────────────────────────────────

const CGV_KEYWORDS = [
  // French
  "conditions générales",
  "conditions d'utilisation",
  "conditions de vente",
  "mentions légales",
  "politique de confidentialité",
  // English
  "terms and conditions",
  "terms of service",
  "terms of use",
  "privacy policy",
  "conditions of use",
  "user agreement",
  // Generic
  "intellectual property",
  "propriété intellectuelle",
  "limitation of liability",
  "limitation de responsabilité",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractPageText(): string {
  const clone = document.body.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll("script, style, noscript")
    .forEach((el) => el.remove());
  return clone.innerText.trim();
}

function hasCgvKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  return CGV_KEYWORDS.some((keyword) => lower.includes(keyword));
}

// ── Main detection ────────────────────────────────────────────────────────────

function detect() {
  const text = extractPageText();

  if (text.length < 100) return;
  if (!hasCgvKeywords(text)) return;

  const msg: ExtensionMessage = {
    type: "CGV_DETECTED",
    text,
    sourceUrl: window.location.href,
  };

  chrome.runtime.sendMessage(msg);
}

// ── Listen for messages from background ──────────────────────────────────────

chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
  if (message.type === "GET_CGV_TEXT") {
    const msg: ExtensionMessage = {
      type: "ANALYZE_REQUEST",
      text: extractPageText(),
      siteDomain: window.location.hostname,
      sourceUrl: window.location.href,
    };
    chrome.runtime.sendMessage(msg);
  }
});

// Run once DOM is ready
detect();
