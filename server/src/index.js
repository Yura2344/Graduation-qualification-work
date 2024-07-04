import "dotenv/config";
import express from "express";
import cors from "cors";

import sync from "./utils/modelsSync.js";
import { initDirectories } from "./utils/functions.js";
import {app, server} from "./utils/server.js";
import io from "./utils/socket.js";
import { chatSocketFunctions } from "./controllers/ChatController.js";
import sessionMiddleware from "./utils/sessionMiddleware.js";
import { privatePath, publicPath } from "./utils/consts.js";
import verifySession from "./utils/verifySession.js";
import userRouter from "./routes/UserRouter.js";
import postRouter from "./routes/PostRouter.js";
import chatRouter from "./routes/ChatRouter.js";

app.use(express.urlencoded({extended: true}));
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(sessionMiddleware);
app.use("/public", express.static(publicPath));
app.use("/private", verifySession, express.static(privatePath));
app.use("/users", userRouter);
app.use("/posts", postRouter);
app.use("/chats", chatRouter);

io.on("connection", (socket) => {
    
    chatSocketFunctions(socket);

    socket.on("disconnect", () => {
        console.log("socket disconnected")
    });
});

initDirectories();

sync({force: false}).then(() => {
    server.listen(process.env.PORT, () => {
        console.log(`Server listening at port ${process.env.PORT}`);
    });
});