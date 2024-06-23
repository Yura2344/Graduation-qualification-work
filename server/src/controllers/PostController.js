import Post from "../models/Post.js";
import path from "node:path";
import { validationResult } from "express-validator";
import fs from "node:fs"
import PostMedia from "../models/PostMedia.js";
import { Op } from "sequelize";
import { ReactionType } from "../utils/customDataTypes.js";
import { postsPath, serverPath } from "../utils/consts.js";
import { avatarURLCol, convertCurrency, countReactions } from "../utils/functions.js";
import slash from "slash";
import Comment from "../models/Comment.js";
import sequelize from "../utils/db.js";
import AdvertisementPost from "../models/AdvertisementPost.js";
import User from "../models/User.js";

async function createFile(file, postPath, postId, filenameNoExt) {
    const ext = path.extname(file.name);
    const filepath = path.join(postPath, `${filenameNoExt}${ext}`);
    file.mv(filepath);
    await PostMedia.create({ postId: postId, mediaPath: slash(path.relative(serverPath, filepath)) });
}

export async function createPost(req, res) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json( result.array() );
    }

    const { type, content, title, cost, currency } = req.body;

    const post = await Post.create({
        creatorId: req.session.userId,
        content: content
    });
    if (post) {
        if (type === "advertisement") {
            const advertisement = await post.createAdvertisementData({
                title: title,
                cost: cost,
                currency: currency
            });
            if (!advertisement) {
                return res.status(500).send("Error while adding advertisement data");
            }
        }
        if (req.files?.media) {
            req.files.media = !req.files.media.length ? [req.files.media] : req.files.media;

            const postPath = path.join(postsPath, `post_${post.id}`)
            if (!fs.existsSync(postPath)) {
                fs.mkdirSync(postPath, { recursive: true });
            }
            for (let [index, file] of req.files.media.entries()) {
                createFile(file, postPath, post.id, `post_media_${index}`);
            }
        }
        return res.status(201).json({message: "Successfully created post", postId: post.id});
    } else {
        return res.status(500).send("Error while creating post");
    }
}

export async function editPost(req, res) {
    const { postId } = req.params;
    const { type, content, title, cost, currency } = req.body;

    const post = await Post.findByPk(postId);
    if (post) {
        if (req.files?.media) {
            const postPath = path.join(postsPath, `post_${postId}`);

            req.files.media = !req.files.media.length ? [req.files.media] : req.files.media;

            const medias = await post.getMedias({
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
            }else if (req.files.media.length < medias.length) {
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
                if (!fs.existsSync(postPath)) {
                    fs.mkdirSync(postPath, { recursive: true });
                }
                for (let i = 0; i < req.files.media.length; i++) {
                    createFile(req.files.media[i], postPath, postId, `post_media_${i}`);
                }
            } else if (req.files.media.length >= medias.length) {
                let i = 0;
                for (; i < medias.length; ++i) {
                    const ext = path.extname(req.files.media[i].name);
                    const oldFilepath = path.join(serverPath, medias[i].mediaPath);
                    fs.unlink(oldFilepath, (err) => {
                        if (err) {
                            console.log(err);
                            return res.status(500).send("Internal server error");
                        }
                        console.log(`deleted ${oldFilepath}`);
                    });
                    const filepath = path.join(postPath, `post_media_${i}${ext}`);
                    req.files.media[i].mv(filepath);
                    await medias[i].update({ mediaPath: slash(path.relative(serverPath, filepath)) });
                }
                for (; i < req.files.media.length; ++i) {
                    createFile(req.files.media[i], postPath, postId, `post_media_${i}`);
                }
            }

        }
        await post.update({ content: content });
        if (type === "advertisement") {
            const oldAdvertisement = await post.getAdvertisementData();
            if (oldAdvertisement) {
                await oldAdvertisement.update({
                    title: title,
                    cost: cost,
                    currency: currency
                });
            } else {
                const advertisement = await post.createAdvertisementData({
                    title: title,
                    cost: cost,
                    currency: currency
                });
                if(!advertisement){
                    return res.status(500).send("Error while adding advertisement data");
                }
            }
        }

        return res.status(200).send("Successfully edited post");
    }
    return res.status(404).send("No post with such id");
}

export async function getPostById(req, res) {
    const { postId } = req.params;
    const post = await Post.findByPk(postId, {
        include: [
            {
                model: User,
                as: "creator",
                attributes: ['id', 'username', avatarURLCol('creator', `${req.protocol}://${req.headers.host}/`)]
            }
        ]
    });

    if (post) {
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
        return res.status(200).json(post);
    } else {
        return res.status(404).send("No post with such id");
    }
}

export async function getPosts(req, res) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json( result.array() );
    }

    const { limit, timestamp, offset, content, type, title, costFrom, costTo, currency } = req.query;

    let whereClause = {
        createdAt: {
            [Op.lt]: timestamp || Date.now()
        }
    };
    let includeAdvertisement = {
        model: AdvertisementPost,
        as: "advertisementData",
        attributes: ['title', 'cost', 'currency']
    };

    if(content && content !== ""){
        whereClause.content = {
            [Op.iLike]: `%${content}%`
        }
    }
    if(type === "advertisement"){

        whereClause['$advertisementData.id$'] = {
            [Op.ne]: null
        };
        if(title && title !== ""){
            includeAdvertisement.where = {
                title: {
                    [Op.iLike]: `%${title}%`
                }
            }
        }
        
    }else if(type === "regular"){
        whereClause['$advertisementData.id$'] = {
            [Op.eq]: null
        };
    }

    let posts = await Post.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: limit === "" ? null : limit,
        offset: offset || 0,
        include: [
            includeAdvertisement,
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

    if(type === "advertisement"){
        if(costTo > 0){
            let currenciesFromTo = {};
            currenciesFromTo[currency.toUpperCase()] = {from: costFrom, to: costTo};

            await Promise.all(posts.map(async (post) => {
                let currentCurrency = post.advertisementData.currency.toUpperCase();
                
                let fromTo = currenciesFromTo[currentCurrency];
                if(!fromTo){
                    fromTo = {
                        from: await convertCurrency(currency, currentCurrency, costFrom),
                        to: await convertCurrency(currency, currentCurrency, costTo)
                    }
                    currenciesFromTo[currentCurrency] = fromTo;
                }
            }));

            for(let fromTo in currenciesFromTo){
                if(typeof fromTo.from === "string") return res.status(400).send("Error while converting");
            }
            
            posts = posts.filter((post) => {
                let currentCurrency = post.advertisementData.currency.toUpperCase();
                console.log(currentCurrency);
                let fromTo = currenciesFromTo[currentCurrency];
                return parseFloat(post.advertisementData.cost) >= parseFloat(fromTo.from) && parseFloat(post.advertisementData.cost) <= parseFloat(fromTo.to);
            });
        }
        
    }

    if (posts.length > 0) {
        for (let post of posts) {
            post.setDataValue("reactions", countReactions(await post.getReactions()));
            post.setDataValue("commentsCount", await post.countComments());
        }
        return res.status(200).json(posts);
    } else {
        return res.status(204).send();
    }
}

export async function setReactionToPost(req, res) {
    const { postId } = req.params;
    if (!ReactionType.values.includes(req.body.reaction)) {
        return res.status(400).send("Invalid reaction");
    }
    const post = await Post.findByPk(postId);
    if (post) {
        const reaction = (await post.getReactions({
            where: {
                userId: req.session.userId
            }
        }))[0];

        if (reaction) {
            if (reaction.reaction === req.body.reaction) {
                await reaction.destroy();
                return res.status(200).send("Removed reaction from this post");
            }
            await reaction.update({ reaction: req.body.reaction });
            return res.status(200).send("Successfully updated reaction");
        } else {
            const newrRaction = await post.createReaction({
                userId: req.session.userId,
                reaction: req.body.reaction
            });
            if (newrRaction)
                return res.status(201).send("Successfully added reaction");
            else
                return res.status(500).send("Internal server error");
        }

    } else {
        return res.status(404).send("No post with such id");
    }
}

export async function getReactionToPost(req, res) {
    const { postId } = req.params;
    const post = await Post.findByPk(postId);
    if (post) {
        const reaction = (await post.getReactions({
            where: {
                userId: req.session.userId
            }
        }))[0];
        if (reaction) {
            return res.status(200).json({ reaction: reaction.reaction });
        } else {
            return res.status(204).send();
        }
    }
    return res.status(404).send("No post with such id");
}

export async function getAllReactionsToPost(req, res) {
    const { postId } = req.params;
    const post = await Post.findByPk(postId);
    if (post) {
        const reactions = await post.getReactions();
        if (reactions.length > 0) {
            return res.status(200).json(countReactions(reactions));
        } else {
            return res.status(204).send();
        }
    }
    return res.status(404).send("No post with such id");
}

export async function deletePost(req, res) {
    const { postId } = req.params;
    const post = await Post.findByPk(postId);
    if (post) {
        if (post.creatorId !== req.session.userId) {
            const currentUser = await User.findByPk(req.session.userId);
            if (currentUser.userRole !== "admin") {
                return res.status(403).send("You don't have permission to delete this post");
            }
        }

        const postFolder = path.join(postsPath, `post_${postId}`);
        if(fs.existsSync(postFolder)){
            fs.rmSync(postFolder, {
                recursive: true,
                force: true
            });
        }

        await post.destroy();
        return res.status(204).send();
    } else {
        return res.status(404).send("No post with such id");
    }
}