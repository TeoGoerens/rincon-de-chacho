import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const createProdeTournament = async ({ name, year, months, participants }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.post(
      `${baseURL}/api/prode/tournament`,
      { name, year, months, participants },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.tournamentCreated;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al crear el torneo",
    );
  }
};

export default createProdeTournament;
