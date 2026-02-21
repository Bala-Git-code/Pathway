import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

/* ── Custom tooltip ── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 text-xs space-y-1">
      <p className="mono font-semibold text-cyan-300">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function AnalysisPanel({ analysis, originalPathway, perturbedPathway }) {
  if (!analysis) {
    return (
      <section className="glass-card p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-slate-700 bg-slate-900/60">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-slate-600">
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
        <h2 className="text-sm font-semibold text-slate-400">No Analysis Data</h2>
        <p className="mt-1.5 text-xs text-slate-600">
          Build a pathway, save it, then run a perturbation simulation.
        </p>
      </section>
    );
  }

  /* ── Build chart data ── */
  const before = analysis.centralityComparison?.before || {};
  const after = analysis.centralityComparison?.after || analysis.degreeCentrality || {};
  const delta = analysis.centralityComparison?.delta || {};

  const allNodeIds = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));

  const chartData = allNodeIds.map((id) => ({
    node: id,
    Before: before[id] ?? 0,
    After: after[id] ?? 0,
    Delta: delta[id] ?? 0,
  }));

  const ranking = analysis.regulatoryRanking || [];
  const structural = analysis.structural || {};

  return (
    <div className="space-y-4 fade-in-up">
      {/* ─── Structural Panels ─── */}
      <section className="glass-card p-4">
        <h2 className="panel-header">
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-cyan-500">
            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          Structural Metrics
        </h2>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Nodes (After)"
            value={structural.perturbedNodeCount ?? perturbedPathway?.nodes?.length ?? "—"}
            sub={`was ${structural.originalNodeCount ?? originalPathway?.nodes?.length ?? "—"}`}
          />
          <MetricCard
            label="Edges (After)"
            value={structural.perturbedEdgeCount ?? perturbedPathway?.edges?.length ?? "—"}
            sub={`was ${structural.originalEdgeCount ?? originalPathway?.edges?.length ?? "—"}`}
          />
          <MetricCard
            label="Connectivity"
            value={`${analysis.connectivity?.after ?? "—"}%`}
            sub={`was ${analysis.connectivity?.before ?? "—"}%`}
            delta={analysis.connectivity?.deltaPercent}
          />
          <MetricCard
            label="Most Influential"
            value={analysis.mostInfluentialNode?.after || "—"}
            mono
            sub={`before: ${analysis.mostInfluentialNode?.before || "—"}`}
          />
        </div>
      </section>

      {/* ─── Centrality Bar Chart ─── */}
      {chartData.length > 0 && (
        <section className="glass-card p-4">
          <h2 className="panel-header">
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-cyan-500">
              <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Centrality — Before vs After
          </h2>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                barSize={14}
              >
                <CartesianGrid vertical={false} stroke="rgba(34,211,238,0.06)" />
                <XAxis
                  dataKey="node"
                  tick={{ fontSize: 10, fontFamily: "JetBrains Mono, monospace", fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
                  formatter={(v) => <span style={{ color: "#94a3b8", fontSize: 11 }}>{v}</span>}
                />
                <Bar dataKey="Before" fill="#0891b2" radius={[3, 3, 0, 0]} />
                <Bar dataKey="After" radius={[3, 3, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.Delta > 0
                          ? "#14b8a6"
                          : entry.Delta < 0
                            ? "#f43f5e"
                            : "#475569"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex gap-4 text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-teal-500 inline-block" /> Increased</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-rose-500 inline-block" /> Decreased</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-slate-500 inline-block" /> Unchanged</span>
          </div>
        </section>
      )}

      {/* ─── Centrality Comparison Table ─── */}
      {allNodeIds.length > 0 && (
        <section className="glass-card p-4">
          <h2 className="panel-header">
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-cyan-500">
              <path d="M4 6h16M4 10h16M4 14h16M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Centrality Comparison
          </h2>
          <div className="panel-scroll rounded-lg border border-slate-800/60 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-900/90">
                <tr>
                  {["Node", "Before", "After", "Delta"].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-[10px] uppercase tracking-wider text-slate-500 font-semibold"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allNodeIds.map((id) => {
                  const b = before[id] ?? 0;
                  const a = after[id] ?? 0;
                  const d = a - b;
                  return (
                    <tr key={id} className="border-t border-slate-800/40 hover:bg-slate-800/20 transition-colors">
                      <td className="px-3 py-2 mono font-medium text-cyan-300">{id}</td>
                      <td className="px-3 py-2 text-slate-400">{b}</td>
                      <td className="px-3 py-2 text-slate-200">{a}</td>
                      <td className={`px-3 py-2 font-semibold ${d > 0 ? "text-emerald-400" : d < 0 ? "text-rose-400" : "text-slate-500"}`}>
                        {d > 0 ? `+${d}` : d}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ─── Regulatory Ranking ─── */}
      {ranking.length > 0 && (
        <section className="glass-card p-4">
          <h2 className="panel-header">
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-cyan-500">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            Regulatory Node Ranking
          </h2>
          <div className="space-y-2 panel-scroll">
            {ranking.slice(0, 8).map((item, idx) => {
              const maxScore = ranking[0]?.regulatoryScore || 1;
              const pct = maxScore > 0 ? (item.regulatoryScore / maxScore) * 100 : 0;
              return (
                <div
                  key={item.nodeId}
                  className="glass-card-sm px-3 py-2.5 flex items-center gap-3"
                >
                  <span className="mono text-xs font-bold text-slate-600 w-5 text-center">
                    #{idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="mono text-xs font-semibold text-cyan-300 truncate">{item.nodeId}</span>
                      <span className="mono text-[10px] text-slate-500 ml-2 whitespace-nowrap">
                        score: {item.regulatoryScore?.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1 flex gap-3 text-[10px] text-slate-600">
                      <span>deg: {item.degree}</span>
                      <span>in: {item.inDegree}</span>
                      <span>out: {item.outDegree}</span>
                      <span>inf: {item.influenceScore}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

/* ── Metric card sub-component ── */
function MetricCard({ label, value, sub, delta, mono }) {
  const showDelta = delta !== undefined && delta !== null;
  return (
    <div className="metric-card">
      <p className="metric-label">{label}</p>
      <p className={`metric-value ${mono ? "mono text-xl" : ""}`} style={mono ? { fontSize: "1.1rem" } : undefined}>
        {value}
      </p>
      {sub && <p className="mt-1 text-[10px] text-slate-600">{sub}</p>}
      {showDelta && (
        <p className={`mt-1 text-[11px] font-semibold ${delta > 0 ? "text-emerald-400" : delta < 0 ? "text-rose-400" : "text-slate-500"}`}>
          {delta > 0 ? `↑ +${delta}%` : delta < 0 ? `↓ ${delta}%` : "→ 0%"}
        </p>
      )}
    </div>
  );
}
