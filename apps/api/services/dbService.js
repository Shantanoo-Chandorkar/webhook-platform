import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
    if(isConnected) return; 

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        isConnected = true;
    } catch (error) {
        console.error("DB connection error:", error.message);
        throw error;
    }
}