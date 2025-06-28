import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

const fetchPodridaRecords = async (year = 2025) => {
  const token = getUserJWT();

  if (!token) {
    throw new Error(
      `El token JWT no es válido o ha expirado. Por favor vuelve a iniciar sesión`
    );
  }

  const endpoint = `${baseURL}/api/podrida/records?year=${year}`;

  try {
    const response = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data; // <-- IMPORTANTE: accedé a `.data.data`
  } catch (error) {
    console.error("❌ Error en fetchPodridaRecords:", error);
    throw error;
  }
};

export default fetchPodridaRecords;
