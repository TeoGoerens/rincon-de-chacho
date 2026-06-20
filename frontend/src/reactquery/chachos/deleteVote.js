import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const deleteVote = async (id) => {
  const token = getUserJWT();
  if (!token) throw new Error("Token JWT inválido o expirado.");

  const response = await axios.delete(`${baseURL}/api/chachos/vote/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
};

export default deleteVote;
