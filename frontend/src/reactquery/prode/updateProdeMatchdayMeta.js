import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const updateProdeMatchdayMeta = async (payload) => {
  const token = getUserJWT();

  if (!token) {
    throw new Error(
      "El token JWT no es válido o ha expirado. Por favor vuelve a iniciar sesión",
    );
  }

  const { matchdayId, ...patch } = payload;

  const endpoint = `${baseURL}/api/prode/matchday/${matchdayId}`;

  try {
    const response = await axios.put(endpoint, patch, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    console.error("❌ Error en updateProdeMatchdayMeta:", error);
    throw error;
  }
};

export default updateProdeMatchdayMeta;
