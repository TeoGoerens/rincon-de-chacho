import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const createVote = async ({ roundId, evaluation, white_pearl, vanilla_pearl, ocher_pearl, black_pearl }) => {
  const token = getUserJWT();
  if (!token) throw new Error("Token JWT inválido o expirado.");

  const response = await axios.post(
    `${baseURL}/api/chachos/vote/${roundId}`,
    { evaluation, white_pearl, vanilla_pearl, ocher_pearl, black_pearl },
    { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
  );

  return response.data;
};

export default createVote;
