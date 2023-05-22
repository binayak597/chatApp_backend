import { Router } from "express";
import { getAllUsers, getMessages, getUser, loginUser,
     logoutUser, registerUser } from "../controllers/userController.js";

const router = Router();

/** all routes API */


router.get("/userdetails", getUser);
router.get("/messages/:userId", getMessages);
router.get("/people", getAllUsers);
router.post("/login",loginUser);
router.post("/register",registerUser);
router.post("/logout", logoutUser);


export { router };

