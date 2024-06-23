import sequelize from "../utils/db.js"
import { DataTypes } from "sequelize";

const Chat = sequelize.define('Chat',{
    chatType: {
        type: DataTypes.ENUM("personal", "group"),
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    creatorId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    avatarPath: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: "chats"
});

export default Chat;