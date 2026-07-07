import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Versión admin de los parciales: para la vista previa de la consolidación */
const fetchProdeMatchdayPartialsAdmin = async (matchdayId) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(
      `${baseURL}/api/prode/matchday/${matchdayId}/partials/all`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.partials;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al obtener los parciales",
    );
  }
};

export default fetchProdeMatchdayPartialsAdmin;
