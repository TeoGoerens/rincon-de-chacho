import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const updateTournamentRound = async ({
  id,
  tournament,
  rival,
  match_date,
  score_chachos,
  score_rival,
  players,
}) => {
  const token = getUserJWT();
  if (!token) throw new Error("Token JWT inválido o expirado.");

  const response = await axios.put(
    `${baseURL}/api/chachos/tournament-round/${id}`,
    {
      tournament,
      rival,
      match_date,
      month: new Date(Date.parse(match_date)).getMonth() + 1,
      year: new Date(Date.parse(match_date)).getFullYear(),
      score_chachos,
      score_rival,
      players,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

export default updateTournamentRound;
