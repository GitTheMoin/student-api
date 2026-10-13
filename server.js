require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const studentRoutes = require("./routes/studentRoutes");

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

app.get("/", (req, res) => res.json({ success: true, message: "Student API is running" }));
app.use("/api/students", studentRoutes);

// Unknown routes
app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));

// Malformed JSON and other unexpected errors
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Invalid JSON in request body" });
  }
  console.error(err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});