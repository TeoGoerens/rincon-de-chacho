import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchFootballCategoryById = async (id) => {
  const token = getUserJWT();
  if (!token) throw new Error("Token JWT inválido o expirado.");

  const response = await axios.get(
    `${baseURL}/api/chachos/football-category/${id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return response.data.footballCategory ?? response.data;
};

export default fetchFootballCategoryById;
