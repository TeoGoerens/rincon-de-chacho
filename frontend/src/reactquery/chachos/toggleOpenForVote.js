import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const toggleOpenForVote = async ({ tournamentRoundId }) => {
  const token = getUserJWT();

  if (!token) {
    throw new Error(
      "El token JWT no es válido o ha expirado. Por favor vuelve a iniciar sesión."
    );
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/chachos/tournament-round/open-for-vote/${tournamentRoundId}`,
      { tournamentRoundId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error al cambiar el estado de votación de la fecha:", error);
    throw error?.response?.data?.message || error;
  }
};

export default toggleOpenForVote;
