import express from "express";
import {
    createAgent,
    getAgents,
    updateAgentStatus
} from "../controllers/agentController.js";
import {authMiddleware} from "../middleware/authMiddleware.js";
import {allowRoles} from "../middleware/roleMiddleware.js";

export const router = express.Router();

router.use(authMiddleware);
router.use(allowRoles("admin"));

router.post("/", createAgent);
router.get("/", getAgents);
router.patch("/:id/status", updateAgentStatus);