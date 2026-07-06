import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchAllProdeTournaments = async () => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(`${baseURL}/api/prode/tournament`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.tournaments;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al obtener los torneos",
    );
  }
};

export default fetchAllProdeTournaments;
