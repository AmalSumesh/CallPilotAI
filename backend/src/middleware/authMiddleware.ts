import jwt, {type JwtPayload} from "jsonwebtoken";
import "dotenv/config";
import type {Request, Response, NextFunction} from "express";

export const authMiddleware = (
    req : Request,
    res : Response,
    next : NextFunction
)=>{
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({
            message : "No valid authorization token provided"
        });
    }

    const token = authHeader.split(" ")[1];

    if(!token){
        return res.status(401).json({
            message : "Invalid authorization header"
        });
    }

    try{
        const jwtsecret = process.env.JWT_SECRET;
        if(!jwtsecret) throw new Error("JWT_SECRET is not defined");

        const decoded = jwt.verify(token, jwtsecret);

        if(
            typeof decoded === "string" ||
            typeof decoded.id !== "string" ||
            (decoded.role !== "admin" && decoded.role !== "agent")
        ){
            return res.status(401).json({
                message : "Invalid token payload"
            });
        }

        req.user = decoded as JwtPayload & {
            id : string;
            role : "admin" | "agent";
        };

        next();
    }
    catch(error){
        return res.status(401).json({
            message : "Invalid or expired token"
        });
    }
}