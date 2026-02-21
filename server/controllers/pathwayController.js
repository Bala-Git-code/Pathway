const Pathway = require("../models/Pathway");
const { runSimulation } = require("../utils/simulationEngine");
const { generatePathwayAnalysis } = require("./aiController");

function validatePathwayPayload(body) {
  if (!body || typeof body !== "object") return "Request body is required.";
  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    return "Pathway name is required.";
  }
  if (!Array.isArray(body.nodes)) return "nodes must be an array.";
  if (!Array.isArray(body.edges)) return "edges must be an array.";

  // Validate each node shape
  for (const node of body.nodes) {
    if (!node.id || typeof node.id !== "string") return "Each node must have a string id.";
    if (!node.label || typeof node.label !== "string") return "Each node must have a string label.";
  }

  // Ensure unique node ids
  const ids = body.nodes.map((n) => n.id);
  const dup = ids.find((id, idx) => ids.indexOf(id) !== idx);
  if (dup) return `Duplicate node id detected: ${dup}`;

  // Validate each edge
  const idSet = new Set(ids);
  for (const edge of body.edges) {
    if (!edge.source || !edge.target) return "Each edge must have source and target.";
    if (!idSet.has(edge.source)) return `Edge references unknown source node: ${edge.source}`;
    if (!idSet.has(edge.target)) return `Edge references unknown target node: ${edge.target}`;
    if (edge.source === edge.target) return `Self-loop detected on node: ${edge.source}`;
  }

  return null;
}

async function createPathway(req, res) {
  try {
    const err = validatePathwayPayload(req.body);
    if (err) return res.status(400).json({ message: err });

    const pathway = await Pathway.create({
      name: req.body.name.trim(),
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
    const pathways = await Pathway.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json(pathways);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function getPathwayById(req, res) {
  try {
    const pathway = await Pathway.findById(req.params.id).lean();
    if (!pathway) return res.status(404).json({ message: "Pathway not found." });
    return res.status(200).json(pathway);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function updatePathway(req, res) {
  try {
    const err = validatePathwayPayload(req.body);
    if (err) return res.status(400).json({ message: err });

    const pathway = await Pathway.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name.trim(), nodes: req.body.nodes, edges: req.body.edges },
      { new: true, runValidators: true }
    ).lean();

    if (!pathway) return res.status(404).json({ message: "Pathway not found." });
    return res.status(200).json(pathway);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function deletePathway(req, res) {
  try {
    const pathway = await Pathway.findByIdAndDelete(req.params.id);
    if (!pathway) return res.status(404).json({ message: "Pathway not found." });
    return res.status(200).json({ message: "Pathway deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function getLatestPathway(req, res) {
  try {
    const pathway = await Pathway.findOne().sort({ createdAt: -1 }).lean();
    if (!pathway) return res.status(404).json({ message: "No pathways available." });
    return res.status(200).json(pathway);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function perturbPathway(req, res) {
  try {
    const { type, nodeId } = req.body;

    if (!type || !nodeId) {
      return res.status(400).json({ message: "type and nodeId are required." });
    }
    if (!["knockout", "overexpression"].includes(type)) {
      return res.status(400).json({ message: "type must be knockout or overexpression." });
    }

    const pathwayDoc = await Pathway.findById(req.params.id).lean();
    if (!pathwayDoc) return res.status(404).json({ message: "Pathway not found." });

    // Run the full simulation engine
    let simResult;
    try {
      simResult = runSimulation(pathwayDoc, type, nodeId);
    } catch (simError) {
      return res.status(400).json({ message: simError.message });
    }

    // Attempt AI analysis — never crash the endpoint if AI fails
    let aiAnalysis = {
      summary: "AI analysis not available.",
      affected_nodes: [],
      predicted_outcome: "",
      biological_context: "",
      confidence_score: 0,
      aiUnavailable: true,
    };

    try {
      aiAnalysis = await generatePathwayAnalysis(
        simResult.perturbedPathway,
        simResult.perturbation,
        simResult.analysis.degreeCentrality,
        simResult.analysis.regulatoryRanking
      );
      aiAnalysis.aiUnavailable = false;
    } catch (aiError) {
      aiAnalysis.aiError = aiError.message || String(aiError);
      // Check if key is missing specifically
      if (aiError.message && aiError.message.includes("API key")) {
        aiAnalysis.aiWarning = "OpenAI API key not configured. Add OPENAI_API_KEY to server/.env";
      }
    }

    return res.status(200).json({
      originalPathway: simResult.originalPathway,
      pathway: simResult.perturbedPathway,
      perturbation: simResult.perturbation,
      analysis: {
        ...simResult.analysis,
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
