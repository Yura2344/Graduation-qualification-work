import path from "node:path";
import bcrypt from "bcrypt";
import { validationResult } from "express-validator";
import fs from "node:fs"

import User from "../models/User.js";
import { avatarsPath, serverPath } from "../utils/consts.js";
import slash from "slash";
import { ReactionType } from "../utils/customDataTypes.js";
import { avatarURLCol, countReactions } from "../utils/functions.js";
import Comment from "../models/Comment.js";
import { Op, where } from "sequelize";
import Post from "../models/Post.js";
import PostMedia from "../models/PostMedia.js";
import sequelize from "../utils/db.js";
import AdvertisementPost from "../models/AdvertisementPost.js";
import sharp from "sharp";

export async function register(req, res) {
    if (req.session.userId) {
        return res.status(400).send("Logout first to register");
    }
    const { username, password, confirmPassword } = req.body;

    const checkUser = await User.findOne({
        where: {
            username: username
        }
    });
    if(checkUser){
        return res.status(400).json([{path: "username", msg: "Username already taken"}]);
    }

    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json(result.array() );
    }

    if (password !== confirmPassword) {
        return res.status(400).send("Password and confirm password don't match");
    }

    let newUser = {
        username: username,
        password: await bcrypt.hash(password, 10)
    };

    await User.create(newUser);
    return res.status(201).send("Successful registration");

}

export async function login(req, res) {
    if (req.session.userId) {
        return res.status(400).send("You are already logged in");
    }
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json( result.array() );
    }

    const { username, password } = req.body;

    const user = await User.findOne({ where: { username: username } });
    if (user) {
        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send("Internal server error");
            }
            if (result) {
                req.session.userId = user.id;
                req.session.username = user.username;
                return res.status(200).json({
                    username: user.username,
                    role: user.role,
                    avatarURL: user.avatarPath && `${req.protocol}://${req.headers.host}/${user.avatarPath}`
                });
            } else {
                return res.status(400).send([{path: "password", msg: "Incorrect password"}]);
            }
        });
    } else {
        return res.status(400).send("No user with such name");
    }
}

export function logout(req, res) {
    res.clearCookie("sid");
    if(req.session){
        req.session.destroy();
        return res.status(204).send("Successfully logged out");
    }else{
        return res.status(204).send("You are already logged out");
    }
}

export async function getOwnUser(req, res) {
    if(!req.session.userId){
        return res.status(204).send("Not logged in");
    }
    const user = await User.findOne({
        where: {
            id: req.session.userId
        }
    });
    if (user)
        return res.status(200).json({
            id: user.id,
            username: user.username,
            role: user.role,
            avatarURL: user.avatarPath && `${req.protocol}://${req.headers.host}/${user.avatarPath}`
        });
    else
        return res.status(404).send("No user with such id");
}

export async function getUserByName(req, res) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json( result.array() );
    }

    const currentUser = await User.findByPk(req.session.userId);

    const user = await User.findOne({ where: { username: req.params.username } });
    if (user) {
        let returnUser = { 
            username: user.username,
            avatarURL: user.avatarPath && `${req.protocol}://${req.headers.host}/${user.avatarPath}` 
        };
        if(currentUser.userRole === "admin"){
            returnUser.role = user.role;
        }
        return res.status(200).json(returnUser);
    } else {
        return res.status(404).send("No user with such name");
    }
}

export async function getUsers(req, res) {
    const {username} = req.query;

    const users = await User.findAll({
        where: {
            username: {
                [Op.iLike]: `%${username || ""}%`
            }
        },
        attributes: ['id', 'username', 'avatarPath']
    });
    if (users) {
        for(const user of users){
            if(user.avatarPath){
                user.setDataValue('avatarURL', `${req.protocol}://${req.headers.host}/${user.avatarPath}`);
            }
            delete user.avatarPath;
        }
        return res.status(200).json(users);
    } else {
        return res.status(204).send("No users");
    }
}

export async function getUserPosts(req, res){
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json( result.array() );
    }

    const user = await User.findOne({ where: { username: req.params.username } });
    if (user) {
        const posts = await user.getPosts();
        for (let post of posts) {
            const creatorData = {
                id: user.id,
                username: user.username,
                avatarURL: user.avatarPath && `${req.protocol}://${req.headers.host}/${user.avatarPath}`
            }
            post.setDataValue("creator", creatorData);
            post.setDataValue("reactions", countReactions(await post.getReactions()));
            post.setDataValue("commentsCount", await Comment.count({
                where: {
                    postId: post.id
                }
            }));
            post.setDataValue("medias", (await post.getMedias()).map((media) => {
                return {
                    id: media.id,
                    mediaURL: `${req.protocol}://${req.headers.host}/${media.mediaPath}`
                }
            }));
            const advertisement = await post.getAdvertisementData();
            if (advertisement) {
                post.setDataValue("title", advertisement.title);
                post.setDataValue("cost", advertisement.cost);
                post.setDataValue("currency", advertisement.currency);
            }
        }
        return res.status(200).json(posts);
    } else {
        return res.status(404).send("No user with such name");
    }
}

export async function getUserChats(req, res) {
    const { limit, offset } = req.query;
    const user = await User.findByPk(req.session.userId);

    const chats = await user.getChats({
        order: [['id', 'DESC']],
        limit: limit === "" ? null : limit,
        offset: offset || 0,
        include: [
            {
                model: User,
                as: "members",
                attributes: ['id', 'username', avatarURLCol("members", `${req.protocol}://${req.headers.host}/`)],
                through: { attributes: [] }
            }
        ],
        joinTableAttributes: []
    });
    if (chats) {
        return res.status(200).json(chats);
    } else {
        return res.status(204).send();
    }
}

export async function followUser(req, res){
    const {username} = req.params;

    const currentUser = await User.findByPk(req.session.userId);

    const userToFollow = await User.findOne({
        where: {
            username: username
        }
    });

    if(userToFollow){
        if(currentUser.username === userToFollow.username){
            return res.status(400).send("You can't follow/unfollow yourself");
        }
        if(await userToFollow.hasFollower(currentUser)){
            return res.status(400).send(`You are already following ${userToFollow.username}`);
        }
        await userToFollow.addFollower(currentUser);
        return res.status(200).send(`Successfully following ${userToFollow.username}`)
    }else{
        return res.status(404).send("No user with such name");
    }
}

export async function unfollowUser(req, res){
    const {username} = req.params;

    const currentUser = await User.findByPk(req.session.userId);

    const userToUnfollow = await User.findOne({
        where: {
            username: username
        }
    });
    if(userToUnfollow){
        if(currentUser.username === userToUnfollow.username){
            return res.status(400).send("You can't follow/unfollow yourself");
        }
        if(!(await userToUnfollow.hasFollower(currentUser))){
            return res.status(400).send(`You are already not following ${userToUnfollow.username}`);
        }
        await userToUnfollow.removeFollower(currentUser);
        return res.status(200).send(`Successfully unfollowed ${userToUnfollow.username}`)
    }else{
        return res.status(404).send("No user with such name");
    }
}

export async function isFollowingUser(req, res){
    const {username} = req.params;

    const currentUser = await User.findByPk(req.session.userId);
    if(currentUser.username === username){
        return res.status(200).json({following: false})
    }
    const userFollowing = await User.findOne({
        where: {
            username: username
        }
    });
    if(userFollowing){
        if(await currentUser.hasFollowing(userFollowing)){
            return res.status(200).json({following: true});
        }else{
            return res.status(200).json({following: false});
        }
    }else{
        return res.status(404).send("No user with such name");
    }
}

export async function isFollowerOfUser(req, res){
    const {username} = req.params;

    const currentUser = await User.findByPk(req.session.userId);
    if(currentUser.username === username){
        return res.status(200).json({follower: false})
    }
    const userFollower = await User.findOne({
        where: {
            username: username
        }
    });
    if(userFollower){
        if(await currentUser.hasFollower(userFollower)){
            return res.status(200).json({follower: true});
        }else{
            return res.status(200).json({follower: false});
        }
    }else{
        return res.status(404).send("No user with such name");
    }
}

export async function getFollowingsFollowersCount(req, res) {
    const {username} = req.params;

    const user = await User.findOne({
        where: {
            username: username
        }
    });
    if(user){
        return res.status(200).json({
            followingsCount: await user.countFollowings(),
            followersCount: await user.countFollowers()
        });
    }else{
        return res.status(404).send("No user with such name");
    }
}

export async function getFollowings(req, res) {
    const {username} = req.params;

    const user = await User.findOne({
        where: {
            username: username
        }
    });
    if(user){
        const followings = await user.getFollowings().then((res) => res.map((following) => {
            return {
                id: following.id,
                username: following.username,
                avatarURL: following.avatarPath && `${req.protocol}://${req.headers.host}/${following.avatarPath}`
            }
        }));
        return res.status(200).json(followings);
    }else{
        return res.status(404).send("No user with such name");
    }
}

export async function getOwnFollowingsPosts(req, res) {
    const user = await User.findOne({
        where: {
            username: req.session.username
        }
    });
    const followingsIds = (await user.getFollowings({
        attributes: ['id']
    })).map((user) => user.id);

    const posts = await Post.findAll({
        where: {
            creatorId: {
                [Op.in]: followingsIds
            }
        },
        order: [['createdAt', 'DESC']],
        include: [
            {
                model: AdvertisementPost,
                as: "advertisementData",
                attributes: ['title', 'cost', 'currency']
            },
            {
                model: User,
                as: "creator",
                attributes: ['id', 'username', avatarURLCol('creator', `${req.protocol}://${req.headers.host}/`)]
            },
            {
                model: PostMedia,
                as: "medias",
                attributes: ['id', [sequelize.fn('CONCAT', `${req.protocol}://${req.headers.host}/`, sequelize.col('mediaPath')), 'mediaURL']]
            }
        ]
    });
    for (let post of posts) {
        post.setDataValue("reactions", countReactions(await post.getReactions()));
        post.setDataValue("commentsCount", await post.countComments());
    }

    return res.status(200).json(posts);
}

export async function getFollowers(req, res) {
    const {username} = req.params;

    const user = await User.findOne({
        where: {
            username: username
        }
    });
    if(user){
        const followers = await user.getFollowers().then((res) => res.map((follower) => {
            return {
                id: follower.id,
                username: follower.username,
                avatarURL: follower.avatarPath && `${req.protocol}://${req.headers.host}/${follower.avatarPath}`
            }
        }));
        return res.status(200).json(followers);
    }else{
        return res.status(404).send("No user with such name");
    }
}

export async function changeUserPassword(req, res) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json( result.array() );
    }

    const { username } = req.params;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        return res.status(400).send("New password doesn't match with confirm password");
    }

    if (oldPassword === newPassword) {
        return res.status(400).send("New password shouldn't match with old password");
    }

    const user = await User.findOne({
        where: {
            username: username
        }
    });
    if (user) {
        if (user.id !== req.session.userId) {
            return res.status(403).send("You don't have permission to change this user's password");
        }

        if (await bcrypt.compare(oldPassword, user.password)) {
            user.update({ password: await bcrypt.hash(newPassword, 10) });
            return res.status(200).send("Successfully changed password");
        } else {
            return res.status(400).send("Wrong password");
        }
    } else {
        return res.status(404).send("No user with such name")
    }
}

export async function changeUserRole(req, res){

    const currentUser = await User.findByPk(req.session.userId);
    if(currentUser.userRole !== "admin"){
        return res.status(403).send("You don't have permission to change user role");
    }

    const {role} = req.body;
    const {username} = req.params;
    if(!ReactionType.values.includes(role)){
        return res.status(400).send("Invalid role");
    }

    if(currentUser.username === username){
        return res.status(400).send("You can't change own role");
    }

    const user = await User.findOne({
        where: {
            username: username
        }
    });
    if(user){
        await user.update({
            role: role
        });
        return res.status(200).send("Successfully changed user role");
    }else{
        return res.status(404).send("No user with such name");
    }
}

export async function changeUsername(req, res){
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json( result.array() );
    }

    const user = await User.findOne({
        where: {
            username: req.params.username
        }
    });
    if (user) {
        const userWithNewName = await User.findOne({
            where: {
                username: req.body.username
            }
        });
        if(userWithNewName){
            return res.status(400).send("Username taken");
        }

        const userUpdated = await user.update({
            username: req.body.username
        });
        req.session.username = req.body.username;
        return res.status(200).json({ 
            username: userUpdated.username,
            avatarURL: userUpdated.avatarPath && `${req.protocol}://${req.headers.host}/${userUpdated.avatarPath}`
        });
    } else {
        return res.status(404).send("No user with such name");
    }
}

export async function changeUserAvatar(req, res) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json( result.array() );
    }

    const {cropX, cropY, cropWidth, cropHeight} = JSON.parse(req.body.cropParams);

    const user = await User.findOne({
        where: {
            username: req.params.username
        }
    });
    if (user) {
        let newAvatarPath = user.avatarPath;
        if (req.files?.avatar) {
            if (user.avatarPath) {
                fs.unlinkSync(path.join(serverPath, user.avatarPath), (err) => {
                    if (err) {
                        console.log(err);
                        return res.status(500).send("Internal server error");
                    }
                });
            }
            const ext = path.extname(req.files.avatar.name);
            let avatarPath = path.join(avatarsPath, `avatar_${user.id}${ext}`);
            if(cropX){
                await sharp(req.files.avatar.data, {animated: true}).extract({
                    left: parseInt(cropX), 
                    top: parseInt(cropY), 
                    width: parseInt(cropWidth), 
                    height: parseInt(cropHeight)
                }).toFile(avatarPath);
            }else{
                req.files.avatar.mv(avatarPath);
            }
            
            let url = slash(path.relative(serverPath, avatarPath));
            newAvatarPath = url;
            const newUser = await user.update({avatarPath: newAvatarPath});

            return res.status(200).json({ 
                avatarURL: newUser.avatarPath && `${req.protocol}://${req.headers.host}/${newUser.avatarPath}`
            });
        }else{
            return res.status(400).send("You need to send image for avatar");
        }

        
    } else {
        return res.status(404).send("No user with such name");
    }
}

export async function deleteAvatar(req, res){
    const user = await User.findOne({
        where: {
            username: req.params.username
        }
    });
    if(user){
        await user.update({avatarPath: null});
        return res.status(204).send("Successfully deleted avatar");
    } else {
        return res.status(404).send("No user with such name");
    }
}

export async function deleteUser(req, res) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json( result.array() );
    }

    const { username } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
        where: {
            username: username
        }
    });

    const currentUser = await User.findByPk(req.session.userId);

    if (user) {
        if (user.id === req.session.userId) {
            if (await bcrypt.compare(password, user.password)) {
                await user.destroy();
                req.session.destroy();
                return res.status(204).send("Successfully deleted user");
            } else {
                return res.status(400).send("Wrong password");
            }
        } else if (currentUser.userRole === "admin") {
            const admin = await User.findOne({
                where: {
                    id: req.session.userId
                }
            });
            if (await bcrypt.compare(password, admin.password)) {
                await user.destroy();
                return res.status(204).send("Successfully deleted user");
            } else {
                return res.status(400).send("Wrong password");
            }
        } else {
            return res.status(403).send("You don't have permission to delete this user");
        }
    } else {
        return res.status(404).send("No user with such name")
    }
}