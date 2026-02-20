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

function normalizeAnalysis(parsed) {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("AI returned invalid JSON structure.");
  }
  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    affected_nodes: Array.isArray(parsed.affected_nodes) ? parsed.affected_nodes : [],
    predicted_outcome:
      typeof parsed.predicted_outcome === "string" ? parsed.predicted_outcome : "",
    biological_context:
      typeof parsed.biological_context === "string" ? parsed.biological_context : "",
  };
} 

async function generatePathwayAnalysis(pathway, perturbation, centrality, ranking) {
  // ensure API key is present; nothing is returned otherwise
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.trim()) {
    throw new Error("OpenAI API key is not configured.");
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
            '{ "summary": "", "affected_nodes": [], "predicted_outcome": "", "biological_context": "" }',
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
    const normalized = normalizeAnalysis(parsed);

    return {
      ...normalized,
      keyAffectedNodes: normalized.affected_nodes,
      predictedBiologicalOutcome: normalized.predicted_outcome,
    };
  } catch (error) {
    throw new Error(`OpenAI request error: ${error.message}`);
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
