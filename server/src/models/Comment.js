import sequelize from "../utils/db.js"
import { DataTypes } from "sequelize";
import User from "./User.js";
import Post from "./Post.js";

const Comment = sequelize.define('Comment', {
    senderId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    postId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },

}, {
    timestamps: true,
    tableName: "comments"
});

User.hasMany(Comment, {
    foreignKey: "senderId"
});
Comment.belongsTo(User, {
    as: "author",
    foreignKey: "senderId"
});

Post.hasMany(Comment, {
    as: "comments",
    foreignKey: "postId"
});
Comment.belongsTo(Post, {
    foreignKey: "postId"
});

export default Comment;