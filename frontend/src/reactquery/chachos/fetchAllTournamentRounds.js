import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchAllTournamentRounds = async () => {
  const token = getUserJWT();
  if (!token) throw new Error("Token JWT inválido o expirado.");

  const response = await axios.get(`${baseURL}/api/chachos/tournament-round`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
};

export default fetchAllTournamentRounds;
