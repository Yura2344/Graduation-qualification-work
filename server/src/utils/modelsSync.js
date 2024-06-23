import AdvertisementPost from "../models/AdvertisementPost.js";
import Chat from "../models/Chat.js";
import Comment from "../models/Comment.js";
import CommentMedia from "../models/CommentMedia.js";
import CommentReaction from "../models/CommentReaction.js";
import Followers from "../models/Followers.js";
import Message from "../models/Message.js";
import MessageMedia from "../models/MessageMedia.js";
import MessageReaction from "../models/MessageReaction.js";
import Post from "../models/Post.js";
import PostMedia from "../models/PostMedia.js";
import PostReaction from "../models/PostReaction.js";
import User from "../models/User.js";
import UsersChats from "../models/UsersChats.js";

async function sync(options){
    await User.sync(options);
    await Followers.sync(options);
    await Chat.sync(options);
    await UsersChats.sync(options);
    await Post.sync(options);
    await PostReaction.sync(options);
    await PostMedia.sync(options);
    await AdvertisementPost.sync(options);
    await Comment.sync(options);
    await CommentReaction.sync(options);
    await CommentMedia.sync(options);
    await Message.sync(options);
    await MessageReaction.sync(options);
    await MessageMedia.sync(options);
}

export default sync;