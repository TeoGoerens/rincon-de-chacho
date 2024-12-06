import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const generateToken = (userId, isAdmin) => {
  return jwt.sign(
    { id: userId, is_admin: isAdmin },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: "1d",
    }
  );
};

export default generateToken;
