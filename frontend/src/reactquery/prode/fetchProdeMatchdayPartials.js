import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Parciales al vuelo de la fecha: puntos por pick, totales por participante
   y estado de los duelos. Mismas guardas que los pronósticos ajenos. */
const fetchProdeMatchdayPartials = async (matchdayId) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(
      `${baseURL}/api/prode/matchday/${matchdayId}/partials`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.partials;
  } catch (error) {
    const message =
      error?.response?.data?.message || "Error al obtener los parciales";
    const customError = new Error(message);
    customError.status = error?.response?.status;
    throw customError;
  }
};

export default fetchProdeMatchdayPartials;
