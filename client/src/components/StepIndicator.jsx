import React from "react";

export default function StepIndicator({ currentStep }) {
  const steps = [
    "Build Pathway",
    "Run Perturbation",
    "Review Analysis",
  ];

  return (
    <div className="flex items-center justify-center gap-6 py-2">
      {steps.map((label, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;
        return (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200
                ${isActive || isCompleted
                  ? "bg-cyan-500 text-slate-900 shadow-lg"
                  : "bg-slate-800 text-slate-400"}`}
            >
              {stepNum}
            </div>
            <span
              className={`whitespace-nowrap text-xs font-medium transition-colors duration-200
                ${isActive ? "text-cyan-200" : isCompleted ? "text-slate-300" : "text-slate-500"}`}
            >
              {label}
            </span>
            {idx < steps.length - 1 && (
              <div className="h-px w-6 bg-slate-600" />
            )}
          </div>
        );
      })}
    </div>
  );
}