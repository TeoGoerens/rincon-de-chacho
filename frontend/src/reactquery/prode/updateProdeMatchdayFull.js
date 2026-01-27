import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const updateProdeMatchdayFull = async ({ matchdayId, duels, status }) => {
  const token = getUserJWT();

  if (!matchdayId) {
    throw new Error(
      "matchdayId es obligatorio para actualizar la fecha (FULL)",
    );
  }

  if (!token) {
    throw new Error(
      "El token JWT no es válido o ha expirado. Por favor vuelve a iniciar sesión",
    );
  }

  const endpoint = `${baseURL}/api/prode/matchday/${matchdayId}/full`;

  try {
    const response = await axios.put(
      endpoint,
      { duels, status }, // ✅ status opcional: scheduled|played
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("❌ Error en updateProdeMatchdayFull:", error);
    throw error;
  }
};

export default updateProdeMatchdayFull;
