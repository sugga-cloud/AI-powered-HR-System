// models/hrModel.js
const mongoose = require("mongoose");

const hrSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    department: { type: String, required: true },
    position: { type: String, required: true },
    experienceYears: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Hr", hrSchema);
