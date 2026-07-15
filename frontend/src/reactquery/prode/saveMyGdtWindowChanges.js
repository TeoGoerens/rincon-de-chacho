import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Cambios de la ventana mensual (hasta 2, a ciegas) o re-elecciones de la
   ronda. changes = set completo [{slotNumber, realPlayer}]; noChanges =
   "confirmar sin cambios". */
const saveMyGdtWindowChanges = async ({ universeId, changes, noChanges }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/prode/gdt/universes/${universeId}/my-window-changes`,
      { changes, noChanges },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al guardar tus cambios",
    );
  }
};

export default saveMyGdtWindowChanges;
