import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Reporte de transferencias del universo: compara el club de cada jugador
   del pool contra los planteles vigentes de los equipos ELEGIDOS en el
   modal. Cada plantel no cacheado es 1 request de la cuota; dentro de la
   ventana de cache del server (media hora por equipo) no gasta cuota. */
const fetchGdtTransferReport = async (universeId, providerTeamIds) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(
      `${baseURL}/api/prode/gdt/universes/${universeId}/transfer-report`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { teams: (providerTeamIds ?? []).join(",") },
        timeout: 600000,
      },
    );
    return response.data.report;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message ||
        "Error al detectar transferencias de la liga",
    );
  }
};

export default fetchGdtTransferReport;
