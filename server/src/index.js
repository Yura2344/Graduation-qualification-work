import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import RedisStore from "connect-redis";
import http from "node:http";
import {Server} from "socket.io";

import socketConnect from "./utils/socket.js";
import userRouter from "./routes/UserRouter.js";
import postRouter from "./routes/PostRouter.js";
import sync from "./utils/modelsSync.js";
import { privatePath, publicPath } from "./utils/consts.js";
import chatRouter from "./routes/ChatRouter.js";
import verifySession from "./utils/verifySession.js";
import redisClient from "./utils/redis.js";
import { initDirectories } from "./utils/functions.js";


const redisStore = new RedisStore({
    client: redisClient,
    prefix: "ukr_info:"
});

const sessionMiddleware = session({
    secret: process.env.SECRET,
    credentials: true,
    name: "sid",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: redisStore,
    cookie: {
        secure: process.env.ENVIRONMENT === "production",
        httpOnly: true,
        sameSite: process.env.ENVIRONMENT === "production" ? "none" : "lax",
        maxAge: 1000 * 60 * 60 * 24
    }
});

const app = express();

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

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: true,
        credentials: true
    },
    maxHttpBufferSize: 1024 * 1024 * 1024 * 2
});
io.engine.use(sessionMiddleware);
socketConnect(io);

initDirectories();

sync({force: false}).then(() => {
    server.listen(process.env.PORT, () => {
        console.log(`Server listening at port ${process.env.PORT}`);
    });
});