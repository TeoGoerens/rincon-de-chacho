import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Todos los planteles del universo (existe recién post-revelación).
   Devuelve { universe, burned, squads, myPlayerId, roundOpen, myStaged }.
   El error conserva .status para distinguir el 403 (no participante). */
const fetchGdtRevealedSquads = async (universeId) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(
      `${baseURL}/api/prode/gdt/universes/${universeId}/squads`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const {
      universe,
      burned,
      squads,
      myPlayerId,
      roundOpen,
      myStaged,
      window: windowInfo,
    } = response.data;
    return {
      universe,
      burned,
      squads,
      myPlayerId,
      roundOpen,
      myStaged,
      window: windowInfo,
    };
  } catch (error) {
    const customError = new Error(
      error?.response?.data?.message || "Error al cargar los planteles",
    );
    customError.status = error?.response?.status;
    throw customError;
  }
};

export default fetchGdtRevealedSquads;
