import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const deletePodridaMatch = async ({ matchId }) => {
  const token = getUserJWT();

  if (!token) {
    throw new Error(
      "El token JWT no es válido o ha expirado. Por favor vuelve a iniciar sesión."
    );
  }

  try {
    const response = await axios.delete(
      `${baseURL}/api/podrida/match/${matchId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ Error al eliminar la partida:", error);
    throw new Error(error?.response?.data?.message || error.message || "Error al eliminar la partida");
  }
};

export default deletePodridaMatch;
