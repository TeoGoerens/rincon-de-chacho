import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const deleteProdePlayer = async ({ playerId }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.delete(
      `${baseURL}/api/prode/player/${playerId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al eliminar el jugador",
    );
  }
};

export default deleteProdePlayer;
