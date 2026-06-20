import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

//Listado completo (sin proyección) para el panel admin — distinto de
//fetchAllTournamentRounds.js, que usa el endpoint /list optimizado para el público
const fetchAllTournamentRoundsAdmin = async () => {
  const token = getUserJWT();
  if (!token) throw new Error("Token JWT inválido o expirado.");

  const response = await axios.get(`${baseURL}/api/chachos/tournament-round/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data.tournamentRounds ?? response.data;
};

export default fetchAllTournamentRoundsAdmin;
