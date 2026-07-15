import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Carga progresiva de puntajes GDT: scores = [{realPlayer, points}] con el
   set COMPLETO de puntajes cargados (reemplaza; sacar uno = pendiente) */
const saveProdeMatchdayGdtScores = async ({ matchdayId, scores }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/prode/matchday/${matchdayId}/gdt-scores`,
      { scores },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.matchdayUpdated;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al guardar los puntajes GDT",
    );
  }
};

export default saveProdeMatchdayGdtScores;
