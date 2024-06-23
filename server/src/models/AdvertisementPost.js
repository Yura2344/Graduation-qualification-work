import sequelize from "../utils/db.js"
import { DataTypes } from "sequelize";
import Post from "./Post.js";

const AdvertisementPost = sequelize.define('AdvertisementPost', {
    id: {
        type: DataTypes.INTEGER,
        unique: true,
        allowNull: false,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    currency: {
        type: DataTypes.STRING(3),
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: "advertisement_posts"
});

Post.hasOne(AdvertisementPost, {
    as: "advertisementData",
    foreignKey: "id"
});
AdvertisementPost.belongsTo(Post, {
    foreignKey: "id"
});

export default AdvertisementPost;