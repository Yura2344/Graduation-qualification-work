import sequelize from "../utils/db.js"
import { DataTypes } from "sequelize";
import User from "./User.js";
import Comment from "./Comment.js";
import { ReactionType } from "../utils/customDataTypes.js";

const CommentReaction = sequelize.define('CommentReaction', {
    userId: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    commentId: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    reaction: {
        type: ReactionType
    }
}, {
    tableName: "comment_reactions"
});

User.hasMany(CommentReaction, {
    foreignKey: {
        name: "userId",
        allowNull: false
    }
});
CommentReaction.belongsTo(User, {
    foreignKey: {
        name: "userId",
        allowNull: false
    }
});

Comment.hasMany(CommentReaction, {
    as: "reactions",
    foreignKey: {
        name: "commentId",
        allowNull: false
    }
});
CommentReaction.belongsTo(Comment, {
    foreignKey: {
        name: "commentId",
        allowNull: false
    }
});

export default CommentReaction;