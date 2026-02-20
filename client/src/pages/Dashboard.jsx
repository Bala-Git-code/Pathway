import React from "react";
import { Navigate } from "react-router-dom";

// dashboard page is a legacy route; redirect users to the modern workspace
export default function Dashboard() {
  return <Navigate to="/workspace" replace />;
}
