import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const openProdeMatchday = async ({ matchdayId }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/prode/matchday/${matchdayId}/open`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    /* Devuelve también failedEmails y participantsWithoutUser para los avisos */
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al abrir la fecha",
    );
  }
};

export default openProdeMatchday;
