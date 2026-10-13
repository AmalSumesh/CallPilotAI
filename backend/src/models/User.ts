import mongoose from "mongoose";

export type UserRole = "admin" | "agent";

export interface IUser{
    name : string;
    email : string;
    password : string;
    role : UserRole;
    isActive : boolean;
    createdAt : Date;
    updatedAt : Date;
}

const userSchema = new mongoose.Schema<IUser>({
    name : {
        type : String,
        required : true,
        trim : true
    },
    email : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true
    },
    password : {
        type : String,
        required : true,
        select : false
    },
    role : {
        type : String,
        enum : ["admin", "agent"],
        default : "agent",
        required : true
    },
    isActive : {
        type : Boolean,
        default : true
    }
},{
    timestamps : true
});

export default mongoose.model<IUser>("User", userSchema);