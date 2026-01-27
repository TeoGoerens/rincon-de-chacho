import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const deleteProdeMonthlyWinnersByMonth = async ({ tournamentId, month }) => {
  const token = getUserJWT();

  if (!token) {
    throw new Error(
      "El token JWT no es válido o ha expirado. Por favor vuelve a iniciar sesión",
    );
  }

  if (!tournamentId) throw new Error("tournamentId es obligatorio");
  if (!month) throw new Error("month es obligatorio");

  const endpoint = `${baseURL}/api/prode/tournament/${tournamentId}/monthly-winners/${month}`;

  try {
    const response = await axios.delete(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    console.error("❌ Error en deleteProdeMonthlyWinnersByMonth:", error);
    throw error;
  }
};

export default deleteProdeMonthlyWinnersByMonth;
