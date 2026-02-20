import React from "react";

export default function AnalysisPanel({ analysis }) {
  if (!analysis) {
    return (
      <section className="rounded-2xl border border-cyan-900/60 bg-slate-950/75 p-4 backdrop-blur">
        <h2 className="text-base font-semibold text-cyan-200">Analysis</h2>
        <p className="mt-2 text-sm text-slate-400">
          No analysis data available. Perform a simulation or visit the Analysis view for full metrics.
        </p>
      </section>
    );
  }

  const centralityEntries = Object.entries(analysis.degreeCentrality || {}).sort(
    (a, b) => b[1] - a[1]
  );
  const beforeCentrality = analysis.centralityComparison?.before || {};
  const afterCentrality = analysis.centralityComparison?.after || analysis.degreeCentrality || {};
  const comparisonNodeIds = Array.from(
    new Set([...Object.keys(beforeCentrality), ...Object.keys(afterCentrality)])
  );

  return (
    <section className="rounded-2xl border border-cyan-900/60 bg-slate-950/75 p-4 backdrop-blur">
      <h2 className="text-base font-semibold text-cyan-200">Analysis</h2>

      <div className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Centrality Ranking
        </h3>
        <div className="mt-2 overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-900/70 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2">Node</th>
                <th className="px-3 py-2">Degree</th>
              </tr>
            </thead>
            <tbody>
              {centralityEntries.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-3 py-3 text-slate-400">
                    No centrality values available.
                  </td>
                </tr>
              )}
              {centralityEntries.map(([nodeId, score]) => (
                <tr key={nodeId} className="border-t border-slate-800">
                  <td className="px-3 py-2 font-medium">{nodeId}</td>
                  <td className="px-3 py-2">{score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Centrality Comparison (Before vs After)
        </h3>
        <div className="mt-2 overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-900/70 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2">Node</th>
                <th className="px-3 py-2">Before</th>
                <th className="px-3 py-2">After</th>
              </tr>
            </thead>
            <tbody>
              {comparisonNodeIds.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-3 text-slate-400">
                    No comparison values available.
                  </td>
                </tr>
              )}
              {comparisonNodeIds.map((nodeId) => (
                <tr key={nodeId} className="border-t border-slate-800">
                  <td className="px-3 py-2 font-medium">{nodeId}</td>
                  <td className="px-3 py-2">{beforeCentrality[nodeId] ?? "-"}</td>
                  <td className="px-3 py-2">{afterCentrality[nodeId] ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Regulatory Node Importance
          </h3>
          <div className="mt-2 space-y-2">
            {(analysis.regulatoryRanking || []).slice(0, 8).map((item) => (
              <div
                key={item.nodeId}
                className="rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-300"
              >
                <p className="font-medium text-cyan-200">{item.nodeId}</p>
                <p>Degree: {item.degree}</p>
                <p>Influence: {item.influenceScore}</p>
                <p>Regulatory Score: {item.regulatoryScore}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-cyan-800/40 bg-gradient-to-br from-slate-900 to-slate-950 p-4 shadow-[0_0_30px_rgba(34,211,238,0.12)]">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
          Research Summary Card
        </h3>

        <div className="mt-3 space-y-3">
          {analysis.aiWarning && (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              {analysis.aiWarning}
            </div>
          )}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Summary</h4>
            <p className="mt-1 text-sm text-slate-200">{analysis.summary}</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Affected Nodes
            </h4>
            <div className="mt-1 flex flex-wrap gap-2">
              {(analysis.affected_nodes || analysis.keyAffectedNodes || []).map((node) => (
                <span
                  key={node}
                  className="rounded-full border border-cyan-500/40 bg-cyan-400/10 px-2 py-1 text-xs text-cyan-200"
                >
                  {node}
                </span>
              ))}
              {(analysis.affected_nodes || analysis.keyAffectedNodes || []).length === 0 && (
                <span className="text-sm text-slate-400">No nodes reported.</span>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Predicted Outcome
            </h4>
            <p className="mt-1 text-sm text-slate-200">
              {analysis.predicted_outcome || analysis.predictedBiologicalOutcome}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
