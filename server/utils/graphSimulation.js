/**
 * graphSimulation.js — legacy shim
 * The canonical implementation has moved to simulationEngine.js.
 * This file re-exports for backward compatibility.
 */
const {
  computeDegreeCentrality,
  simulateKnockout,
  simulateOverexpression,
  rankRegulatoryNodes,
} = require("./simulationEngine");

// Keep old export names identical to avoid breaking existing imports
module.exports = {
  calculateDegreeCentrality: computeDegreeCentrality,
  simulateKnockout,
  simulateOverexpression,
  rankRegulatoryNodes,
};
