import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchAllTeams = async () => {
  const token = getUserJWT();
  if (!token) throw new Error("Token JWT inválido o expirado.");

  const response = await axios.get(`${baseURL}/api/chachos/rival-team/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data.rivalTeams ?? response.data;
};

export default fetchAllTeams;
