import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const createGdtUniverse = async (team) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.post(`${baseURL}/api/prode/gdt/universes`, team, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.teamCreated;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al crear el universo GDT",
    );
  }
};

export default createGdtUniverse;
