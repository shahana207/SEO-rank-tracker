import express from "express";

import {
  register,
  login,
  getUser,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const authRouter = express.Router();

// Public routes
authRouter.post("/register", register);
authRouter.post("/login", login);

// Protected route
authRouter.get("/me", protect, getUser);

export default authRouter;