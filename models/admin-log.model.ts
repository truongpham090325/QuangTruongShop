import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    adminId: String,
    method: String,
    route: String,
    title: String,
    expireAt: {
      type: Date,
      expires: 0,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true, // Tự động sinh ra trường createdAt và updatedAt
  },
);

const AdminLog = mongoose.model("AdminLog", schema, "admin-logs");

export default AdminLog;
