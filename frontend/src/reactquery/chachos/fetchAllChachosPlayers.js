import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchAllChachosPlayers = async () => {
  const token = getUserJWT();
  if (!token) throw new Error("Token inválido. Por favor iniciá sesión nuevamente.");

  const response = await axios.get(`${baseURL}/api/chachos/player`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data.players;
};

export default fetchAllChachosPlayers;
