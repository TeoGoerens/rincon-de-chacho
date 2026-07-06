import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const updateProdeTournament = async ({ tournamentId, ...fields }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/prode/tournament/${tournamentId}`,
      fields,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.tournamentUpdated;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al actualizar el torneo",
    );
  }
};

export default updateProdeTournament;
