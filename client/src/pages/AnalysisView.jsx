import React, { useCallback, useEffect, useMemo, useState } from "react";
import AIInterpretationPanel from "../components/AIInterpretationPanel";
import GraphViewer from "../components/GraphViewer";
import { pathwayApi } from "../services/api";

const SIMULATION_STORAGE_KEY = "bio_pathway_latest_simulation";

function calculateDegree(pathway) {
  const degrees = {};
  (pathway?.nodes || []).forEach((node) => {
    degrees[node.id] = 0;
  });
  (pathway?.edges || []).forEach((edge) => {
    if (degrees[edge.source] !== undefined) degrees[edge.source] += 1;
    if (degrees[edge.target] !== undefined) degrees[edge.target] += 1;
  });
  return degrees;
}

export default function AnalysisView() {
  const [originalPathway, setOriginalPathway] = useState({ name: "", nodes: [], edges: [] });
  const [perturbedPathway, setPerturbedPathway] = useState({ name: "", nodes: [], edges: [] });
  const [analysis, setAnalysis] = useState({});
  const [statusText, setStatusText] = useState("Loading analysis framework...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const snapshotRaw = localStorage.getItem(SIMULATION_STORAGE_KEY);
        if (snapshotRaw) {
          const snapshot = JSON.parse(snapshotRaw);
          setOriginalPathway(snapshot.originalPathway || { name: "", nodes: [], edges: [] });
          setPerturbedPathway(snapshot.perturbedPathway || { name: "", nodes: [], edges: [] });
          setAnalysis(snapshot.analysis || {});
          setStatusText(
            `Analysis generated from latest simulation at ${new Date(snapshot.timestamp).toLocaleString()}.`
          );
        } else {
          setStatusText("No simulation data found. Run a perturbation in the Workspace first.");
        }
      } catch (error) {
        setStatusText("Unable to load analysis data. Check storage or backend.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const beforeCentrality = analysis.centralityComparison?.before || {};
  const afterCentrality =
    analysis.centralityComparison?.after || analysis.degreeCentrality || calculateDegree(perturbedPathway);

  const metrics = useMemo(() => {
    const totalNodes = perturbedPathway.nodes.length;
    const totalEdges = perturbedPathway.edges.length;
    const beforeEdges = originalPathway.edges.length;
    const connectivityChangePercent =
      beforeEdges > 0 ? (((totalEdges - beforeEdges) / beforeEdges) * 100).toFixed(1) : "0.0";
    const influentialEntry = Object.entries(afterCentrality).sort((a, b) => b[1] - a[1])[0] || [];
    const mostInfluentialNode = influentialEntry[0] || "N/A";
    return { totalNodes, totalEdges, connectivityChangePercent, mostInfluentialNode };
  }, [afterCentrality, originalPathway.edges.length, perturbedPathway.edges.length, perturbedPathway.nodes.length]);

  const comparisonRows = useMemo(() => {
    const nodeIds = Array.from(new Set([...Object.keys(beforeCentrality), ...Object.keys(afterCentrality)]));
    return nodeIds.map((nodeId) => ({
      nodeId,
      before: beforeCentrality[nodeId] ?? 0,
      after: afterCentrality[nodeId] ?? 0,
      delta: (afterCentrality[nodeId] ?? 0) - (beforeCentrality[nodeId] ?? 0),
    }));
  }, [afterCentrality, beforeCentrality]);

  const perturbationSummary = useMemo(() => {
    const lostConnections = Math.max(0, originalPathway.edges.length - perturbedPathway.edges.length);
    const newHubs = analysis.highCentralityNodes?.join(", ") || "None";
    const affected = analysis.affected_nodes?.join(", ") || "None";
    return {
      lostConnections,
      newHubs,
      affected,
    };
  }, [analysis.affected_nodes, analysis.highCentralityNodes, originalPathway.edges.length, perturbedPathway.edges.length]);
  const handleNodeClick = useCallback(() => {}, []);

  return (
    <section className="space-y-4">
      <header className="relative rounded-2xl border border-cyan-900/60 bg-slate-950/70 p-5">
        <h1 className="text-2xl font-semibold text-cyan-100">Analysis View</h1>
        <p className="mt-1 text-sm text-slate-300">
          Structural metrics, perturbation impact quantification, and AI biological interpretation.
        </p>
        <p className="mt-2 text-xs text-slate-400">{statusText}</p>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-950/60">
            <div className="flex items-center gap-2 rounded-md border border-cyan-800/50 bg-slate-900/80 px-4 py-2 text-sm text-cyan-200">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
              Loading analysis…
            </div>
          </div>
        )}
      </header>

      {analysis ? (
        <>
          <GraphViewer
            originalPathway={originalPathway}
            perturbedPathway={perturbedPathway}
            analysis={analysis}
            selectedNodeId=""
            pendingKnockoutNode=""
            onNodeClick={handleNodeClick}
          />

          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-cyan-900/60 bg-slate-950/75 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total Nodes</p>
          <p className="mt-2 text-2xl font-semibold text-cyan-200 transition-all duration-500 ease-in-out">{metrics.totalNodes}</p>
        </div>
        <div className="rounded-xl border border-cyan-900/60 bg-slate-950/75 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total Edges</p>
          <p className="mt-2 text-2xl font-semibold text-cyan-200 transition-all duration-500 ease-in-out">{metrics.totalEdges}</p>
        </div>
        <div className="rounded-xl border border-cyan-900/60 bg-slate-950/75 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Connectivity Change %</p>
          <p className="mt-2 text-2xl font-semibold text-cyan-200 transition-all duration-500 ease-in-out">{metrics.connectivityChangePercent}%</p>
        </div>
        <div className="rounded-xl border border-cyan-900/60 bg-slate-950/75 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Most Influential Node</p>
          <p className="mt-2 text-2xl font-semibold text-cyan-200 transition-all duration-500 ease-in-out">{metrics.mostInfluentialNode}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-900/60 bg-slate-950/75 p-4">
        <h2 className="text-base font-semibold text-cyan-200">Centrality Comparison (Before vs After)</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-2">Node</th>
                <th className="px-3 py-2">Before</th>
                <th className="px-3 py-2">After</th>
                <th className="px-3 py-2">Delta</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.nodeId} className="border-t border-slate-800">
                  <td className="px-3 py-2 font-medium">{row.nodeId}</td>
                  <td className="px-3 py-2">{row.before}</td>
                  <td className="px-3 py-2">{row.after}</td>
                  <td className={`px-3 py-2 ${row.delta >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {row.delta > 0 ? `+${row.delta}` : row.delta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-900/60 bg-slate-950/75 p-4">
        <h2 className="text-base font-semibold text-cyan-200">Perturbation Impact Summary</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-wide text-slate-400">Lost Connections</p>
            <p className="mt-1 text-lg font-semibold text-amber-300">{perturbationSummary.lostConnections}</p>
          </div>
          <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-wide text-slate-400">New Hubs</p>
            <p className="mt-1 text-sm text-cyan-200">{perturbationSummary.newHubs}</p>
          </div>
          <div className="rounded-md border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-wide text-slate-400">AI Affected Nodes</p>
            <p className="mt-1 text-sm text-cyan-200">{perturbationSummary.affected}</p>
          </div>
        </div>
      </section>

          <AIInterpretationPanel analysis={analysis} />
        </>
      ) : null}
    </section>
  );
}
