import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchPlayerById = async (id) => {
  const token = getUserJWT();
  if (!token) throw new Error("Token JWT inválido o expirado.");

  const response = await axios.get(`${baseURL}/api/chachos/player/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data.player ?? response.data;
};

export default fetchPlayerById;
