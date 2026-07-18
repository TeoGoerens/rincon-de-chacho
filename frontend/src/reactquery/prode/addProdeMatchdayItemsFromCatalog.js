import axios from "axios";
import { baseURL } from "../../helpers/baseURL";
import { getUserJWT } from "../getUserInformation";

/* events: [{ providerEventId, pointsHome, pointsDraw, pointsAway }] — los
   puntos por acertar L/E/V se eligen en el carrito (default 5) */
const addProdeMatchdayItemsFromCatalog = async ({
  matchdayId,
  challenge,
  leagueId,
  events,
}) => {
  const token = getUserJWT();
  if (!token) {
    throw new Error("Token inválido o expirado. Volvé a iniciar sesión.");
  }

  try {
    const response = await axios.post(
      `${baseURL}/api/prode/matchday/${matchdayId}/items/from-catalog`,
      { challenge, leagueId, events },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data.matchdayUpdated;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message ||
        "Error al agregar los partidos del catálogo",
    );
  }
};

export default addProdeMatchdayItemsFromCatalog;
