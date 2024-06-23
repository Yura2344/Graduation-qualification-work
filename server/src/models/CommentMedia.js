import { DataTypes } from "sequelize";
import sequelize from "../utils/db.js";
import Comment from "./Comment.js";

const CommentMedia = sequelize.define('CommentMedia', {
    commentId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    mediaPath: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
}, {
    tableName: "comment_media"
});

Comment.hasMany(CommentMedia, {
    as: "medias",
    foreignKey: {
        name: "commentId"
    }
});
CommentMedia.belongsTo(Comment, {
    foreignKey: {
        name: "commentId"
    }
});

export default CommentMedia;