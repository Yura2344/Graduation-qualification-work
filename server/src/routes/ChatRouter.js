import express from "express";
import verifySession from "../utils/verifySession.js";
import { createGroupChat, createPersonalChat, getChat, getChatMessages, getChats, getPersonalChatByUsername } from "../controllers/ChatController.js";
import { body, param } from "express-validator";

const chatRouter = express.Router({mergeParams: true});

chatRouter.post(
    "/personal",
    [
        verifySession,
        body("username").trim().notEmpty()
    ],
    createPersonalChat
);

chatRouter.post(
    "/group",
    [
        verifySession,
        body("name").trim().notEmpty().isAscii().isLength({ min: 5, max: 20 })
    ],
    createGroupChat
);

chatRouter.get(
    "/personal/:username",
    [
        verifySession,
        param("username").trim().notEmpty().isLength({min: 5, max: 20})
    ],
    getPersonalChatByUsername
);

chatRouter.get(
    "/:chatId",
    [
        verifySession,
        param("chatId").trim().isInt()
    ],
    getChat
);

chatRouter.get(
    "/:chatId/messages",
    [
        verifySession,
        param("chatId").trim().isInt()
    ],
    getChatMessages
);

chatRouter.get(
    "/",
    getChats
);

export default chatRouter;