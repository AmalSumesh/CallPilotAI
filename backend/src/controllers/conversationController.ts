import type {Request, Response} from "express";
import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";

export const createConversation = async(req : Request, res : Response)=>{
    try{
        if(!req.user){
            return res.status(401).json({
                message : "Authentication required"
            });
        }

        const {
            title,
            source,
            duration,
            audioUrl,
            transcript,
            emotionTrend,
            escalationDetected,
            status
        } = req.body;

        if(source !== "upload" && source !== "live"){
            return res.status(400).json({
                message : "Source must be upload or live"
            });
        }

        const validEmotionTrend = Array.isArray(emotionTrend)
            ? emotionTrend.filter(pt => typeof pt.time === 'number')
            : [];

        let finalAudioUrl = typeof audioUrl === "string" ? audioUrl : "";
        if (finalAudioUrl.startsWith("data:audio/webm;base64,Rd+j")) {
            const base64Data = finalAudioUrl.split(",")[1] || "";
            const raw = Buffer.from(base64Data, "base64");
            const fixed = Buffer.concat([Buffer.from([0x1a]), raw]);
            finalAudioUrl = "data:audio/webm;base64," + fixed.toString("base64");
        }

        const conversation = await Conversation.create({
            agentId : req.user.id,
            title : typeof title === "string" && title.trim()
                ? title.trim()
                : "Untitled call",
            source,
            status : status || (validEmotionTrend.length > 0 ? "completed" : "processing"),
            duration : typeof duration === "number" && duration >= 0 ? duration : 0,
            audioUrl : finalAudioUrl,
            transcript : typeof transcript === "string" ? transcript : "",
            emotionTrend : validEmotionTrend,
            escalationDetected : Boolean(escalationDetected)
        });

        return res.status(201).json({
            message : "Call record created",
            conversation
        });
    }
    catch(error){
        console.error("CREATE CONVERSATION ERROR:", error);
        return res.status(500).json({
            message : "Unable to create call record"
        });
    }
}

export const getConversations = async(req : Request, res : Response)=>{
    try{
        if(!req.user){
            return res.status(401).json({
                message : "Authentication required"
            });
        }

        const filter = req.user.role === "admin"
            ? {}
            : {agentId : req.user.id};

        const conversations = await Conversation.find(filter)
            .populate("agentId", "name email")
            .sort({createdAt : -1})
            .limit(100);

        return res.status(200).json({
            count : conversations.length,
            conversations
        });
    }
    catch(error){
        console.error("GET CONVERSATIONS ERROR:", error);
        return res.status(500).json({
            message : "Unable to retrieve calls"
        });
    }
}

export const getConversationById = async(req : Request, res : Response)=>{
    try{
        if(!req.user){
            return res.status(401).json({
                message : "Authentication required"
            });
        }

        if(!mongoose.isValidObjectId(req.params.id)){
            return res.status(400).json({
                message : "Invalid call ID"
            });
        }

        const filter = req.user.role === "admin"
            ? {_id : req.params.id}
            : {_id : req.params.id, agentId : req.user.id};

        const conversation = await Conversation.findOne(filter)
            .populate("agentId", "name email");

        if(!conversation){
            return res.status(404).json({
                message : "Call not found"
            });
        }

        return res.status(200).json({conversation});
    }
    catch(error){
        console.error("GET CONVERSATION ERROR:", error);
        return res.status(500).json({
            message : "Unable to retrieve call"
        });
    }
}

export const deleteConversation = async(req : Request, res : Response)=>{
    try{
        if(!req.user){
            return res.status(401).json({
                message : "Authentication required"
            });
        }

        if(!mongoose.isValidObjectId(req.params.id)){
            return res.status(400).json({
                message : "Invalid call ID"
            });
        }

        const filter = req.user.role === "admin"
            ? {_id : req.params.id}
            : {_id : req.params.id, agentId : req.user.id};

        const conversation = await Conversation.findOneAndDelete(filter);

        if(!conversation){
            return res.status(404).json({
                message : "Call record not found or you do not have permission to delete it"
            });
        }

        return res.status(200).json({
            message : "Call record deleted successfully",
            id : req.params.id
        });
    }
    catch(error){
        console.error("DELETE CONVERSATION ERROR:", error);
        return res.status(500).json({
            message : "Unable to delete call record"
        });
    }
}