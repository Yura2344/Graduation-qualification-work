import { DataTypes } from "sequelize";

export const ReactionType = DataTypes.ENUM("like", "dislike");
export const RolesType = DataTypes.ENUM("user", "admin");