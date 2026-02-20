const Pathway = require("../models/Pathway");
const {
  calculateDegreeCentrality,
  simulateKnockout,
  simulateOverexpression,
  rankRegulatoryNodes,
} = require("../utils/graphSimulation");
const { generatePathwayAnalysis } = require("./aiController");



function validatePathwayPayload(body) {
  if (!body || typeof body !== "object") {
    return "Request body is required.";
  }
  if (!body.name || typeof body.name !== "string") {
    return "Pathway name is required.";
  }
  if (!Array.isArray(body.nodes)) {
    return "nodes must be an array.";
  }
  if (!Array.isArray(body.edges)) {
    return "edges must be an array.";
  }
  // ensure node ids are unique
  const ids = body.nodes.map((n) => n.id);
  const dup = ids.find((id, idx) => ids.indexOf(id) !== idx);
  if (dup) {
    return `Duplicate node id detected: ${dup}`;
  }
  return null;
}

async function createPathway(req, res) {
  try {
    const validationError = validatePathwayPayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const pathway = await Pathway.create({
      name: req.body.name,
      nodes: req.body.nodes,
      edges: req.body.edges,
    });

    return res.status(201).json(pathway);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function getAllPathways(req, res) {
  try {
    const pathways = await Pathway.find().sort({ createdAt: -1 });
    return res.status(200).json(pathways);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function getPathwayById(req, res) {
  try {
    const pathway = await Pathway.findById(req.params.id);
    if (!pathway) {
      return res.status(404).json({ message: "Pathway not found." });
    }
    return res.status(200).json(pathway);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function updatePathway(req, res) {
  try {
    const validationError = validatePathwayPayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const pathway = await Pathway.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        nodes: req.body.nodes,
        edges: req.body.edges,
      },
      { new: true, runValidators: true }
    );

    if (!pathway) {
      return res.status(404).json({ message: "Pathway not found." });
    }

    return res.status(200).json(pathway);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function deletePathway(req, res) {
  try {
    const pathway = await Pathway.findByIdAndDelete(req.params.id);
    if (!pathway) {
      return res.status(404).json({ message: "Pathway not found." });
    }
    return res.status(200).json({ message: "Pathway deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function getLatestPathway(req, res) {
  try {
    // return the most recently created pathway; do not fabricate data if none exist
    const pathway = await Pathway.findOne().sort({ createdAt: -1 });
    if (!pathway) {
      return res.status(404).json({ message: "No pathways available." });
    }
    return res.status(200).json(pathway);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function perturbPathway(req, res) {
  try {
    const { type, nodeId } = req.body;

    if (!type || !nodeId) {
      return res
        .status(400)
        .json({ message: "type and nodeId are required for perturbation." });
    }

    if (type !== "knockout" && type !== "overexpression") {
      return res
        .status(400)
        .json({ message: "Perturbation type must be knockout or overexpression." });
    }

    const pathwayDoc = await Pathway.findById(req.params.id);
    if (!pathwayDoc) {
      return res.status(404).json({ message: "Pathway not found." });
    }

    const original = pathwayDoc.toObject();

    const nodeExists = original.nodes.some((node) => node.id === nodeId);
    if (!nodeExists) {
      return res.status(400).json({ message: "Selected node does not exist." });
    }

    const perturbed =
      type === "knockout"
        ? simulateKnockout(original, nodeId)
        : simulateOverexpression(original, nodeId);

    const beforeCentrality = calculateDegreeCentrality(original);
    const centrality = calculateDegreeCentrality(perturbed);
    const regulatoryRanking = rankRegulatoryNodes(perturbed);
    // attempt AI analysis but do not let it crash the perturbation
    let aiAnalysis = {};
    try {
      aiAnalysis = await generatePathwayAnalysis(
        perturbed,
        { type, nodeId },
        centrality,
        regulatoryRanking
      );
    } catch (aiError) {
      aiAnalysis = {
        summary: "AI analysis failed or unavailable.",
        affected_nodes: [],
        predicted_outcome: "",
        biological_context: "",
        aiError: aiError.message || aiError,
      };
    }

    // do not overwrite the stored pathway; return the computed perturbation only
    return res.status(200).json({
      originalPathway: original,
      pathway: perturbed,
      perturbation: { type, nodeId },
      analysis: {
        degreeCentrality: centrality,
        beforeDegreeCentrality: beforeCentrality,
        centralityComparison: {
          before: beforeCentrality,
          after: centrality,
        },
        regulatoryRanking,
        highCentralityNodes: regulatoryRanking.slice(0, 3).map((item) => item.nodeId),
        knockedOutNode: type === "knockout" ? nodeId : null,
        overexpressedNode: type === "overexpression" ? nodeId : null,
        ...aiAnalysis,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  createPathway,
  getAllPathways,
  getPathwayById,
  updatePathway,
  deletePathway,
  getLatestPathway,
  perturbPathway,
};
