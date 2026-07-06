import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchProdePlayerById = async (playerId) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(
      `${baseURL}/api/prode/player/${playerId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.player;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al obtener el jugador",
    );
  }
};

export default fetchProdePlayerById;
