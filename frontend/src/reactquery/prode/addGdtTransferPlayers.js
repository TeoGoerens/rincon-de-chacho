import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Alta de jugadores nuevos detectados por el reporte de diferencias: una
   fila sola o todo un club de una. El body solo lleva los providerPlayerIds,
   los datos los rearma el server desde su snapshot (patrón carrito) */
const addGdtTransferPlayers = async ({ universeId, providerPlayerIds }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.post(
      `${baseURL}/api/prode/gdt/universes/${universeId}/transfer-add`,
      { providerPlayerIds },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.summary;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message ||
        "Error al agregar los jugadores al pool",
    );
  }
};

export default addGdtTransferPlayers;
