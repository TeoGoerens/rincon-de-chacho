import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchGdtUniverseById = async (universeId) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(
      `${baseURL}/api/prode/gdt/universes/${universeId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.team;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al cargar el universo GDT",
    );
  }
};

export default fetchGdtUniverseById;
