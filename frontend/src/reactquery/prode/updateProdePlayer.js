import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const updateProdePlayer = async ({ playerId, name, active }) => {
  const token = getUserJWT();

  if (!token) {
    throw new Error(
      "El token JWT no es válido o ha expirado. Por favor vuelve a iniciar sesión",
    );
  }

  const endpoint = `${baseURL}/api/prode/player/${playerId}`;

  try {
    const response = await axios.put(
      endpoint,
      { name, active },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("❌ Error en updateProdePlayer:", error);
    throw error;
  }
};

export default updateProdePlayer;
