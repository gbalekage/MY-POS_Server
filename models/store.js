const mongoose = require("mongoose");

const StoreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    printer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Printer",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Store", StoreSchema);
