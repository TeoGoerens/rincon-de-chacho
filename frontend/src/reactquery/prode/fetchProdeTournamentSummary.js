import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchProdeTournamentSummary = async (tournamentId) => {
  const token = getUserJWT();

  if (!token) {
    throw new Error(
      "El token JWT no es válido o ha expirado. Por favor vuelve a iniciar sesión",
    );
  }

  const endpoint = `${baseURL}/api/prode/tournament/${tournamentId}/summary`;

  try {
    const response = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data; // { tournament, summary }
  } catch (error) {
    console.error("❌ Error en fetchProdeTournamentSummary:", error);
    throw error;
  }
};

export default fetchProdeTournamentSummary;
