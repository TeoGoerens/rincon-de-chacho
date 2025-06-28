import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchLastPodridaMatch = async (year = 2025) => {
  const token = getUserJWT();

  if (!token) {
    throw new Error(
      `El token JWT no es válido o ha expirado. Por favor vuelve a iniciar sesión`
    );
  }

  const endpoint = `${baseURL}/api/podrida/match/last`;

  try {
    const response = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("❌ Error en fetchLastPodridaMatch:", error);
    throw error;
  }
};

export default fetchLastPodridaMatch;
