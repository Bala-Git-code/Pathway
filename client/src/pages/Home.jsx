import React from "react";
import { useNavigate } from "react-router-dom";

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <circle cx="5" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="19" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="19" cy="19" r="3" stroke="currentColor" strokeWidth="1.5" />
        <line x1="7.5" y1="10.9" x2="16.5" y2="6.1" stroke="currentColor" strokeWidth="1.5" />
        <line x1="7.5" y1="13.1" x2="16.5" y2="17.9" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    title: "Visual Network Builder",
    desc: "Add nodes with influence scores and typed edges (activation / inhibition) on an interactive Cytoscape canvas.",
    accent: "cyan",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    title: "Perturbation Engine",
    desc: "Knockout a node (remove + edges) or overexpress it (amplify influence) with real-time network recalculation.",
    accent: "amber",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    title: "Structural Metrics",
    desc: "Dynamic degree centrality, directed in/out-degree, connectivity ratio, and regulatory node ranking — all recomputed live.",
    accent: "blue",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17v-6H7l6-8v6h4l-6 8z" />
      </svg>
    ),
    title: "AI Biological Insights",
    desc: "GPT-4o-mini generates structured biological summaries, affected node identification, predicted outcomes, and confidence scores.",
    accent: "violet",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    title: "Before vs After Charts",
    desc: "Interactive Recharts bar chart shows centrality changes per node with color-coded deltas after perturbation.",
    accent: "emerald",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Persistent Pathways",
    desc: "Save, update, and reload pathways from MongoDB. Simulation snapshots persist in browser storage for offline analysis.",
    accent: "teal",
  },
];

const ACCENT_MAP = {
  cyan: { border: "border-cyan-800/50", bg: "bg-cyan-500/10", icon: "text-cyan-400", dot: "bg-cyan-500" },
  amber: { border: "border-amber-800/50", bg: "bg-amber-500/10", icon: "text-amber-400", dot: "bg-amber-500" },
  blue: { border: "border-blue-800/50", bg: "bg-blue-500/10", icon: "text-blue-400", dot: "bg-blue-500" },
  violet: { border: "border-violet-800/50", bg: "bg-violet-500/10", icon: "text-violet-400", dot: "bg-violet-500" },
  emerald: { border: "border-emerald-800/50", bg: "bg-emerald-500/10", icon: "text-emerald-400", dot: "bg-emerald-500" },
  teal: { border: "border-teal-800/50", bg: "bg-teal-500/10", icon: "text-teal-400", dot: "bg-teal-500" },
};

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="space-y-10">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-2xl border border-cyan-900/40 bg-gradient-to-br from-[#060d1a] via-[#071525] to-[#060d1a] px-8 py-16 sm:px-12">
        {/* Grid bg */}
        <div className="hero-grid absolute inset-0 opacity-30 rounded-2xl" />
        {/* Glows */}
        <div className="absolute -left-32 top-16 h-80 w-80 rounded-full bg-cyan-600/15 blur-3xl pointer-events-none" />
        <div className="absolute -right-24 bottom-12 h-72 w-72 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-violet-600/8 blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-700/50 bg-cyan-500/8 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 pulse" />
            <span className="mono text-xs uppercase tracking-[0.18em] text-cyan-300">
              Research-grade · Simulation Platform · v2.0
            </span>
          </div>

          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">
              Bio Pathway AI
            </span>
            <br />
            <span className="text-slate-200 text-3xl sm:text-4xl font-semibold">
              Simulation Platform
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base text-slate-400 sm:text-lg leading-relaxed">
            Build biological pathway networks visually, run knockout and overexpression experiments,
            and interpret downstream network effects with AI-powered biological reasoning.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              id="hero-launch-btn"
              onClick={() => navigate("/workspace")}
              className="btn-primary px-8 py-3 text-sm"
            >
              Open Simulation Workspace →
            </button>
            <button
              type="button"
              onClick={() => navigate("/analysis")}
              className="btn-secondary px-6 py-3 text-sm"
            >
              View Analysis
            </button>
          </div>

          {/* Stats row */}
          <div className="mt-10 flex flex-wrap justify-center gap-6 text-center">
            {[
              ["Dynamic", "Simulation Engine"],
              ["Real-time", "Centrality Metrics"],
              ["GPT-4o-mini", "AI Analysis"],
            ].map(([num, label]) => (
              <div key={label}>
                <p className="mono text-lg font-bold text-cyan-300">{num}</p>
                <p className="text-xs text-slate-600">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section>
        <div className="mb-6 text-center">
          <p className="mono text-xs uppercase tracking-widest text-cyan-700 mb-2">Capabilities</p>
          <h2 className="text-2xl font-semibold text-slate-200">
            Platform Features
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const a = ACCENT_MAP[f.accent];
            return (
              <div
                key={f.title}
                className={`glass-card-sm p-5 border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${a.border} cursor-default`}
              >
                <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg border ${a.border} ${a.bg} ${a.icon}`}>
                  {f.icon}
                </div>
                <h3 className="text-sm font-semibold text-slate-200">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Workflow ── */}
      <section className="glass-card p-6 sm:p-8">
        <div className="mb-6 text-center">
          <p className="mono text-xs uppercase tracking-widest text-cyan-700 mb-2">Workflow</p>
          <h2 className="text-xl font-semibold text-slate-200">How to Use</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { step: "01", title: "Build Pathway", desc: "Add molecular nodes and define activation or inhibition interactions. Set influence scores per node." },
            { step: "02", title: "Simulate Perturbation", desc: "Save pathway to DB, select target node, choose knockout or overexpression. Click Run Simulation." },
            { step: "03", title: "Analyze Results", desc: "Review centrality charts, before/after comparison, regulatory rankings, and AI biological interpretation." },
          ].map((s) => (
            <div key={s.step} className="relative pl-14">
              <span className="mono absolute left-0 top-0 text-4xl font-black text-cyan-900/60 leading-none select-none">
                {s.step}
              </span>
              <h3 className="text-sm font-semibold text-cyan-200">{s.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => navigate("/workspace")}
            className="btn-primary"
            id="workflow-cta-btn"
          >
            Get Started Now →
          </button>
        </div>
      </section>
    </div>
  );
}
