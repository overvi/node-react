import { config } from "dotenv";
import { connect } from "mongoose";

config();

const connectDB = async () => {
  try {
    await connect(process.env.MONGODB_URI!);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  }
};

export default connectDB;
