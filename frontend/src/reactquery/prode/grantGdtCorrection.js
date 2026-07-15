import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Corrección one-shot por error de datos del pool: el afectado repone solo
   sus slots inconsistentes, sin gastar cambios mensuales */
const grantGdtCorrection = async ({ universeId, playerId }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/prode/gdt/universes/${universeId}/correction/grant`,
      { playerId },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al habilitar la corrección",
    );
  }
};

export default grantGdtCorrection;
