import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Jugador de Prode vinculado al usuario logueado, o null si no está
   vinculado. No exige ser participante: la landing lo usa para decidir
   qué mostrar. */
const fetchMyProdePlayer = async () => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(`${baseURL}/api/prode/my-player`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.player;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al obtener tu jugador de Prode",
    );
  }
};

export default fetchMyProdePlayer;
