import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchAllUsers = async () => {
  const token = getUserJWT();
  if (!token) throw new Error("Token inválido. Por favor iniciá sesión nuevamente.");

  const response = await axios.get(`${baseURL}/api/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.data.users;
};

export default fetchAllUsers;
