import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const deleteProdeTournament = async ({ tournamentId }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.delete(
      `${baseURL}/api/prode/tournament/${tournamentId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al eliminar el torneo",
    );
  }
};

export default deleteProdeTournament;
