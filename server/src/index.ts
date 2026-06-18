import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Backend server is running",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});