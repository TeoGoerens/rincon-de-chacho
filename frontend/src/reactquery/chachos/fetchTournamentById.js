import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchTournamentById = async (id) => {
  const token = getUserJWT();
  if (!token) throw new Error("Token JWT inválido o expirado.");

  const response = await axios.get(`${baseURL}/api/chachos/tournament/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data.tournament ?? response.data;
};

export default fetchTournamentById;
