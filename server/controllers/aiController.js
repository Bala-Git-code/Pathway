let openaiClient = null;

async function getOpenAIClient() {
  if (openaiClient) {
    return openaiClient;
  }
  const { default: OpenAI } = await import("openai");
  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  return openaiClient;
}

function safeParseJson(text) {
  if (!text || typeof text !== "string") {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]);
    } catch (nestedError) {
      return null;
    }
  }
}

function normalizeAnalysis(parsed, fallbackNodes) {
  return {
    summary:
      typeof parsed?.summary === "string"
        ? parsed.summary
        : "Pathway perturbation analysis completed.",
    affected_nodes: Array.isArray(parsed?.affected_nodes)
      ? parsed.affected_nodes
      : fallbackNodes,
    predicted_outcome:
      typeof parsed?.predicted_outcome === "string"
        ? parsed.predicted_outcome
        : "No predicted outcome provided by model.",
  };
}

async function generatePathwayAnalysis(pathway, perturbation, centrality, ranking) {
  const fallbackNodes = ranking.slice(0, 3).map((item) => item.nodeId);

  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.trim()) {
    return {
      summary: "OpenAI API key is missing. Returning deterministic local interpretation.",
      affected_nodes: fallbackNodes,
      predicted_outcome:
        "Set OPENAI_API_KEY in server/.env to enable model-generated biological predictions.",
      aiWarning: "OPENAI_API_KEY is not configured.",
      keyAffectedNodes: fallbackNodes,
      predictedBiologicalOutcome:
        "Set OPENAI_API_KEY in server/.env to enable model-generated biological predictions.",
    };
  }

  try {
    const openai = await getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a computational biologist analyzing signaling pathways.",
        },
        {
          role: "user",
          content: [
            "Analyze the perturbation and return ONLY valid JSON with this exact schema:",
            '{ "summary": "", "affected_nodes": [], "predicted_outcome": "" }',
            "",
            `Nodes: ${JSON.stringify(pathway.nodes)}`,
            `Edges: ${JSON.stringify(pathway.edges)}`,
            `Perturbation: ${JSON.stringify(perturbation)}`,
            `Centrality: ${JSON.stringify(centrality)}`,
          ].join("\n"),
        },
      ],
      temperature: 0.2,
    });

    const content = completion.choices?.[0]?.message?.content || "";
    const parsed = safeParseJson(content);
    const normalized = normalizeAnalysis(parsed, fallbackNodes);

    return {
      ...normalized,
      keyAffectedNodes: normalized.affected_nodes,
      predictedBiologicalOutcome: normalized.predicted_outcome,
    };
  } catch (error) {
    return {
      summary: "AI request failed. Returning fallback response.",
      affected_nodes: fallbackNodes,
      predicted_outcome:
        "Unable to generate model prediction due to API error. Please verify OpenAI configuration.",
      aiWarning: `OpenAI request failed: ${error.message}`,
      keyAffectedNodes: fallbackNodes,
      predictedBiologicalOutcome:
        "Unable to generate model prediction due to API error. Please verify OpenAI configuration.",
    };
  }
}

async function analyzePathway(req, res) {
  try {
    const { pathway, perturbation, centrality, ranking } = req.body;
    if (!pathway || !Array.isArray(pathway.nodes) || !Array.isArray(pathway.edges)) {
      return res.status(400).json({ message: "Invalid pathway payload." });
    }

    const analysis = await generatePathwayAnalysis(
      pathway,
      perturbation || { type: "none", nodeId: null },
      centrality || {},
      Array.isArray(ranking) ? ranking : []
    );

    return res.status(200).json(analysis);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

module.exports = {
  generatePathwayAnalysis,
  analyzePathway,
};
