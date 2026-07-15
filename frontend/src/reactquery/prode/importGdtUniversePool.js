import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Recorre ~30 planteles en el server; con el rate limit del plan free de
   API-Football puede tardar varios minutos */
const importGdtUniversePool = async ({ universeId }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.post(
      `${baseURL}/api/prode/gdt/universes/${universeId}/players/import`,
      {},
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
