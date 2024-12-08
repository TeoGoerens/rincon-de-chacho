import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchCronicaById = async (cronicaId) => {
  // Retrieve jwt from the user
  const token = getUserJWT();

  if (!token) {
    throw new Error(
      `El token JWT no es válido o ha expirado. Por favor vuelve a iniciar sesión`
    );
  }

  // Retrieve infromation from API endpoint
  const endpoint = `${baseURL}/api/cronica/${cronicaId}`;

  // AXIOS fetching request
  const response = await axios.get(endpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export default fetchCronicaById;
