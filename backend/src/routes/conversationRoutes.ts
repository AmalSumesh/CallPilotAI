import express from "express";
import {
    createConversation,
    getConversations,
    getConversationById,
    deleteConversation
} from "../controllers/conversationController.js";
import {authMiddleware} from "../middleware/authMiddleware.js";
import {allowRoles} from "../middleware/roleMiddleware.js";

export const router = express.Router();

router.use(authMiddleware);

router.post("/", allowRoles("agent"), createConversation);
router.get("/", getConversations);
router.get("/:id", getConversationById);
router.delete("/:id", deleteConversation);