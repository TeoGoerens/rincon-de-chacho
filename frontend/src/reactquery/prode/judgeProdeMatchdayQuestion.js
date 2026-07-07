import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Arbitraje de una pregunta: verdicts = [{ player, isCorrect }] */
const judgeProdeMatchdayQuestion = async ({ matchdayId, itemId, verdicts }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/prode/matchday/${matchdayId}/items/${itemId}/judge`,
      { verdicts },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al arbitrar la pregunta",
    );
  }
};

export default judgeProdeMatchdayQuestion;
