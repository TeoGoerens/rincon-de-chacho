import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchPodridaPlayerById = async (id) => {
  const token = getUserJWT();

  if (!token) {
    throw new Error("Token inválido o expirado.");
  }

  try {
    const response = await axios.get(`${baseURL}/api/podrida/player/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.player;
  } catch (error) {
    console.error("❌ Error al obtener jugador:", error);
    throw error?.response?.data?.message || error;
  }
};

export default fetchPodridaPlayerById;
