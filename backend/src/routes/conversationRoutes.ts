import express from "express";
import {
    createConversation,
    getConversations,
    getConversationById
} from "../controllers/conversationController.js";
import {authMiddleware} from "../middleware/authMiddleware.js";

export const router = express.Router();

router.use(authMiddleware);

router.post("/", createConversation);
router.get("/", getConversations);
router.get("/:id", getConversationById);