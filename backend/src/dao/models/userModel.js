import mongoose from "mongoose";
import { mongoConnections } from "../connection.js";
const { dbUsers } = mongoConnections;

const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
    },
    profile_picture: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_1280.png",
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    is_admin: {
      type: Boolean,
      default: false,
    },
    role: {
      type: [
        {
          type: String,
          enum: ["Admin", "Prode", "Chachos", "Reader"],
        },
      ],
      default: ["Reader"],
    },
    password_reset_token: { type: String, default: null },
    password_reset_expires: { type: Date, default: null },
    password_changed_at: { type: Date, default: null },
    last_login: { type: Date, default: null },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    timestamps: true,
  }
);

const User = dbUsers.model("User", userSchema);
export default User;
