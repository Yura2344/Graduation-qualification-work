import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import sequelize from "../utils/db.js";
import fs from "node:fs";
import path from "node:path";
import { groupChatsPath, personalChatsPath, serverPath } from "../utils/consts.js";
import slash from "slash";
import MessageMedia from "../models/MessageMedia.js";
import { ReactionType } from "../utils/customDataTypes.js";
import { avatarURLCol, countReactions } from "../utils/functions.js";
import { Op } from "sequelize";
import { validationResult } from "express-validator";
import sharp from "sharp";
import io from "../utils/socket.js"

export async function createPersonalChat(req, res) {
    const { username } = req.body;

    if (req.session.username === username) {
        return res.status(400).send("You can't create personal chat with yourself");
    }

    const user = await User.findOne({
        where: {
            username: username
        }
    });
    if (!user) {
        return res.status(404).send("No user with such name");
    }

    const chat = await Chat.create({
        creatorId: req.session.userId,
        chatType: "personal"
    });
    if (chat) {
        const currentUser = await User.findOne({
            where: {
                username: req.session.username
            }
        });
        await chat.addMembers([currentUser, user]);

        io.to(`user_${user.id}`).emit("created_chat");
        return res.status(200).json({ message: "Successfully created chat", chatId: chat.id });
    } else {
        return res.status(500).send("Error while creating chat");
    }
}

export async function createGroupChat(req, res) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json(result.array());
    }
    const { name } = req.body;

    const chat = await Chat.create({
        creatorId: req.session.userId,
        chatType: "group",
        name: name
    });
    if (chat) {
        const currentUser = await User.findOne({
            where: {
                username: req.session.username
            }
        });
        await chat.addMembers([currentUser]);
        return res.status(200).json({ message: "Successfully created chat", chatId: chat.id })
    } else {
        return res.status(500).send("Error while creating chat");
    }
}

export async function getPersonalChatByUsername(req, res) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json(result.array());
    }

    const { username } = req.params;
    const chat = await Chat.findOne({
        where: {
            chatType: "personal"
        },
        include: [
            {
                model: User,
                as: "members",
                attributes: ['id', 'username', avatarURLCol("members", `${req.protocol}://${req.headers.host}/`)],
                where: {
                    username: {
                        [Op.in]: [username, req.session.username]
                    }
                },
                through: {
                    attributes: []
                },
                required: true
            }
        ]
    });

    if(chat && chat.members.length === 2){
        return res.status(200).json(chat);
    }else{
        return res.status(404).send("No personal chat with this user");
    }
}

export async function getChat(req, res) {
    const result = validationResult(req);
    if (!result.isEmpty()) {
        return res.status(400).json(result.array());
    }

    const { chatId } = req.params;

    const chat = await Chat.findOne({
        attributes: {
            exclude: ['avatarPath'],
            include: [avatarURLCol("Chat", `${req.protocol}://${req.headers.host}/`)]
        },
        where: {
            id: chatId
        },
        include: [
            {
                model: User,
                as: "members",
                attributes: ['id', 'username', avatarURLCol("members", `${req.protocol}://${req.headers.host}/`)]
            }
        ]
    });
    if (chat) {
        if (chat.chatType !== "group") {
            if (!chat.members.some((value) => (value.username === req.session.username))) {
                return res.status(403).send("This is personal chat and you are not its member");
            }
        }
        const lastMessage = (await chat.getMessages({
            limit: 1,
            order: [["createdAt", "DESC"]],
            include: [
                {
                    model: MessageMedia,
                    as: "medias",
                    attributes: ['id', [sequelize.fn('CONCAT', `${req.protocol}://${req.headers.host}/`, sequelize.col('mediaPath')), 'mediaURL']]
                },
                {
                    model: User,
                    as: "sender",
                    attributes: ['id', 'username', avatarURLCol("sender", `${req.protocol}://${req.headers.host}/`)]
                }
            ]
        }))[0];
        chat.setDataValue("lastMessage", lastMessage);
        return res.status(200).json(chat);
    } else {
        return res.status(404).send("No chat with such id");
    }
}

export async function getChatMessages(req, res) {
    const { chatId } = req.params;
    const { limit, offset } = req.query;

    const chat = await Chat.findOne({
        attributes: {
            exclude: ['avatarPath'],
            include: [avatarURLCol("Chat", `${req.protocol}://${req.headers.host}/`)]
        },
        where: {
            id: chatId
        }
    });
    if (chat) {
        const currentUser = await User.findOne({
            where: {
                username: req.session.username
            }
        });
        if (chat.chatType === "group" || await chat.hasMember(currentUser)) {
            const messages = await chat.getMessages({
                order: [['createdAt', 'ASC']],
                limit: limit === "" ? null : limit,
                offset: offset || 0,
                include: [
                    {
                        model: MessageMedia,
                        as: "medias",
                        attributes: ['id', [sequelize.fn('CONCAT', `${req.protocol}://${req.headers.host}/`, sequelize.col('mediaPath')), 'mediaURL']]
                    },
                    {
                        model: User,
                        as: "sender",
                        attributes: ['id', 'username', avatarURLCol("sender", `${req.protocol}://${req.headers.host}/`)]
                    }
                ]
            });
            for (let message of messages) {
                message.setDataValue("reactions", countReactions(await message.getReactions()));
            }
            return res.status(200).json(messages);
        } else {
            return res.status(403).json("You don't have permission to get messages from this chat");
        }
    } else {
        return res.status(404).send("No chat with such id");
    }
}

export async function getChats(req, res) {
    const { limit, offset, name } = req.query;
    const chats = await Chat.findAll({
        attributes: {
            exclude: ['avatarPath'],
            include: [avatarURLCol("Chat", `${req.protocol}://${req.headers.host}/`)]
        },
        where: {
            chatType: "group",
            name: {
                [Op.iLike]: `%${name || ""}%`
            }
        },
        order: [['id', 'DESC']],
        limit: limit === "" ? null : limit,
        offset: offset || 0
    });
    if (chats) {
        for(let chat of chats){
            const lastMessage = (await chat.getMessages({
                limit: 1,
                order: [["createdAt", "DESC"]],
                include: [
                    {
                        model: MessageMedia,
                        as: "medias",
                        attributes: ['id', [sequelize.fn('CONCAT', `${req.protocol}://${req.headers.host}/`, sequelize.col('mediaPath')), 'mediaURL']]
                    },
                    {
                        model: User,
                        as: "sender",
                        attributes: ['id', 'username', avatarURLCol("sender", `${req.protocol}://${req.headers.host}/`)]
                    }
                ]
            }))[0];
            chat.setDataValue("lastMessage", lastMessage);
        }
        return res.status(200).json(chats);
    } else {
        return res.status(204).send();
    }
}

export function chatSocketFunctions(socket) {
    if (socket.request.session.userId) {
        socket.join(`user_${socket.request.session.userId}`);
    }

    socket.on("connect_to_chat", (chatId) => {
        console.log("connected chat", chatId);
        socket.join(`chat_${chatId}`);
    });

    socket.on("disconnect_from_chat", (chatId) => {
        console.log("disconencted chat", chatId);
        socket.leave(`chat_${chatId}`);
    });

    socket.on("add_user_to_chat", async (userId, chatId) => {
        const currentUserId = socket.request.session.userId;
        if (!currentUserId) {
            socket.emit("not_authenticated");
            return;
        }

        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', avatarURLCol('User', `${process.env.ENVIRONMENT === "production" ? "https" : "http"}://${socket.handshake.headers.host}/`)]
        });
        if (!user) {
            socket.emit("no_user");
            return;
        }

        const chat = await Chat.findByPk(chatId);
        if (!chat) {
            socket.emit("no_chat");
            return;
        }

        if (await chat.hasMember(user)) {
            socket.emit("user_is_already_chat_member");
            return;
        }
        await chat.addMember(user);
        io.to(`chat_${chatId}`).emit("added_member", user);
        socket.emit("added_to_chat", chatId);
    });

    socket.on("remove_user_from_chat", async (userId, chatId) => {
        const currentUserId = socket.request.session.userId;
        if (!currentUserId) {
            socket.emit("not_authenticated");
            return;
        }

        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', avatarURLCol('User', `${process.env.ENVIRONMENT === "production" ? "https" : "http"}://${socket.handshake.headers.host}/`)]
        });
        if (!user) {
            socket.emit("no_user");
            return;
        }

        const chat = await Chat.findByPk(chatId);
        if (!chat) {
            socket.emit("no_chat");
            return;
        }

        if (!(await chat.hasMember(user))) {
            socket.emit("user_is_already_not_chat_member");
            return;
        }
        await chat.removeMember(user);
        io.to(`chat_${chatId}`).emit("removed_member", user);
    });

    socket.on("update_chat_name", async (chatId, name) => {
        const currentUserId = socket.request.session.userId;
        if (!currentUserId) {
            socket.emit("not_authenticated");
            return;
        }

        if (!name || name.trim === "") {
            socket.emit("no_chat_name");
            return;
        }
        name = name.trim();

        const chat = await Chat.findByPk(chatId);
        if (!chat) {
            socket.emit("no_chat");
            return;
        }

        await chat.update({ name: name });
        io.to(`chat_${chatId}`).emit("updated_chat")
    });

    socket.on("update_chat_avatar", async (chatId, avatar, cropParams) => {
        const currentUserId = socket.request.session.userId;
        if (!currentUserId) {
            socket.emit("not_authenticated");
            return;
        }

        const chat = await Chat.findByPk(chatId);
        if (!chat) {
            socket.emit("no_chat");
            return;
        }

        if (!avatar) {
            socket.emit("no_avatar");
            return;
        }

        const { cropX, cropY, cropWidth, cropHeight } = cropParams;

        if (!fs.existsSync(path.join(groupChatsPath, `chat_${chatId}`))) {
            fs.mkdirSync(path.join(groupChatsPath, `chat_${chatId}`));
        }

        if (chat.avatarPath) {
            fs.unlinkSync(path.join(serverPath, chat.avatarPath), (err) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send("Internal server error");
                }
            });
        }
        const ext = path.extname(avatar.name);
        let avatarPath = path.join(groupChatsPath, `chat_${chatId}`, `avatar${ext}`);
        if (cropX) {
            await sharp(avatar.data, { animated: true }).extract({
                left: parseInt(cropX),
                top: parseInt(cropY),
                width: parseInt(cropWidth),
                height: parseInt(cropHeight)
            }).toFile(avatarPath);
        } else {
            await sharp(avatar.data).toFile(avatarPath);
        }

        let newAvatarPath = slash(path.relative(serverPath, avatarPath));
        await chat.update({ avatarPath: newAvatarPath });
        io.to(`chat_${chatId}`).emit("updated_chat");
    });

    socket.on("join_chat", async (chatId) => {
        const currentUserId = socket.request.session.userId;
        if (!currentUserId) {
            socket.emit("not_authenticated");
            return;
        }

        const currentUser = await User.findByPk(currentUserId, {
            attributes: ['id', 'username', avatarURLCol('User', `${process.env.ENVIRONMENT === "production" ? "https" : "http"}://${socket.handshake.headers.host}/`)]
        });

        const chat = await Chat.findByPk(chatId);
        if (!chat) {
            socket.emit("no_chat");
            return;
        }

        if (await chat.hasMember(currentUser)) {
            socket.emit("user_is_already_chat_member");
            return;
        }
        await chat.addMember(currentUser);
        io.to(`chat_${chatId}`).emit("added_member", currentUser);
    });

    socket.on("leave_chat", async (chatId) => {
        const currentUserId = socket.request.session.userId;
        if (!currentUserId) {
            socket.emit("not_authenticated");
            return;
        }

        const currentUser = await User.findByPk(currentUserId);

        const chat = await Chat.findByPk(chatId);
        if (!chat) {
            socket.emit("no_chat");
            return;
        }

        await chat.removeMember(currentUser);
        io.to(`chat_${chatId}`).emit("removed_member", currentUser);
        socket.emit("left_chat", chatId);
    });

    socket.on("delete_chat", async (chatId) => {
        const currentUserId = socket.request.session.userId;
        if (!currentUserId) {
            socket.emit("not_authenticated");
            return;
        }

        const chat = await Chat.findByPk(chatId);
        if (!chat) {
            socket.emit("no_chat");
            return;
        }

        const user = await User.findByPk(chat.creatorId);
        if (!user) {
            socket.emit("no_permission");
            return;
        }

        await chat.destroy();
        io.to(`chat_${chatId}`).emit("deleted_chat");
    });

    socket.on("send_message", async (chatId, content, files) => {
        const currentUserId = socket.request.session.userId;
        if (!currentUserId) {
            socket.emit("not_authenticated");
            return;
        }

        const sender = await User.findByPk(currentUserId);

        const chat = await Chat.findByPk(chatId);
        if (!chat) {
            socket.emit("no_chat");
            return;
        }

        if (content.trim() === "" && (!files || files.length === 0)) {
            socket.emit("empty_message");
            return;
        }

        const message = await Message.create({
            senderId: currentUserId,
            chatId: chatId,
            content: content
        });
        if (message) {
            if (files) {
                const chatPath = chat.chatType === "group" ? groupChatsPath : personalChatsPath;
                const messagePath = path.join(chatPath, `chat_${chatId}`, `message_${message.id}`);
                if (!fs.existsSync(messagePath)) {
                    fs.mkdirSync(messagePath, { recursive: true })
                }

                for (const [index, file] of files.entries()) {
                    const ext = path.extname(file.name);

                    const filepath = path.join(messagePath, `message_media_${index}${ext}`);
                    fs.writeFileSync(filepath, file.data);
                    await message.createMedia({ mediaPath: slash(path.relative(serverPath, filepath)) });
                }
            }

            let returnMessage = {
                id: message.id,
                chatId: message.chatId,
                senderId: message.senderId,
                content: message.content,
                createdAt: message.createdAt,
                updatedAt: message.updatedAt,
                sender: {
                    id: sender.id,
                    username: sender.username,
                    avatarURL: `${process.env.ENVIRONMENT === "production" ? "https" : "http"}://${socket.handshake.headers.host}/${sender.avatarPath}`
                }
            }

            const medias = await message.getMedias();
            if (medias) {
                const mediasToReturn = medias.map((media) => {
                    return {
                        id: media.id,
                        mediaURL: `${process.env.ENVIRONMENT === "production" ? "https" : "http"}://${socket.handshake.headers.host}/${media.mediaPath}`
                    };
                });
                returnMessage.medias = mediasToReturn;
            }
            io.to(`chat_${chatId}`).emit("sent_message", returnMessage);
        } else {
            socket.emit("error_creating_message");
        }

    });

    socket.on("set_message_reaction", async (messageId, reactionStr) => {
        const currentUserId = socket.request.session.userId;
        if (!currentUserId) {
            socket.emit("not_authenticated");
            return;
        }

        if (!ReactionType.values.includes(reactionStr)) {
            socket.emit("invalid_reaction", reactionStr);
            return;
        }
        const message = await Message.findByPk(messageId);
        if (!message) {
            socket.emit("no_message");
            return;
        }

        const reaction = (await message.getReactions({
            where: {
                userId: currentUserId
            }
        }))[0];

        if (reaction) {
            if (reaction.reaction === reactionStr) {
                await reaction.destroy();
            } else {
                await reaction.update({ reaction: reactionStr });
            }
        } else {
            await message.createReaction({ userId: currentUserId, reaction: reactionStr });
        }
        const reactions = countReactions(await message.getReactions());
        io.to(`chat_${message.chatId}`).emit("update_reactions", messageId, reactions);
    });

    socket.on("edit_message", async (messageId, content, files) => {
        const currentUserId = socket.request.session.userId;
        if (!currentUserId) {
            socket.emit("not_authenticated");
            return;
        }

        const message = await Message.findByPk(messageId);
        if (!message) {
            socket.emit("no_message");
            return;
        }

        if (message.senderId !== currentUserId && socket.request.session.userRole !== "admin") {
            socket.emit("no_permission");
            return;
        }

        if (content.trim() === "" && (!files || files.length === 0)) {
            socket.emit("empty_message");
            return;
        }

        if (files) {
            const chatPath = await message.getChat().chatType === "group" ? groupChatsPath : personalChatsPath;
            const messagePath = path.join(chatPath, `chat_${message.chatId}`, `message_${message.id}`);
            if (!fs.existsSync(messagePath)) {
                fs.mkdirSync(messagePath, { recursive: true })
            }

            const medias = await message.getMedias({
                ordder: [['id', 'ASC']]
            });

            if (files.length < medias.length) {
                let i = 0;
                for (; i < files.length; ++i) {
                    const ext = path.extname(files[i].name);
                    const messagePath = path.join(chatPath, `chat_${message.chatId}`, `message_${message.id}`);
                    const filepath = path.join(messagePath, `message_media_${i}${ext}`);
                    fs.writeFileSync(filepath, files[i].data);
                    await medias[i].update({ mediaPath: slash(path.relative(serverPath, filepath)) });
                }
                for (; i < medias.length; ++i) {
                    const oldFilepath = path.join(serverPath, medias[i].mediaPath);
                    fs.unlink(oldFilepath, (err) => {
                        if (err) {
                            console.log(err);
                            socket.emit("error_deleting_files");
                            return;
                        }
                        console.log(`deleted ${oldFilepath}`);
                    });
                    await medias[i].destroy();
                }
            } else if (files.length >= medias.length) {
                let i = 0;
                for (; i < medias.length; ++i) {
                    const ext = path.extname(files[i].name);
                    const messagePath = path.join(chatPath, `chat_${message.chatId}`, `message_${message.id}`);
                    const filepath = path.join(messagePath, `message_media_${i}${ext}`);
                    fs.writeFileSync(filepath, files[i].data);
                    await medias[i].update({ mediaPath: slash(path.relative(serverPath, filepath)) });
                }
                for (; i < files.length; ++i) {
                    const ext = path.extname(files[i].name);

                    const filepath = path.join(messagePath, `message_media_${i}${ext}`);
                    fs.writeFileSync(filepath, files[i].data);
                    await message.createMedia({ mediaPath: slash(path.relative(serverPath, filepath)) });
                }
            }
        }
        message.changed("updatedAt", true);
        if(content  && content !== ""){
            message.set("content", content);
        }
        await message.save();
        const medias = await message.getMedias();
        if (medias) {
            const mediasToReturn = medias.map((media) => {
                return {
                    id: media.id,
                    mediaURL: `${process.env.ENVIRONMENT === "production" ? "https" : "http"}://${socket.handshake.headers.host}/${media.mediaPath}`
                };
            });
            message.setDataValue("medias", mediasToReturn);
        }
        io.to(`chat_${message.chatId}`).emit("update_message", message);
    })

    socket.on("delete_message", async (messageId) => {
        const currentUserId = socket.request.session.userId;
        if (!currentUserId) {
            socket.emit("not_authenticated");
            return;
        }

        const message = await Message.findByPk(messageId);

        if (!message) {
            socket.emit("no_message");
            return;
        }

        if (message.senderId !== currentUserId && socket.request.session.userRole !== "admin") {
            socket.emit("no_permission");
            return;
        }

        const chatId = message.chatId;
        await message.destroy();

        const prevMessage = await Message.findOne({
            where: {
                chatId: chatId
            },
            order: [["createdAt", "DESC"]],
            include: [
                {
                    model: MessageMedia,
                    as: "medias",
                    attributes: ['id', [sequelize.fn('CONCAT', `${process.env.ENVIRONMENT === "production" ? "https" : "http"}://${socket.handshake.headers.host}/`, sequelize.col('mediaPath')), 'mediaURL']]
                },
                {
                    model: User,
                    as: "sender",
                    attributes: ['id', 'username', avatarURLCol("sender", `${process.env.ENVIRONMENT === "production" ? "https" : "http"}://${socket.handshake.headers.host}/`)]
                }
            ]
        });
        io.to(`chat_${chatId}`).emit("message_deleted", messageId, prevMessage);
    });
}