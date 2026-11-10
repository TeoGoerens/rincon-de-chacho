import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Equipos de la liga del universo para el modal de selección (import y
   detector): estado de cada uno en el pool + cuota diaria de API-Football.
   Armar la lista cuesta 1-3 requests de la cuota (cacheado 10 min en el
   server) */
const fetchGdtPoolTeams = async (universeId) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(
      `${baseURL}/api/prode/gdt/universes/${universeId}/pool-teams`,
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 120000,
      },
    );
    const { teams, unresolvedTeams, quota, league } = response.data;
    return { teams, unresolvedTeams, quota, league };
  } catch (error) {
    throw new Error(
      error?.response?.data?.message ||
        "Error al listar los equipos de la liga",
    );
  }
};

export default fetchGdtPoolTeams;
