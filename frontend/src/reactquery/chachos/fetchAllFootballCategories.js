import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchAllFootballCategories = async () => {
  const token = getUserJWT();
  if (!token) throw new Error("Token JWT inválido o expirado.");

  const response = await axios.get(`${baseURL}/api/chachos/football-category/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data.footballCategories ?? response.data;
};

export default fetchAllFootballCategories;
