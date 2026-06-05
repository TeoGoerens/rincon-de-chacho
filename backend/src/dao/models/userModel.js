import mongoose from "mongoose";

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
      default: null,
    },
    profile_picture_key: {
      type: String,
      default: null,
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
    chacho_player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      default: null,
    },
    podrida_player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PodridaPlayer",
      default: null,
    },
    prode_player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProdePlayer",
      default: null,
    },
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

const User = mongoose.model("User", userSchema);
export default User;
