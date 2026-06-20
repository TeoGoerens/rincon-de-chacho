import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";
import { simplifyVotesInformation } from "../../helpers/simplifiedVotesForAxios";
import { simplifyPointsInformation } from "../../helpers/simplifiedPointsForAxios";

//Recibe los votos crudos de la fecha (ya consultados por el llamador) y los
//simplifica antes de enviarlos — evita depender de un store global para esto
const consolidatePearls = async ({ tournamentRoundId, fullVotes }) => {
  const token = getUserJWT();
  if (!token) throw new Error("Token JWT inválido o expirado.");

  const votes = simplifyVotesInformation(fullVotes ?? []);
  const points = simplifyPointsInformation(fullVotes ?? []);

  const response = await axios.put(
    `${baseURL}/api/chachos/tournament-round/consolidate-pearls/${tournamentRoundId}`,
    { votes, points },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

export default consolidatePearls;
