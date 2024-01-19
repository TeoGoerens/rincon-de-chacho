import User from "../dao/models/userModel.js";
import bcrypt from "bcrypt";
import baseRepository from "./baseRepository.js";

export default class UserRepository extends baseRepository {
  constructor() {
    super(User);
  }
  // ---------- SIGN UP & CREATE USER ----------
  createUser = async (user) => {
    //Check if user exists
    const userExists = await User.findOne({ email: user.email });
    if (userExists) {
      throw new Error("User already exists");
    }

    //Hash user's password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hashSync(user.password, salt);

    //Create user
    const userToLoad = await User.create({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      password: hashedPassword,
    });

    return userToLoad;
  };

  loginUser = async (user) => {
    //Check if user exists
    const userExists = await User.findOne({ email: user.email });
    if (!userExists) {
      throw new Error("User is not properly registered");
    }

    //Compare hashed passwords
    const matchingPasswords = await bcrypt.compareSync(
      user.password,
      userExists.password
    );

    //Return user information
    if (matchingPasswords) {
      return userExists;
    } else {
      throw new Error(
        "Login credentials are not valid. Check the information submitted"
      );
    }
  };
}
