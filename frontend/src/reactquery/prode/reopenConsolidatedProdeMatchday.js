import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Válvula de corrección: la fecha consolidada vuelve a "en juego" para
   corregir resultados/arbitraje/puntajes GDT y consolidarse de nuevo */
const reopenConsolidatedProdeMatchday = async ({ matchdayId }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/prode/matchday/${matchdayId}/reopen-consolidated`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.matchdayUpdated;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al reabrir la fecha",
    );
  }
};

export default reopenConsolidatedProdeMatchday;
