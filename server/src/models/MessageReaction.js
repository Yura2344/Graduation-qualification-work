import sequelize from "../utils/db.js"
import { DataTypes } from "sequelize";
import User from "./User.js";
import Message from "./Message.js";
import { ReactionType } from "../utils/customDataTypes.js";

const MessageReaction = sequelize.define('Reaction', {
    userId: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    messsageId: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    reaction: {
        type: ReactionType
    }
}, {
    tableName: "message_reactions"
});

User.hasMany(MessageReaction, {
    foreignKey: {
        name: "userId",
        allowNull: false
    }
});
MessageReaction.belongsTo(User, {
    foreignKey: {
        name: "userId",
        allowNull: false
    }
});

Message.hasMany(MessageReaction, {
    as: "reactions",
    foreignKey: {
        name: "messsageId",
        allowNull: false
    }
});
MessageReaction.belongsTo(Message, {
    foreignKey: {
        name: "messsageId",
        allowNull: false
    }
});

export default MessageReaction;