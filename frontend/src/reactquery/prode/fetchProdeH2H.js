import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchProdeH2H = async (playerId) => {
  if (!playerId) return [];
  const token = getUserJWT();

  const response = await axios.get(
    `${baseURL}/api/prode/h2h?playerId=${playerId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data;
};

export default fetchProdeH2H;
