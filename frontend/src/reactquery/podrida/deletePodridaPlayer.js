import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const deletePodridaPlayer = async ({ playerId }) => {
  const token = getUserJWT();

  if (!token) {
    throw new Error("Token inválido o expirado.");
  }

  try {
    const response = await axios.delete(
      `${baseURL}/api/podrida/player/${playerId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data.message;
  } catch (error) {
    console.error("❌ Error al eliminar jugador:", error);
    throw error?.response?.data?.message || error;
  }
};

export default deletePodridaPlayer;
