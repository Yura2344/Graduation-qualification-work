import express from "express";
import { createComment, setReactionToComment, getComments, getCommentById, editComment, getReactionToComment, deleteComment, getAllReactionsToCommentCounts } from "../controllers/CommentController.js";
import verifySession from "../utils/verifySession.js";
import { body } from "express-validator";
import fileUpload from "express-fileupload";

const commentRouter = express.Router({mergeParams: true});

const commentFileMiddleware = fileUpload({
    limits: {
        files: 10,
        fileSize: 1024 * 1024 * 1024 * 2 // 2 GB
    },
    responseOnLimit: true
});

commentRouter.post(
    "/", 
    [
        verifySession, 
        commentFileMiddleware,
        body("content").if((value, {req}) => {
            return !(req.files?.media);
        }).trim().notEmpty()
    ], 
    createComment
);

commentRouter.put(
    "/:commentId/reaction", 
    [
        verifySession,
        body("content").optional({values: 'falsy'}).trim()
    ], 
    setReactionToComment
);

commentRouter.get(
    "/:commentId/reaction", 
    [
        verifySession
    ], 
    getReactionToComment
);

commentRouter.get(
    "/:commentId/reactions", 
    getAllReactionsToCommentCounts
);

commentRouter.get(
    "/", 
    getComments
);

commentRouter.get(
    "/:commentId",
    getCommentById
);

commentRouter.put(
    "/:commentId", 
    [
        verifySession,
        commentFileMiddleware
    ], 
    editComment
);

commentRouter.delete(
    "/:commentId",
    verifySession,
    deleteComment
);

export default commentRouter;