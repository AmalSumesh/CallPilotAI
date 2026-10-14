import type {Request, Response} from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import "dotenv/config";

import User from "../models/User.js";

export const loginUser = async(req : Request, res : Response)=>{
    try{
        const {email, password} = req.body;

        if(typeof email !== "string" || typeof password !== "string" ||
           !email.trim() || !password){
            return res.status(400).json({
                message : "Email and password are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({email : normalizedEmail})
            .select("+password");

        if(!user){
            return res.status(401).json({
                message : "Invalid email or password"
            });
        }

        if(!user.isActive){
            return res.status(403).json({
                message : "This account has been deactivated"
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid){
            return res.status(401).json({
                message : "Invalid email or password"
            });
        }

        const JWT_SECRET = process.env.JWT_SECRET;

        if(!JWT_SECRET){
            console.error("JWT_SECRET is not configured");
            return res.status(500).json({
                message : "Server configuration error"
            });
        }

        const token = jwt.sign(
            {
                id : user._id.toString(),
                role : user.role
            },
            JWT_SECRET,
            {
                expiresIn : "1d"
            }
        );

        return res.status(200).json({
            message : "Login successful",
            token,
            user : {
                id : user._id,
                name : user.name,
                email : user.email,
                role : user.role,
                isActive : user.isActive
            }
        });

    } catch(error) {
        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            message : "Unable to log in"
        });
    }
};


export const getCurrentUser = async(req : Request, res : Response)=>{
    try{
        if(!req.user){
            return res.status(401).json({
                message : "Authentication required"
            });
        }

        const user = await User.findById(req.user.id)
            .select("name email role isActive createdAt");

        if(!user){
            return res.status(404).json({
                message : "User not found"
            });
        }

        if(!user.isActive){
            return res.status(403).json({
                message : "This account has been deactivated"
            });
        }

        return res.status(200).json({
            user : {
                id : user._id,
                name : user.name,
                email : user.email,
                role : user.role,
                isActive : user.isActive,
                createdAt : user.createdAt
            }
        });

    } catch(error) {
        console.error("GET CURRENT USER ERROR:", error);

        return res.status(500).json({
            message : "Unable to fetch user details"
        });
    }
};
