import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Tablero de carga de la fecha abierta (admin): SOLO conteos por
   participante, nunca contenido de pronósticos */
const fetchProdeMatchdayPredictionOverview = async (matchdayId) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(
      `${baseURL}/api/prode/matchday/${matchdayId}/predictions/overview`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.overview;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message ||
        "Error al obtener el progreso de carga",
    );
  }
};

export default fetchProdeMatchdayPredictionOverview;
