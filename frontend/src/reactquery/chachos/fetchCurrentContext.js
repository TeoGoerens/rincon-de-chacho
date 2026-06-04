import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchCurrentContext = async () => {
  const token = getUserJWT();
  if (!token) throw new Error("Token JWT inválido o expirado.");

  const response = await axios.get(
    `${baseURL}/api/chachos/tournament-round/current-context`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return response.data;
};

export default fetchCurrentContext;
