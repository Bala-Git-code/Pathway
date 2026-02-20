const express = require("express");
const {
  createPathway,
  getAllPathways,
  getPathwayById,
  updatePathway,
  deletePathway,
  getLatestPathway,
  perturbPathway,
} = require("../controllers/pathwayController");

const router = express.Router();

router.post("/", createPathway);
router.get("/", getAllPathways);
router.get("/latest", getLatestPathway);
router.get("/:id", getPathwayById);
router.put("/:id", updatePathway);
router.delete("/:id", deletePathway);
router.post("/:id/perturb", perturbPathway);

module.exports = router;
