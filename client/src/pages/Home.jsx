import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden rounded-3xl border border-cyan-900/40 bg-slate-950 px-6 py-16 shadow-[0_0_90px_rgba(45,212,191,0.16)] sm:px-10">
      <div className="hero-grid absolute inset-0 opacity-35" />
      <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute -right-20 bottom-8 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <p className="inline-flex rounded-full border border-cyan-700/50 bg-cyan-500/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
          Research-grade Pathway Intelligence
        </p>
        <h1 className="mt-5 text-4xl font-semibold leading-tight text-slate-100 sm:text-5xl">
          Bio Pathway AI Simulation Platform
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-slate-300 sm:text-lg">
          Build pathway networks visually, run knockout and overexpression experiments, and
          interpret downstream effects with AI-assisted biological reasoning.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="rounded-lg bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Open Interactive Dashboard
          </button>
          <span className="text-sm text-slate-400">
            No coding required. Designed for researchers.
          </span>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-3 text-left sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-sm font-semibold text-cyan-200">Visual Pathway Builder</h3>
            <p className="mt-2 text-sm text-slate-400">
              Add nodes and interactions directly on a dynamic graph interface.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-sm font-semibold text-cyan-200">Perturbation Simulation</h3>
            <p className="mt-2 text-sm text-slate-400">
              Compare before vs after network behavior under knockout or overexpression.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-sm font-semibold text-cyan-200">AI Biological Insight</h3>
            <p className="mt-2 text-sm text-slate-400">
              Generate structured summaries, affected nodes, and predicted outcomes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
