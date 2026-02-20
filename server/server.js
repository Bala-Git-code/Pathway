require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const pathwayRoutes = require("./routes/pathwayRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  })
);
app.use(express.json());

app.get("/health", async (req, res) => {
  return res.status(200).json({ status: "ok" });
});

app.use("/pathways", pathwayRoutes);
app.use("/ai", aiRoutes);

app.use((req, res) => {
  return res.status(404).json({ message: "Route not found." });
});

app.use((error, req, res, next) => {
  const status = error.status || 500;
  return res.status(status).json({
    message: error.message || "Internal server error.",
  });
});

const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();
