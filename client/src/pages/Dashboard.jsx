import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AnalysisPanel from "../components/AnalysisPanel";
import GraphViewer from "../components/GraphViewer";
import PerturbationPanel from "../components/PerturbationPanel";
import { pathwayApi } from "../services/api";

const emptyPathway = {
  name: "Untitled Pathway",
  nodes: [],
  edges: [],
};

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const [builderPathway, setBuilderPathway] = useState(emptyPathway);
  const [pathwayId, setPathwayId] = useState("");
  const [comparisonState, setComparisonState] = useState({ before: null, after: null });
  const [viewMode, setViewMode] = useState("after");
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
    if (hasFetchedRef.current) {
      return;
    }
    hasFetchedRef.current = true;

    const fetchPathway = async () => {
      setError("");
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
        if (requestError?.response?.status !== 404) {
          setError(
            requestError?.response?.data?.message ||
              "Unable to load existing pathway. Start by building a new one."
          );
        }
      }
    };

    fetchPathway();
  }, [pathwayIdFromQuery]);

  const activePathway =
    viewMode === "before" && comparisonState.before
      ? comparisonState.before
      : viewMode === "after" && comparisonState.after
      ? comparisonState.after
      : builderPathway;

  const clearComparison = () => {
    setComparisonState({ before: null, after: null });
    setViewMode("after");
  };

  const handleCreateNode = () => {
    const id = nodeIdInput.trim();
    const label = nodeLabelInput.trim();

    if (!id || !label) {
      setError("Node ID and label are required.");
      return;
    }
    if (builderPathway.nodes.some((node) => node.id === id)) {
      setError("Node ID already exists. Use a unique ID.");
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
    setSuccessMessage("Node added.");
    clearComparison();
  };

  const handleAddEdge = () => {
    if (!edgeSource || !edgeTarget) {
      setError("Select source and target nodes.");
      return;
    }
    if (edgeSource === edgeTarget) {
      setError("Source and target must be different nodes.");
      return;
    }

    setBuilderPathway((previous) => ({
      ...previous,
      edges: [...previous.edges, { source: edgeSource, target: edgeTarget, type: edgeType }],
    }));
    setError("");
    setSuccessMessage("Edge added.");
    clearComparison();
  };

  const handleSavePathway = async () => {
    if (!builderPathway.name.trim()) {
      setError("Pathway name is required.");
      return;
    }
    if (builderPathway.nodes.length === 0) {
      setError("Add at least one node before saving.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccessMessage("");

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
      setSuccessMessage(pathwayId ? "Pathway updated." : "Pathway created.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to save pathway.");
    } finally {
      setIsSaving(false);
    }
  };

  const runPerturbation = async () => {
    if (!pathwayId) {
      setError("Save pathway before running simulation.");
      return;
    }
    if (!selectedNodeId) {
      setError("Select a target node.");
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setSuccessMessage("");
    if (perturbationType === "knockout") {
      setPendingKnockoutNode(selectedNodeId);
    } else {
      setPendingKnockoutNode("");
    }

    try {
      const response = await pathwayApi.perturb(pathwayId, {
        type: perturbationType,
        nodeId: selectedNodeId,
      });

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
      setViewMode("after");
      setSuccessMessage("Simulation completed.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Simulation failed.");
    } finally {
      setIsAnalyzing(false);
      setPendingKnockoutNode("");
    }
  };

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-cyan-900/60 bg-slate-950/70 p-5 shadow-[0_0_40px_rgba(34,211,238,0.15)] backdrop-blur">
        <h1 className="text-2xl font-semibold text-cyan-100">Bio Pathway AI Workspace</h1>
        <p className="mt-1 text-sm text-slate-300">
          Build pathway networks visually, simulate perturbations, and review AI-assisted
          biological interpretation.
        </p>
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        {successMessage && <p className="mt-3 text-sm text-emerald-300">{successMessage}</p>}
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_370px]">
        <div className="space-y-4">
          <GraphViewer
            pathway={activePathway}
            selectedNodeId={selectedNodeId}
            analysis={analysis}
            pendingKnockoutNode={pendingKnockoutNode}
            onNodeClick={(node) => {
              setSelectedNodeId(node.id);
              setSelectedNodeDetails(node);
            }}
          />

          <div className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Before vs After</p>
            <div className="mt-2 inline-flex rounded-lg border border-slate-700 p-1">
              <button
                type="button"
                onClick={() => setViewMode("before")}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  viewMode === "before"
                    ? "bg-cyan-500 text-slate-950"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                Before
              </button>
              <button
                type="button"
                onClick={() => setViewMode("after")}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  viewMode === "after"
                    ? "bg-cyan-500 text-slate-950"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                After
              </button>
            </div>
          </div>
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
                    setBuilderPathway((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }));
                    clearComparison();
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
                    <option value="">Source node</option>
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
                    <option value="">Target node</option>
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
            <h2 className="text-base font-semibold text-cyan-200">Node Details</h2>
            {!selectedNodeDetails && (
              <p className="mt-2 text-sm text-slate-400">Click a node in the graph.</p>
            )}
            {selectedNodeDetails && (
              <div className="mt-2 space-y-1 text-sm text-slate-200">
                <p>
                  <span className="text-slate-400">ID:</span> {selectedNodeDetails.id}
                </p>
                <p>
                  <span className="text-slate-400">Label:</span> {selectedNodeDetails.label}
                </p>
                <p>
                  <span className="text-slate-400">Influence:</span>{" "}
                  {selectedNodeDetails.influenceScore}
                </p>
              </div>
            )}
          </section>

          <AnalysisPanel analysis={analysis} />
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
