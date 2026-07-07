import User from "../../dao/models/userModel.js";

/* Corre después de authMiddleware: resuelve el usuario logueado a su
   ProdePlayer vinculado (userModel.prode_player) y lo deja en
   req.prodePlayerId. La pertenencia del jugador al torneo de la fecha se
   valida en el repository, que es donde se conoce la fecha. */
const prodeParticipantMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id, { prode_player: 1 });
    if (!user) {
      const customError = new Error("User was not found in database");
      customError.status = 404;
      return next(customError);
    }

    if (!user.prode_player) {
      const customError = new Error(
        "Tu usuario no está vinculado a ningún jugador del Prode. Pedile al admin que te vincule.",
      );
      customError.status = 403;
      return next(customError);
    }

    req.prodePlayerId = user.prode_player;
    next();
  } catch (error) {
    next(error);
  }
};

export default prodeParticipantMiddleware;
