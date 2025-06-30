import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const createPodridaMatch = async (matchData) => {
  const token = getUserJWT();

  if (!token) {
    throw new Error(
      "El token JWT no es válido o ha expirado. Por favor vuelve a iniciar sesión."
    );
  }

  try {
    const response = await axios.post(
      `${baseURL}/api/podrida/match`,
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
    console.error("❌ Error al crear la partida de Podrida:", error);
    throw error?.response?.data?.message || error;
  }
};

export default createPodridaMatch;
