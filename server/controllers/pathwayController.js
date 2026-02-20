const Pathway = require("../models/Pathway");
const {
  calculateDegreeCentrality,
  simulateKnockout,
  simulateOverexpression,
  rankRegulatoryNodes,
} = require("../utils/graphSimulation");
const { generatePathwayAnalysis } = require("./aiController");

const defaultPathwayTemplate = {
  name: "EGFR Signaling Pathway",
  nodes: [
    { id: "EGFR", label: "EGFR" },
    { id: "RAS", label: "RAS" },
    { id: "RAF", label: "RAF" },
    { id: "MEK", label: "MEK" },
    { id: "ERK", label: "ERK" },
    { id: "MYC", label: "MYC" },
  ],
  edges: [
    { source: "EGFR", target: "RAS", type: "activation" },
    { source: "RAS", target: "RAF", type: "activation" },
    { source: "RAF", target: "MEK", type: "activation" },
    { source: "MEK", target: "ERK", type: "activation" },
    { source: "ERK", target: "MYC", type: "activation" },
  ],
};

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
    let pathway = await Pathway.findOne().sort({ createdAt: -1 });
    if (!pathway) {
      pathway = await Pathway.create(defaultPathwayTemplate);
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
    const aiAnalysis = await generatePathwayAnalysis(
      perturbed,
      { type, nodeId },
      centrality,
      regulatoryRanking
    );

    const updatedPathway = await Pathway.findByIdAndUpdate(
      req.params.id,
      {
        name: perturbed.name,
        nodes: perturbed.nodes,
        edges: perturbed.edges,
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      originalPathway: original,
      pathway: updatedPathway,
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
