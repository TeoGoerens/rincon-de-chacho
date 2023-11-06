// ---------- GENERAL IMPORTS & CONFIGURATIONS ----------
import express from "express";
const app = express();

import cors from "cors";
app.use(cors());

import dotenv from "dotenv";
dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- MONGO DB SET UP & CONNECTION ----------
import initMongoDB from "./dao/connection.js";
initMongoDB();

// ---------- SESSION CONFIGURATION & SET UP ----------
import session from "express-session";
import MongoStore from "connect-mongo";
import flash from "express-flash";
app.use(flash());
app.use(
  session({
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_ATLAS_URL,
      ttl: 15,
    }),
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// ---------- PASSPORT IMPORT & INITIALIZATION ----------
import passport from "passport";
import initializePassport from "./config/passportConfig.js";
app.use(passport.initialize());
app.use(passport.session());
initializePassport();

// ---------- ROUTER CONFIGURATION ----------
import userRouter from "./routes/userRouter.js";
app.use("/api/users", userRouter);

// ---------- PORT CONFIGURATION & SET UP ----------
const PORT = parseInt(process.env.PORT, 10);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
