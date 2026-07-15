import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchGdtDraftOverview = async (universeId) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.get(
      `${baseURL}/api/prode/gdt/universes/${universeId}/draft/overview`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.overview;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message ||
        "Error al cargar el estado del draft",
    );
  }
};

export default fetchGdtDraftOverview;
