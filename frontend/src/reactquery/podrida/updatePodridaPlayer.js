import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const updatePodridaPlayer = async ({ playerId, updateData }) => {
  const token = getUserJWT();

  if (!token) {
    throw new Error("Token inválido o expirado.");
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/podrida/player/${playerId}`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.updatedPlayer;
  } catch (error) {
    console.error("❌ Error al actualizar jugador:", error);
    throw error?.response?.data?.message || error;
  }
};

export default updatePodridaPlayer;
