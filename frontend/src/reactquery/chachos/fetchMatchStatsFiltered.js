import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchMatchStatsFiltered = async ({ tournament, round, year } = {}) => {
  const token = getUserJWT();
  if (!token) throw new Error("Token JWT inválido o expirado.");

  const params = {};
  if (tournament) params.tournament = tournament;
  if (round) params.round = round;
  if (year) params.year = year;

  const response = await axios.get(
    `${baseURL}/api/chachos/match-stat/filtered`,
    {
      headers: { Authorization: `Bearer ${token}` },
      params,
    }
  );

  return response.data.filteredMatchStats;
};

export default fetchMatchStatsFiltered;
