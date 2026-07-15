import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchProdeSportsLeagues = async () => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(`${baseURL}/api/prode/sports/leagues`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.leagues;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al cargar las ligas del catálogo",
    );
  }
};

export default fetchProdeSportsLeagues;
