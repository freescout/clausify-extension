import { ExtensionMessage } from "../shared/types";

// ── Keywords that indicate a CGV page ────────────────────────────────────────

const CGV_KEYWORDS = [
  "conditions générales",
  "conditions d'utilisation",
  "mentions légales",
  "politique de confidentialité",
  "terms and conditions",
  "terms of service",
  "privacy policy",
  "terms of use",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractPageText(): string {
  // Remove script and style tags before extracting text
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

// Run once DOM is ready
detect();
