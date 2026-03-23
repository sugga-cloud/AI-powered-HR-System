import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  projectLeadId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  startDate: Date,
  endDate: Date,
  status: {
    type: String,
    enum: ["Active", "Completed", "On Hold"],
    default: "Active"
  }
}, { timestamps: true });

export default mongoose.model("Project", projectSchema);