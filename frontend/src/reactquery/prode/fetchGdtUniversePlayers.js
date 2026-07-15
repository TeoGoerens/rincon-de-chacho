import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchGdtUniversePlayers = async (universeId) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(
      `${baseURL}/api/prode/gdt/universes/${universeId}/players`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.players;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message ||
        "Error al cargar el pool del universo GDT",
    );
  }
};

export default fetchGdtUniversePlayers;
