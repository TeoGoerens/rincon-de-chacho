import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Historial head to head entre dos participantes (pestaña H2H) */
const fetchProdeH2H = async (playerAId, playerBId) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(`${baseURL}/api/prode/stats/h2h`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { playerA: playerAId, playerB: playerBId },
    });
    return response.data.h2h;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message ||
        "Error al obtener el head to head del Prode",
    );
  }
};

export default fetchProdeH2H;
