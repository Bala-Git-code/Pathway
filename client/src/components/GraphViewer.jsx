import React, { useEffect, useMemo, useRef } from "react";
import cytoscape from "cytoscape";

/* ── Helpers ── */
function toElements(pathway) {
  const nodes = (pathway?.nodes || []).map((node) => ({
    data: {
      id: node.id,
      label: node.label || node.id,
      influenceScore: typeof node.influenceScore === "number" ? node.influenceScore : 1,
    },
  }));
  const edges = (pathway?.edges || []).map((edge, i) => ({
    data: {
      id: `e-${edge.source}-${edge.target}-${i}`,
      source: edge.source,
      target: edge.target,
      type: edge.type || "activation",
    },
  }));
  return [...nodes, ...edges];
}

function edgeKey(edge) {
  return `${edge.source}→${edge.target}:${edge.type || "activation"}`;
}

function buildStyle() {
  return [
    {
      selector: "node",
      style: {
        label: "data(label)",
        color: "#bae6fd",
        "font-size": 10,
        "font-family": "JetBrains Mono, monospace",
        "text-wrap": "wrap",
        "text-max-width": "80px",
        "text-valign": "bottom",
        "text-margin-y": 4,
        "background-color": "#0c4a6e",
        "border-width": 1.5,
        "border-color": "#0891b2",
        "width": 36,
        "height": 36,
        "overlay-opacity": 0,
        "transition-property": "background-color, border-color, border-width, width, height",
        "transition-duration": "400ms",
        "transition-timing-function": "ease-in-out",
      },
    },
    {
      selector: "edge",
      style: {
        width: 2,
        "curve-style": "bezier",
        "target-arrow-shape": "triangle",
        "line-color": "#334155",
        "target-arrow-color": "#334155",
        opacity: 0.8,
        "transition-property": "line-color, opacity, width",
        "transition-duration": "400ms",
        "transition-timing-function": "ease-in-out",
      },
    },
    {
      selector: 'edge[type = "activation"]',
      style: {
        "line-color": "#10b981",
        "target-arrow-color": "#10b981",
        opacity: 0.85,
      },
    },
    {
      selector: 'edge[type = "inhibition"]',
      style: {
        "line-color": "#f43f5e",
        "target-arrow-color": "#f43f5e",
        "target-arrow-shape": "tee",
        opacity: 0.85,
      },
    },
    {
      selector: "node.selected-node",
      style: {
        "border-width": 3,
        "border-color": "#f8fafc",
        "background-color": "#164e63",
        width: 42,
        height: 42,
      },
    },
    {
      selector: "node.high-centrality",
      style: {
        "background-color": "#854d0e",
        "border-color": "#fbbf24",
        "border-width": 3,
        color: "#fde68a",
        width: 46,
        height: 46,
      },
    },
    {
      selector: "node.knocked-out",
      style: {
        "background-color": "#7f1d1d",
        "border-color": "#ef4444",
        "border-width": 3,
        color: "#fca5a5",
        opacity: 0.55,
      },
    },
    {
      selector: "node.overexpressed",
      style: {
        "background-color": "#134e4a",
        "border-color": "#14b8a6",
        "border-width": 3,
        color: "#99f6e4",
        width: 44,
        height: 44,
      },
    },
    {
      selector: "node.affected-node",
      style: {
        "border-color": "#22d3ee",
        "border-width": 2.5,
      },
    },
    {
      selector: "edge.lost-connection",
      style: {
        "line-style": "dashed",
        "line-dash-pattern": [6, 4],
        "line-color": "#f97316",
        "target-arrow-color": "#f97316",
        width: 2.5,
        opacity: 0.6,
      },
    },
  ];
}

/* ── Component ── */
export default function GraphViewer({
  originalPathway,
  perturbedPathway,
  analysis,
  selectedNodeId,
  pendingKnockoutNode,
  onNodeClick,
}) {
  const origRef = useRef(null);
  const pertRef = useRef(null);
  const origCyRef = useRef(null);
  const pertCyRef = useRef(null);

  /* Track which edges were removed (shown as dashed orange in original) */
  const lostEdgeIds = useMemo(() => {
    const origEdges = originalPathway?.edges || [];
    const pertSet = new Set((perturbedPathway?.edges || []).map(edgeKey));
    return origEdges
      .map((edge, i) => ({ edge, id: `e-${edge.source}-${edge.target}-${i}` }))
      .filter(({ edge }) => !pertSet.has(edgeKey(edge)))
      .map(({ id }) => id);
  }, [originalPathway, perturbedPathway]);

  /* Build / rebuild original graph when pathway changes */
  useEffect(() => {
    if (!origRef.current) return;
    const cy = cytoscape({
      container: origRef.current,
      elements: toElements(originalPathway),
      style: buildStyle(),
      layout: {
        name: "cose",
        animate: true,
        animationDuration: 600,
        padding: 24,
        nodeRepulsion: () => 4000,
        idealEdgeLength: () => 90,
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
    });
    cy.on("tap", "node", (evt) => {
      onNodeClick({
        id: evt.target.id(),
        label: evt.target.data("label"),
        influenceScore: evt.target.data("influenceScore"),
      });
    });
    origCyRef.current = cy;
    return () => { cy.destroy(); origCyRef.current = null; };
  }, [originalPathway, onNodeClick]);

  /* Build / rebuild perturbed graph */
  useEffect(() => {
    if (!pertRef.current) return;
    const cy = cytoscape({
      container: pertRef.current,
      elements: toElements(perturbedPathway),
      style: buildStyle(),
      layout: {
        name: "cose",
        animate: true,
        animationDuration: 600,
        padding: 24,
        nodeRepulsion: () => 4000,
        idealEdgeLength: () => 90,
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
    });
    cy.on("tap", "node", (evt) => {
      onNodeClick({
        id: evt.target.id(),
        label: evt.target.data("label"),
        influenceScore: evt.target.data("influenceScore"),
      });
    });
    pertCyRef.current = cy;
    return () => { cy.destroy(); pertCyRef.current = null; };
  }, [perturbedPathway, onNodeClick]);

  /* Selected node highlight — both graphs */
  useEffect(() => {
    [origCyRef.current, pertCyRef.current].forEach((cy) => {
      if (!cy) return;
      cy.nodes().removeClass("selected-node");
      if (selectedNodeId) cy.$id(selectedNodeId).addClass("selected-node");
    });
  }, [selectedNodeId]);

  /* Lost-edge dashes on original + analysis classes on perturbed */
  useEffect(() => {
    const origCy = origCyRef.current;
    const pertCy = pertCyRef.current;
    if (!origCy || !pertCy) return;

    origCy.edges().removeClass("lost-connection");
    lostEdgeIds.forEach((id) => origCy.$id(id).addClass("lost-connection"));

    pertCy.nodes().removeClass("high-centrality knocked-out overexpressed affected-node");
    (analysis?.highCentralityNodes || []).forEach((id) => {
      pertCy.$id(id).addClass("high-centrality");
    });
    if (analysis?.knockedOutNode) pertCy.$id(analysis.knockedOutNode).addClass("knocked-out");
    if (analysis?.overexpressedNode) pertCy.$id(analysis.overexpressedNode).addClass("overexpressed");
    (analysis?.affected_nodes || []).forEach((id) => pertCy.$id(id).addClass("affected-node"));
  }, [analysis, lostEdgeIds]);

  /* Knockout preview fade */
  useEffect(() => {
    const cy = pertCyRef.current;
    if (!cy || !pendingKnockoutNode) return;
    const node = cy.$id(pendingKnockoutNode);
    if (!node.length) return;
    node.animate({ style: { opacity: 0.1, "background-color": "#ef4444" } }, { duration: 350 });
  }, [pendingKnockoutNode]);

  /* Pulse high-centrality nodes */
  useEffect(() => {
    let live = true;
    const cy = pertCyRef.current;
    if (!cy) return;
    const pulse = (node) => {
      if (!live || !pertCyRef.current) return;
      node.animate({ style: { "border-width": 5 } }, { duration: 700 })
        .then(() => { if (live) node.animate({ style: { "border-width": 3 } }, { duration: 700 }).then(() => pulse(node)); });
    };
    (analysis?.highCentralityNodes || []).forEach((id) => {
      const node = cy.$id(id);
      if (node.length) pulse(node);
    });
    return () => { live = false; };
  }, [analysis?.highCentralityNodes]);

  const hasOriginal = (originalPathway?.nodes?.length ?? 0) > 0;
  const hasPerturbed = (perturbedPathway?.nodes?.length ?? 0) > 0;

  const EmptyState = ({ label }) => (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 bg-slate-900/60">
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-slate-600">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {/* Original */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-cyan-950/60 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-500" />
            <span className="mono text-xs font-semibold uppercase tracking-widest text-slate-400">
              Original Network
            </span>
          </div>
          <span className="mono text-xs text-slate-600">
            {originalPathway?.nodes?.length ?? 0}N · {originalPathway?.edges?.length ?? 0}E
          </span>
        </div>
        <div ref={origRef} className="cy-container bg-[#060d1a]">
          {!hasOriginal && <EmptyState label="Add nodes to build your pathway" />}
        </div>
      </div>

      {/* Perturbed */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-cyan-950/60 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${analysis ? "bg-amber-400" : "bg-slate-600"
                }`}
            />
            <span className="mono text-xs font-semibold uppercase tracking-widest text-slate-400">
              {analysis ? "Perturbed Network" : "Awaiting Simulation"}
            </span>
          </div>
          <span className="mono text-xs text-slate-600">
            {perturbedPathway?.nodes?.length ?? 0}N · {perturbedPathway?.edges?.length ?? 0}E
          </span>
        </div>
        <div ref={pertRef} className="cy-container bg-[#060d1a]">
          {!hasPerturbed && (
            <EmptyState label={analysis ? "No perturbed nodes" : "Run simulation to see perturbed network"} />
          )}
        </div>
      </div>
    </div>
  );
}
