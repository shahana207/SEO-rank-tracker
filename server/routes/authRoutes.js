import express from "express";
import { register } from "../controllers/authController";

const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login',login);
authRouter.get('/user',auth,getUser);

export default authRouter;