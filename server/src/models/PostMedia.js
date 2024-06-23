import { DataTypes } from "sequelize";
import sequelize from "../utils/db.js";

const PostMedia = sequelize.define('PostMedia', {
    postId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    mediaPath: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
}, {
    tableName: "post_media"
});


export default PostMedia;