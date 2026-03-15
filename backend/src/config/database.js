import mongoose from "mongoose";


const connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log("MongoDB connected successfully"))
        .catch((err) => console.log("MongoDB connection error: ", err));
}

export default connectDB;