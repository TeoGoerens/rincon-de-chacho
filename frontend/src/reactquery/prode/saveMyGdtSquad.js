import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const saveMyGdtSquad = async ({ universeId, slots }) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.put(
      `${baseURL}/api/prode/gdt/universes/${universeId}/my-squad`,
      { slots },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.squad;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Error al guardar tu plantel",
    );
  }
};

export default saveMyGdtSquad;
