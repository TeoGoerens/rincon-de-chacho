import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchAllProdePlayers = async () => {
  const token = getUserJWT();

  if (!token) {
    throw new Error(
      "El token JWT no es válido o ha expirado. Por favor vuelve a iniciar sesión",
    );
  }

  const endpoint = `${baseURL}/api/prode/player`;

  try {
    const response = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.players;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message ||
        "No se pudieron obtener los jugadores del Prode",
    );
  }
};

export default fetchAllProdePlayers;
