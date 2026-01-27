import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const updateProdeTournament = async ({
  tournamentId,
  name,
  year,
  months,
  status,
  champion,
  lastPlace,
}) => {
  const token = getUserJWT();

  if (!token) {
    throw new Error(
      "El token JWT no es válido o ha expirado. Por favor vuelve a iniciar sesión",
    );
  }

  const endpoint = `${baseURL}/api/prode/tournament/${tournamentId}`;

  try {
    const response = await axios.put(
      endpoint,
      { name, year, months, status, champion, lastPlace },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("❌ Error en updateProdeTournament:", error);
    throw error;
  }
};

export default updateProdeTournament;
