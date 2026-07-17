import User from "../../dao/models/userModel.js";

/* Único super admin del sitio: habilitado para las SUPER ELIMINACIONES,
   que saltean los bloqueos por datos asociados y borran en cascada.
   No existe un rol en el modelo de usuario — se identifica por MAIL.
   El chequeo que vale es SIEMPRE este (server-side); el frontend solo
   decide si muestra u oculta el botón. */
export const SUPER_ADMIN_EMAIL = "goerens_teo@hotmail.com";

const superAdminMiddleware = async (req, res, next) => {
  try {
    const userLogged = await User.findById(req.user.id, {
      email: 1,
      is_admin: 1,
    });
    if (
      userLogged?.is_admin &&
      userLogged?.email?.toLowerCase() === SUPER_ADMIN_EMAIL
    ) {
      next();
    } else {
      const customError = new Error(
        "Solo el super admin puede ejecutar esta acción",
      );
      customError.status = 403;
      next(customError);
    }
  } catch (error) {
    const customError = new Error("User was not found in database");
    customError.status = 404;
    next(customError);
  }
};

export default superAdminMiddleware;
