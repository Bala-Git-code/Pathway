import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AIInterpretationPanel from "../components/AIInterpretationPanel";
import AnalysisPanel from "../components/AnalysisPanel";
import GraphViewer from "../components/GraphViewer";
import PerturbationPanel from "../components/PerturbationPanel";
import StepIndicator from "../components/StepIndicator";
import { pathwayApi } from "../services/api";

/* ── Constants ── */
const SIMULATION_STORAGE_KEY = "bio_pathway_latest_simulation";
const EMPTY_PATHWAY = { name: "", nodes: [], edges: [] };

/* ── Tiny hook: auto-clear flash message ── */
function useFlash(ms = 3500) {
  const [msg, setMsg] = useState("");
  const timerRef = useRef(null);
  const flash = useCallback((text) => {
    clearTimeout(timerRef.current);
    setMsg(text);
    timerRef.current = setTimeout(() => setMsg(""), ms);
  }, [ms]);
  useEffect(() => () => clearTimeout(timerRef.current), []);
  return [msg, flash];
}

/* ═══════════════════════════════════════════════════════ */
export default function Workspace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  /* ── Pathway state ── */
  const [pathway, setPathway] = useState(EMPTY_PATHWAY);
  const [pathwayId, setPathwayId] = useState("");

  /* ── Simulation state ── */
  const [simulationResult, setSimulationResult] = useState(null); // { originalPathway, perturbedPathway, analysis }
  const [aiResult, setAiResult] = useState(null);

  /* ── UI state ── */
  const [loading, setLoading] = useState({ saving: false, simulating: false, loadingPaths: false });
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [selectedNodeDetails, setSelectedNodeDetails] = useState(null);
  const [perturbationType, setPerturbationType] = useState("knockout");
  const [pendingKnockoutNode, setPendingKnockoutNode] = useState("");

  /* ── Builder form state ── */
  const [nodeIdInput, setNodeIdInput] = useState("");
  const [nodeLabelInput, setNodeLabelInput] = useState("");
  const [nodeInfluence, setNodeInfluence] = useState("1");
  const [edgeSource, setEdgeSource] = useState("");
  const [edgeTarget, setEdgeTarget] = useState("");
  const [edgeType, setEdgeType] = useState("activation");

  /* ── Modals ── */
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [availablePathways, setAvailablePathways] = useState([]);

  /* ── Notifications ── */
  const [error, setError] = useState("");
  const [success, flashSuccess] = useFlash();

  const hasFetchedRef = useRef(false);
  const pathwayIdFromQuery = useMemo(() => searchParams.get("pathwayId"), [searchParams]);

  /* ── Step calculation ── */
  const currentStep = useMemo(() => {
    if (simulationResult?.analysis) return 3;
    if (pathwayId) return 2;
    return 1;
  }, [simulationResult, pathwayId]);

  /* ── Load pathway from query param on mount ── */
  useEffect(() => {
    if (hasFetchedRef.current || !pathwayIdFromQuery) return;
    hasFetchedRef.current = true;
    (async () => {
      try {
        const { data } = await pathwayApi.getById(pathwayIdFromQuery);
        setPathway({ name: data.name, nodes: data.nodes || [], edges: data.edges || [] });
        setPathwayId(data._id);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load pathway from URL.");
      }
    })();
  }, [pathwayIdFromQuery]);

  /* ── Derived view data ── */
  const originalPathway = simulationResult?.originalPathway || pathway;
  const perturbedPathway = simulationResult?.perturbedPathway || pathway;
  const analysis = simulationResult?.analysis || null;

  /* ── Handlers: builder ── */
  const clearSimulation = () => {
    setSimulationResult(null);
    setAiResult(null);
    setPendingKnockoutNode("");
  };

  const handleCreateNode = () => {
    const id = nodeIdInput.trim();
    const label = nodeLabelInput.trim();
    const influence = parseFloat(nodeInfluence) || 1;

    if (!id) { setError("Node ID is required."); return; }
    if (!label) { setError("Node Label is required."); return; }
    if (pathway.nodes.some((n) => n.id === id)) {
      setError(`Node ID "${id}" already exists. Use a unique ID.`);
      return;
    }

    setPathway((prev) => ({
      ...prev,
      nodes: [...prev.nodes, { id, label, influenceScore: influence }],
    }));
    setShowNodeModal(false);
    setNodeIdInput("");
    setNodeLabelInput("");
    setNodeInfluence("1");
    setError("");
    flashSuccess(`Node "${label}" added.`);
    clearSimulation();
  };

  const handleRemoveNode = (nodeId) => {
    setPathway((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => n.id !== nodeId),
      edges: prev.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    }));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId("");
      setSelectedNodeDetails(null);
    }
    clearSimulation();
    flashSuccess(`Node "${nodeId}" removed.`);
  };

  const handleAddEdge = () => {
    if (!edgeSource || !edgeTarget) { setError("Select both source and target."); return; }
    if (edgeSource === edgeTarget) { setError("Self-loops are not allowed."); return; }

    // Check duplicate edge
    const duplicate = pathway.edges.some(
      (e) => e.source === edgeSource && e.target === edgeTarget && e.type === edgeType
    );
    if (duplicate) { setError("This edge already exists."); return; }

    setPathway((prev) => ({
      ...prev,
      edges: [...prev.edges, { source: edgeSource, target: edgeTarget, type: edgeType }],
    }));
    setError("");
    flashSuccess("Connection added.");
    clearSimulation();
  };

  const handleRemoveEdge = (idx) => {
    setPathway((prev) => ({
      ...prev,
      edges: prev.edges.filter((_, i) => i !== idx),
    }));
    clearSimulation();
  };

  const handleClearPathway = () => {
    setPathway(EMPTY_PATHWAY);
    setPathwayId("");
    setSelectedNodeId("");
    setSelectedNodeDetails(null);
    clearSimulation();
    flashSuccess("Pathway cleared.");
  };

  /* ── Save pathway ── */
  const handleSavePathway = async () => {
    if (!pathway.name.trim()) { setError("Pathway name is required."); return; }
    if (pathway.nodes.length < 2) { setError("Add at least 2 nodes before saving."); return; }

    setLoading((l) => ({ ...l, saving: true }));
    setError("");
    try {
      const payload = { name: pathway.name, nodes: pathway.nodes, edges: pathway.edges };
      const { data } = pathwayId
        ? await pathwayApi.update(pathwayId, payload)
        : await pathwayApi.create(payload);
      setPathwayId(data._id);
      setPathway({ name: data.name, nodes: data.nodes, edges: data.edges });
      flashSuccess(pathwayId ? "Pathway updated." : "Pathway saved successfully!");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save pathway.");
    } finally {
      setLoading((l) => ({ ...l, saving: false }));
    }
  };

  /* ── Load pathway from DB ── */
  const openLoadModal = async () => {
    setLoading((l) => ({ ...l, loadingPaths: true }));
    try {
      const { data } = await pathwayApi.getAll();
      setAvailablePathways(data || []);
      setShowLoadModal(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to fetch saved pathways.");
    } finally {
      setLoading((l) => ({ ...l, loadingPaths: false }));
    }
  };

  const loadPathwayById = async (id) => {
    try {
      const { data } = await pathwayApi.getById(id);
      setPathway({ name: data.name, nodes: data.nodes || [], edges: data.edges || [] });
      setPathwayId(data._id);
      clearSimulation();
      setShowLoadModal(false);
      flashSuccess(`Loaded: ${data.name}`);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load pathway.");
    }
  };

  /* ── Run simulation ── */
  const runSimulation = async () => {
    if (!pathwayId) { setError("Save the pathway first."); return; }
    if (!selectedNodeId) { setError("Select a target node."); return; }
    if (pathway.nodes.length < 1) { setError("Pathway has no nodes."); return; }

    setLoading((l) => ({ ...l, simulating: true }));
    setError("");
    setPendingKnockoutNode(perturbationType === "knockout" ? selectedNodeId : "");

    try {
      const { data } = await pathwayApi.perturb(pathwayId, {
        type: perturbationType,
        nodeId: selectedNodeId,
      });

      const snap = {
        pathwayId,
        timestamp: new Date().toISOString(),
        originalPathway: data.originalPathway,
        perturbedPathway: data.pathway,
        analysis: data.analysis,
        perturbation: data.perturbation,
      };
      try { localStorage.setItem(SIMULATION_STORAGE_KEY, JSON.stringify(snap)); } catch { /* storage full */ }

      setSimulationResult({
        originalPathway: data.originalPathway,
        perturbedPathway: data.pathway,
        analysis: data.analysis,
        perturbation: data.perturbation,
      });

      // Keep pathway synced with latest saved state (not perturbed)
      flashSuccess("Simulation complete! Scroll down for analysis.");
    } catch (err) {
      setError(err?.response?.data?.message || "Simulation failed. Check backend connection.");
    } finally {
      setLoading((l) => ({ ...l, simulating: false }));
      setPendingKnockoutNode("");
    }
  };

  /* ── Node click handler ── */
  const handleNodeClick = useCallback((node) => {
    setSelectedNodeId(node.id);
    setSelectedNodeDetails(node);
  }, []);

  /* ═══════════════  RENDER  ═══════════════ */
  return (
    <div className="space-y-5">

      {/* ── Header + Step Indicator ── */}
      <header className="glass-card glow-cyan-sm p-5">
        <StepIndicator currentStep={currentStep} />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-cyan-100">
              Simulation Workspace
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Build → Save → Perturb → Analyze · All data is user-defined
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openLoadModal}
              disabled={loading.loadingPaths}
              className="btn-secondary text-xs"
              id="load-pathway-btn"
            >
              {loading.loadingPaths ? <span className="spinner" /> : null}
              Load Saved
            </button>
            {analysis && (
              <button
                type="button"
                onClick={() => navigate("/analysis")}
                className="btn-primary text-xs"
                id="open-analysis-btn"
              >
                Open Full Analysis →
              </button>
            )}
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mt-3 alert-error flex items-center gap-2">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 flex-shrink-0">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
            <button onClick={() => setError("")} className="ml-auto text-rose-400 hover:text-rose-200">✕</button>
          </div>
        )}
        {success && (
          <div className="mt-3 alert-success flex items-center gap-2">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 flex-shrink-0">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        )}
      </header>

      {/* ── Main 2-col grid ── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">

        {/* ── LEFT: Graph workspace ── */}
        <div className="space-y-5">

          {/* Graph viewer */}
          <div className="relative">
            <GraphViewer
              originalPathway={originalPathway}
              perturbedPathway={perturbedPathway}
              analysis={analysis}
              selectedNodeId={selectedNodeId}
              pendingKnockoutNode={pendingKnockoutNode}
              onNodeClick={handleNodeClick}
            />

            {/* Simulating overlay */}
            {loading.simulating && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl" style={{ background: "rgba(6,13,26,0.55)", backdropFilter: "blur(4px)" }}>
                <div className="glass-card glow-cyan flex items-center gap-3 px-6 py-3">
                  <span className="spinner spinner-lg" style={{ width: "1.5rem", height: "1.5rem" }} />
                  <div>
                    <p className="text-sm font-semibold text-cyan-200">Running Simulation…</p>
                    <p className="text-xs text-slate-500">Computing metrics + AI analysis</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Analysis panels — shown after simulation */}
          {analysis && (
            <div className="fade-in-up space-y-4" id="analysis-section">
              <AnalysisPanel
                analysis={analysis}
                originalPathway={originalPathway}
                perturbedPathway={perturbedPathway}
              />
              <AIInterpretationPanel analysis={analysis} />
            </div>
          )}
        </div>

        {/* ── RIGHT: Sidebar ── */}
        <aside className="space-y-4">

          {/* ── Pathway Builder ── */}
          <section className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-800/50">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-cyan-400">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold text-cyan-200">Pathway Builder</h2>
              </div>
              {(pathway.nodes.length > 0 || pathway.name) && (
                <button
                  type="button"
                  onClick={handleClearPathway}
                  className="btn-danger text-[11px] py-1"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Name */}
            <div className="mb-3">
              <label className="panel-header">Pathway Name</label>
              <input
                id="pathway-name-input"
                value={pathway.name}
                onChange={(e) => {
                  setPathway((p) => ({ ...p, name: e.target.value }));
                  clearSimulation();
                }}
                placeholder="e.g. MAPK Signaling Pathway"
                className="sci-input"
              />
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                id="add-node-btn"
                onClick={() => setShowNodeModal(true)}
                className="btn-secondary text-xs"
              >
                + Add Node
              </button>
              <button
                type="button"
                id="save-pathway-btn"
                onClick={handleSavePathway}
                disabled={loading.saving}
                className="btn-primary text-xs"
              >
                {loading.saving ? <><span className="spinner" /> Saving…</> : pathwayId ? "Update" : "Save Pathway"}
              </button>
            </div>

            {/* Pathway ID badge */}
            {pathwayId && (
              <div className="mb-3 flex items-center gap-2 rounded-md bg-emerald-500/5 border border-emerald-800/30 px-2.5 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="mono text-[10px] text-emerald-400 truncate">ID: {pathwayId}</span>
              </div>
            )}
          </section>

          {/* ── Add Edge ── */}
          <section className="glass-card p-4">
            <h2 className="panel-header">
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-cyan-500">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Add Interaction / Edge
            </h2>
            <div className="space-y-2">
              <select
                value={edgeSource}
                onChange={(e) => setEdgeSource(e.target.value)}
                className="sci-input"
                disabled={pathway.nodes.length < 2}
                id="edge-source-select"
              >
                <option value="">Source Node</option>
                {pathway.nodes.map((n) => (
                  <option key={n.id} value={n.id}>{n.label} ({n.id})</option>
                ))}
              </select>
              <select
                value={edgeTarget}
                onChange={(e) => setEdgeTarget(e.target.value)}
                className="sci-input"
                disabled={pathway.nodes.length < 2}
                id="edge-target-select"
              >
                <option value="">Target Node</option>
                {pathway.nodes.map((n) => (
                  <option key={n.id} value={n.id}>{n.label} ({n.id})</option>
                ))}
              </select>
              <select
                value={edgeType}
                onChange={(e) => setEdgeType(e.target.value)}
                className="sci-input"
                id="edge-type-select"
              >
                <option value="activation">Activation →</option>
                <option value="inhibition">Inhibition ⊣</option>
              </select>
              <button
                type="button"
                onClick={handleAddEdge}
                disabled={pathway.nodes.length < 2}
                className="btn-secondary w-full text-xs"
                id="add-edge-btn"
              >
                Add Connection
              </button>
            </div>
          </section>

          {/* ── Node List ── */}
          {pathway.nodes.length > 0 && (
            <section className="glass-card p-4">
              <h2 className="panel-header">
                Nodes ({pathway.nodes.length})
              </h2>
              <div className="space-y-1.5 panel-scroll">
                {pathway.nodes.map((node) => (
                  <div
                    key={node.id}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-all cursor-pointer ${selectedNodeId === node.id
                        ? "border-cyan-500/50 bg-cyan-500/10"
                        : "border-slate-800/60 bg-slate-900/40 hover:border-slate-700"
                      }`}
                    onClick={() => {
                      setSelectedNodeId(node.id);
                      setSelectedNodeDetails(node);
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="mono text-xs font-semibold text-cyan-300 truncate">{node.label}</p>
                      <p className="text-[10px] text-slate-600">id: {node.id} · inf: {node.influenceScore}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemoveNode(node.id); }}
                      className="ml-2 flex-shrink-0 text-slate-600 hover:text-rose-400 transition-colors text-xs"
                      title="Remove node"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Edge List ── */}
          {pathway.edges.length > 0 && (
            <section className="glass-card p-4">
              <h2 className="panel-header">Edges ({pathway.edges.length})</h2>
              <div className="space-y-1.5 panel-scroll">
                {pathway.edges.map((edge, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-900/40 px-3 py-2"
                  >
                    <span className="mono text-[11px] text-slate-400 truncate">
                      <span className={edge.type === "inhibition" ? "text-rose-400" : "text-emerald-400"}>
                        {edge.source}
                      </span>
                      {" "}
                      <span className="text-slate-600">{edge.type === "inhibition" ? "⊣" : "→"}</span>
                      {" "}
                      <span className="text-slate-300">{edge.target}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEdge(idx)}
                      className="ml-2 flex-shrink-0 text-slate-600 hover:text-rose-400 transition-colors text-xs"
                      title="Remove edge"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Perturbation Panel ── */}
          <PerturbationPanel
            pathway={pathway}
            pathwayId={pathwayId}
            perturbationType={perturbationType}
            selectedNodeId={selectedNodeId}
            isLoading={loading.simulating}
            onSelectNode={setSelectedNodeId}
            onSelectPerturbationType={setPerturbationType}
            onApply={runSimulation}
          />

          {/* ── Node Inspector ── */}
          <section className="glass-card p-4">
            <h2 className="panel-header">
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-cyan-500">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Node Inspector
            </h2>
            {selectedNodeDetails ? (
              <div className="space-y-1.5 text-xs">
                <Row label="ID" value={selectedNodeDetails.id} mono />
                <Row label="Label" value={selectedNodeDetails.label} />
                <Row label="Influence Score" value={selectedNodeDetails.influenceScore ?? 1} />
                {analysis && (
                  <>
                    <Row
                      label="Degree (after)"
                      value={analysis.degreeCentrality?.[selectedNodeDetails.id] ?? "N/A"}
                    />
                    <Row
                      label="Degree (before)"
                      value={analysis.beforeDegreeCentrality?.[selectedNodeDetails.id] ?? "N/A"}
                    />
                  </>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-600">
                Click a node in the graph or select from the list above.
              </p>
            )}
          </section>
        </aside>
      </div>

      {/* ══ Add Node Modal ══ */}
      {showNodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(6,13,26,0.75)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-sm glass-card glow-cyan p-5 slide-in-right" role="dialog" aria-modal="true" aria-label="Add node">
            <h2 className="text-base font-semibold text-cyan-200 mb-4">Add Node</h2>
            <div className="space-y-3">
              <div>
                <label className="panel-header" htmlFor="modal-node-id">Node ID</label>
                <input
                  id="modal-node-id"
                  value={nodeIdInput}
                  onChange={(e) => setNodeIdInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateNode()}
                  placeholder="e.g. EGFR"
                  className="sci-input"
                  autoFocus
                />
              </div>
              <div>
                <label className="panel-header" htmlFor="modal-node-label">Display Label</label>
                <input
                  id="modal-node-label"
                  value={nodeLabelInput}
                  onChange={(e) => setNodeLabelInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateNode()}
                  placeholder="e.g. Epidermal Growth Factor Receptor"
                  className="sci-input"
                />
              </div>
              <div>
                <label className="panel-header" htmlFor="modal-node-influence">Influence Score</label>
                <input
                  id="modal-node-influence"
                  type="number"
                  value={nodeInfluence}
                  onChange={(e) => setNodeInfluence(e.target.value)}
                  min="0.1"
                  step="0.1"
                  className="sci-input"
                />
                <p className="mt-1 text-[10px] text-slate-600">
                  Weights regulatory importance (default: 1.0)
                </p>
              </div>
              {error && <div className="alert-error text-xs">{error}</div>}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowNodeModal(false); setError(""); }}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNode}
                className="btn-primary text-xs"
                id="confirm-add-node-btn"
              >
                Add Node
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Load Pathway Modal ══ */}
      {showLoadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(6,13,26,0.75)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-md glass-card glow-cyan p-5 slide-in-right" role="dialog" aria-modal="true" aria-label="Load pathway">
            <h2 className="text-base font-semibold text-cyan-200 mb-4">Load Saved Pathway</h2>
            <div className="panel-scroll space-y-2">
              {availablePathways.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">No saved pathways found.</p>
              ) : (
                availablePathways.map((pw) => (
                  <button
                    key={pw._id}
                    type="button"
                    onClick={() => loadPathwayById(pw._id)}
                    className="block w-full rounded-lg border border-slate-700/60 bg-slate-900/60 px-4 py-3 text-left transition-all hover:border-cyan-700 hover:bg-cyan-900/20"
                  >
                    <p className="text-sm font-medium text-cyan-200">{pw.name || "Unnamed"}</p>
                    <p className="mono text-[10px] text-slate-600 mt-0.5">
                      {pw.nodes?.length ?? 0} nodes · {pw.edges?.length ?? 0} edges · {new Date(pw.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                ))
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLoadModal(false)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Tiny helper row ── */
function Row({ label, value, mono }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium text-slate-200 truncate max-w-[60%] text-right ${mono ? "mono" : ""}`}>
        {String(value ?? "—")}
      </span>
    </div>
  );
}
