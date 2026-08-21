import express from "express";
import cors from "cors";
import "dotenv/config";

import connectDB from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import rankRouter from "./routes/rankRoutes.js";

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database
connectDB();

// Routes
app.use("/api/auth", authRouter);
app.use("/api/rank", rankRouter);

// Test route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "SEO Rank Tracker API is running",
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});