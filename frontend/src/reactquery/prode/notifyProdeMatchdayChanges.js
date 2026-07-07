import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const notifyProdeMatchdayChanges = async ({ matchdayId }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.post(
      `${baseURL}/api/prode/matchday/${matchdayId}/notify-changes`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    /* Devuelve failedEmails y participantsWithoutUser para los avisos */
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al notificar los cambios",
    );
  }
};

export default notifyProdeMatchdayChanges;
