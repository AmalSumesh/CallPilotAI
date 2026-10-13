import mongoose from "mongoose";

export interface IEmotionPoint{
    time : number;
    anger : number;
    disgust : number;
    fear : number;
    happy : number;
    neutral : number;
    sad : number;
}

export interface IConversation{
    agentId : mongoose.Types.ObjectId;
    title : string;
    source : "upload" | "live";
    status : "processing" | "completed" | "failed";
    duration : number;
    transcript : string;
    emotionTrend : IEmotionPoint[];
    escalationDetected : boolean;
    createdAt : Date;
    updatedAt : Date;
}

const emotionPointSchema = new mongoose.Schema<IEmotionPoint>({
    time : {type : Number, required : true, min : 0},
    anger : {type : Number, required : true, min : 0, max : 1},
    disgust : {type : Number, required : true, min : 0, max : 1},
    fear : {type : Number, required : true, min : 0, max : 1},
    happy : {type : Number, required : true, min : 0, max : 1},
    neutral : {type : Number, required : true, min : 0, max : 1},
    sad : {type : Number, required : true, min : 0, max : 1}
},{_id : false});

const conversationSchema = new mongoose.Schema<IConversation>({
    agentId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required : true,
        index : true
    },
    title : {
        type : String,
        trim : true,
        default : "Untitled call"
    },
    source : {
        type : String,
        enum : ["upload", "live"],
        required : true
    },
    status : {
        type : String,
        enum : ["processing", "completed", "failed"],
        default : "processing"
    },
    duration : {
        type : Number,
        default : 0,
        min : 0
    },
    transcript : {
        type : String,
        default : ""
    },
    emotionTrend : {
        type : [emotionPointSchema],
        default : []
    },
    escalationDetected : {
        type : Boolean,
        default : false
    }
},{
    timestamps : true
});

export default mongoose.model<IConversation>( "Conversation",conversationSchema);