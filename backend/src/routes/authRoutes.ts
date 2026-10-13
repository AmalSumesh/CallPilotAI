import express from "express";
import {
    registerAgent,
    loginUser,
    getCurrentUser
} from "../controllers/authController.js";
import {authMiddleware} from "../middleware/authMiddleware.js";

export const router = express.Router();

router.post("/register", registerAgent);
router.post("/login", loginUser);
router.get("/me", authMiddleware, getCurrentUser);