const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, sparse: true, unique: true },
    username: { type: String, required: true },
    pin: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    password: { type: String },
    avatar: { type: String },
    activityLogs: [
      {
        action: String,
        description: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    assignedTables: [
      {
        type: Schema.Types.ObjectId,
        ref: "Table",
        default: [],
      },
    ],
    role: {
      type: String,
      required: true,
      enum: ["admin", "manager", "cashier", "attendant"],
      default: "attendant",
    },
    lastLogin: {
      type: Date,
    },
    loginHistory: [
      {
        ip: String,
        userAgent: String,
        date: { type: Date, default: Date.now },
      },
    ],
    isDeleted: {type: Boolean, default: false}
  },
  { timestamps: true }
);

module.exports = model("User", userSchema);
