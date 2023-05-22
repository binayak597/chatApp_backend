import mongoose from "mongoose";

mongoose.set("strictQuery", true);
const connection = async () => {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("DB is connected");
}

export default connection;