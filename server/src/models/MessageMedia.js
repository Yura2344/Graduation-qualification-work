import { DataTypes } from "sequelize";
import sequelize from "../utils/db.js";
import Message from "./Message.js";

const MessageMedia = sequelize.define('MessageMedia', {
    messageId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    mediaPath: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
}, {
    tableName: "message_media"
});

Message.hasMany(MessageMedia, {
    as: "medias",
    foreignKey: {
        name: "messageId"
    }
});
MessageMedia.belongsTo(Message, {
    foreignKey: {
        name: "messageId"
    }
});

export default MessageMedia;