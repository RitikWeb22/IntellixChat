import mongoose from "mongoose";

let cachedConnection = null;

const connectDB = async () => {
    // If connection is already open, reuse it (crucial for serverless environments)
    if (mongoose.connection.readyState >= 1) {
        return mongoose.connection;
    }

    if (cachedConnection) {
        return cachedConnection;
    }

    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        console.error("MONGO_URI environment variable is missing!");
        throw new Error("MONGO_URI is not defined in environment variables. Please set it in your deployment settings.");
    }

    try {
        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            bufferCommands: false, // Don't buffer commands indefinitely if not connected
        });

        cachedConnection = conn;
        console.log("MongoDB connected successfully");
        return cachedConnection;
    } catch (err) {
        console.error("MongoDB connection error:", err.message);
        cachedConnection = null;
        throw err;
    }
};

export default connectDB;