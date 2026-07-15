import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* Tablero GDT de la fecha (admin): jugadores de los planteles del mes con
   su puntaje cargado + mini-duelos slot vs slot de cada duelo */
const fetchProdeMatchdayGdtBoard = async (matchdayId) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(
      `${baseURL}/api/prode/matchday/${matchdayId}/gdt-board`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.board;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al obtener el tablero GDT",
    );
  }
};

export default fetchProdeMatchdayGdtBoard;
