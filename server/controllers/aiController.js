let openaiClient = null;

async function getOpenAIClient() {
  if (openaiClient) return openaiClient;
  const { default: OpenAI } = await import("openai");
  openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return openaiClient;
}

function safeParseJson(text) {
  if (!text || typeof text !== "string") return null;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeAnalysis(parsed) {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("AI returned invalid JSON structure.");
  }
  return {
    summary: typeof parsed.summary === "string" ? parsed.summary : "No summary provided.",
    affected_nodes: Array.isArray(parsed.affected_nodes) ? parsed.affected_nodes : [],
    predicted_outcome: typeof parsed.predicted_outcome === "string" ? parsed.predicted_outcome : "",
    biological_context: typeof parsed.biological_context === "string" ? parsed.biological_context : "",
    confidence_score: typeof parsed.confidence_score === "number"
      ? Math.min(1, Math.max(0, parsed.confidence_score))
      : 0.7,
  };
}

async function generatePathwayAnalysis(pathway, perturbation, centrality, ranking) {
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.trim()) {
    throw new Error("OpenAI API key is not configured.");
  }

  try {
    const openai = await getOpenAIClient();

    const topNodes = (ranking || []).slice(0, 5).map((r) => ({
      id: r.nodeId,
      degree: r.degree,
      influence: r.influenceScore,
    }));

    const prompt = [
      "You are a computational biologist analyzing perturbed signaling pathways.",
      "Analyze the provided perturbation experiment and return ONLY valid JSON matching this EXACT schema:",
      '{ "summary": "string", "affected_nodes": ["nodeId1", "nodeId2"], "predicted_outcome": "string", "biological_context": "string", "confidence_score": 0.0 }',
      "",
      `Perturbation Type: ${perturbation?.type || "unknown"}`,
      `Target Node: ${perturbation?.nodeId || "unknown"}`,
      `Pathway Nodes (${pathway.nodes.length}): ${JSON.stringify(pathway.nodes.slice(0, 20))}`,
      `Pathway Edges (${pathway.edges.length}): ${JSON.stringify(pathway.edges.slice(0, 30))}`,
      `Post-perturbation Degree Centrality: ${JSON.stringify(centrality)}`,
      `Top Regulatory Nodes: ${JSON.stringify(topNodes)}`,
      "",
      "Rules:",
      "- confidence_score must be a float between 0.0 and 1.0",
      "- affected_nodes must be an array of node IDs (strings) from the pathway",
      "- Return ONLY JSON, no markdown, no explanation outside JSON",
    ].join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a computational biologist. Always respond with valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 600,
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

    if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.trim()) {
      return res.status(503).json({
        message: "OpenAI API key not configured on server.",
        aiUnavailable: true,
        summary: "AI analysis unavailable — API key missing.",
        affected_nodes: [],
        predicted_outcome: "Configure OPENAI_API_KEY in server/.env to enable AI analysis.",
        biological_context: "",
        confidence_score: 0,
      });
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

module.exports = { generatePathwayAnalysis, analyzePathway };
