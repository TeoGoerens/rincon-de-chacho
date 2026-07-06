import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const updateProdePlayer = async ({ playerId, name, active }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/prode/player/${playerId}`,
      { name, active },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.playerUpdated;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al actualizar el jugador",
    );
  }
};

export default updateProdePlayer;
