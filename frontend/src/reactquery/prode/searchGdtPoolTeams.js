import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Búsqueda manual de un club en API-Football, filtrada por el país de la
   liga del universo. Cuesta 1 request de la cuota diaria: solo a pedido */
const searchGdtPoolTeams = async ({ universeId, term }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(
      `${baseURL}/api/prode/gdt/universes/${universeId}/pool-teams/search`,
      {
        params: { q: term },
        headers: { Authorization: `Bearer ${token}` },
        timeout: 120000,
      },
    );
    const { results, quota } = response.data;
    return { results, quota };
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al buscar en API-Football",
    );
  }
};

export default searchGdtPoolTeams;
