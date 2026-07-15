import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Devuelve { universe, squad, canEdit }. El error conserva .status para
   distinguir el 403 (no participante) de otros errores. */
const fetchMyGdtSquad = async (universeId) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(
      `${baseURL}/api/prode/gdt/universes/${universeId}/my-squad`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const { universe, squad, canEdit } = response.data;
    return { universe, squad, canEdit };
  } catch (error) {
    const customError = new Error(
      error?.response?.data?.message || "Error al cargar tu plantel",
    );
    customError.status = error?.response?.status;
    throw customError;
  }
};

export default fetchMyGdtSquad;
