import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Elección de reemplazos de la ronda en curso (a ciegas, se aplica al
   cierre). picks = set completo: [{ slotNumber, realPlayer }] */
const saveMyGdtReplacements = async ({ universeId, picks }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/prode/gdt/universes/${universeId}/my-replacements`,
      { picks },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.staged;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al guardar tus reemplazos",
    );
  }
};

export default saveMyGdtReplacements;
