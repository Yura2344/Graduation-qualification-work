import Post from "../models/Post.js";
import path from "node:path";
import { validationResult } from "express-validator";
import fs from "node:fs"
import { Op, where } from "sequelize";
import { ReactionType } from "../utils/customDataTypes.js";
import { postsPath, serverPath } from "../utils/consts.js";
import CommentMedia from "../models/CommentMedia.js";
import { countReactions } from "../utils/functions.js"
import slash from "slash";
import User from "../models/User.js";

async function createFile(file, commentPath, commentId, filenameNoExt) {

    const ext = path.extname(file.name);
    const filepath = path.join(commentPath, `${filenameNoExt}${ext}`);
    file.mv(filepath);
    await CommentMedia.create({ commentId: commentId, mediaPath: slash(path.relative(serverPath, filepath)) });
}

export async function createComment(req, res) {
    const { postId } = req.params;
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json( result.array() );
    }

    const post = await Post.findByPk(postId);

    if (post) {
        const comment = await post.createComment({
            senderId: req.session.userId,
            content: req.body.content || ""
        });
        if (comment) {
            if (req.files?.media) {
                req.files.media = !req.files.media.length ? [req.files.media] : req.files.media;

                const commentPath = path.join(postsPath, `post_${postId}`, `comment_${comment.id}`)
                if (!fs.existsSync(commentPath)) {
                    fs.mkdirSync(commentPath, { recursive: true });
                }
                for (let [index, file] of req.files.media.entries()) {
                    createFile(file, commentPath, comment.id, `comment_media_${index}`);
                }
            }
            return res.status(201).send("Successfully created comment");
        } else {
            return res.status(500).send("Error while creating comment")
        }
    } else {
        return res.status(404).send("No post with such id");
    }
}

export async function editComment(req, res) {
    const { postId, commentId } = req.params;

    const post = await Post.findByPk(postId);
    if (post) {
        const comment = (await post.getComments({
            where: {
                id: commentId
            }
        }))[0];
        if (comment) {
            const medias = await comment.getMedias({
                order: [['id', 'ASC']]
            });
            if(req.body.removeMedias){
                if(req.body.content === ""){
                    return res.status(400).send("You should have text or media or both of them");
                }
                for (let i = 0; i < medias.length; i++) {
                    medias[i].destroy();
                    const filepath = path.join(serverPath, medias[i].mediaPath);
                    fs.unlink(filepath, (err) => {
                        if (err) {
                            console.log(err);
                            return res.status(500).send("Internal server error");
                        }
                        console.log(`deleted ${filepath}`);
                    });
                }
            }else if (req.files?.media) {
                const commentPath = path.join(postsPath, `post_${postId}`, `comment_${commentId}`);
                req.files.media = !req.files.media.length ? [req.files.media] : req.files.media;
                
                if (req.files.media.length < medias.length) {
                    
                    for (let i = req.files.media.length; i < medias.length; i++) {
                        medias[i].destroy();
                        const oldFilepath = path.join(serverPath, medias[i].mediaPath);
                        fs.unlink(oldFilepath, (err) => {
                            if (err) {
                                console.log(err);
                                return res.status(500).send("Internal server error");
                            }
                            console.log(`deleted ${oldFilepath}`);
                        });
                    }
                }

                if (medias.length === 0) {
                    if (!fs.existsSync(commentPath)) {
                        fs.mkdirSync(commentPath, { recursive: true });
                    }
                    for (let i = 0; i < req.files.media.length; i++) {
                        createFile(req.files.media[i], commentPath, commentId, `comment_media_${i}`);
                    }
                } else if (req.files.media.length >= medias.length) {
                    console.log(req.files.media.length, medias.length);
                    let i = 0;
                    for (; i < medias.length; ++i) {
                        const ext = path.extname(req.files.media[i].name);
                        const oldFilepath = path.join(serverPath, medias[i].mediaPath);
                        if(fs.existsSync(oldFilepath)){
                            fs.unlink(oldFilepath, (err) => {
                                if (err) {
                                    console.log(err);
                                    return res.status(500).send("Internal server error");
                                }
                                console.log(`deleted ${oldFilepath}`);
                            });
                        }
                       
                        const filepath = path.join(commentPath, `comment_media_${i}${ext}`);
                        req.files.media[i].mv(filepath);
                        await medias[i].update({ mediaPath: slash(path.relative(serverPath, filepath)) });
                    }
                    for (; i < req.files.media.length; ++i) {
                        createFile(req.files.media[i], commentPath, commentId, `comment_media_${i}`);
                    }
                }

            }
            await comment.update({ content: req.body.content });
            return res.status(200).send("Successfully edited comment");
        } else {
            return res.status(404).send("No comment with such id");
        }

    } else {
        return res.status(404).send("No post with such id");
    }
}

export async function getCommentById(req, res) {
    const { postId, commentId } = req.params;
    const post = await Post.findByPk(postId);

    if (post) {
        const comment = (await post.getComments({
            where: {
                id: commentId
            }
        }))[0];
        if (comment){
            const author = await comment.getAuthor();
            comment.setDataValue("author", {
                id: author.id,
                username: author.username,
                avatarURL: author.avatarPath && `${req.protocol}://${req.headers.host}/${author.avatarPath}`
            });
            comment.setDataValue("reactions", countReactions(await comment.getReactions()));
            comment.setDataValue("medias", (await comment.getMedias()).map((media) => {return {
                id: media.id,
                mediaURL: `${req.protocol}://${req.headers.host}/${media.mediaPath}`
            }}));
            return res.status(200).json(comment);
        }
        else
            return res.status(404).send("This post doesn't have comment with such id");
    } else {
        return res.status(404).send("No post with such id");
    }
}

export async function getComments(req, res) {
    const { postId } = req.params;
    const { limit, timestamp, offset } = req.query;

    const post = await Post.findByPk(postId);
    if (post) {
        const comments = await post.getComments({
            where: {
                createdAt: {
                    [Op.lt]: timestamp || Date.now()
                }
            },
            order: [['createdAt', 'DESC']],
            limit: limit === "" ? null : limit,
            offset: offset || 0,
        });
        if (comments.length > 0) {
            for(let comment of comments){
                const author = await comment.getAuthor();
                comment.setDataValue("author", {
                    id: author.id,
                    username: author.username,
                    avatarURL: author.avatarPath && `${req.protocol}://${req.headers.host}/${author.avatarPath}`
                });
                comment.setDataValue("reactions", countReactions(await comment.getReactions()));
                comment.setDataValue("medias", (await comment.getMedias()).map((media) => {return {
                    id: media.id,
                    mediaURL: `${req.protocol}://${req.headers.host}/${media.mediaPath}`
                }}));
            }
            return res.status(200).json(comments);
        } else {
            return res.status(204).send();
        }
    } else {
        return res.status(404).send("No post with such id");
    }
}

export async function setReactionToComment(req, res) {
    const { postId, commentId } = req.params;
    if (!ReactionType.values.includes(req.body.reaction)) {
        return res.status(400).send("invalid reaction");
    }
    const post = await Post.findByPk(postId);

    if (post) {
        const comment = (await post.getComments({
            where: {
                id: commentId
            }
        }))[0];
        if(comment){
            const reaction = (await comment.getReactions({
                where: {
                    userId: req.session.userId
                }
            }))[0];
    
            if (reaction) {
                if (reaction.reaction === req.body.reaction) {
                    await reaction.destroy();
                    return res.status(200).send("Removed reaction from this comment");
                }
                await reaction.update({ reaction: req.body.reaction });
                return res.status(200).send("Successfully updated reaction");
            } else {
                const newReaction = await comment.createReaction({
                    userId: req.session.userId,
                    reaction: req.body.reaction
                });
                if (newReaction)
                    return res.status(201).send("Successfully added reaction");
                else
                    return res.status(500).send("internal server error");
            }
        }else{
            return res.status(404).send("No comment with such id");
        }

    } else {
        return res.status(404).send("No post with such id");
    }
}

export async function getReactionToComment(req, res) {
    const { postId, commentId } = req.params;
    const post = await Post.findByPk(postId);
    if (post) {
        const comment = (await post.getComments({
            where: {
                id: commentId
            }
        }))[0];
        if(comment){
            const reaction = (await comment.getReactions({
                where: {
                    userId: req.session.userId
                }
            }))[0];
            if (reaction) {
                return res.status(200).json({ reaction: reaction.reaction });
            } else {
                return res.status(204).send();
            }
        }else{
            return res.status(404).send("No comment with such id");
        }
    }
    return res.status(404).send("No post with such id");
}

export async function getAllReactionsToCommentCounts(req, res) {
    const { postId, commentId } = req.params;
    const post = await Post.findByPk(postId);
    if (post) {
        const comment = (await post.getComments({
            where: {
                id: commentId
            }
        }))[0];
        if(comment){
            const reactions = await comment.getReactions();
            if (reactions.length > 0) {
                return res.status(200).json(countReactions(reactions));
            } else {
                return res.status(204).send();
            }
        }else{
            return res.status(404).send("No comment with such id");
        }
    }
    return res.status(404).send("No post with such id");
}

export async function deleteComment(req, res) {
    const { postId, commentId } = req.params;
    const post = await Post.findByPk(postId);
    if (post) {
        const comment = (await post.getComments({
            where: {
                id: commentId
            }
        }))[0];
        if(comment){
            if (comment.senderId !== req.session.userId) {
                const currentUser = await User.findByPk(req.session.userId);
                if (currentUser.userRole !== "admin") {
                    return res.status(403).send("You don't have permission to delete this comment");
                }
            }

            const commentFolder = path.join(postsPath, `post_${postId}`, `comment_${commentId}`);
            if(fs.existsSync(commentFolder)){
                fs.rmSync(commentFolder, {
                    recursive: true,
                    force: true
                });
            }
            
            
            await comment.destroy();
            return res.status(204).send();
        }else{
            return res.status(404).send("No comment with such id");
        }
        
    } else {
        return res.status(404).send("No post with such id");
    }
}