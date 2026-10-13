import type {Request, Response} from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const createAgent = async(req : Request, res : Response)=>{
    try{
        const {name, email, password} = req.body;

        if(
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            password.length < 8
        ){
            return res.status(400).json({
                message : "Valid name, email and password are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({email : normalizedEmail});

        if(existingUser){
            return res.status(409).json({
                message : "Email is already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const agent = await User.create({
            name : name.trim(),
            email : normalizedEmail,
            password : hashedPassword,
            role : "agent"
        });

        return res.status(201).json({
            message : "Agent created successfully",
            agent : {
                id : agent._id,
                name : agent.name,
                email : agent.email,
                role : agent.role,
                isActive : agent.isActive
            }
        });
    }
    catch(error){
        console.error("CREATE AGENT ERROR:", error);
        return res.status(500).json({
            message : "Unable to create agent"
        });
    }
}

export const getAgents = async(req : Request, res : Response)=>{
    try{
        const agents = await User.find({role : "agent"})
            .select("name email isActive createdAt")
            .sort({createdAt : -1});

        return res.status(200).json({
            count : agents.length,
            agents
        });
    }
    catch(error){
        console.error("GET AGENTS ERROR:", error);
        return res.status(500).json({
            message : "Unable to retrieve agents"
        });
    }
}

export const updateAgentStatus = async(req : Request, res : Response)=>{
    try{
        const {isActive} = req.body;

        if(typeof isActive !== "boolean"){
            return res.status(400).json({
                message : "isActive must be true or false"
            });
        }

        const agent = await User.findOneAndUpdate(
            {
                _id : req.params.id,
                role : "agent"
            },
            {isActive},
            {new : true, runValidators : true}
        ).select("name email role isActive");

        if(!agent){
            return res.status(404).json({
                message : "Agent not found"
            });
        }

        return res.status(200).json({
            message : "Agent status updated",
            agent
        });
    }
    catch(error){
        console.error("UPDATE AGENT ERROR:", error);
        return res.status(500).json({
            message : "Unable to update agent status"
        });
    }
}