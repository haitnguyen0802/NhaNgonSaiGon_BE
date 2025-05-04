const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_mts: {
      type: DataTypes.INTEGER,
      field: "product_mts",
    },
    representative_image: {
      type: DataTypes.STRING,
      field: "representative_image",
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    location: {
      type: DataTypes.STRING,
    },
    price: {
      type: DataTypes.DECIMAL(15, 2),
    },
    status: {
      type: DataTypes.ENUM("available", "sold", "discounted", "empty"),
      defaultValue: "available",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "categories",
        key: "id",
      },
      field: "category_id",
    },
    collaborator_id: {
      type: DataTypes.INTEGER,
      references: {
        model: "collaborators",
        key: "id",
      },
      field: "collaborator_id",
    },
  },
  {
    tableName: "products",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
  }
);

module.exports = Product;
