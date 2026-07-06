import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchProdeMatchdayById = async (matchdayId) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(
      `${baseURL}/api/prode/matchday/${matchdayId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.matchday;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al obtener la fecha",
    );
  }
};

export default fetchProdeMatchdayById;
