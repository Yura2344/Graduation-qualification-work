import RedisStore from "connect-redis";
import redisClient from "./redis.js";
import session from "express-session";

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

export default sessionMiddleware;