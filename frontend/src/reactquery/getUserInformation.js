import store from "../redux/store/store";

export const getUserId = () => {
  return (
    store.getState().users?.userAuth?._id ||
    store.getState().users?.userAuth?.userToDisplay?._id ||
    null
  );
};

export const getUserJWT = () => {
  return (
    store.getState().users?.userAuth?.jwt ||
    store.getState().users?.userAuth?.userToDisplay?.jwt ||
    null
  );
};

export const getUserRole = () => {
  return (
    store.getState().users?.userAuth?.is_admin ||
    store.getState().users?.userAuth?.userToDisplay?.is_admin ||
    null
  );
};

export const getUserEmail = () => {
  return (
    store.getState().users?.userAuth?.email ||
    store.getState().users?.userAuth?.userToDisplay?.email ||
    null
  );
};

/* Único super admin del sitio (habilita las super eliminaciones del admin
   Prode). Este chequeo solo OCULTA/MUESTRA el botón: el que vale es el del
   backend (superAdminMiddleware, mismo mail). */
export const SUPER_ADMIN_EMAIL = "goerens_teo@hotmail.com";

export const isSuperAdmin = () =>
  (getUserEmail() ?? "").toLowerCase() === SUPER_ADMIN_EMAIL;
