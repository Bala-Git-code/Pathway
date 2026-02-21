import React from "react";
import { NavLink, useLocation } from "react-router-dom";

const NAV_LINKS = [
  { to: "/", label: "Home", exact: true },
  { to: "/workspace", label: "Workspace" },
  { to: "/analysis", label: "Analysis" },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav
      className="sticky top-0 z-50 border-b border-cyan-950/60 bg-[#060d1a]/90 backdrop-blur-xl"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/30">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <circle cx="12" cy="5" r="2.5" fill="white" opacity="0.9" />
              <circle cx="5" cy="18" r="2.5" fill="white" opacity="0.9" />
              <circle cx="19" cy="18" r="2.5" fill="white" opacity="0.9" />
              <line x1="12" y1="7.5" x2="5" y2="15.5" stroke="white" strokeWidth="1.5" opacity="0.7" />
              <line x1="12" y1="7.5" x2="19" y2="15.5" stroke="white" strokeWidth="1.5" opacity="0.7" />
              <line x1="5" y1="18" x2="19" y2="18" stroke="white" strokeWidth="1.5" opacity="0.7" />
            </svg>
          </div>
          <div>
            <span className="mono text-sm font-semibold tracking-wide text-cyan-200">
              BioPathway
            </span>
            <span className="ml-1 text-sm font-light text-slate-500">AI</span>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ to, label, exact }) => {
            const isActive = exact
              ? location.pathname === to
              : location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${isActive
                    ? "bg-cyan-500/15 text-cyan-200 shadow-sm"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
              >
                {label}
              </NavLink>
            );
          })}
        </div>

        {/* Status badge */}
        <div className="hidden items-center gap-2 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 pulse" />
          <span className="mono text-xs text-slate-500">v2.0 · Simulation Engine Active</span>
        </div>
      </div>
    </nav>
  );
}
