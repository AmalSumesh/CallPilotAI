import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import {connectToDb} from "../config/database.js";
import User from "../models/User.js";

const seedAdmin = async()=>{
    try{
        const {ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD} = process.env;

        if(!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD){
            throw new Error(
                "ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be defined"
            );
        }

        if(ADMIN_PASSWORD.length < 12){
            throw new Error(
                "Admin password must be at least 12 characters"
            );
        }

        await connectToDb();

        const email = ADMIN_EMAIL.trim().toLowerCase();

        const existingAdmin = await User.findOne({email});

        if(existingAdmin){
            console.log("User with this email already exists.");
            return;
        }

        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

        const admin = await User.create({
            name : ADMIN_NAME.trim(),
            email,
            password : hashedPassword,
            role : "admin",
            isActive : true
        });

        console.log("Admin created successfully!");
        console.log(`Admin email: ${admin.email}`);
    }
    catch(error){
        console.error("ADMIN SEEDER ERROR:", error);
        process.exitCode = 1;
    }
    finally{
        await mongoose.disconnect();
    }
}

seedAdmin();