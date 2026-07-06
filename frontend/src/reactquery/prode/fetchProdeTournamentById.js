import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchProdeTournamentById = async (tournamentId) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(
      `${baseURL}/api/prode/tournament/${tournamentId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.tournament;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al obtener el torneo",
    );
  }
};

export default fetchProdeTournamentById;
