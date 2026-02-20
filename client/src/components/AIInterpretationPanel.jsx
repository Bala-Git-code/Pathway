import React from "react";

export default function AIInterpretationPanel({ analysis }) {
  if (!analysis) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-center text-sm text-slate-400">
        <h2 className="text-base font-semibold text-cyan-200">AI Interpretation</h2>
        <p className="mt-2">Run a perturbation to obtain a biological interpretation from the AI engine.</p>
      </section>
    );
  }

  const summary = analysis.summary || "";
  const affectedNodes = analysis.affected_nodes || [];
  const predictedOutcome = analysis.predicted_outcome || "";
  const biologicalContext = analysis.biological_context || "";

  return (
    <section className="rounded-2xl border border-cyan-900/60 bg-slate-950/75 p-4 shadow-[0_0_30px_rgba(34,211,238,0.12)]">
      <h2 className="text-base font-semibold text-cyan-200">AI Interpretation Panel</h2>
      {analysis.aiError && (
        <p className="mt-3 rounded-md border border-rose-500/50 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {analysis.aiError}
        </p>
      )}
      <div className="mt-4 space-y-4">
        <div>
          <h3 className="text-xs uppercase tracking-wide text-slate-400">Summary</h3>
          <p className="mt-1 text-sm text-slate-200">{summary}</p>
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-wide text-slate-400">Affected Nodes</h3>
          <div className="mt-1 flex flex-wrap gap-2">
            {affectedNodes.length > 0 ? (
              affectedNodes.map((nodeId) => (
                <span
                  key={nodeId}
                  className="rounded-full border border-cyan-500/50 bg-cyan-400/10 px-2 py-1 text-xs text-cyan-200"
                >
                  {nodeId}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-400">No affected nodes reported.</span>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-wide text-slate-400">Predicted Outcome</h3>
          <p className="mt-1 text-sm text-slate-200">{predictedOutcome}</p>
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-wide text-slate-400">Biological Context</h3>
          <p className="mt-1 text-sm text-slate-200">{biologicalContext}</p>
        </div>
      </div>
    </section>
  );
}
