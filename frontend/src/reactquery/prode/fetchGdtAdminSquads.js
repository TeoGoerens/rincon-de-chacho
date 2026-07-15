import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Planteles vigentes de todos los participantes (vista admin, con flags
   de bloqueo). Devuelve { draftStatus, burned, squads }. */
const fetchGdtAdminSquads = async (universeId) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(
      `${baseURL}/api/prode/gdt/universes/${universeId}/squads/admin`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const { draftStatus, burned, burnedPlayers, correctionsFor, squads } =
      response.data;
    return {
      draftStatus,
      burned,
      burnedPlayers: burnedPlayers ?? [],
      correctionsFor: correctionsFor ?? [],
      squads,
    };
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al cargar los planteles",
    );
  }
};

export default fetchGdtAdminSquads;
