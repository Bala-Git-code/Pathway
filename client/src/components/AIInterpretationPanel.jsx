import React from "react";

export default function AIInterpretationPanel({ analysis }) {
  const summary = analysis?.summary || "Awaiting model interpretation from the latest simulation.";
  const affectedNodes = analysis?.affected_nodes || [];
  const predictedOutcome =
    analysis?.predicted_outcome || "Predicted outcome will appear after perturbation.";
  const biologicalContext =
    analysis?.biological_context ||
    "Biological context will be generated after AI interpretation is complete.";

  return (
    <section className="rounded-2xl border border-cyan-900/60 bg-slate-950/75 p-4 shadow-[0_0_30px_rgba(34,211,238,0.12)]">
      <h2 className="text-base font-semibold text-cyan-200">AI Interpretation Panel</h2>
      {analysis?.aiWarning && (
        <p className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {analysis.aiWarning}
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
              <span className="text-sm text-slate-400">No affected nodes reported yet.</span>
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
