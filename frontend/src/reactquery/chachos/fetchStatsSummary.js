import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchStatsSummary = async ({ year }) => {
  const token = getUserJWT();
  if (!token) throw new Error("Token JWT inválido o expirado.");

  const params = {};
  if (year) params.year = year;

  const response = await axios.get(
    `${baseURL}/api/chachos/tournament-round/stats-summary`,
    { headers: { Authorization: `Bearer ${token}` }, params }
  );

  return response.data;
};

export default fetchStatsSummary;
