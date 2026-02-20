import React, { useEffect, useMemo, useRef } from "react";
import cytoscape from "cytoscape";

function toElements(pathway) {
  const nodes = (pathway?.nodes || []).map((node) => ({
    data: {
      id: node.id,
      label: node.label,
      influenceScore: node.influenceScore || 1,
    },
  }));

  const edges = (pathway?.edges || []).map((edge, index) => ({
    data: {
      id: `${edge.source}-${edge.target}-${index}`,
      source: edge.source,
      target: edge.target,
      type: edge.type || "activation",
    },
  }));

  return [...nodes, ...edges];
}

function edgeKey(edge) {
  return `${edge.source}->${edge.target}:${edge.type || "activation"}`;
}

function baseStyle() {
  return [
    {
      selector: "node",
      style: {
        label: "data(label)",
        color: "#dbeafe",
        "font-size": 11,
        "text-wrap": "wrap",
        "text-max-width": "90px",
        "text-valign": "bottom",
        "background-color": "#1d4ed8",
        "border-width": 1.5,
        "border-color": "#38bdf8",
        "overlay-opacity": 0,
      },
    },
    {
      selector: "edge",
      style: {
        width: 2.2,
        "curve-style": "bezier",
        "target-arrow-shape": "triangle",
        "line-color": "#64748b",
        "target-arrow-color": "#64748b",
        opacity: 0.95,
      },
    },
    {
      selector: 'edge[type = "activation"]',
      style: {
        "line-color": "#22c55e",
        "target-arrow-color": "#22c55e",
      },
    },
    {
      selector: 'edge[type = "inhibition"]',
      style: {
        "line-color": "#ef4444",
        "target-arrow-color": "#ef4444",
      },
    },
    {
      selector: "node.selected-node",
      style: {
        "border-width": 3,
        "border-color": "#f8fafc",
      },
    },
    {
      selector: "node.high-centrality",
      style: {
        "background-color": "#facc15",
        color: "#111827",
        "border-color": "#fde047",
        "border-width": 4,
      },
    },
    {
      selector: "node.knocked-out",
      style: {
        "background-color": "#ef4444",
      },
    },
    {
      selector: "node.overexpressed",
      style: {
        "background-color": "#14b8a6",
      },
    },
    {
      selector: "node.affected-node",
      style: {
        "border-color": "#22d3ee",
        "border-width": 4,
      },
    },
    {
      selector: "edge.lost-connection",
      style: {
        "line-style": "dashed",
        "line-color": "#f97316",
        "target-arrow-color": "#f97316",
        width: 3,
      },
    },
  ];
}

export default function GraphViewer({
  originalPathway,
  perturbedPathway,
  analysis,
  selectedNodeId,
  pendingKnockoutNode,
  onNodeClick,
}) {
  const originalRef = useRef(null);
  const perturbedRef = useRef(null);
  const originalCyRef = useRef(null);
  const perturbedCyRef = useRef(null);

  const lostEdgeIds = useMemo(() => {
    const originalEdges = originalPathway?.edges || [];
    const perturbedSet = new Set((perturbedPathway?.edges || []).map(edgeKey));
    return originalEdges
      .map((edge, index) => ({ edge, id: `${edge.source}-${edge.target}-${index}` }))
      .filter(({ edge }) => !perturbedSet.has(edgeKey(edge)))
      .map(({ id }) => id);
  }, [originalPathway, perturbedPathway]);

  useEffect(() => {
    if (!originalRef.current) return undefined;
    const cy = cytoscape({
      container: originalRef.current,
      elements: toElements(originalPathway),
      style: baseStyle(),
      layout: { name: "cose", animate: true, animationDuration: 500, padding: 18 },
    });
    cy.on("tap", "node", (event) => {
      const node = event.target;
      onNodeClick({
        id: node.id(),
        label: node.data("label"),
        influenceScore: node.data("influenceScore"),
      });
    });
    originalCyRef.current = cy;
    return () => {
      cy.destroy();
      originalCyRef.current = null;
    };
  }, [originalPathway, onNodeClick]);

  useEffect(() => {
    if (!perturbedRef.current) return undefined;
    const cy = cytoscape({
      container: perturbedRef.current,
      elements: toElements(perturbedPathway),
      style: baseStyle(),
      layout: { name: "cose", animate: true, animationDuration: 500, padding: 18 },
    });
    cy.on("tap", "node", (event) => {
      const node = event.target;
      onNodeClick({
        id: node.id(),
        label: node.data("label"),
        influenceScore: node.data("influenceScore"),
      });
    });
    perturbedCyRef.current = cy;
    return () => {
      cy.destroy();
      perturbedCyRef.current = null;
    };
  }, [perturbedPathway, onNodeClick]);

  useEffect(() => {
    [originalCyRef.current, perturbedCyRef.current].forEach((cy) => {
      if (!cy) return;
      cy.nodes().removeClass("selected-node");
      if (selectedNodeId) {
        cy.$id(selectedNodeId).addClass("selected-node");
      }
    });
  }, [selectedNodeId]);

  useEffect(() => {
    const originalCy = originalCyRef.current;
    const perturbedCy = perturbedCyRef.current;
    if (!originalCy || !perturbedCy) return;

    originalCy.edges().removeClass("lost-connection");
    lostEdgeIds.forEach((id) => {
      originalCy.$id(id).addClass("lost-connection");
    });

    perturbedCy.nodes().removeClass("high-centrality knocked-out overexpressed affected-node");
    (analysis?.highCentralityNodes || []).forEach((nodeId) => {
      perturbedCy.$id(nodeId).addClass("high-centrality");
    });
    if (analysis?.knockedOutNode) {
      perturbedCy.$id(analysis.knockedOutNode).addClass("knocked-out");
    }
    if (analysis?.overexpressedNode) {
      perturbedCy.$id(analysis.overexpressedNode).addClass("overexpressed");
    }
    (analysis?.affected_nodes || []).forEach((nodeId) => {
      perturbedCy.$id(nodeId).addClass("affected-node");
    });
  }, [analysis, lostEdgeIds]);

  useEffect(() => {
    if (!perturbedCyRef.current || !pendingKnockoutNode) return;
    const targetNode = perturbedCyRef.current.$id(pendingKnockoutNode);
    if (targetNode.length === 0) return;
    targetNode.animate(
      {
        style: { opacity: 0.05, "background-color": "#ef4444" },
      },
      { duration: 420 }
    );
  }, [pendingKnockoutNode]);

  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="rounded-2xl border border-slate-800/90 bg-slate-950/75 p-3 shadow-[0_0_48px_rgba(8,145,178,0.15)]">
        <h3 className="mb-2 text-xs uppercase tracking-wide text-slate-400">Original Network</h3>
        <div ref={originalRef} className="h-[520px] w-full rounded-xl bg-slate-900/50" />
      </div>
      <div className="rounded-2xl border border-slate-800/90 bg-slate-950/75 p-3 shadow-[0_0_48px_rgba(8,145,178,0.2)]">
        <h3 className="mb-2 text-xs uppercase tracking-wide text-slate-400">Perturbed Network</h3>
        <div ref={perturbedRef} className="h-[520px] w-full rounded-xl bg-slate-900/50" />
      </div>
    </section>
  );
}
