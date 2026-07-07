import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const deleteProdeMatchdayItem = async ({ matchdayId, itemId }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.delete(
      `${baseURL}/api/prode/matchday/${matchdayId}/items/${itemId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.matchdayUpdated;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al eliminar el ítem",
    );
  }
};

export default deleteProdeMatchdayItem;
