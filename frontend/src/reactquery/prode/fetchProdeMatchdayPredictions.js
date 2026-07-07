import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Pronósticos de TODOS los participantes de una fecha. Solo disponible
   post-deadline y para participantes; un rezagado con la carga reabierta
   recibe 403 hasta que guarde la suya. */
const fetchProdeMatchdayPredictions = async (matchdayId) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(
      `${baseURL}/api/prode/matchday/${matchdayId}/predictions`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.predictions;
  } catch (error) {
    const message =
      error?.response?.data?.message || "Error al obtener los pronósticos";
    const customError = new Error(message);
    customError.status = error?.response?.status;
    throw customError;
  }
};

export default fetchProdeMatchdayPredictions;
