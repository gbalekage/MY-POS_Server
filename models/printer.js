const { Schema, model } = require("mongoose");

const printerSchema = new Schema({
  name: { type: String, required: true, unique: true },
  ipAddress: { type: String, required: true, unique: true },
});

module.exports = model("Printer", printerSchema);
