const mongoose = require("mongoose");

const closedBillSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    totalPrice: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    amountReceived: { type: Number, required: true },
    change: { type: Number, default: 0 },
    paymentDate: { type: Date, default: Date.now },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    cashier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ClosedBill", closedBillSchema);
