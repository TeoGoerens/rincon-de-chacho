import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchGdtWindowOverview = async (universeId) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(
      `${baseURL}/api/prode/gdt/universes/${universeId}/window/overview`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.overview;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message ||
        "Error al cargar la ventana de cambios",
    );
  }
};

export default fetchGdtWindowOverview;
