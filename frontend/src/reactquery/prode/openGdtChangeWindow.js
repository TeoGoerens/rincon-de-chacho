import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const openGdtChangeWindow = async ({ universeId, month, deadline }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.post(
      `${baseURL}/api/prode/gdt/universes/${universeId}/window/open`,
      { month, deadline },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message ||
        "Error al abrir la ventana de cambios",
    );
  }
};

export default openGdtChangeWindow;
