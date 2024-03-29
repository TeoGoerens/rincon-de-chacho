import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const authMiddleware = async (req, res, next) => {
  let token;

  try {
    if (req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
      try {
        if (token) {
          const tokenDecoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
          req.user = tokenDecoded;
          next();
        }
      } catch (error) {
        const customError = new Error("Token decoding failed");
        next(customError);
      }
    }
  } catch (error) {
    const customError = new Error("No token was provided in headers");
    next(customError);
  }
};

export default authMiddleware;
