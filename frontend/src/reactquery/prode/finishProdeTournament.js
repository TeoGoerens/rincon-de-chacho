import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const finishProdeTournament = async ({ tournamentId }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/prode/tournament/${tournamentId}/finish`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.tournamentUpdated;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al finalizar el torneo",
    );
  }
};

export default finishProdeTournament;
