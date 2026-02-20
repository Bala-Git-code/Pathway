const express = require("express");
const { analyzePathway } = require("../controllers/aiController");

const router = express.Router();

router.post("/analyze", analyzePathway);

module.exports = router;
