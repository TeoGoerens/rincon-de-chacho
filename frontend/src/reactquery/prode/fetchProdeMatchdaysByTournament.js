import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchProdeMatchdaysByTournament = async (tournamentId) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(
      `${baseURL}/api/prode/matchday/tournament/${tournamentId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.matchdays;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al obtener las fechas",
    );
  }
};

export default fetchProdeMatchdaysByTournament;
