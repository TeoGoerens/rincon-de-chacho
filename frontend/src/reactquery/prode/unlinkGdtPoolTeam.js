import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Deshace un vínculo manual: el equipo vuelve a figurar sin resolver */
const unlinkGdtPoolTeam = async ({ universeId, sourceTeamId }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.delete(
      `${baseURL}/api/prode/gdt/universes/${universeId}/pool-teams/links/${sourceTeamId}`,
      { headers: { Authorization: `Bearer ${token}` }, timeout: 120000 },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al deshacer el vínculo",
    );
  }
};

export default unlinkGdtPoolTeam;
