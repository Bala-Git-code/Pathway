import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AIInterpretationPanel from "../components/AIInterpretationPanel";
import GraphViewer from "../components/GraphViewer";
import PerturbationPanel from "../components/PerturbationPanel";
import { pathwayApi } from "../services/api";

const emptyPathway = {
  name: "Untitled Pathway",
  nodes: [],
  edges: [],
};

const SIMULATION_STORAGE_KEY = "bio_pathway_latest_simulation";

export default function Workspace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [builderPathway, setBuilderPathway] = useState(emptyPathway);
  const [pathwayId, setPathwayId] = useState("");
  const [comparisonState, setComparisonState] = useState({ before: null, after: null });
  const [analysis, setAnalysis] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [selectedNodeDetails, setSelectedNodeDetails] = useState(null);
  const [perturbationType, setPerturbationType] = useState("knockout");
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [nodeIdInput, setNodeIdInput] = useState("");
  const [nodeLabelInput, setNodeLabelInput] = useState("");
  const [edgeSource, setEdgeSource] = useState("");
  const [edgeTarget, setEdgeTarget] = useState("");
  const [edgeType, setEdgeType] = useState("activation");
  const [pendingKnockoutNode, setPendingKnockoutNode] = useState("");
  const hasFetchedRef = useRef(false);

  const pathwayIdFromQuery = useMemo(() => searchParams.get("pathwayId"), [searchParams]);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const fetchPathway = async () => {
      try {
        const response = pathwayIdFromQuery
          ? await pathwayApi.getById(pathwayIdFromQuery)
          : await pathwayApi.getLatest();
        setBuilderPathway({
          name: response.data.name,
          nodes: response.data.nodes || [],
          edges: response.data.edges || [],
        });
        setPathwayId(response.data._id);
      } catch (requestError) {
        setError(
          requestError?.response?.data?.message ||
            "Unable to load pathway. Please verify backend connectivity."
        );
      }
    };

    fetchPathway();
  }, [pathwayIdFromQuery]);

  const clearSimulationState = () => {
    setComparisonState({ before: null, after: null });
    setAnalysis(null);
  };

  const handleCreateNode = () => {
    const id = nodeIdInput.trim();
    const label = nodeLabelInput.trim();
    if (!id || !label) {
      setError("Node ID and Label are required.");
      return;
    }
    if (builderPathway.nodes.some((node) => node.id === id)) {
      setError("Node ID already exists.");
      return;
    }

    setBuilderPathway((previous) => ({
      ...previous,
      nodes: [...previous.nodes, { id, label }],
    }));
    setShowNodeModal(false);
    setNodeIdInput("");
    setNodeLabelInput("");
    setError("");
    setSuccessMessage("Node added to pathway.");
    clearSimulationState();
  };

  const handleAddEdge = () => {
    if (!edgeSource || !edgeTarget) {
      setError("Source and Target are required.");
      return;
    }
    if (edgeSource === edgeTarget) {
      setError("Source and Target must be different.");
      return;
    }

    setBuilderPathway((previous) => ({
      ...previous,
      edges: [...previous.edges, { source: edgeSource, target: edgeTarget, type: edgeType }],
    }));
    setSuccessMessage("Interaction added.");
    setError("");
    clearSimulationState();
  };

  const handleSavePathway = async () => {
    if (!builderPathway.name.trim()) {
      setError("Pathway name is required.");
      return;
    }
    if (builderPathway.nodes.length < 2) {
      setError("Add at least two nodes for meaningful simulation.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const payload = {
        name: builderPathway.name,
        nodes: builderPathway.nodes,
        edges: builderPathway.edges,
      };
      const response = pathwayId
        ? await pathwayApi.update(pathwayId, payload)
        : await pathwayApi.create(payload);
      setPathwayId(response.data._id);
      setBuilderPathway({
        name: response.data.name,
        nodes: response.data.nodes,
        edges: response.data.edges,
      });
      setSuccessMessage(pathwayId ? "Pathway updated successfully." : "Pathway saved successfully.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to save pathway.");
    } finally {
      setIsSaving(false);
    }
  };

  const runPerturbation = async () => {
    if (!pathwayId) {
      setError("Save pathway before simulation.");
      return;
    }
    if (!selectedNodeId) {
      setError("Select a target node.");
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setSuccessMessage("");
    setPendingKnockoutNode(perturbationType === "knockout" ? selectedNodeId : "");

    try {
      const response = await pathwayApi.perturb(pathwayId, {
        type: perturbationType,
        nodeId: selectedNodeId,
      });

      const snapshot = {
        pathwayId,
        timestamp: new Date().toISOString(),
        originalPathway: response.data.originalPathway,
        perturbedPathway: response.data.pathway,
        analysis: response.data.analysis,
        perturbation: response.data.perturbation,
      };

      localStorage.setItem(SIMULATION_STORAGE_KEY, JSON.stringify(snapshot));

      setComparisonState({
        before: response.data.originalPathway,
        after: response.data.pathway,
      });
      setBuilderPathway({
        name: response.data.pathway.name,
        nodes: response.data.pathway.nodes,
        edges: response.data.pathway.edges,
      });
      setAnalysis(response.data.analysis);
      setSuccessMessage("Perturbation simulation completed.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Simulation failed.");
    } finally {
      setIsAnalyzing(false);
      setPendingKnockoutNode("");
    }
  };

  const originalPathway = comparisonState.before || builderPathway;
  const perturbedPathway = comparisonState.after || builderPathway;
  const handleNodeClick = useCallback((node) => {
    setSelectedNodeId(node.id);
    setSelectedNodeDetails(node);
  }, []);

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-cyan-900/60 bg-slate-950/70 p-5 shadow-[0_0_40px_rgba(34,211,238,0.15)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-cyan-100">Workspace</h1>
            <p className="mt-1 text-sm text-slate-300">
              Construct pathway topology, run perturbations, and inspect network transitions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/analysis")}
            className="rounded-md border border-cyan-500/50 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-400/20"
          >
            Open Analysis View
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        {successMessage && <p className="mt-3 text-sm text-emerald-300">{successMessage}</p>}
      </header>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[1fr_420px]">
        <div className="relative space-y-4">
          <GraphViewer
            originalPathway={originalPathway}
            perturbedPathway={perturbedPathway}
            analysis={analysis}
            selectedNodeId={selectedNodeId}
            pendingKnockoutNode={pendingKnockoutNode}
            onNodeClick={handleNodeClick}
          />
          {isAnalyzing && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-950/50">
              <div className="flex items-center gap-2 rounded-md border border-cyan-800/50 bg-slate-900/80 px-4 py-2 text-sm text-cyan-200">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
                Running AI-assisted simulation...
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-cyan-900/60 bg-slate-950/75 p-4">
            <h2 className="text-base font-semibold text-cyan-200">Pathway Builder</h2>
            <div className="mt-3 space-y-3">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
                  Pathway Name
                </label>
                <input
                  value={builderPathway.name}
                  onChange={(event) => {
                    setBuilderPathway((previous) => ({ ...previous, name: event.target.value }));
                    clearSimulationState();
                  }}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowNodeModal(true)}
                  className="rounded-md border border-cyan-500/60 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-200 hover:bg-cyan-400/20"
                >
                  Add Node
                </button>
                <button
                  type="button"
                  onClick={handleSavePathway}
                  disabled={isSaving}
                  className="rounded-md bg-teal-400/90 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-300 disabled:bg-slate-700 disabled:text-slate-300"
                >
                  {isSaving ? "Saving..." : pathwayId ? "Update Pathway" : "Save Pathway"}
                </button>
              </div>

              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">Add Edge</p>
                <div className="grid grid-cols-1 gap-2">
                  <select
                    value={edgeSource}
                    onChange={(event) => setEdgeSource(event.target.value)}
                    className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  >
                    <option value="">Source Node</option>
                    {builderPathway.nodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={edgeTarget}
                    onChange={(event) => setEdgeTarget(event.target.value)}
                    className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  >
                    <option value="">Target Node</option>
                    {builderPathway.nodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={edgeType}
                    onChange={(event) => setEdgeType(event.target.value)}
                    className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  >
                    <option value="activation">Activation</option>
                    <option value="inhibition">Inhibition</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddEdge}
                    className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
                  >
                    Add Connection
                  </button>
                </div>
              </div>
            </div>
          </section>

          <PerturbationPanel
            pathway={builderPathway}
            perturbationType={perturbationType}
            selectedNodeId={selectedNodeId}
            isLoading={isAnalyzing}
            onSelectNode={setSelectedNodeId}
            onSelectPerturbationType={setPerturbationType}
            onApply={runPerturbation}
          />

          <section className="rounded-2xl border border-cyan-900/60 bg-slate-950/75 p-4">
            <h2 className="text-base font-semibold text-cyan-200">Node Inspector</h2>
            {selectedNodeDetails ? (
              <div className="mt-2 space-y-1 text-sm text-slate-200">
                <p>
                  <span className="text-slate-400">ID:</span> {selectedNodeDetails.id}
                </p>
                <p>
                  <span className="text-slate-400">Label:</span> {selectedNodeDetails.label}
                </p>
                <p>
                  <span className="text-slate-400">Influence:</span> {selectedNodeDetails.influenceScore}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-400">
                Select a node in either graph to inspect properties.
              </p>
            )}
          </section>

          <AIInterpretationPanel analysis={analysis} />
        </aside>
      </div>

      {showNodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-cyan-900/60 bg-slate-900 p-5 shadow-[0_0_40px_rgba(34,211,238,0.2)]">
            <h2 className="text-lg font-semibold text-cyan-200">Add Node</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
                  Node ID
                </label>
                <input
                  value={nodeIdInput}
                  onChange={(event) => setNodeIdInput(event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
                  Label
                </label>
                <input
                  value={nodeLabelInput}
                  onChange={(event) => setNodeLabelInput(event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNodeModal(false)}
                className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNode}
                className="rounded-md bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
              >
                Add Node
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
