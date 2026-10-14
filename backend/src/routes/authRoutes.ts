import express from "express";

import {loginUser, getCurrentUser} from "../controllers/authController.js";
import {authMiddleware} from "../middleware/authMiddleware.js";

export const router = express.Router();

router.post("/login", loginUser);

router.get("/me", authMiddleware, getCurrentUser);
