import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const deleteProdeTournament = async ({ tournamentId }) => {
  const token = getUserJWT();

  if (!token) {
    throw new Error(
      "El token JWT no es válido o ha expirado. Por favor vuelve a iniciar sesión",
    );
  }

  const endpoint = `${baseURL}/api/prode/tournament/${tournamentId}`;

  try {
    const response = await axios.delete(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("❌ Error en deleteProdeTournament:", error);
    throw error;
  }
};

export default deleteProdeTournament;
