import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const updateProdeMonthlyWinners = async ({
  tournamentId,
  month,
  winnerPlayerIds,
  note,
}) => {
  const token = getUserJWT();

  if (!token) {
    throw new Error(
      "El token JWT no es válido o ha expirado. Por favor vuelve a iniciar sesión",
    );
  }

  if (!tournamentId) throw new Error("tournamentId es obligatorio");
  if (!month) throw new Error("month es obligatorio");

  if (!Array.isArray(winnerPlayerIds) || winnerPlayerIds.length !== 4) {
    throw new Error(
      "winnerPlayerIds debe ser un array de exactamente 4 jugadores",
    );
  }

  const endpoint = `${baseURL}/api/prode/tournament/${tournamentId}/monthly-winners`;

  try {
    const response = await axios.put(
      endpoint,
      { month, winnerPlayerIds, note },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    return response.data;
  } catch (error) {
    console.error("❌ Error en updateProdeMonthlyWinners:", error);
    throw error;
  }
};

export default updateProdeMonthlyWinners;
