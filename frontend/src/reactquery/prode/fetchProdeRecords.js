import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Records históricos del Prode (pestaña Records): top-3 por récord +
   tabla histórica por desafío */
const fetchProdeRecords = async () => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(`${baseURL}/api/prode/stats/records`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.records;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message ||
        "Error al obtener los records del Prode",
    );
  }
};

export default fetchProdeRecords;
