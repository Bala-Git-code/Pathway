const mongoose = require("mongoose");

const NodeSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    influenceScore: {
      type: Number,
      default: 1,
      min: 0,
    },
  },
  { _id: false }
);

const EdgeSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      required: true,
      trim: true,
    },
    target: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      default: "regulates",
      trim: true,
    },
  },
  { _id: false }
);

const PathwaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  nodes: {
    type: [NodeSchema],
    default: [],
  },
  edges: {
    type: [EdgeSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Pathway", PathwaySchema);
