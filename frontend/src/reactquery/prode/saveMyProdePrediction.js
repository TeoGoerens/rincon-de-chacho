import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const saveMyProdePrediction = async ({ matchdayId, picks }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/prode/matchday/${matchdayId}/my-prediction`,
      { picks },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.prediction;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al guardar tus pronósticos",
    );
  }
};

export default saveMyProdePrediction;
