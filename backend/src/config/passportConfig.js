import passport from "passport";
import local from "passport-local";
import bcrypt from "bcrypt";
import userModel from "../dao/models/userModel.js";

import dotenv from "dotenv";
dotenv.config();

const LocalStrategy = local.Strategy;
const initializePassport = () => {
  passport.use(
    "signup",
    new LocalStrategy(
      { passReqToCallback: true, usernameField: "email" },
      async (req, username, password, done) => {
        const { name, email } = req.body;

        const userExists = await userModel.findOne({ email: username });

        if (userExists) {
          return done(null, false, { message: "User already exists" });
        }

        const user = await userModel.create({
          name,
          email,
          password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
        });

        return done(null, user, { message: "User registered successfully" });
      }
    )
  );

  passport.use(
    "login",
    new LocalStrategy(
      { usernameField: "email" },
      async (username, password, done) => {
        try {
          const user = await userModel.findOne({ email: username });

          if (!user) {
            return done(null, false, { message: "User not found" });
          }

          if (!bcrypt.compareSync(password, user.password)) {
            return done(null, false, { message: "Incorrect password" });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    const user = await userModel.findById(id);
    done(null, user);
  });
};

export default initializePassport;
