import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const updateProdeMatchdayItem = async ({ matchdayId, itemId, item }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/prode/matchday/${matchdayId}/items/${itemId}`,
      item,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.matchdayUpdated;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al actualizar el ítem",
    );
  }
};

export default updateProdeMatchdayItem;
