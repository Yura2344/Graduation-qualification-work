import sequelize from "../utils/db.js"
import { DataTypes } from "sequelize";
import User from "./User.js";
import Post from "./Post.js";
import { ReactionType } from "../utils/customDataTypes.js";

const PostReaction = sequelize.define('PostReaction', {
    userId: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    postId: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    reaction: {
        type: ReactionType
    }
}, {
    tableName: "post_reactions"
});

User.hasMany(PostReaction, {
    foreignKey: {
        name: "userId",
        allowNull: false
    }
});
PostReaction.belongsTo(User, {
    foreignKey: {
        name: "userId",
        allowNull: false
    }
});

Post.hasMany(PostReaction, {
    as: "reactions",
    foreignKey: {
        name: "postId",
        allowNull: false
    }
});
PostReaction.belongsTo(Post, {
    foreignKey: {
        name: "postId",
        allowNull: false
    }
});

export default PostReaction;