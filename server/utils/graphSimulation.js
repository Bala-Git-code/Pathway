function clonePathway(pathway) {
  return {
    ...pathway,
    nodes: pathway.nodes.map((node) => ({ ...node })),
    edges: pathway.edges.map((edge) => ({ ...edge })),
  };
}

function calculateDegreeCentrality(pathway) {
  const centrality = {};

  pathway.nodes.forEach((node) => {
    centrality[node.id] = 0;
  });

  pathway.edges.forEach((edge) => {
    if (Object.prototype.hasOwnProperty.call(centrality, edge.source)) {
      centrality[edge.source] += 1;
    }
    if (Object.prototype.hasOwnProperty.call(centrality, edge.target)) {
      centrality[edge.target] += 1;
    }
  });

  return centrality;
}

function simulateKnockout(pathway, nodeId) {
  const nextPathway = clonePathway(pathway);
  nextPathway.nodes = nextPathway.nodes.filter((node) => node.id !== nodeId);
  nextPathway.edges = nextPathway.edges.filter(
    (edge) => edge.source !== nodeId && edge.target !== nodeId
  );
  return nextPathway;
}

function simulateOverexpression(pathway, nodeId, multiplier = 2) {
  const nextPathway = clonePathway(pathway);
  nextPathway.nodes = nextPathway.nodes.map((node) => {
    if (node.id !== nodeId) {
      return node;
    }

    const influenceScore =
      typeof node.influenceScore === "number" ? node.influenceScore : 1;

    return {
      ...node,
      influenceScore: influenceScore * multiplier,
    };
  });

  return nextPathway;
}

function rankRegulatoryNodes(pathway) {
  const centrality = calculateDegreeCentrality(pathway);

  return Object.entries(centrality)
    .map(([nodeId, degree]) => ({
      nodeId,
      degree,
      influenceScore:
        pathway.nodes.find((node) => node.id === nodeId)?.influenceScore ?? 1,
      regulatoryScore:
        degree * (pathway.nodes.find((node) => node.id === nodeId)?.influenceScore ?? 1),
    }))
    .sort((a, b) => b.regulatoryScore - a.regulatoryScore);
}

module.exports = {
  calculateDegreeCentrality,
  simulateKnockout,
  simulateOverexpression,
  rankRegulatoryNodes,
};
