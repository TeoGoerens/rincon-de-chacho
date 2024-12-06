import axios from "axios";
import { baseURL } from "../helpers/baseURL.js";
import store from "../redux/store/store.js";

const fetchAllCommentsFromACronica = async (cronicaId) => {
  // Retrieve jwt from the user
  const token =
    store.getState().users?.userAuth?.jwt ||
    store.getState().users?.userAuth?.userToDisplay?.jwt ||
    null;

  if (!token) {
    throw new Error(
      `El token JWT no es válido o ha expirado. Por favor vuelve a iniciar sesión`
    );
  }

  // Retrieve infromation from API endpoint
  const endpoint = `${baseURL}/api/cronica/comment/${cronicaId}`;

  // AXIOS fetching request
  const response = await axios.get(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export default fetchAllCommentsFromACronica;
