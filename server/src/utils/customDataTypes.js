import { DataTypes } from "sequelize";

export const ReactionType = DataTypes.ENUM("like", "dislike");