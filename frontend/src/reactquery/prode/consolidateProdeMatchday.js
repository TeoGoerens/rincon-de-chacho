import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Consolidación definitiva: ARG/MISC salen de los parciales y el GDT de los
   mini-duelos (los puntajes ya cargados en la fecha); no viaja nada */
const consolidateProdeMatchday = async ({ matchdayId }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/prode/matchday/${matchdayId}/consolidate`,
      {},
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
