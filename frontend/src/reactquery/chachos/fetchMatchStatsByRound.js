import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchMatchStatsByRound = async (roundId) => {
  const token = getUserJWT();
  if (!token) throw new Error("Token JWT inválido o expirado.");

  const response = await axios.get(
    `${baseURL}/api/chachos/match-stats/tournament-round/${roundId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return response.data.roundMatchStat;
};

export default fetchMatchStatsByRound;
