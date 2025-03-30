const mongoose = require("mongoose");

const TableSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["disponible", "occupe"],
      default: "disponible",
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    attendent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Table", TableSchema);
