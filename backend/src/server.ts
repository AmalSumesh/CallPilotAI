import express from "express";
import "dotenv/config";
import cors from "cors";

import {connectToDb} from "./config/database.js";
import {router as authRoutes} from "./routes/authRoutes.js";
import {router as agentRoutes} from "./routes/agentRoutes.js";
import {router as conversationRoutes} from "./routes/conversationRoutes.js";

const app = express();

process.on("uncaughtException", (err)=>{
    console.error("UNCAUGHT EXCEPTION:", err);
    process.exit(1);
});

process.on("unhandledRejection", (err)=>{
    console.error("UNHANDLED REJECTION:", err);
    process.exit(1);
});

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/", (req, res)=>{
    res.send("API is running");
});

app.use("/api/auth", authRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/conversations", conversationRoutes);

const PORT = process.env.PORT;
if(!PORT) process.exit(1);

await connectToDb();

app.listen(PORT, ()=>{
    console.log(`Server is listening on port ${PORT}`);
});