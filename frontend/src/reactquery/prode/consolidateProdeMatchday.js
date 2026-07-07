import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Consolidación definitiva: gdtScores = [{scoreA, scoreB}] en el orden de
   los duelos de la fecha */
const consolidateProdeMatchday = async ({ matchdayId, gdtScores }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/prode/matchday/${matchdayId}/consolidate`,
      { gdtScores },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    /* Devuelve también failedEmails y participantsWithoutUser */
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al consolidar la fecha",
    );
  }
};

export default consolidateProdeMatchday;
