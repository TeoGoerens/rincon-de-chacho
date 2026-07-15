import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchGdtUniversesByTournament = async (tournamentId) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(
      `${baseURL}/api/prode/gdt/universes/tournament/${tournamentId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.teams;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message ||
        "Error al cargar los universos GDT del torneo",
    );
  }
};

export default fetchGdtUniversesByTournament;
