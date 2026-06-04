import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT, getUserId } from "../getUserInformation";

const fetchVoteByVoterAndRound = async (roundId) => {
  const token  = getUserJWT();
  const userId = getUserId();
  if (!token || !userId) throw new Error("Token JWT inválido o expirado.");

  const response = await axios.get(
    `${baseURL}/api/chachos/vote/${roundId}/voter/${userId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return response.data;
};

export default fetchVoteByVoterAndRound;
