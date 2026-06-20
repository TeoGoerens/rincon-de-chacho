import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchPodridaPlayerProfile = async (playerId) => {
  const token = getUserJWT();

  if (!token) {
    throw new Error("El token JWT no es válido o ha expirado. Por favor vuelve a iniciar sesión");
  }

  try {
    const response = await axios.get(`${baseURL}/api/podrida/player/${playerId}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error en fetchPodridaPlayerProfile:", error);
    throw error;
  }
};

export default fetchPodridaPlayerProfile;
