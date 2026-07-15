import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const createGdtRealPlayer = async ({ universeId, player }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.post(
      `${baseURL}/api/prode/gdt/universes/${universeId}/players`,
      player,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.playerCreated;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al crear el jugador",
    );
  }
};

export default createGdtRealPlayer;
