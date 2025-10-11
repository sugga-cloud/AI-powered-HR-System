import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: ["manager", "system", "hr", "approver"],
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    metadata: {
      phone: String,
      title: String,
    }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

// Indexes for faster queries
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });

const User = mongoose.model("User", userSchema);
export default User;