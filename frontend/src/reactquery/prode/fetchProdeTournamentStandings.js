import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Tabla de posiciones del torneo (pestaña Torneo). month=null → acumulada */
const fetchProdeTournamentStandings = async (tournamentId, month = null) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(
      `${baseURL}/api/prode/stats/tournament/${tournamentId}/standings`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: month ? { month } : {},
      },
    );
    return response.data.standings;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al obtener la tabla del torneo",
    );
  }
};

export default fetchProdeTournamentStandings;
