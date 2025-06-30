import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const updatePodridaMatch = async ({ matchId, matchData }) => {
  const token = getUserJWT();

  if (!token) {
    throw new Error(
      "El token JWT no es válido o ha expirado. Por favor vuelve a iniciar sesión."
    );
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/podrida/match/${matchId}`,
      matchData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ Error al actualizar la partida de Podrida:", error);
    throw error?.response?.data?.message || error;
  }
};

export default updatePodridaMatch;
