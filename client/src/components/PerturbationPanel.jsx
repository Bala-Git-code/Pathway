import React from "react";

export default function PerturbationPanel({
  pathway,
  pathwayId,
  perturbationType,
  selectedNodeId,
  isLoading,
  onSelectNode,
  onSelectPerturbationType,
  onApply,
}) {
  const nodes = pathway?.nodes || [];
  const canRun = !isLoading && !!selectedNodeId && nodes.length >= 1 && !!pathwayId;

  const typeConfig = {
    knockout: {
      color: "rose",
      icon: "✕",
      desc: "Remove node and all incident edges",
    },
    overexpression: {
      color: "teal",
      icon: "↑",
      desc: "Multiply node influence score ×2",
    },
  };

  return (
    <section className="glass-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-800/50">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-cyan-400">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-sm font-semibold text-cyan-200">Perturbation Engine</h2>
      </div>

      {/* No pathway saved warning */}
      {!pathwayId && (
        <div className="alert-warn text-xs">
          ⚠ Save your pathway first to enable simulation.
        </div>
      )}

      {/* Target node */}
      <div>
        <label
          htmlFor="perturbation-node-select"
          className="panel-header"
        >
          Target Node
        </label>
        <select
          id="perturbation-node-select"
          className="sci-input"
          value={selectedNodeId}
          onChange={(e) => onSelectNode(e.target.value)}
          disabled={nodes.length === 0}
        >
          <option value="">
            {nodes.length === 0 ? "Add nodes first…" : "Select target node…"}
          </option>
          {nodes.map((n) => (
            <option key={n.id} value={n.id}>
              {n.label} ({n.id})
            </option>
          ))}
        </select>
      </div>

      {/* Perturbation type */}
      <div>
        <p className="panel-header">Perturbation Type</p>
        <div className="grid grid-cols-2 gap-2">
          {["knockout", "overexpression"].map((type) => {
            const cfg = typeConfig[type];
            const isSelected = perturbationType === type;
            return (
              <label
                key={type}
                className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border p-3 transition-all duration-200 ${isSelected
                    ? type === "knockout"
                      ? "border-rose-500/60 bg-rose-500/10 text-rose-200"
                      : "border-teal-500/60 bg-teal-500/10 text-teal-200"
                    : "border-slate-700/60 bg-slate-900/40 text-slate-400 hover:border-slate-600"
                  }`}
              >
                <input
                  type="radio"
                  name="perturbation-type"
                  value={type}
                  checked={isSelected}
                  onChange={(e) => onSelectPerturbationType(e.target.value)}
                  className="sr-only"
                />
                <span className="text-lg font-bold leading-none">{cfg.icon}</span>
                <span className="text-xs font-semibold capitalize">{type}</span>
                <span className="text-center text-[10px] leading-tight opacity-70">
                  {cfg.desc}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Run button */}
      <button
        id="run-simulation-btn"
        type="button"
        onClick={onApply}
        disabled={!canRun}
        className="btn-primary w-full"
      >
        {isLoading ? (
          <>
            <span className="spinner" />
            Simulating...
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M8 5v14l11-7z" />
            </svg>
            Run Simulation
          </>
        )}
      </button>

      {/* Legend */}
      <div className="border-t border-slate-800/60 pt-3">
        <p className="panel-header">Node Legend</p>
        <div className="flex flex-wrap gap-2">
          <span className="node-tag danger">● Knocked-out</span>
          <span className="node-tag success">● Overexpressed</span>
          <span className="node-tag">● High Centrality</span>
        </div>
      </div>
    </section>
  );
}
