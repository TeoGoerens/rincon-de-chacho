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
