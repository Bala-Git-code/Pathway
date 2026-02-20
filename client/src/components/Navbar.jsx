import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  const linkClass = (path) =>
    `rounded-md px-3 py-2 text-sm font-medium ${
      location.pathname === path
        ? "bg-cyan-500 text-slate-950"
        : "text-slate-300 hover:bg-slate-800"
    }`;

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-lg font-semibold text-cyan-200">
          Bio Pathway AI
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/" className={linkClass("/")}>
            Home
          </Link>
          <Link to="/workspace" className={linkClass("/workspace")}>
            Workspace
          </Link>
          <Link to="/analysis" className={linkClass("/analysis")}>
            Analysis
          </Link>
        </div>
      </div>
    </nav>
  );
}
