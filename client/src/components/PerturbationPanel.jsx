import React from "react";

export default function PerturbationPanel({
  pathway,
  perturbationType,
  selectedNodeId,
  isLoading,
  onSelectNode,
  onSelectPerturbationType,
  onApply,
}) {
  return (
    <section className="rounded-2xl border border-cyan-900/60 bg-slate-950/75 p-4 backdrop-blur">
      <h2 className="text-base font-semibold text-cyan-200">Perturbation Panel</h2>

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="nodeSelect" className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
            Target Node
          </label>
          <select
            id="nodeSelect"
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
            value={selectedNodeId}
            onChange={(event) => onSelectNode(event.target.value)}
          >
            <option value="">Select node</option>
            {(pathway?.nodes || []).map((node) => (
              <option key={node.id} value={node.id}>
                {node.label} ({node.id})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
            Perturbation Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200">
              <input
                type="radio"
                name="perturbation"
                value="knockout"
                checked={perturbationType === "knockout"}
                onChange={(event) => onSelectPerturbationType(event.target.value)}
              />
              Knockout
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200">
              <input
                type="radio"
                name="perturbation"
                value="overexpression"
                checked={perturbationType === "overexpression"}
                onChange={(event) => onSelectPerturbationType(event.target.value)}
              />
              Overexpression
            </label>
          </div>
        </div>

        <button
          type="button"
          onClick={onApply}
          disabled={isLoading || !selectedNodeId}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-cyan-500/90 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
        >
          {isLoading && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          )}
          {isLoading ? "Running Simulation..." : "Run Simulation"}
        </button>
      </div>
    </section>
  );
}
