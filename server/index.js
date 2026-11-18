import "dotenv/config";
import express from "express";
import cors from "cors";
import aiRoutes from "./routes/ai.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "LectureLens server running" });
});

app.use("/api", aiRoutes);

// Friendly error for oversized uploads and anything unexpected
app.use((err, req, res, _next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File is too large (max 500 MB)." });
  }
  console.error(err);
  res.status(500).json({ error: err.message || "Something went wrong." });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, (err) => {
  if (err) {
    console.error("Server failed to start:", err.message);
    process.exit(1);
  }
  console.log(`Server on http://localhost:${PORT}`);
});
