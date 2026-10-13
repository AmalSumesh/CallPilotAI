
import mongoose from "mongoose";
import "dotenv/config";

export const connectToDb = async()=>{
    try{
        const mongo_uri = process.env.MONGO_URI;
        if(!mongo_uri) throw new Error("MONGO_URI is not defined");

        await mongoose.connect(mongo_uri);
        console.log("MongoDB connected Successfully!");
    }
    catch(error){
        console.log(`ERROR : ${error}`);
        process.exit(1);
    }
}
