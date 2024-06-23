import express from "express";
import { register, login, logout, getUserByName, changeUserPassword, getOwnUser, followUser, unfollowUser, isFollowingUser, isFollowerOfUser, getFollowers, getFollowings, getFollowingsFollowersCount, getUserPosts, getUsers, getUserChats, getOwnFollowingsPosts, changeUserAvatar, changeUsername, changeUserRole, deleteUser, deleteAvatar } from "../controllers/UserController.js";
import { body, param } from "express-validator";

import fileUpload from "express-fileupload";
import verifySession from "../utils/verifySession.js";

const userRouter = express.Router();

const usernameValidator = (field) =>
    field.trim().notEmpty().isAscii().isLength({ min: 5, max: 20 })

const passwordValidator = (field) => 
    field.trim().notEmpty().isAscii().isLength({ min: 6, max: 15 })


userRouter.post(
    "/", 
    [
        usernameValidator(body("username")), 
        passwordValidator(body("password")),
        passwordValidator(body("confirmPassword"))
    ],
    register
);

userRouter.post(
    "/login", 
    [
        usernameValidator(body("username")), 
        passwordValidator(body("password"))
    ], 
    login
);

userRouter.post(
    "/logout", 
    logout
);

userRouter.get(
    "/me",
    getOwnUser
);

userRouter.get(
    "/me/chats",
    [
        verifySession
    ],
    getUserChats
);

userRouter.get(
    "/me/followings_posts",
    [
        verifySession
    ],
    getOwnFollowingsPosts
);

userRouter.get(
    "/:username", 
    [
        usernameValidator(param("username"))
    ], 
    getUserByName
);

userRouter.get(
    "/",
    getUsers
);

userRouter.get(
    "/:username/posts", 
    [
        usernameValidator(param("username"))
    ], 
    getUserPosts
);

userRouter.post(
    "/:username/follow",
    [
        verifySession
    ],
    followUser
);

userRouter.delete(
    "/:username/follow",
    [
        verifySession
    ],
    unfollowUser
);

userRouter.get(
    "/:username/is_following",
    [
        verifySession
    ],
    isFollowingUser
);

userRouter.get(
    "/:username/is_follower",
    [
        verifySession
    ],
    isFollowerOfUser
);

userRouter.get(
    "/:username/following_followers_count",
    getFollowingsFollowersCount
);

userRouter.get(
    "/:username/followers",
    getFollowers
);

userRouter.get(
    "/:username/followings",
    getFollowings
);

userRouter.put(
    "/:username/password",
    [
        verifySession,
        usernameValidator(param("username")),
        passwordValidator(body("oldPassword")),
        passwordValidator(body("newPassword")),
        passwordValidator(body("confirmPassword")),
    ],
    changeUserPassword
);

userRouter.put(
    "/:username/role",
    [
        verifySession,
        usernameValidator(param("username"))
    ],
    changeUserRole
);

userRouter.put(
    "/:username/username",
    [
        verifySession,
        usernameValidator(param("username"))
    ],
    changeUsername
);

userRouter.put(
    "/:username/avatar",
    [
        verifySession,
        fileUpload({
            limits: {
                fileSize: 1024*1024*10,
                files: 1
            },
            responseOnLimit: true
        })
    ],
    changeUserAvatar
);

userRouter.delete(
    "/:username/avatar",
    [
        verifySession
    ],
    deleteAvatar
);

userRouter.delete(
    "/:username",
    [
        verifySession,
        usernameValidator(param("username")),
        passwordValidator(body("password")),
    ],
    deleteUser
);

export default userRouter;