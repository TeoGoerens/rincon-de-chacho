import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const annulProdeMatchdayItem = async ({ matchdayId, itemId, annulled }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/prode/matchday/${matchdayId}/items/${itemId}/annul`,
      { annulled },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.matchdayUpdated;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al anular el ítem",
    );
  }
};

export default annulProdeMatchdayItem;
