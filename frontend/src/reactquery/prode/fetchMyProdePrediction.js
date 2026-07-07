import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchMyProdePrediction = async (matchdayId) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(
      `${baseURL}/api/prode/matchday/${matchdayId}/my-prediction`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    /* Puede ser null si todavía no cargó nada */
    return response.data.prediction;
  } catch (error) {
    const message =
      error?.response?.data?.message || "Error al obtener tu pronóstico";
    const customError = new Error(message);
    /* 403 = no participa (sin vincular o de otro torneo): la pantalla lo
       distingue para mostrar un estado presentable en vez de un error */
    customError.status = error?.response?.status;
    throw customError;
  }
};

export default fetchMyProdePrediction;
