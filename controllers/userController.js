
import { UserModel } from "../model/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { MessageModel } from "../model/messageModel.js";

const saltRounds = 10;

export const getUser = async (req, res) => {
    try {
        const token = req.cookies?.token;
        if(token) {
           const decodedToken =  jwt.verify(token, process.env.SECRET_MSG);
           res.status(200).send(decodedToken);
        }else{
            res.status(401).send({msg: "no token"});
        }
    } catch (error) {
        res.status(500).send({error: error.message});
    }
    }

const getUserIdFromOriginUrl = async (req)=> {
    return new Promise((resolve, reject) => {
        const token = req.cookies?.token;
        if (token) {
         const decodedToken = jwt.verify(token, process.env.SECRET_MSG);
         resolve(decodedToken);
        } else {
          reject('no token');
        }
      });
}


export const registerUser = async (req, res) => {
    try {
        const {email, userName, password} = req.body;
        bcrypt.hash(password, saltRounds)
        .then((hashedPassword) => {
            const newUser = new UserModel({
                email,
                userName,
                password: hashedPassword
            });
            newUser.save()
            .then((result) => res.status(201).send({msg: "User saved successfully"}))
            .catch((error) => res.status(500).send({msg: "Unable to save the data"}));
        })
        .catch((error) => res.status(500).send({msg: "Unable to generate the hashed Password"}));
    } catch (error) {
        res.status(500).send({error: error.message})
    }
}

export const loginUser = async (req, res) => {
   try {
    const {userName} = req.body;

    const options = {
        expiresIn: "24h"
    }

    UserModel.findOne({userName: userName})
    .then((foundUser) => {
        const token = jwt.sign({
            userId: foundUser._id,
            userName: foundUser.userName
        }, process.env.SECRET_MSG, options);

        res.status(200).cookie('token', token, {sameSite: 'none', secure: true}).send({
            msg: "Login is successful",
            token: token,
            userDetails: {
                userId: foundUser._id,
                userName: foundUser.userName
            }
        });
    })
    .catch((error) => res.status(404).send({msg: "username is not found"}));
   } catch (error) {
    res.status(500).send({error: error.message});
   }
}


export const getMessages = async (req, res) => {
 const {userId} = req.params;
  const userData = await getUserIdFromOriginUrl(req);
  const ourUserId = userData.userId;
  const messages = await MessageModel.find({
    sender:{$in:[userId,ourUserId]},
    recipient:{$in:[userId,ourUserId]},
  }).sort({createdAt: 1});
res.status(200).send(messages);
}

export const getAllUsers = async (req, res) => {
    const users = await UserModel.find();
    res.status(200).send(users);
}

export const logoutUser = async (req, res) => {
    res.status(200).cookie('token', "").send({msg: "logout successfully"});
}

export const getAllMessages = async (req, res) => {
    const {ourId, userId} = req.params;

    const messages = await MessageModel.find({
        sender: {$in: [ourId, userId]},
        recipient: {$in: [ourId, userId]}
    });
    res.send(messages);
}
