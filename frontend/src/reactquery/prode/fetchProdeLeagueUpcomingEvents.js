import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchProdeLeagueUpcomingEvents = async (leagueId) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(
      `${baseURL}/api/prode/sports/leagues/${leagueId}/upcoming-events`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.events;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message ||
        "Error al cargar los partidos próximos de la liga",
    );
  }
};

export default fetchProdeLeagueUpcomingEvents;
