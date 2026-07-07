import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const reopenProdeMatchday = async ({ matchdayId, playerId }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/prode/matchday/${matchdayId}/reopen`,
      { playerId },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.matchdayUpdated;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al reabrir la carga",
    );
  }
};

export default reopenProdeMatchday;
