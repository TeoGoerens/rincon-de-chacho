import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Import SELECTIVO: solo los equipos tildados en el modal (1 request de la
   cuota diaria por equipo). Con el rate limit del plan free de API-Football
   una liga entera puede tardar varios minutos */
const importGdtUniversePool = async ({ universeId, providerTeamIds }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.post(
      `${baseURL}/api/prode/gdt/universes/${universeId}/players/import`,
      { providerTeamIds },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 600000,
      },
    );
    return response.data.summary;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message ||
        "Error al importar los planteles de la liga",
    );
  }
};

export default importGdtUniversePool;
