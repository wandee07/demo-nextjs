import { Schema, model, models } from "mongoose";

const WorkLogSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    location: { type: String, trim: true },
    startTime: { type: String, trim: true },
    endTime: { type: String, trim: true },
    activities: { type: String, trim: true },
    result: { type: String, trim: true },
    blockers: { type: String, trim: true },
    participants: { type: String, trim: true },
    tags: { type: String, trim: true },
    color: { type: String, trim: true, default: "#3b82f6" },
  },
  { timestamps: true },
);

export default models.WorkLog || model("WorkLog", WorkLogSchema);
