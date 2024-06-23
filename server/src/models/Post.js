import sequelize from "../utils/db.js"
import { DataTypes } from "sequelize";
import User from "./User.js";
import PostMedia from "./PostMedia.js";

const Post = sequelize.define('Post', {
    creatorId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    timestamps: true,
    tableName: "posts"
});

User.hasMany(Post, {
    as: "posts",
    foreignKey: "creatorId"
});
Post.belongsTo(User, {
    as: "creator",
    foreignKey: "creatorId"
});

Post.hasMany(PostMedia, {
    as: "medias",
    foreignKey: {
        name: "postId"
    }
});
PostMedia.belongsTo(Post, {
    foreignKey: {
        name: "postId"
    }
});

export default Post;