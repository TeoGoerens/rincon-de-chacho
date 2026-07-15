import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Bloqueo puntual del admin: ese jugador, en ese plantel, suma 0 */
const setGdtSlotBlock = async ({ universeId, playerId, slotNumber, blocked }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/prode/gdt/universes/${universeId}/squads/${playerId}/block`,
      { slotNumber, blocked },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.squad;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al actualizar el bloqueo",
    );
  }
};

export default setGdtSlotBlock;
