import React, { useCallback, useEffect, useMemo, useState } from "react";
import AIInterpretationPanel from "../components/AIInterpretationPanel";
import AnalysisPanel from "../components/AnalysisPanel";
import GraphViewer from "../components/GraphViewer";
import { useNavigate } from "react-router-dom";

const SIMULATION_STORAGE_KEY = "bio_pathway_latest_simulation";

export default function AnalysisView() {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState("Loading analysis data…");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIMULATION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSnapshot(parsed);
        setStatusText(
          `Simulation performed on ${new Date(parsed.timestamp).toLocaleString()} · Pathway ID: ${parsed.pathwayId || "N/A"}`
        );
      } else {
        setStatusText("No simulation data found. Run a perturbation experiment in the Workspace first.");
      }
    } catch {
      setStatusText("Unable to load analysis data.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleNodeClick = useCallback(() => { }, []);

  const hasData = !!snapshot?.analysis;
  const originalPathway = snapshot?.originalPathway || { name: "", nodes: [], edges: [] };
  const perturbedPathway = snapshot?.perturbedPathway || { name: "", nodes: [], edges: [] };
  const analysis = snapshot?.analysis || null;

  const perturbation = snapshot?.perturbation;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <header className="glass-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="mono text-xs uppercase tracking-widest text-cyan-600 mb-1">Analysis View</p>
            <h1 className="text-xl font-semibold text-cyan-100">
              Perturbation Results Dashboard
            </h1>
            <p className="mt-1 text-xs text-slate-500">{statusText}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate("/workspace")}
              className="btn-secondary text-xs"
            >
              ← Back to Workspace
            </button>
            {hasData && (
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(SIMULATION_STORAGE_KEY);
                  setSnapshot(null);
                  setStatusText("Analysis cleared.");
                }}
                className="btn-danger text-xs"
              >
                Clear Analysis
              </button>
            )}
          </div>
        </div>

        {/* Perturbation badge */}
        {perturbation && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium
                         border-cyan-800/50 bg-cyan-900/20 text-cyan-300">
            <span className={`h-2 w-2 rounded-full ${perturbation.type === "knockout" ? "bg-rose-400" : "bg-teal-400"}`} />
            {perturbation.type === "knockout" ? "Knockout" : "Overexpression"} of{" "}
            <span className="mono font-semibold">{perturbation.nodeId}</span>
          </div>
        )}
      </header>

      {loading ? (
        <div className="glass-card flex items-center justify-center gap-3 p-16">
          <span className="spinner spinner-lg" />
          <span className="text-sm text-slate-400">Loading analysis framework…</span>
        </div>
      ) : !hasData ? (
        <div className="glass-card p-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-700 bg-slate-900/60">
            <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-slate-600">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-slate-400">No Simulation Data</h2>
          <p className="mt-2 text-sm text-slate-600 max-w-sm mx-auto">
            Build a pathway in the Workspace, save it, then run a perturbation simulation to generate analysis data.
          </p>
          <button
            type="button"
            onClick={() => navigate("/workspace")}
            className="btn-primary mt-6 text-sm"
          >
            Go to Workspace
          </button>
        </div>
      ) : (
        <div className="space-y-5 fade-in-up">
          {/* Graph comparison */}
          <section className="glass-card p-4">
            <h2 className="panel-header mb-3">
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-cyan-500">
                <rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="13" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="3" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="13" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              Network Comparison — Original vs Perturbed
            </h2>
            <GraphViewer
              originalPathway={originalPathway}
              perturbedPathway={perturbedPathway}
              analysis={analysis}
              selectedNodeId=""
              pendingKnockoutNode=""
              onNodeClick={handleNodeClick}
            />
          </section>

          {/* Full analysis */}
          <AnalysisPanel
            analysis={analysis}
            originalPathway={originalPathway}
            perturbedPathway={perturbedPathway}
          />

          {/* AI Panel */}
          <AIInterpretationPanel analysis={analysis} />
        </div>
      )}
    </div>
  );
}
