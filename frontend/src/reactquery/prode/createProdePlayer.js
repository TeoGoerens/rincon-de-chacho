import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const createProdePlayer = async ({ name, active }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.post(
      `${baseURL}/api/prode/player`,
      { name, active },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.playerCreated;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al crear el jugador",
    );
  }
};

export default createProdePlayer;
