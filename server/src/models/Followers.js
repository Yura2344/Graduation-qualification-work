import sequelize from "../utils/db.js"
import { DataTypes } from "sequelize";
import User from "./User.js";

const Followers = sequelize.define('Followers', {
    followingId: {
        type: DataTypes.INTEGER
    },
    followerId: {
        type: DataTypes.INTEGER
    }
}, {
    timestamps: true,
    updatedAt: false,
    tableName: "followers"
});

User.belongsToMany(User, {
    as: "followings", 
    foreignKey: {
        name: "followingId",
        allowNull: false
    }, through: Followers
});
User.belongsToMany(User, {
    as: "followers", 
    foreignKey: {
        name: "followerId",
        allowNull: false
    }, through: Followers
});

export default Followers;