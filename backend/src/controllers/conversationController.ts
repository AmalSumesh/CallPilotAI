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

        const {title, source} = req.body;

        if(source !== "upload" && source !== "live"){
            return res.status(400).json({
                message : "Source must be upload or live"
            });
        }

        const conversation = await Conversation.create({
            agentId : req.user.id,
            title : typeof title === "string" && title.trim()
                ? title.trim()
                : "Untitled call",
            source,
            status : "processing"
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