import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  roles: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "roles",
    },
  ],
});

const User = mongoose.model("users", userSchema);
export default User;
