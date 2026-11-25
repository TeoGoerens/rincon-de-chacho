import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Vincula un equipo sin resolver (TheSportsDB) con un club de API-Football.
   Se guarda POR LIGA: queda resuelto para todos los universos de esa liga */
const linkGdtPoolTeam = async ({
  universeId,
  sourceTeamId,
  providerTeamId,
  providerTeamName,
}) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.post(
      `${baseURL}/api/prode/gdt/universes/${universeId}/pool-teams/links`,
      { sourceTeamId, providerTeamId, providerTeamName },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 120000 },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al vincular el equipo",
    );
  }
};

export default linkGdtPoolTeam;
