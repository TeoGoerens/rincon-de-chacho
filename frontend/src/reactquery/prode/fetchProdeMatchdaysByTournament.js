import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchProdeMatchdaysByTournament = async (tournamentId) => {
  const token = getUserJWT();

  if (!token) {
    throw new Error(
      "El token JWT no es válido o ha expirado. Por favor vuelve a iniciar sesión",
    );
  }

  if (!tournamentId) {
    return [];
  }

  const endpoint = `${baseURL}/api/prode/matchday/tournament/${tournamentId}`;

  try {
    const response = await axios.get(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    console.error("❌ Error en fetchProdeMatchdaysByTournament:", error);
    throw error;
  }
};

export default fetchProdeMatchdaysByTournament;
