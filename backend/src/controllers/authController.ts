import type {Request, Response} from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import "dotenv/config";

export const registerAgent = async(req : Request, res : Response)=>{
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
                message : "Name, email and a password of at least 8 characters are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({email : normalizedEmail});

        if(existingUser){
            return res.status(409).json({
                message : "An account with this email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name : name.trim(),
            email : normalizedEmail,
            password : hashedPassword,
            role : "agent"
        });

        return res.status(201).json({
            message : "Agent registered successfully",
            user : {
                id : user._id,
                name : user.name,
                email : user.email,
                role : user.role
            }
        });
    }
    catch(error){
        console.error("REGISTER ERROR:", error);
        return res.status(500).json({
            message : "Unable to register agent"
        });
    }
}

export const loginUser = async(req : Request, res : Response)=>{
    try{
        const {email, password} = req.body;

        if(
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ){
            return res.status(400).json({
                message : "Email and password are required"
            });
        }

        const user = await User.findOne({
            email : email.trim().toLowerCase()
        }).select("+password");

        if(!user || !user.isActive){
            return res.status(401).json({
                message : "Invalid email or password"
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if(!passwordMatch){
            return res.status(401).json({
                message : "Invalid email or password"
            });
        }

        const jwtsecret = process.env.JWT_SECRET;
        if(!jwtsecret) throw new Error("JWT_SECRET is not defined");

        const token = jwt.sign({
            id : user._id.toString(),
            role : user.role
        }, jwtsecret, {
            expiresIn : "1d"
        });

        return res.status(200).json({
            message : "Login successful",
            token,
            user : {
                id : user._id,
                name : user.name,
                email : user.email,
                role : user.role
            }
        });
    }
    catch(error){
        console.error("LOGIN ERROR:", error);
        return res.status(500).json({
            message : "Unable to login"
        });
    }
}

export const getCurrentUser = async(req : Request, res : Response)=>{
    try{
        if(!req.user){
            return res.status(401).json({
                message : "Authentication required"
            });
        }

        const user = await User.findById(req.user.id).select(
            "name email role isActive createdAt"
        );

        if(!user || !user.isActive){
            return res.status(401).json({
                message : "User account not available"
            });
        }

        return res.status(200).json({user});
    }
    catch(error){
        console.error("CURRENT USER ERROR:", error);
        return res.status(500).json({
            message : "Unable to retrieve user"
        });
    }
}