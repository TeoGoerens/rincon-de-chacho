import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const updateGdtRealPlayer = async ({ playerId, player }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/prode/gdt/players/${playerId}`,
      player,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    /* impacts: inconsistencias que la edición generó en planteles vigentes;
       unblockSuggestions: bloqueos que quedaron sin motivo — ambos para
       alertar al admin */
    const { playerUpdated, impacts, unblockSuggestions } = response.data;
    return {
      playerUpdated,
      impacts: impacts ?? [],
      unblockSuggestions: unblockSuggestions ?? [],
    };
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al actualizar el jugador",
    );
  }
};

export default updateGdtRealPlayer;
