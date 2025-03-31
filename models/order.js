const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },
    attendant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Item",
          required: true,
        },
        quantity: { type: Number, require: true },
      },
    ],
    removedItems: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
        quantity: { type: Number, required: true },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "bill-printed", "paid"],
      default: "pending",
    },
    totalPrice: { type: Number, require: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
