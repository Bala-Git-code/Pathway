import React, { useEffect, useRef } from "react";
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

export default function GraphViewer({
  pathway,
  selectedNodeId,
  analysis,
  pendingKnockoutNode,
  onNodeClick,
}) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements: toElements(pathway),
      style: [
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
      ],
      layout: { name: "cose", animate: true, animationDuration: 500, padding: 22 },
    });

    cy.on("tap", "node", (event) => {
      const clickedNode = event.target;
      onNodeClick({
        id: clickedNode.id(),
        label: clickedNode.data("label"),
        influenceScore: clickedNode.data("influenceScore"),
      });
    });

    cyRef.current = cy;
    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [pathway, onNodeClick]);

  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    cy.nodes().removeClass("selected-node");
    if (selectedNodeId) {
      cy.$id(selectedNodeId).addClass("selected-node");
    }
  }, [selectedNodeId]);

  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    cy.nodes().removeClass("high-centrality knocked-out overexpressed affected-node");

    (analysis?.highCentralityNodes || []).forEach((nodeId) => {
      cy.$id(nodeId).addClass("high-centrality");
    });
    if (analysis?.knockedOutNode) {
      cy.$id(analysis.knockedOutNode).addClass("knocked-out");
    }
    if (analysis?.overexpressedNode) {
      cy.$id(analysis.overexpressedNode).addClass("overexpressed");
    }
    (analysis?.affected_nodes || analysis?.keyAffectedNodes || []).forEach((nodeId) => {
      cy.$id(nodeId).addClass("affected-node");
    });
  }, [analysis]);

  useEffect(() => {
    if (!cyRef.current || !pendingKnockoutNode) {
      return;
    }
    const target = cyRef.current.$id(pendingKnockoutNode);
    if (target.length === 0) {
      return;
    }
    target.animate(
      {
        style: { opacity: 0.1, "background-color": "#ef4444" },
      },
      { duration: 380 }
    );
  }, [pendingKnockoutNode]);

  return (
    <div className="h-[560px] w-full rounded-2xl border border-slate-800/90 bg-slate-950/70 p-3 shadow-[0_0_48px_rgba(8,145,178,0.18)]">
      <div ref={containerRef} className="h-full w-full rounded-xl bg-slate-900/50" />
    </div>
  );
}
