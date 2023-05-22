import * as dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import { router } from "./router/routes.js";
import connection from "./connection/database.js";
import { userValidator } from "./middlewares/userValiator.js";
import { authenticator } from "./middlewares/authenticator.js";
import { WebSocketServer } from "ws";
import fs from "fs";
import { MessageModel } from "./model/messageModel.js";

const app = express();

/**middlewares */

app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
}));


app.use(userValidator);
app.use(authenticator);
app.use("/user", router);


let port = process.env.PORT;

if (port == null || port == "") {
    port = 8000;
}


/** start a server only there is a valid DB connection */

connection()
    .then((result) => {
        try {
            /** create a webSocketServer for a new client connection */

            const server = app.listen(port);//assigning a server object to server variable

            const wss = new WebSocketServer({ server });

            wss.on('connection', (connection, req) => {
                // console.log("connected");
                // connection.send("hello"); // after a successful client connection to webScoket server, send a message to the client.

                //to read the username and id of the newly connected user


                function notifyAllOnlinePeople() {
                    [...wss.clients].forEach(client => {
                        client.send(JSON.stringify({
                            online: [...wss.clients].map(c => ({ userName: c.userName, userId: c.userId }))
                        }
                        ));
                    })
                }

                connection.isAlive = true; //add the isAlive property to be true when a user connect..

                connection.timer = setInterval(() => {
                    connection.ping();
                    connection.deathTimer = setTimeout(() => {
                        connection.isAlive = false;
                        clearInterval(connection.timer);
                        connection.terminate();
                        notifyAllOnlinePeople();
                        console.log("dead");
                    }, 1000); //if within 1 sec we will not able to get the pong frame from the client to the server
                    //then we need to execute this setTimeOut func to disconnect the client from the server
                }, 5000);

                connection.on('pong', () => {
                    clearTimeout(connection.deathTimer);

                }); //if within 1 sec we will able to get pong frame from client to server
                //we neeed to clear the setTimeOut func to stop the exec.

                //here we are doing ping pong in webSocketServer
                //when server send a pings to client, the recipient must send back pongs as soon as possible
                //in this way we can know that wheather the client is connected to the server 
                //we are doing ping pong here......

                const cookies = req.headers?.cookie;
                if (cookies) {
                    const tokenStrings = cookies.split(";").find(str => str.startsWith("token"));
                    if (tokenStrings) {
                        const token = tokenStrings.split("=")[1];
                        const decodedToken = jwt.verify(token, process.env.SECRET_MSG);
                        const { userId, userName } = decodedToken;
                        connection.userId = userId;
                        connection.userName = userName;
                    }
                }

                connection.on('message', async (message) => {
                    const messageData = JSON.parse(message);
                    const { recipient, text, file } = messageData;
                    let fileName = null;
                    if (file) {
                        const fileParts = file.name.split(".");
                        const ext = fileParts[fileParts.length - 1];
                        fileName = Date.now() + "." + ext;
                        const path = 'uploads/' + fileName;
                        // console.log(ext, fileName, path);
                        const bufferData = new Buffer(file.data.split(",")[1], "base64");
                        fs.writeFile(path, bufferData, (err) => {
                            if (err) throw err;
                            // console.log("file saved: " + path);
                        });
                    }
                    if (recipient && (text || file)) {
                        const messageDoc = await MessageModel.create({
                            sender: connection.userId,
                            recipient,
                            text,
                            file: file ? fileName : null
                        });

                        //there might be possible same user connected through multiple devices from the app
                        //filter that user and store the same user based on the device multiple times in array
                        //send the message to the same user based on device.
                        [...wss.clients].filter(client => client.userId === recipient).forEach(c => c.send(JSON.stringify({
                            text,
                            file: file ? fileName : null,
                            sender: connection.userId,
                            recipient,
                            _id: messageDoc._id
                        })));
                    }
                }); // whenever a active client send a message to the server.

                //notify to every active user about other active users (when someone connects)
                notifyAllOnlinePeople();

            });

            wss.on('close', data => {
                console.log("diconnected", data);
            });

        } catch (error) {
            console.log("unable to connect to the server");
        }
    })
    .catch((error) => console.log("invalid DB connection"));
