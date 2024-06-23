import sequelize from "../utils/db.js"
import { DataTypes } from "sequelize";
import Chat from "./Chat.js";
import User from "./User.js";

const Message = sequelize.define('Message', {
    senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    chatId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    timestamps: true,
    tableName: "messages"
});

Chat.hasMany(Message, {
    foreignKey: "chatId"
});
Message.belongsTo(Chat, {
    foreignKey: "chatId"
});

User.hasMany(Message, {
    foreignKey: "senderId"
});
Message.belongsTo(User, {
    as: "sender",
    foreignKey: "senderId"
});

export default Message;