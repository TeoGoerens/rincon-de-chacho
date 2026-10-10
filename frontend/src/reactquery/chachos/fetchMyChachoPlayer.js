import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchMyChachoPlayer = async () => {
  const token = getUserJWT();
  if (!token) throw new Error("Token JWT inválido o expirado.");

  const response = await axios.get(`${baseURL}/api/chachos/player/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data;
};

export default fetchMyChachoPlayer;
