import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const updateCronicaViewsById = async (cronicaId) => {
  // Retrieve jwt from the user
  const token = getUserJWT();

  if (!token) {
    throw new Error(
      `El token JWT no es válido o ha expirado. Por favor vuelve a iniciar sesión`
    );
  }

  // Endpoint to update likes
  const endpoint = `${baseURL}/api/cronica/${cronicaId}/views`;

  // PUT request to the server
  const response = await axios.put(
    endpoint,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export default updateCronicaViewsById;
