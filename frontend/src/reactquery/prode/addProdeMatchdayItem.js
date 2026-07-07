import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const addProdeMatchdayItem = async ({ matchdayId, item }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.post(
      `${baseURL}/api/prode/matchday/${matchdayId}/items`,
      item,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.matchdayUpdated;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al agregar el ítem",
    );
  }
};

export default addProdeMatchdayItem;
