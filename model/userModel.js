import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        require: [true, "please provide a unique username"],
        unique: [true, "username is exist"]
    },
    password: {
        type: String, 
        require: true
    },
    email: {
        type: String,
        require: [true, "please provide a unique email"],
        unique: [true, "email is exist"]
    }
},
{
    versionKey: false,
    timestamps: true
}
);

const UserModel = mongoose.model("User", userSchema);

export { UserModel };