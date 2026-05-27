import "./popup.css";
import {
  AnalysisResult,
  ClauseCategory,
  ExtensionMessage,
  PopupState,
} from "../shared/types";
import { CLAUSE_TYPE_LABELS, SEVERITY_ORDER } from "../shared/constants";

// ── DOM root ─────────────────────────────────────────────────────────────────

const root = document.getElementById("root")!;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getScoreTier(score: number): "safe" | "warn" | "danger" {
  if (score >= 60) return "safe";
  if (score >= 35) return "warn";
  return "danger";
}

function getVerdict(score: number): string {
  if (score >= 60) return "Mostly reliable";
  if (score >= 35) return "Read carefully";
  return "Problematic clauses";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function sortedClauses(clauses: ClauseCategory[]): ClauseCategory[] {
  return [...clauses].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
}

// ── Render helpers ────────────────────────────────────────────────────────────

function renderHeader(domain?: string): string {
  return `
    <div class="header">
      <div class="header__logo">C</div>
      <span class="header__title">Clausify</span>
      ${domain ? `<span class="header__domain">${domain}</span>` : ""}
    </div>
  `;
}

function renderScoreRing(score: number): string {
  const tier = getScoreTier(score);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return `
    <div class="score-ring">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle class="score-ring__track" cx="36" cy="36" r="${radius}" />
        <circle
          class="score-ring__fill stroke--${tier}"
          cx="36" cy="36" r="${radius}"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${offset}"
        />
      </svg>
      <div class="score-ring__label">
        <span class="score-ring__value score--${tier}">${score}</span>
        <span class="score-ring__unit">/100</span>
      </div>
    </div>
  `;
}

function renderClause(clause: ClauseCategory): string {
  const label = CLAUSE_TYPE_LABELS[clause.type] ?? clause.type;
  return `
    <div class="clause-item clause-item--${clause.severity}">
      <div class="clause-item__dot"></div>
      <div class="clause-item__body">
        <div class="clause-item__type">${label}</div>
        <div class="clause-item__summary">${clause.summary}</div>
      </div>
    </div>
  `;
}

// ── State renderers ───────────────────────────────────────────────────────────

function renderIdle(): string {
  return `
    ${renderHeader()}
    <div class="content">
      <div class="idle">
        <div class="idle__icon">📋</div>
        <div class="idle__title">No Terms detected</div>
        <div class="idle__desc">
          Navigate to a page with Terms &amp; Conditions,
          or import a text file to analyze it.
        </div>
      </div>
    </div>
    <div class="footer">
      <div class="btn-group">
        <button class="btn btn--ghost" id="btn-upload">
          📂 Import a file
        </button>
      </div>
    </div>
    <input type="file" id="file-input" accept=".txt,.pdf" style="display:none" />
  `;
}

function renderDetected(sourceUrl: string): string {
  return `
    ${renderHeader(new URL(sourceUrl).hostname)}
    <div class="content">
      <div class="detected">
        <div class="detected__banner">
          <div class="detected__dot"></div>
          <span class="detected__text">CGV détectées sur cette page</span>
        </div>
      </div>
    </div>
    <div class="footer">
      <div class="btn-group">
        <button class="btn btn--primary" id="btn-analyze">
          🔍 Analyser les CGV
        </button>
        <button class="btn btn--ghost" id="btn-upload">
          📂 Importer un fichier
        </button>
      </div>
    </div>
    <input type="file" id="file-input" accept=".txt,.pdf" style="display:none" />
  `;
}

function renderLoading(): string {
  return `
    ${renderHeader()}
    <div class="content">
      <div class="loading">
        <div class="loading__spinner"></div>
        <div class="loading__text">Analyse en cours…</div>
      </div>
    </div>
  `;
}

function renderResult(result: AnalysisResult): string {
  const tier = getScoreTier(result.score);
  const clauses = sortedClauses(result.clauses);
  const clausesHtml = clauses.map(renderClause).join("");
  const webUrl = `http://localhost:5173/sites/${result.siteDomain}`;

  return `
    ${renderHeader(result.siteDomain)}
    <div class="content">
      <div class="score-section">
        ${renderScoreRing(result.score)}
        <div class="score-info">
          <div class="score-info__label">Score de confiance</div>
          <div class="score-info__verdict score--${tier}">${getVerdict(result.score)}</div>
          <div class="score-info__date">Analysé le ${formatDate(result.analyzedAt)}</div>
        </div>
      </div>
      <div class="clauses">
        ${clausesHtml}
      </div>
    </div>
    <div class="footer">
      <div class="btn-group">
        <button class="btn btn--primary" id="btn-open-web" data-url="${webUrl}">
          Voir le rapport complet →
        </button>
        <button class="btn btn--ghost" id="btn-reanalyze">
          🔄 Relancer l'analyse
        </button>
      </div>
    </div>
  `;
}

function renderError(message: string): string {
  return `
    ${renderHeader()}
    <div class="content">
      <div class="error">
        <div class="error__icon">⚠️</div>
        <div class="error__title">Analyse échouée</div>
        <div class="error__desc">${message}</div>
      </div>
    </div>
    <div class="footer">
      <button class="btn btn--ghost" id="btn-retry">Réessayer</button>
    </div>
  `;
}

// ── Event binding ─────────────────────────────────────────────────────────────

function bindEvents(state: PopupState) {
  const btnUpload = document.getElementById("btn-upload");
  const fileInput = document.getElementById(
    "file-input",
  ) as HTMLInputElement | null;

  btnUpload?.addEventListener("click", () => fileInput?.click());

  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const text = await file.text();
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const sourceUrl = tab.url ?? "file://upload";
    const siteDomain = new URL(sourceUrl).hostname || "upload";
    const msg: ExtensionMessage = {
      type: "ANALYZE_REQUEST",
      text,
      siteDomain,
      sourceUrl,
    };
    chrome.runtime.sendMessage(msg);
  });

  const btnAnalyze = document.getElementById("btn-analyze");
  btnAnalyze?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "TRIGGER_ANALYZE" });
  });

  const btnOpenWeb = document.getElementById("btn-open-web");
  btnOpenWeb?.addEventListener("click", () => {
    const url = btnOpenWeb.getAttribute("data-url");
    if (url) chrome.tabs.create({ url });
  });

  const btnReanalyze = document.getElementById("btn-reanalyze");
  btnReanalyze?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "TRIGGER_ANALYZE" });
  });

  const btnRetry = document.getElementById("btn-retry");
  btnRetry?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "TRIGGER_ANALYZE" });
  });
}

// ── Main render ───────────────────────────────────────────────────────────────

function render(state: PopupState) {
  switch (state.status) {
    case "idle":
      root.innerHTML = renderIdle();
      break;
    case "detected":
      root.innerHTML = renderDetected(state.sourceUrl);
      break;
    case "loading":
      root.innerHTML = renderLoading();
      break;
    case "result":
      root.innerHTML = renderResult(state.result);
      break;
    case "error":
      root.innerHTML = renderError(state.message);
      break;
  }
  bindEvents(state);
}

// ── Boot ──────────────────────────────────────────────────────────────────────

chrome.runtime.sendMessage(
  { type: "GET_CURRENT_STATE" } satisfies ExtensionMessage,
  (response: ExtensionMessage) => {
    if (response?.type === "CURRENT_STATE") {
      render(response.state);
    } else {
      render({ status: "idle" });
    }
  },
);

// Listen for live updates while popup is open
chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
  if (message.type === "ANALYSIS_RESULT") {
    render({ status: "result", result: message.result });
  } else if (message.type === "ANALYSIS_ERROR") {
    render({ status: "error", message: message.message });
  }
});
