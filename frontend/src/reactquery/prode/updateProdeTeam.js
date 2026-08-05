import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Solo displayName y code: el apiName es la clave con la que los jugadores
   del pool referencian a su equipo y el backend no lo acepta. */
const updateProdeTeam = async ({ teamId, displayName, code }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/prode/team/${teamId}`,
      { displayName, code },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.teamUpdated;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al actualizar el equipo",
    );
  }
};

export default updateProdeTeam;
