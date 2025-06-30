import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchAllPodridaPlayers = async () => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido. Por favor iniciá sesión nuevamente.");
  }

  const endpoint = `${baseURL}/api/podrida/player`;

  try {
    const response = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.players;
  } catch (error) {
    console.error("❌ Error en fetchAllPodridaPlayers:", error);
    throw error;
  }
};

export default fetchAllPodridaPlayers;
