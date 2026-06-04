import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const updateUser = async ({ id, data }) => {
  const token = getUserJWT();
  if (!token) throw new Error("Token inválido. Por favor iniciá sesión nuevamente.");

  const response = await axios.put(`${baseURL}/api/users/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return response.data;
};

export default updateUser;
