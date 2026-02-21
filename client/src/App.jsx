import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Workspace from "./pages/Workspace";
import AnalysisView from "./pages/AnalysisView";

function App() {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      {/* Global animated grid backdrop */}
      <div className="app-grid" aria-hidden="true" />

      <Navbar />

      <main className="relative mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/analysis" element={<AnalysisView />} />
          <Route path="/dashboard" element={<Navigate to="/workspace" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
