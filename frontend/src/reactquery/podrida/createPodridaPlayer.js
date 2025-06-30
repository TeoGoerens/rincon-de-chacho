import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const createPodridaPlayer = async ({ name, email }) => {
  const token = getUserJWT();

  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  // Validación mínima en frontend (puede omitirse si ya está en el form)
  if (!name || !email) {
    throw new Error("Nombre y correo electrónico son requeridos.");
  }

  try {
    const response = await axios.post(
      `${baseURL}/api/podrida/player`,
      { name, email },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.playerCreated;
  } catch (error) {
    console.error("❌ Error al crear jugador:", error);
    throw error?.response?.data?.message || error;
  }
};

export default createPodridaPlayer;
