import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchProdeH2H = async (playerId, tournamentId = "") => {
  if (!playerId) return null;
  const token = getUserJWT();

  // Importante: Usamos URLSearchParams para que los parámetros viajen limpios
  const params = new URLSearchParams();
  params.append("playerId", playerId);
  if (tournamentId) {
    params.append("tournamentId", tournamentId);
  }

  const response = await axios.get(
    `${baseURL}/api/prode/h2h?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data;
};

export default fetchProdeH2H;
