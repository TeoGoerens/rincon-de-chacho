import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Silencia una fila del reporte de transferencias: el par (jugador, club
   según la API) no se vuelve a mostrar mientras la API siga diciendo ese
   club — para cuando la corrección manual del admin le ganó a la API */
const ignoreGdtTransfer = async ({ universeId, playerId, apiClub }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/prode/gdt/universes/${universeId}/transfer-ignores`,
      { playerId, apiClub },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al silenciar la transferencia",
    );
  }
};

export default ignoreGdtTransfer;
