import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    text: {
        type: String
    },
    file: {
        type: String
    }
},
{
    versionKey: false,
    timestamps: true
});

const MessageModel = mongoose.model('Message', messageSchema);

export {MessageModel};