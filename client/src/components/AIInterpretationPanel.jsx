import React from "react";

const CONFIDENCE_COLORS = {
  high: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-300" },
  medium: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-300" },
  low: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-300" },
};

function confidenceTier(score) {
  if (score >= 0.75) return "high";
  if (score >= 0.45) return "medium";
  return "low";
}

export default function AIInterpretationPanel({ analysis }) {
  /* Empty state */
  if (!analysis) {
    return (
      <section className="glass-card p-5 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 bg-slate-900/60">
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-slate-600">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17v-6H7l6-8v6h4l-6 8z" fill="currentColor" />
          </svg>
        </div>
        <h2 className="text-sm font-semibold text-slate-400">AI Interpretation</h2>
        <p className="mt-1.5 text-xs text-slate-600">
          Run a perturbation experiment to receive AI-generated biological insights.
        </p>
      </section>
    );
  }

  const summary = analysis.summary || "";
  const affectedNodes = analysis.affected_nodes || analysis.keyAffectedNodes || [];
  const predictedOutcome = analysis.predicted_outcome || analysis.predictedBiologicalOutcome || "";
  const bioContext = analysis.biological_context || "";
  const confidenceScore = typeof analysis.confidence_score === "number" ? analysis.confidence_score : null;
  const aiError = analysis.aiError;
  const aiUnavailable = analysis.aiUnavailable;
  const aiWarning = analysis.aiWarning;

  const tier = confidenceScore !== null ? confidenceTier(confidenceScore) : null;
  const conf = tier ? CONFIDENCE_COLORS[tier] : null;

  return (
    <section className="glass-card p-4 space-y-4 fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-violet-500/20 to-cyan-600/20 border border-violet-800/50">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-violet-400">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17v-6H7l6-8v6h4l-6 8z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-cyan-200">AI Interpretation Panel</h2>
        </div>

        {/* Confidence badge */}
        {confidenceScore !== null && conf && (
          <div
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${conf.bg} ${conf.border} ${conf.text}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {Math.round(confidenceScore * 100)}% confidence
          </div>
        )}
      </div>

      {/* Alerts */}
      {aiWarning && <div className="alert-warn text-xs">{aiWarning}</div>}
      {aiUnavailable && !aiWarning && (
        <div className="alert-warn text-xs">
          OpenAI key not configured — simulation ran successfully but AI insights are unavailable.
        </div>
      )}
      {aiError && !aiUnavailable && (
        <div className="alert-error text-xs">
          AI error: {aiError}
        </div>
      )}

      {/* Content */}
      <div className="space-y-4">
        {/* Summary */}
        {summary && (
          <div>
            <p className="panel-header">
              <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 text-cyan-500">
                <path d="M9 12h6M9 16h6M7 8h10M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              Summary
            </p>
            <p className="text-xs leading-relaxed text-slate-300">{summary}</p>
          </div>
        )}

        {/* Affected nodes */}
        <div>
          <p className="panel-header">
            <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 text-cyan-500">
              <circle cx="12" cy="12" r="3" fill="currentColor" />
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            Affected Nodes
          </p>
          {affectedNodes.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {affectedNodes.map((id) => (
                <span key={id} className="node-tag">
                  {id}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-600">No affected nodes identified.</p>
          )}
        </div>

        {/* Predicted outcome */}
        {predictedOutcome && (
          <div>
            <p className="panel-header">
              <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 text-cyan-500">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
              Predicted Outcome
            </p>
            <p className="text-xs leading-relaxed text-slate-300">{predictedOutcome}</p>
          </div>
        )}

        {/* Biological context */}
        {bioContext && (
          <div>
            <p className="panel-header">
              <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 text-cyan-500">
                <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              Biological Context
            </p>
            <p className="text-xs leading-relaxed text-slate-300">{bioContext}</p>
          </div>
        )}
      </div>
    </section>
  );
}
