import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchPodridaMatchById = async (matchId) => {
  const token = getUserJWT();

  if (!token) {
    throw new Error(
      "El token JWT no es válido o ha expirado. Por favor vuelve a iniciar sesión."
    );
  }

  if (!matchId) {
    throw new Error("ID de la partida no especificado.");
  }

  try {
    const response = await axios.get(
      `${baseURL}/api/podrida/match/${matchId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data?.match;
  } catch (error) {
    console.error("❌ Error al obtener partida de Podrida por ID:", error);
    throw error?.response?.data?.message || error.message || error;
  }
};

export default fetchPodridaMatchById;
