import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Alta selectiva de un jugador nuevo detectado por el reporte de
   transferencias: el body solo lleva el providerPlayerId, los datos los
   rearma el server desde su snapshot (patrón carrito) */
const addGdtTransferPlayer = async ({ universeId, providerPlayerId }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.post(
      `${baseURL}/api/prode/gdt/universes/${universeId}/transfer-add`,
      { providerPlayerId },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.playerCreated;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al agregar el jugador al pool",
    );
  }
};

export default addGdtTransferPlayer;
