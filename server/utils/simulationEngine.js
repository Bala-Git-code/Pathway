/**
 * simulationEngine.js
 * Full dynamic biological pathway simulation module.
 * All calculations are performed on live user-provided data.
 * No static values, no placeholders, no fallback seed data.
 */

function clonePathway(pathway) {
    return {
        ...pathway,
        nodes: pathway.nodes.map((n) => ({ ...n })),
        edges: pathway.edges.map((e) => ({ ...e })),
    };
}

/**
 * Compute degree centrality (combined in+out) for every node.
 * Returns: { [nodeId]: number }
 */
function computeDegreeCentrality(pathway) {
    const centrality = {};
    for (const node of pathway.nodes) {
        centrality[node.id] = 0;
    }
    for (const edge of pathway.edges) {
        if (Object.prototype.hasOwnProperty.call(centrality, edge.source)) {
            centrality[edge.source] += 1;
        }
        if (Object.prototype.hasOwnProperty.call(centrality, edge.target)) {
            centrality[edge.target] += 1;
        }
    }
    return centrality;
}

/**
 * Compute in-degree and out-degree separately.
 * Returns: { [nodeId]: { inDegree, outDegree } }
 */
function computeDirectedDegrees(pathway) {
    const degrees = {};
    for (const node of pathway.nodes) {
        degrees[node.id] = { inDegree: 0, outDegree: 0 };
    }
    for (const edge of pathway.edges) {
        if (Object.prototype.hasOwnProperty.call(degrees, edge.source)) {
            degrees[edge.source].outDegree += 1;
        }
        if (Object.prototype.hasOwnProperty.call(degrees, edge.target)) {
            degrees[edge.target].inDegree += 1;
        }
    }
    return degrees;
}

/**
 * Connectivity ratio: actual edges / max possible edges (directed).
 * Max directed edges for N nodes = N*(N-1).
 */
function computeConnectivityRatio(pathway) {
    const n = pathway.nodes.length;
    if (n <= 1) return 0;
    const maxEdges = n * (n - 1);
    const actual = pathway.edges.length;
    return parseFloat(((actual / maxEdges) * 100).toFixed(2));
}

/**
 * Rank nodes by a composite regulatory score.
 * regulatoryScore = degree * influenceScore
 */
function rankRegulatoryNodes(pathway, centrality) {
    return Object.entries(centrality)
        .map(([nodeId, degree]) => {
            const node = pathway.nodes.find((n) => n.id === nodeId);
            const influenceScore = typeof node?.influenceScore === "number" ? node.influenceScore : 1;
            return {
                nodeId,
                degree,
                inDegree: 0,
                outDegree: 0,
                influenceScore,
                regulatoryScore: degree * influenceScore,
            };
        })
        .sort((a, b) => b.regulatoryScore - a.regulatoryScore);
}

/**
 * Find the single most influential node by degree centrality.
 * Breaks ties by influenceScore.
 */
function findMostInfluentialNode(pathway, centrality) {
    let best = null;
    let bestScore = -1;
    for (const [nodeId, degree] of Object.entries(centrality)) {
        const node = pathway.nodes.find((n) => n.id === nodeId);
        const score = degree * (typeof node?.influenceScore === "number" ? node.influenceScore : 1);
        if (score > bestScore) {
            bestScore = score;
            best = nodeId;
        }
    }
    return best || "N/A";
}

/**
 * Perform knockout: remove the target node and all its incident edges.
 */
function simulateKnockout(pathway, nodeId) {
    const next = clonePathway(pathway);
    next.nodes = next.nodes.filter((n) => n.id !== nodeId);
    next.edges = next.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
    return next;
}

/**
 * Perform overexpression: multiply the influenceScore of the target node.
 */
function simulateOverexpression(pathway, nodeId, multiplier = 2) {
    const next = clonePathway(pathway);
    next.nodes = next.nodes.map((n) => {
        if (n.id !== nodeId) return n;
        const base = typeof n.influenceScore === "number" ? n.influenceScore : 1;
        return { ...n, influenceScore: parseFloat((base * multiplier).toFixed(4)) };
    });
    return next;
}

/**
 * Master simulation function.
 * Accepts raw pathway + perturbation config.
 * Returns a fully structured result object.
 */
function runSimulation(pathway, perturbationType, targetNodeId) {
    if (!pathway || !Array.isArray(pathway.nodes) || !Array.isArray(pathway.edges)) {
        throw new Error("Invalid pathway: nodes and edges must be arrays.");
    }
    if (!targetNodeId) {
        throw new Error("targetNodeId is required.");
    }
    if (!["knockout", "overexpression"].includes(perturbationType)) {
        throw new Error("perturbationType must be knockout or overexpression.");
    }

    const nodeExists = pathway.nodes.some((n) => n.id === targetNodeId);
    if (!nodeExists) {
        throw new Error(`Node '${targetNodeId}' not found in pathway.`);
    }

    // ── Before metrics ──
    const beforeCentrality = computeDegreeCentrality(pathway);
    const beforeDirected = computeDirectedDegrees(pathway);
    const beforeConnectivity = computeConnectivityRatio(pathway);
    const beforeRanking = rankRegulatoryNodes(pathway, beforeCentrality);
    const beforeMostInfluential = findMostInfluentialNode(pathway, beforeCentrality);

    // ── Perturb ──
    const perturbedPathway =
        perturbationType === "knockout"
            ? simulateKnockout(pathway, targetNodeId)
            : simulateOverexpression(pathway, targetNodeId);

    // ── After metrics ──
    const afterCentrality = computeDegreeCentrality(perturbedPathway);
    const afterDirected = computeDirectedDegrees(perturbedPathway);
    const afterConnectivity = computeConnectivityRatio(perturbedPathway);
    const afterRanking = rankRegulatoryNodes(perturbedPathway, afterCentrality);
    const afterMostInfluential = findMostInfluentialNode(perturbedPathway, afterCentrality);

    // Enrich ranking with directed degrees
    const enrichRanking = (ranking, directed) =>
        ranking.map((item) => ({
            ...item,
            inDegree: directed[item.nodeId]?.inDegree ?? 0,
            outDegree: directed[item.nodeId]?.outDegree ?? 0,
        }));

    // ── Delta centrality ──
    const allNodeIds = new Set([
        ...Object.keys(beforeCentrality),
        ...Object.keys(afterCentrality),
    ]);
    const centralityDelta = {};
    for (const id of allNodeIds) {
        const before = beforeCentrality[id] ?? 0;
        const after = afterCentrality[id] ?? 0;
        centralityDelta[id] = after - before;
    }

    // ── Connectivity delta ──
    const connectivityDeltaPercent =
        beforeConnectivity > 0
            ? parseFloat(((afterConnectivity - beforeConnectivity) / beforeConnectivity * 100).toFixed(2))
            : 0;

    // ── High centrality nodes (top 3 after perturbation) ──
    const highCentralityNodes = afterRanking.slice(0, 3).map((r) => r.nodeId);

    return {
        perturbation: { type: perturbationType, nodeId: targetNodeId },
        originalPathway: { ...pathway, nodes: [...pathway.nodes], edges: [...pathway.edges] },
        perturbedPathway,
        analysis: {
            // Centrality maps
            degreeCentrality: afterCentrality,
            beforeDegreeCentrality: beforeCentrality,
            centralityComparison: {
                before: beforeCentrality,
                after: afterCentrality,
                delta: centralityDelta,
            },
            // Directed degrees
            directedDegrees: {
                before: beforeDirected,
                after: afterDirected,
            },
            // Connectivity
            connectivity: {
                before: beforeConnectivity,
                after: afterConnectivity,
                deltaPercent: connectivityDeltaPercent,
            },
            // Rankings
            regulatoryRanking: enrichRanking(afterRanking, afterDirected),
            beforeRegulatoryRanking: enrichRanking(beforeRanking, beforeDirected),
            // Influence
            mostInfluentialNode: { before: beforeMostInfluential, after: afterMostInfluential },
            highCentralityNodes,
            // Specific perturbation markers
            knockedOutNode: perturbationType === "knockout" ? targetNodeId : null,
            overexpressedNode: perturbationType === "overexpression" ? targetNodeId : null,
            // Structural summary
            structural: {
                originalNodeCount: pathway.nodes.length,
                originalEdgeCount: pathway.edges.length,
                perturbedNodeCount: perturbedPathway.nodes.length,
                perturbedEdgeCount: perturbedPathway.edges.length,
                lostEdges: perturbationType === "knockout"
                    ? pathway.edges.filter((e) => e.source === targetNodeId || e.target === targetNodeId).length
                    : 0,
            },
        },
    };
}

module.exports = {
    runSimulation,
    computeDegreeCentrality,
    simulateKnockout,
    simulateOverexpression,
    rankRegulatoryNodes,
};
