import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Tabla histórica del Prode: todos los torneos sumados */
const fetchProdeAllTimeStandings = async () => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(
      `${baseURL}/api/prode/stats/all-time/standings`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data.standings;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message ||
        "Error al obtener la tabla histórica del Prode",
    );
  }
};

export default fetchProdeAllTimeStandings;
