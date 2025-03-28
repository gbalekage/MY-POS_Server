const { Schema, model } = require("mongoose");

const categorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

module.exports = model("Category", categorySchema);
