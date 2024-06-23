import express from "express";
import { createPost, setReactionToPost, getPosts, getPostById, editPost, getReactionToPost, getAllReactionsToPost, deletePost } from "../controllers/PostController.js";
import verifySession from "../utils/verifySession.js";
import { body, query } from "express-validator";
import fileUpload from "express-fileupload";
import commentRouter from "./CommentRouter.js";

const postRouter = express.Router();

postRouter.use("/:postId/comments", commentRouter);

const postFileMiddleware = fileUpload({
    limits: {
        files: 10,
        fileSize: 1024 * 1024 * 1024 * 2 // 2 GB
    },
    responseOnLimit: true
});

postRouter.post(
    "/", 
    [
        verifySession, 
        postFileMiddleware,
        body("content").trim().if((value, {req}) => !req.files).notEmpty(),
        body("type").trim().optional(),
        body("title").trim().if((value, {req}) => req.body.type === "advertisement").notEmpty(),
        body("cost").trim().if((value, {req}) => req.body.type === "advertisement").isFloat({min: 1, max: 10000000}),
        body("currency").trim().if((value, {req}) => req.body.type === "advertisement").isLength({min: 3, max: 3})
    ], 
    createPost
);

postRouter.put(
    "/:postId/reaction", 
    [
        verifySession
    ], 
    setReactionToPost
);

postRouter.get(
    "/:postId/reaction", 
    [
        verifySession
    ], 
    getReactionToPost
);

postRouter.get(
    "/:postId/reactions", 
    getAllReactionsToPost
);

postRouter.get(
    "/",
    [
        query("title").trim().if((value, {req}) => req.body.type === "advertisement"),
        query("costFrom").trim().if((value, {req}) =>  req.query.type === "advertisement").isFloat({min: 0}),
        query("costTo").trim().if((value, {req}) => req.query.type === "advertisement").isFloat({min: 0}),
        query("currency").trim().if((value, {req}) => req.query.type === "advertisement").isLength({min: 3, max: 3})
    ],
    getPosts
);

postRouter.get(
    "/:postId",
    getPostById
);

postRouter.put(
    "/:postId", 
    [
        verifySession,
        postFileMiddleware
    ], 
    editPost
);

postRouter.delete(
    "/:postId",
    verifySession,
    deletePost
);

export default postRouter;