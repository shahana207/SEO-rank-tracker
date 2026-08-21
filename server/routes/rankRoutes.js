import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
    addKeyword,
    getKeywords,
    getKeyword,
    refreshKeyword,
    deleteKeyword,
    toggleTracking,
} from "../controllers/rankController.js";

const rankRouter = express.Router();

rankRouter.use(authMiddleware);

rankRouter.post("/keywords", addKeyword);
rankRouter.get("/keywords", getKeywords);
rankRouter.get("/keywords/:id", getKeyword);
rankRouter.post("/keywords/:id/refresh", refreshKeyword);
rankRouter.delete("/keywords/:id", deleteKeyword);
rankRouter.patch("/keywords/:id/toggle", toggleTracking);

export default rankRouter;