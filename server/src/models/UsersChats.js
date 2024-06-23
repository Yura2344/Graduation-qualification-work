import sequelize from "../utils/db.js"
import { DataTypes } from "sequelize";
import User from "./User.js";
import Chat from "./Chat.js";

const UsersChats = sequelize.define('UserChats', {
    userId: {
        type: DataTypes.INTEGER
    },
    chatId: {
        type: DataTypes.INTEGER
    }
}, {
    timestamps: true,
    updatedAt: false,
    tableName: "users_chats"
});

User.belongsToMany(Chat, {
    as: "chats", 
    foreignKey: {
        name: "userId",
        allowNull: false
    }, 
    through: UsersChats
});
Chat.belongsToMany(User, {
    as: "members", 
    foreignKey: {
        name: "chatId",
        allowNull: false
    }, 
    through: UsersChats
});

export default UsersChats;