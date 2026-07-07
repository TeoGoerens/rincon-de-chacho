import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Versión admin: pronósticos de todos sin exigir ser participante
   (el admin la necesita para arbitrar las preguntas) */
const fetchProdeMatchdayAllPredictions = async (matchdayId) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(
      `${baseURL}/api/prode/matchday/${matchdayId}/predictions/all`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.predictions;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al obtener los pronósticos",
    );
  }
};

export default fetchProdeMatchdayAllPredictions;
