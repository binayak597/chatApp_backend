import { UserModel } from "../model/userModel.js";


export const userValidator = async (req, res, next) => {
    if(req.path == "/user/register"){
        try{
            const {userName, email} = req.body;
            const userData = await UserModel.find({$or: [{userName: userName}, {email: email}]});
            if(userData.length > 0){
                res.status(200).send({msg: "username is exist"});
            }else{
                next();
            }
        }catch(error){
            res.status(500).send({msg: "couldn't register"});
        }
    }else{
        next();
    }
}