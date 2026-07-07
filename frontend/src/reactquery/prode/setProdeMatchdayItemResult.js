import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Resultado real de un ítem (admin, fecha en juego): marcador para partidos,
   respuesta oficial para preguntas */
const setProdeMatchdayItemResult = async ({ matchdayId, itemId, result }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/prode/matchday/${matchdayId}/items/${itemId}/result`,
      result,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.matchdayUpdated;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al cargar el resultado",
    );
  }
};

export default setProdeMatchdayItemResult;
