import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const createProdeMatchday = async ({
  tournament,
  month,
  roundNumber,
  predictionsDeadline,
  gdtUniverse,
}) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.post(
      `${baseURL}/api/prode/matchday`,
      { tournament, month, roundNumber, predictionsDeadline, gdtUniverse },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.matchdayCreated;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al crear la fecha",
    );
  }
};

export default createProdeMatchday;
