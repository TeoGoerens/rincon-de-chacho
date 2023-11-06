import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  name: String,
});

const Role = mongoose.model("roles", roleSchema);
export default Role;
