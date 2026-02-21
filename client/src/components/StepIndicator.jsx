import React from "react";

const STEPS = [
  { label: "Build Pathway", icon: "⬡", desc: "Add nodes & connections" },
  { label: "Run Simulation", icon: "⚡", desc: "Perturbation experiment" },
  { label: "Analyze Results", icon: "◈", desc: "Metrics & AI insights" },
];

export default function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center gap-0 w-full" role="list" aria-label="Workflow steps">
      {STEPS.map((step, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isDone = stepNum < currentStep;

        return (
          <React.Fragment key={step.label}>
            <div
              className="flex items-center gap-2.5"
              role="listitem"
              aria-current={isActive ? "step" : undefined}
            >
              {/* Circle */}
              <div
                className={`relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${isActive
                    ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-900 shadow-lg shadow-cyan-500/40"
                    : isDone
                      ? "bg-cyan-900/60 text-cyan-300 border border-cyan-700/60"
                      : "bg-slate-800/80 text-slate-500 border border-slate-700/60"
                  }`}
              >
                {isDone ? (
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span>{stepNum}</span>
                )}
                {isActive && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-cyan-400/30" />
                )}
              </div>

              {/* Labels */}
              <div className="hidden sm:block">
                <p
                  className={`text-xs font-semibold transition-colors duration-200 ${isActive ? "text-cyan-200" : isDone ? "text-slate-400" : "text-slate-600"
                    }`}
                >
                  {step.label}
                </p>
                <p className="text-[10px] text-slate-600">{step.desc}</p>
              </div>
            </div>

            {/* Connector */}
            {idx < STEPS.length - 1 && (
              <div className="flex-1 mx-3 h-px mx-2" aria-hidden="true">
                <div
                  className={`h-full transition-all duration-500 ${isDone
                      ? "bg-gradient-to-r from-cyan-700/80 to-cyan-900/40"
                      : "bg-slate-800/60"
                    }`}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}