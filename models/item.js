const { Schema, model } = require("mongoose");

const itemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    barCode: { type: String, required: true, unique: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    store: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    packageSize: { type: Number, required: true, min: 1 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    currency: { type: String, default: "FC" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    minStock: { type: Number, default: 5, min: 0 },
    activityLogs: [
      {
        date: { type: Date, default: Date.now },
        action: {
          type: String,
          enum: ["added", "sold", "restocked", "edited"],
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
      },
    ],
  },
  { timestamps: true }
);

itemSchema.virtual("isLowStock").get(function () {
  return this.stock < this.minStock;
});

module.exports = model("Item", itemSchema);
