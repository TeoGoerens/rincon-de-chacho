import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Equipos del Gran DT con su nombre editable y su código de 3 letras. El
   backend los sincroniza solo desde el pool en cada llamada, así que la lista
   siempre trae los equipos que realmente existen. */
const fetchAllProdeTeams = async () => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(`${baseURL}/api/prode/team`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.teams;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al obtener los equipos",
    );
  }
};

export default fetchAllProdeTeams;
