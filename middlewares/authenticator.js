import  { UserModel } from "../model/userModel.js";
import bcrypt from "bcrypt";


export const authenticator = async(req, res, next) =>{
    if(req.path == "/user/login"){
        try {
            const {userName, password} = req.body;
            UserModel.findOne({userName: userName})
            .then((foundUser) => {
                bcrypt.compare(password, foundUser.password)
                .then((result) => {
                    if(result) {
                        next();
                    }else{
                        res.status(400).send({msg: "Password didn't match"});
                    }
                })
                .catch((error) => res.status(500).send({msg: "unable to compare"}));
            })
            .catch((error) => res.status(404).send({msg: "username is not found"}));
        } catch (error) {
            res.status(500).send({error: error.message});
        }
    }else{
        next();
    }
}