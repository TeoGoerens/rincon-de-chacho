import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const updateGdtDraftDeadline = async ({ universeId, draftDeadline }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/prode/gdt/universes/${universeId}/draft/deadline`,
      { draftDeadline },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.universe;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message ||
        "Error al actualizar el deadline del draft",
    );
  }
};

export default updateGdtDraftDeadline;
