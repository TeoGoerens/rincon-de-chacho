import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const finalizeGdtDraft = async ({ universeId }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/prode/gdt/universes/${universeId}/draft/finalize`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.universe;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al cerrar el draft",
    );
  }
};

export default finalizeGdtDraft;
