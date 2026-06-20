import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchTeamById = async (id) => {
  const token = getUserJWT();
  if (!token) throw new Error("Token JWT inválido o expirado.");

  const response = await axios.get(`${baseURL}/api/chachos/rival-team/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data.rivalTeam ?? response.data;
};

export default fetchTeamById;
