import { Router } from "express";
import passport from "passport";
import dotenv from "dotenv";
dotenv.config();

const router = Router();

router.post("/signup", async (req, res, next) => {
  passport.authenticate("signup", async (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(400).send({ message: info.message });
    }

    return res.status(200).send({ message: "Usuario registrado" });
  })(req, res, next);
});

router.post(
  "/login",
  passport.authenticate("login", { failureRedirect: "/login" }),
  async (req, res) => {
    if (!req.user) {
      res.status(400).send();
    }

    req.session.user = {
      name: req.user.name,
      email: req.user.email,
      isLogged: true,
    };

    return res.status(200).send({ message: "Usuario loggeado" });
  }
);

router.get("/hola", (req, res) => {
  res.send("hola");
});

export default router;
